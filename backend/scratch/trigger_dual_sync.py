import sys
import os
import logging
from dotenv import load_dotenv

# Set up paths
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Load real env
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

# Mock/Override necessary ones
os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/ipl2"

# Configure logging to see EVERYTHING
logging.basicConfig(level=logging.INFO)

from app.db.session import SessionLocal
from app.services.live_match_sync import LiveIPLSyncService
from app.models.match import Match
from sqlalchemy import select

def trigger_sync():
    print("Starting Manual Sync with RapidAPI + CricAPI...")
    print(f"Rapid Key present: {bool(os.getenv('X-RapidAPI-Key'))}")
    
    with SessionLocal() as db:
        service = LiveIPLSyncService(db)
        results = service.sync_ipl()
        print(f"Sync Results: {results}")
        
        # Now list matches
        ms = db.scalars(select(Match).order_by(Match.match_date)).all()
        print(f"\nFinal Matches in DB: {len(ms)}")
        for m in ms:
            t1 = m.team1.short_name if m.team1 else "TBD"
            t2 = m.team2.short_name if m.team2 else "TBD"
            print(f"ID: {m.id} | {t1} vs {t2} | ExtID: {m.external_match_id} | Status: {m.match_status}")

if __name__ == "__main__":
    trigger_sync()
