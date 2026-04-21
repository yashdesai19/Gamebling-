from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PlaceBetRequest(BaseModel):
    match_id: int
    predicted_winner_team_id: int
    bet_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class BetPublic(BaseModel):
    id: int
    user_id: int
    match_id: int
    bet_type: str
    predicted_winner_team_id: int
    bet_amount: Decimal
    odds: Decimal
    potential_payout: Decimal
    bet_status: str
    created_at: datetime
    settled_at: datetime | None

    model_config = {"from_attributes": True}

