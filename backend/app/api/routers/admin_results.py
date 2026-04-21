from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.admin import Admin
from app.models.bet import Bet
from app.models.enums import BetStatus, BetType, MatchStatus, TransactionStatus, TransactionType
from app.models.match import Match
from app.services.wallet import WalletService


router = APIRouter(prefix="/admin", tags=["admin"])


class ResultUpdate(BaseModel):
    match_id: int
    toss_winner_team_id: int | None = None
    match_winner_team_id: int | None = None
    match_status: str = Field(default=MatchStatus.completed.value)


@router.post("/results")
def set_results(
    payload: ResultUpdate,
    db: Session = Depends(get_db),
    _admin: Admin = Depends(get_current_admin),
) -> dict[str, int]:
    match = db.scalar(select(Match).where(Match.id == payload.match_id))
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    match.toss_winner_team_id = payload.toss_winner_team_id
    match.match_winner_team_id = payload.match_winner_team_id
    match.match_status = payload.match_status
    db.add(match)

    wallet = WalletService(db)
    settled = 0

    bets = list(db.scalars(select(Bet).where(Bet.match_id == match.id, Bet.bet_status == BetStatus.placed.value)))
    for bet in bets:
        if bet.bet_type == BetType.toss.value:
            winner_team_id = match.toss_winner_team_id
        else:
            winner_team_id = match.match_winner_team_id

        if not winner_team_id:
            continue

        bet.settled_at = datetime.now(timezone.utc)
        if bet.predicted_winner_team_id == winner_team_id:
            bet.bet_status = BetStatus.won.value
            wallet.credit(
                user_id=bet.user_id,
                amount=bet.potential_payout,
                transaction_type=TransactionType.bet_payout,
                payment_method="wallet",
                status=TransactionStatus.succeeded,
                reference=f"bet_payout:{bet.id}",
            )
        else:
            bet.bet_status = BetStatus.lost.value

        db.add(bet)
        settled += 1

    db.commit()
    return {"settled_bets": settled}

