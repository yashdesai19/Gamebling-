import sys
import os

# Set up paths
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock env
os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/ipl2"
os.environ["JWT_SECRET_KEY"] = "change-me-to-a-long-random-secret"

from app.db.session import SessionLocal
from app.services.live_match_sync import LiveIPLSyncService

def manual_sync():
    print("Starting Manual Sync with New API Key...")
    with SessionLocal() as db:
        svc = LiveIPLSyncService(db)
        res = svc.sync_ipl()
        print(f"Sync Result: {res}")

if __name__ == "__main__":
    manual_sync()
