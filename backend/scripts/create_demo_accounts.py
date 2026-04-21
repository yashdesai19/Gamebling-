from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import select

# Make script runnable directly via: python scripts/create_demo_accounts.py
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.admin import Admin  # noqa: E402
from app.models.enums import KycStatus  # noqa: E402
from app.models.user import User  # noqa: E402


DEMO_USER = {
    "username": "demo",
    "email": "demo@mail.com",
    "password": "Password@123",
}

DEMO_ADMIN = {
    "username": "admin",
    "password": "Admin@12345",
}


def main() -> None:
    with SessionLocal() as db:
        # Admin
        admin = db.scalar(select(Admin).where(Admin.username == DEMO_ADMIN["username"]))
        if not admin:
            admin = Admin(
                username=DEMO_ADMIN["username"],
                password_hash=hash_password(DEMO_ADMIN["password"]),
            )
            db.add(admin)

        # User
        user = db.scalar(select(User).where(User.username == DEMO_USER["username"]))
        if not user:
            user = User(
                username=DEMO_USER["username"],
                email=DEMO_USER["email"],
                phone=None,
                password_hash=hash_password(DEMO_USER["password"]),
                is_verified=True,
                kyc_status=KycStatus.verified.value,
            )
            db.add(user)

        db.commit()


if __name__ == "__main__":
    main()

