from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.schemas.team import TeamPublic


class MatchPublic(BaseModel):
    id: int
    match_date: datetime
    venue: str
    match_status: str
    external_match_id: str | None = None
    live_score: str | None = None
    live_over: str | None = None
    live_status_text: str | None = None
    last_synced_at: datetime | None = None

    team1: TeamPublic
    team2: TeamPublic
    toss_winner: TeamPublic | None
    match_winner: TeamPublic | None

    model_config = {"from_attributes": True}

