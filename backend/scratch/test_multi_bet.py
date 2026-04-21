
import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.services.color_game import ColorGameService
from app.models.color import ColorBet
from sqlalchemy import select
from decimal import Decimal

def test_multiple_bets():
    with SessionLocal() as db:
        svc = ColorGameService(db)
        rnd = svc.ensure_current_round()
        print(f"Current Round ID: {rnd.id}, Status: {rnd.status}")
        
        user_id = 1 # Assuming user 1 exists
        
        # Place first bet
        bet1 = ColorBet(
            user_id=user_id,
            round_id=rnd.id,
            chosen_color="red",
            bet_amount=Decimal("10.00"),
            status="placed"
        )
        db.add(bet1)
        
        # Place second bet
        bet2 = ColorBet(
            user_id=user_id,
            round_id=rnd.id,
            chosen_color="green",
            bet_amount=Decimal("10.00"),
            status="placed"
        )
        db.add(bet2)
        
        try:
            db.commit()
            print("Successfully placed multiple bets in one round!")
        except Exception as e:
            db.rollback()
            print(f"Error placing multiple bets: {e}")

if __name__ == "__main__":
    test_multiple_bets()
