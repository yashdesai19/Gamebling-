import sys
import os
from datetime import datetime, timezone

# Set up paths
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock env
os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/ipl2"
os.environ["JWT_SECRET_KEY"] = "change-me-to-a-long-random-secret"

from app.db.session import SessionLocal
from app.models.match import Match

def seed_live():
    with SessionLocal() as db:
        # Check if already exists
        ext_id = "manual_sim_srh_dc_1"
        existing = db.query(Match).filter(Match.external_match_id == ext_id).first()
        if existing:
            print("Match already exists.")
            return

        match = Match(
            team1_id=7, # SRH
            team2_id=5, # DC
            match_date=datetime.now(timezone.utc),
            venue="Hyderabad",
            match_status="live",
            live_score="162/4 (17.2 Ovs)",
            live_status_text="SRH won the toss and chose to bat",
            external_match_id=ext_id,
        )
        db.add(match)
        db.commit()
        print("Successfully added SRH vs DC Live Match simulation.")

if __name__ == "__main__":
    seed_live()
