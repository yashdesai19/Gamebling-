
import sys
import os
from datetime import datetime, timezone
import zoneinfo

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.color import ColorRound
from sqlalchemy import select

def check_sync():
    now = datetime.now(timezone.utc)
    now_local = datetime.now(zoneinfo.ZoneInfo("Asia/Calcutta"))
    print(f"Server UTC: {now}")
    print(f"Server Local (Calcutta): {now_local}")
    
    with SessionLocal() as db:
        q = select(ColorRound).order_by(ColorRound.round_number.desc()).limit(1)
        latest = db.scalar(q)
        if latest:
            print(f"Latest Round in DB: #{latest.round_number} (ID: {latest.id})")
            print(f"Status: {latest.status}")
            print(f"End At (DB): {latest.end_at}")
            print(f"Is now > end_at? {now_local > latest.end_at}")
        else:
            print("No rounds found.")

if __name__ == "__main__":
    check_sync()
