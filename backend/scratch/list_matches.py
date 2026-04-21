import sys
import os

# Set up paths
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock environment variables for Pydantic
os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/ipl2"
os.environ["JWT_SECRET_KEY"] = "change-me-to-a-long-random-secret"

from app.db.session import SessionLocal
from app.models.match import Match

def list_matches():
    with SessionLocal() as db:
        matches = db.query(Match).all()
        print(f"Total Matches in DB: {len(matches)}")
        for m in matches:
            print(f"ID: {m.id} | Teams: {m.team1_name} vs {m.team2_name} | Date: {m.match_date} | Status: {m.match_status}")

if __name__ == "__main__":
    list_matches()
