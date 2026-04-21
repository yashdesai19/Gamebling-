from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class WithdrawalRequest(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    bank_details: str | None = Field(default=None, max_length=500)
    upi_id: str | None = Field(default=None, max_length=100)


class WithdrawalPublic(BaseModel):
    id: int
    user_id: int
    amount: Decimal
    bank_details: str | None
    upi_id: str | None
    status: str
    processed_at: datetime | None
    created_at: datetime
    admin_id: int | None

    model_config = {"from_attributes": True}

