
import sys
import os
from datetime import datetime, timezone

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.services.color_game import ColorGameService

def test_catchup():
    print(f"Current UTC time: {datetime.now(timezone.utc)}")
    try:
        with SessionLocal() as db:
            svc = ColorGameService(db)
            print("Calling ensure_current_round...")
            rnd = svc.ensure_current_round()
            print(f"Resulting round: ID={rnd.id}, Number={rnd.round_number}, Status={rnd.status}, EndAt={rnd.end_at}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_catchup()
