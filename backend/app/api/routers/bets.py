from __future__ import annotations

from decimal import Decimal
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.bet import Bet
from app.models.enums import BetStatus, BetType, MatchStatus, TransactionStatus, TransactionType
from app.models.match import Match
from app.models.user import User
from app.schemas.bet import BetPublic, PlaceBetRequest
from app.services.odds import DEFAULT_ODDS, calc_potential_payout
from app.services.wallet import WalletService


router = APIRouter(prefix="/bets", tags=["bets"])

TOSS_CLOSE_BUFFER = timedelta(minutes=5)
DEFAULT_TOSS_LEAD = timedelta(minutes=30)


def _effective_toss_time(match: Match) -> datetime:
    return match.toss_time or (match.match_date - DEFAULT_TOSS_LEAD)


def _is_toss_betting_closed(match: Match, *, now: datetime | None = None) -> bool:
    current = now or datetime.now(UTC)
    return current >= (_effective_toss_time(match) - TOSS_CLOSE_BUFFER)


def _place_bet(
    *,
    db: Session,
    current_user: User,
    payload: PlaceBetRequest,
    bet_type: BetType,
) -> Bet:
    match = db.scalar(select(Match).where(Match.id == payload.match_id))
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.match_status not in {MatchStatus.open.value, MatchStatus.scheduled.value, MatchStatus.live.value}:
        raise HTTPException(status_code=400, detail="Betting is closed for this match")

    odds = DEFAULT_ODDS
    potential_payout = calc_potential_payout(payload.bet_amount, odds)

    wallet = WalletService(db)
    wallet.debit(
        user_id=current_user.id,
        amount=payload.bet_amount,
        transaction_type=TransactionType.bet_debit,
        payment_method="wallet",
        status=TransactionStatus.succeeded,
        reference=f"bet:{payload.match_id}:{bet_type.value}",
    )

    bet = Bet(
        user_id=current_user.id,
        match_id=payload.match_id,
        bet_type=bet_type.value,
        predicted_winner_team_id=payload.predicted_winner_team_id,
        bet_amount=payload.bet_amount,
        odds=odds,
        potential_payout=potential_payout,
        bet_status=BetStatus.placed.value,
    )
    db.add(bet)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Bet already exists for this match and type")
    db.refresh(bet)
    return bet


@router.post("/place_toss", response_model=BetPublic)
def place_toss(
    payload: PlaceBetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Bet:
    match = db.scalar(select(Match).where(Match.id == payload.match_id))
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    if match.match_status == MatchStatus.live.value:
        raise HTTPException(status_code=400, detail="Toss betting is closed for live matches")
    if _is_toss_betting_closed(match):
        raise HTTPException(status_code=400, detail="Toss betting closes 5 minutes before toss time")
    
    return _place_bet(db=db, current_user=current_user, payload=payload, bet_type=BetType.toss)


@router.post("/place_winner", response_model=BetPublic)
def place_winner(
    payload: PlaceBetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Bet:
    return _place_bet(db=db, current_user=current_user, payload=payload, bet_type=BetType.match_winner)


@router.get("/history", response_model=list[BetPublic])
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Bet]:
    q = select(Bet).where(Bet.user_id == current_user.id).order_by(Bet.created_at.desc())
    return list(db.scalars(q))


@router.get("/{bet_id}", response_model=BetPublic)
def get_bet(
    bet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Bet:
    bet = db.scalar(select(Bet).where(Bet.id == bet_id, Bet.user_id == current_user.id))
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    return bet

