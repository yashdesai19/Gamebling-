from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class TeamPublic(BaseModel):
    id: int
    name: str
    short_name: str
    logo: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

