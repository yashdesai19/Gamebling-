from __future__ import annotations

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.color import ColorBet, ColorRound
from app.models.enums import TransactionStatus, TransactionType
from app.models.user import User
from app.schemas.color import ColorBetPublic, ColorRoundHistoryItem, ColorRoundPublic, PlaceColorBetRequest
from app.services.color_game import BET_LOCK_SECONDS, ColorGameService, VALID_COLORS
from app.services.wallet import WalletService


router = APIRouter(prefix="/color", tags=["color"])


@router.get("/current", response_model=ColorRoundPublic)
def get_current_round(db: Session = Depends(get_db)) -> ColorRoundPublic:
    svc = ColorGameService(db)
    rnd = svc.ensure_current_round()
    return ColorRoundPublic(
        id=rnd.id,
        round_number=rnd.round_number,
        status=rnd.status,  # type: ignore[arg-type]
        started_at=rnd.started_at,
        seconds_remaining=svc.seconds_remaining(rnd),
        result_color=rnd.result_color,  # type: ignore[arg-type]
    )


@router.get("/history", response_model=list[ColorRoundHistoryItem])
def get_round_history(db: Session = Depends(get_db)) -> list[ColorRound]:
    svc = ColorGameService(db)
    svc.ensure_current_round()
    q = (
        select(ColorRound)
        .where(ColorRound.result_color.is_not(None))
        .order_by(ColorRound.round_number.desc())
        .limit(30)
    )
    return list(db.scalars(q))


@router.get("/my-bets", response_model=list[ColorBetPublic])
def get_my_color_bets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ColorBet]:
    q = (
        select(ColorBet)
        .where(ColorBet.user_id == current_user.id)
        .order_by(ColorBet.created_at.desc())
        .limit(100)
    )
    return list(db.scalars(q))


@router.post("/bet", response_model=ColorBetPublic)
def place_color_bet(
    payload: PlaceColorBetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ColorBet:
    if payload.chosen_color not in VALID_COLORS:
        raise HTTPException(status_code=400, detail="Invalid color")
    if payload.bet_amount < Decimal("10"):
        raise HTTPException(status_code=400, detail="Min bet is 10")

    svc = ColorGameService(db)
    rnd = svc.ensure_current_round()

    if payload.round_id != rnd.id:
        raise HTTPException(status_code=400, detail="Round changed. Please place bet in current round.")
    if rnd.status != "open":
        raise HTTPException(status_code=400, detail="Betting is closed for this round")
    if svc.seconds_remaining(rnd) <= BET_LOCK_SECONDS:
        raise HTTPException(status_code=400, detail="Betting window closed for this round")

    wallet = WalletService(db)
    wallet.debit(
        user_id=current_user.id,
        amount=payload.bet_amount,
        transaction_type=TransactionType.bet_debit,
        payment_method="wallet",
        status=TransactionStatus.succeeded,
        reference=f"color:round:{rnd.id}:user:{current_user.id}:debit",
    )

    bet = ColorBet(
        user_id=current_user.id,
        round_id=rnd.id,
        chosen_color=payload.chosen_color,
        bet_amount=payload.bet_amount,
        status="placed",
    )
    db.add(bet)
    db.commit()
    db.refresh(bet)
    return bet
