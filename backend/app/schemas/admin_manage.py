from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AdminMatchCreate(BaseModel):
    team1_id: int
    team2_id: int
    match_date: datetime
    venue: str = Field(min_length=2, max_length=255)
    match_status: str = Field(default="open")


class AdminMatchUpdate(BaseModel):
    team1_id: int | None = None
    team2_id: int | None = None
    match_date: datetime | None = None
    venue: str | None = Field(default=None, min_length=2, max_length=255)
    match_status: str | None = None
    toss_winner_team_id: int | None = None
    match_winner_team_id: int | None = None


class AdminUserPublic(BaseModel):
    id: int
    username: str
    email: str
    phone: str | None
    wallet_balance: str
    is_verified: bool
    kyc_status: str
    created_at: datetime

    model_config = {"from_attributes": True}

