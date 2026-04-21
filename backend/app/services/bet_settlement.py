import logging
from decimal import Decimal
from datetime import UTC, datetime
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.match import Match
from app.models.bet import Bet
from app.models.user import User
from app.models.transaction import Transaction
from app.models.enums import BetStatus, TransactionType, TransactionStatus

logger = logging.getLogger(__name__)


def auto_settle_match_bets(db: Session, match: Match) -> dict:
    """
    Settles all placed bets for a given completed match.
    Expected to run immediately after the match status turns to 'completed'.
    """
    if match.match_status != "completed":
        return {"settled": 0, "status": "skipped", "reason": "match not completed"}

    # Find all placed bets for this match
    stmt = select(Bet).filter(Bet.match_id == match.id, Bet.bet_status == BetStatus.placed.value)
    bets = db.scalars(stmt).all()

    if not bets:
        return {"settled": 0, "status": "skipped", "reason": "no pending bets"}

    toss_winner_id = match.toss_winner_team_id
    match_winner_id = match.match_winner_team_id
    
    if not match_winner_id:
        return {"settled": 0, "status": "skipped", "reason": "no match winner declared"}

    settled_count = 0

    for bet in bets:
        is_winner = False
        if bet.bet_type == "toss":
            # If toss winner is unknown, we can't settle toss bets
            if not toss_winner_id:
                continue
            is_winner = (bet.predicted_winner_team_id == toss_winner_id)
        elif bet.bet_type == "match_winner":
            is_winner = (bet.predicted_winner_team_id == match_winner_id)

        user = db.scalar(select(User).where(User.id == bet.user_id).with_for_update())
        if not user:
            logger.warning(f"User {bet.user_id} not found for bet {bet.id}")
            continue

        if is_winner:
            bet.bet_status = BetStatus.won.value
            payout = bet.potential_payout
            user.wallet_balance += payout
            
            # Create transaction record
            tx = Transaction(
                user_id=user.id,
                transaction_type=TransactionType.bet_payout.value,
                amount=payout,
                status=TransactionStatus.succeeded.value,
                reference=f"bet_win:{bet.id}",
                description=f"Winnings for Bet #{bet.id}"
            )
            db.add(tx)
        else:
            bet.bet_status = BetStatus.lost.value

        bet.settled_at = datetime.now(UTC)
        settled_count += 1

    db.commit()
    return {"settled": settled_count, "status": "success"}
