import sys
import os

# Set up paths
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock environment variables for Pydantic
os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/ipl2"
os.environ["JWT_SECRET_KEY"] = "change-me-to-a-long-random-secret"

from app.db.session import SessionLocal
from app.models.match import Match
from sqlalchemy import delete

def cleanup_dummies():
    with SessionLocal() as db:
        # Delete matches with dummy external IDs
        stmt = delete(Match).where(Match.external_match_id.like("dummy_ipl_%"))
        result = db.execute(stmt)
        db.commit()
        print(f"Cleanup successfully deleted {result.rowcount} dummy matches.")

if __name__ == "__main__":
    cleanup_dummies()
