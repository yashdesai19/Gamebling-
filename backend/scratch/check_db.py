
import sys
import os

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from sqlalchemy import text

def check_db():
    try:
        with SessionLocal() as db:
            # Check if tables exist
            res = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            tables = [r[0] for r in res]
            print(f"Tables: {tables}")
            
            if 'color_rounds' in tables:
                res = db.execute(text("SELECT COUNT(*) FROM color_rounds"))
                count = res.scalar()
                print(f"Color rounds count: {count}")
                
                if count > 0:
                    res = db.execute(text("SELECT * FROM color_rounds ORDER BY round_number DESC LIMIT 1"))
                    latest = res.mappings().first()
                    print(f"Latest round: {latest}")
            else:
                print("Table 'color_rounds' does not exist!")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
