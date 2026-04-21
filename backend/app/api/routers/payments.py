from __future__ import annotations

from decimal import Decimal
import hashlib
import hmac
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.enums import TransactionStatus, TransactionType
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.wallet import DepositLinkResponse, DepositRequest, TransactionPublic


router = APIRouter(prefix="/payments", tags=["payments"])

_RAZORPAY_PAYMENT_LINKS_URL = "https://api.razorpay.com/v1/payment_links"


def _require_razorpay_config() -> tuple[str, str]:
    key_id = (settings.razorpay_key_id or "").strip()
    key_secret = (settings.razorpay_key_secret or "").strip()
    if not key_id or not key_secret:
        raise HTTPException(status_code=500, detail="Razorpay is not configured")
    return key_id, key_secret


def _amount_to_paise(amount: Decimal) -> int:
    # Razorpay expects integer amount in smallest currency unit (paise).
    quantized = amount.quantize(Decimal("0.01"))
    paise = int(quantized * 100)
    if paise <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    return paise


def _create_payment_link(*, amount: Decimal, tx_id: int, user: User) -> dict:
    key_id, key_secret = _require_razorpay_config()
    paise = _amount_to_paise(amount)

    callback_url = None
    if (settings.public_app_url or "").strip():
        callback_url = f"{settings.public_app_url.rstrip('/')}/wallet?deposit_tx_id={tx_id}"

    payload: dict = {
        "amount": paise,
        "currency": "INR",
        "description": "Wallet deposit",
        "notes": {
            "tx_id": str(tx_id),
            "user_id": str(user.id),
        },
        # Razorpay will prefill these on hosted page when provided
        "customer": {
            "name": user.username,
            "email": user.email,
            **({"contact": user.phone} if user.phone else {}),
        },
    }
    if callback_url:
        payload["callback_url"] = callback_url
        payload["callback_method"] = "get"

    try:
        with httpx.Client(timeout=20.0, verify=True) as client:
            res = client.post(
                _RAZORPAY_PAYMENT_LINKS_URL,
                json=payload,
                auth=(key_id, key_secret),
            )
    except httpx.HTTPError as e:
        print(f"DEBUG: Razorpay connection error: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to contact Razorpay: {str(e)}")

    if res.status_code >= 400:
        print(f"DEBUG: Razorpay API error {res.status_code}: {res.text}")
        raise HTTPException(status_code=502, detail=f"Razorpay API error ({res.status_code}): {res.text[:100]}")

    try:
        return res.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Invalid response from Razorpay")


def _fetch_payment_link(*, payment_link_id: str) -> dict:
    key_id, key_secret = _require_razorpay_config()
    url = f"{_RAZORPAY_PAYMENT_LINKS_URL}/{payment_link_id}"
    try:
        with httpx.Client(timeout=20.0) as client:
            res = client.get(url, auth=(key_id, key_secret))
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Failed to contact Razorpay")
    if res.status_code >= 400:
        raise HTTPException(status_code=502, detail="Razorpay error fetching payment link")
    try:
        return res.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Invalid response from Razorpay")


def _settle_deposit_if_paid(*, db: Session, tx: Transaction) -> bool:
    # Idempotent settlement: only credit once.
    if tx.transaction_type != TransactionType.deposit.value:
        raise HTTPException(status_code=400, detail="Not a deposit transaction")
    if tx.status == TransactionStatus.succeeded.value:
        return True
    if tx.status != TransactionStatus.pending.value:
        return False

    # Credit wallet by updating the *existing* pending tx.
    # (Do not call WalletService.credit here, because it creates a new Transaction row.)
    user = db.scalar(select(User).where(User.id == tx.user_id).with_for_update())
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.wallet_balance = (user.wallet_balance or Decimal("0.00")) + tx.amount
    tx.status = TransactionStatus.succeeded.value
    db.add_all([user, tx])
    db.commit()
    return True


@router.post("/deposit", response_model=DepositLinkResponse)
def deposit(
    payload: DepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DepositLinkResponse:
    # Create a pending transaction first, then redirect user to Razorpay.
    # Wallet is credited only after server-side verification (webhook/verify endpoint).
    internal_ref = str(uuid4())
    tx = Transaction(
        user_id=current_user.id,
        transaction_type=TransactionType.deposit.value,
        amount=payload.amount,
        payment_method="razorpay",
        status=TransactionStatus.pending.value,
        reference=internal_ref,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    try:
        rp = _create_payment_link(amount=payload.amount, tx_id=tx.id, user=current_user)
        payment_link_id = str(rp.get("id") or "")
        short_url = str(rp.get("short_url") or rp.get("short_url") or "")
        if not payment_link_id or not short_url:
            raise HTTPException(status_code=502, detail="Razorpay response missing payment link fields")

        tx.reference = payment_link_id
        db.add(tx)
        db.commit()

        return DepositLinkResponse(tx_id=tx.id, payment_link_id=payment_link_id, short_url=short_url)
    except HTTPException:
        tx.status = TransactionStatus.failed.value
        db.add(tx)
        db.commit()
        raise


@router.get("/razorpay/verify/{payment_link_id}", response_model=TransactionPublic)
def verify_razorpay_payment_link(
    payment_link_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Transaction:
    payment_link_id = (payment_link_id or "").strip()
    if not payment_link_id:
        raise HTTPException(status_code=400, detail="Invalid payment link id")

    tx = db.scalar(
        select(Transaction).where(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == TransactionType.deposit.value,
            Transaction.reference == payment_link_id,
        )
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    rp = _fetch_payment_link(payment_link_id=payment_link_id)
    status = str(rp.get("status") or "").lower()
    if status == "paid":
        _settle_deposit_if_paid(db=db, tx=tx)
        db.refresh(tx)
        return tx

    # Keep as pending for other states (created/expired/cancelled/partially_paid etc.)
    return tx


@router.post("/razorpay/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None, alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    secret = (settings.razorpay_webhook_secret or "").strip()
    if not secret:
        raise HTTPException(status_code=500, detail="Razorpay webhook secret is not configured")
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing Razorpay signature")

    raw = await request.body()
    expected = hmac.new(secret.encode("utf-8"), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid Razorpay signature")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = str(body.get("event") or "")
    if event != "payment_link.paid":
        # Acknowledge other events (partially_paid/expired/cancelled) without side effects.
        return {"status": "ignored"}

    payload = body.get("payload") or {}
    pl_entity = ((payload.get("payment_link") or {}).get("entity") or {})
    payment_link_id = str(pl_entity.get("id") or "").strip()
    if not payment_link_id:
        raise HTTPException(status_code=400, detail="Missing payment link id in webhook payload")

    tx = db.scalar(
        select(Transaction).where(
            Transaction.transaction_type == TransactionType.deposit.value,
            Transaction.reference == payment_link_id,
        )
    )
    if not tx:
        # If we can't map it, still ack so Razorpay doesn't retry forever.
        return {"status": "unmatched"}

    _settle_deposit_if_paid(db=db, tx=tx)
    return {"status": "ok"}


@router.get("/history", response_model=list[TransactionPublic])
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Transaction]:
    q = select(Transaction).where(Transaction.user_id == current_user.id).order_by(Transaction.created_at.desc())
    return list(db.scalars(q))


@router.post("/withdraw")
def withdraw_alias() -> dict[str, str]:
    raise HTTPException(status_code=400, detail="Use /api/payments/withdraw_request")


@router.post("/withdraw_request")
def withdraw_request_placeholder() -> dict[str, str]:
    raise HTTPException(status_code=400, detail="Use /api/payments/withdraw_request endpoint implemented in withdrawals router")

