from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.admin import Admin
from app.models.enums import KycStatus, TransactionStatus, TransactionType, WithdrawalStatus
from app.models.transaction import Transaction
from app.models.user import User
from app.models.withdrawal import Withdrawal
from app.schemas.withdrawal import WithdrawalPublic, WithdrawalRequest
from app.services.wallet import WalletService


router = APIRouter(tags=["withdrawals"])


def _compose_bank_details(payload: WithdrawalRequest, current_user: User) -> tuple[str | None, str | None]:
    upi_id = (payload.upi_id or current_user.upi_id or "").strip() or None

    if payload.bank_details:
        bank_details = payload.bank_details.strip() or None
    else:
        parts: list[str] = []
        if payload.bank_name:
            parts.append(f"Bank Name: {payload.bank_name.strip()}")
        if payload.account_holder_name:
            parts.append(f"Account Holder: {payload.account_holder_name.strip()}")
        if payload.account_number:
            parts.append(f"Account Number: {payload.account_number.strip()}")
        if payload.ifsc_code:
            parts.append(f"IFSC Code: {payload.ifsc_code.strip()}")

        bank_details = " | ".join(parts) if parts else None
        if not bank_details:
            bank_details = (current_user.bank_details or "").strip() or None

    return bank_details, upi_id


@router.post("/payments/withdraw_request", response_model=WithdrawalPublic)
def withdraw_request(
    payload: WithdrawalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Withdrawal:
    if current_user.kyc_status != KycStatus.verified.value:
        raise HTTPException(status_code=400, detail="KYC required for withdrawals")

    bank_details, upi_id = _compose_bank_details(payload, current_user)
    if not bank_details and not upi_id:
        raise HTTPException(status_code=400, detail="Bank details or UPI ID required")

    wallet = WalletService(db)
    hold_ref = f"withdraw_hold:{current_user.id}:{datetime.now(timezone.utc).timestamp()}"
    wallet.debit(
        user_id=current_user.id,
        amount=payload.amount,
        transaction_type=TransactionType.withdrawal_hold,
        payment_method="wallet",
        status=TransactionStatus.pending,
        reference=hold_ref,
    )

    w = Withdrawal(
        user_id=current_user.id,
        amount=payload.amount,
        bank_details=bank_details,
        upi_id=upi_id,
        status=WithdrawalStatus.requested.value,
        processed_at=None,
        admin_id=None,
        hold_reference=hold_ref,
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@router.post("/payments/withdraw", response_model=WithdrawalPublic)
def withdraw_alias(
    payload: WithdrawalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Withdrawal:
    return withdraw_request(payload, db, current_user)


@router.get("/admin/withdrawals", response_model=list[WithdrawalPublic])
def admin_list_withdrawals(
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> list[Withdrawal]:
    q = select(Withdrawal).order_by(Withdrawal.created_at.desc())
    return list(db.scalars(q))


class AdminDecision(BaseModel):
    action: str  # approve|reject


@router.post("/admin/withdrawals/{withdrawal_id}/approve", response_model=WithdrawalPublic)
def admin_approve(
    withdrawal_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> Withdrawal:
    w = db.scalar(select(Withdrawal).where(Withdrawal.id == withdrawal_id))
    if not w:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    if w.status != WithdrawalStatus.requested.value:
        raise HTTPException(status_code=400, detail="Withdrawal not in requested state")

    w.status = WithdrawalStatus.approved.value
    w.admin_id = admin.id
    w.processed_at = datetime.now(timezone.utc)
    db.add(w)

    # Mark hold transaction as succeeded (funds already debited)
    if w.hold_reference:
        tx = db.scalar(
            select(Transaction).where(
                Transaction.user_id == w.user_id,
                Transaction.reference == w.hold_reference,
                Transaction.transaction_type == TransactionType.withdrawal_hold.value,
            )
        )
        if tx and tx.status == TransactionStatus.pending.value:
            tx.status = TransactionStatus.succeeded.value
            tx.transaction_type = TransactionType.withdrawal_paid.value
            db.add(tx)
    db.commit()
    db.refresh(w)
    return w


@router.post("/admin/withdrawals/{withdrawal_id}/reject", response_model=WithdrawalPublic)
def admin_reject(
    withdrawal_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
) -> Withdrawal:
    w = db.scalar(select(Withdrawal).where(Withdrawal.id == withdrawal_id))
    if not w:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    if w.status != WithdrawalStatus.requested.value:
        raise HTTPException(status_code=400, detail="Withdrawal not in requested state")

    w.status = WithdrawalStatus.rejected.value
    w.admin_id = admin.id
    w.processed_at = datetime.now(timezone.utc)
    db.add(w)

    # Release held funds back to wallet
    wallet = WalletService(db)
    wallet.credit(
        user_id=w.user_id,
        amount=Decimal(w.amount),
        transaction_type=TransactionType.withdrawal_released,
        payment_method="wallet",
        status=TransactionStatus.succeeded,
        reference=f"withdraw_release:{w.id}",
    )

    db.commit()
    db.refresh(w)
    return w

