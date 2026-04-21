import sys
import os

# Set up paths
sys.path.append(os.path.join(os.getcwd(), "backend"))

# Mock environment variables for Pydantic
os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/ipl2"
os.environ["JWT_SECRET_KEY"] = "change-me-to-a-long-random-secret"

from app.db.session import SessionLocal
from app.models.wallet import Wallet
from app.models.user import User

def list_users():
    with SessionLocal() as db:
        users = db.query(User).all()
        for u in users:
            wallet = db.query(Wallet).filter(Wallet.user_id == u.id).first()
            balance = wallet.wallet_balance if wallet else "No Wallet"
            print(f"ID: {u.id} | Email: {u.email} | Phone: {u.phone} | Balance: {balance}")

if __name__ == "__main__":
    list_users()
