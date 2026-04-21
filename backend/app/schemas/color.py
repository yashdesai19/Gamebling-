from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


ColorChoice = Literal["red", "green", "violet"]
RoundStatus = Literal["open", "closed", "resulted"]


class ColorRoundPublic(BaseModel):
    id: int
    round_number: int
    status: RoundStatus
    started_at: datetime
    seconds_remaining: int
    result_color: ColorChoice | None = None

    model_config = {"from_attributes": True}


class ColorRoundHistoryItem(BaseModel):
    id: int
    round_number: int
    result_color: ColorChoice
    status: RoundStatus

    model_config = {"from_attributes": True}


class PlaceColorBetRequest(BaseModel):
    round_id: int
    chosen_color: ColorChoice
    bet_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class ColorBetPublic(BaseModel):
    id: int
    round_id: int
    chosen_color: ColorChoice
    bet_amount: Decimal
    status: str
    actual_payout: Decimal | None = None
    commission: Decimal | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
