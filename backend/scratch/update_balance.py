import sys
import os
from decimal import Decimal

# Set up paths
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock environment variables for Pydantic
os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/ipl2"
os.environ["JWT_SECRET_KEY"] = "change-me-to-a-long-random-secret"

from app.db.session import SessionLocal
from app.models.user import User

def update_balances():
    with SessionLocal() as db:
        # Find user with the high balance
        users = db.query(User).filter(User.wallet_balance > 900000).all()
        if not users:
            print("No high balance user found. Checking all users...")
            users = db.query(User).all()
        
        for u in users:
            old_balance = u.wallet_balance
            u.wallet_balance = Decimal("5000.00")
            print(f"User {u.email}: Updated balance from {old_balance} to {u.wallet_balance}")
        
        db.commit()
        print("Updated all targeted user balances.")

if __name__ == "__main__":
    update_balances()
