from __future__ import annotations

from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserPublic(BaseModel):
    id: int
    username: str
    email: EmailStr
    phone: str | None
    wallet_balance: Decimal
    is_verified: bool
    kyc_status: str
    created_at: datetime

    model_config = {"from_attributes": True}

