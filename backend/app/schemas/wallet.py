from __future__ import annotations

from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, Field


class WalletResponse(BaseModel):
    wallet_balance: Decimal


class DepositRequest(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    payment_method: str | None = Field(default="manual", max_length=50)


class DepositLinkResponse(BaseModel):
    tx_id: int
    payment_link_id: str
    short_url: str


class TransactionPublic(BaseModel):
    id: int
    transaction_type: str
    amount: Decimal
    payment_method: str | None
    status: str
    reference: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class BankDetails(BaseModel):
    bank_details: str | None = Field(default=None, max_length=500)
    upi_id: str | None = Field(default=None, max_length=100)

