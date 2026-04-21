import sys
import os
from datetime import datetime, timezone, timedelta

# Set up paths
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock env
os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/ipl2"
os.environ["JWT_SECRET_KEY"] = "change-me-to-a-long-random-secret"

from app.db.session import SessionLocal
from app.models.match import Match

def update_time():
    with SessionLocal() as db:
        ext_id = "manual_sim_srh_dc_1"
        match = db.query(Match).filter(Match.external_match_id == ext_id).first()
        if not match:
            print("Match not found.")
            return

        # Set to April 21, 2026, 14:00 UTC (which is 7:30 PM IST)
        # Using a fixed date from the conversation context (2026-04-21)
        new_date = datetime(2026, 4, 21, 14, 0, 0, tzinfo=timezone.utc)
        
        match.match_date = new_date
        match.match_status = "live" # Ensure it stays live for simulation
        db.commit()
        print(f"Updated match {match.id} time to {new_date}")

if __name__ == "__main__":
    update_time()
