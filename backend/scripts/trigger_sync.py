
import sys
from pathlib import Path

# Add project root to sys.path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.session import SessionLocal
from app.services.live_match_sync import LiveIPLSyncService

def main():
    print("Connecting to database...")
    db = SessionLocal()
    try:
        service = LiveIPLSyncService(db)
        print("Starting IPL Sync (CricAPI + RapidAPI)...")
        result = service.sync_ipl()
        print(f"Sync completed: {result}")
    except Exception as e:
        print(f"Sync failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
