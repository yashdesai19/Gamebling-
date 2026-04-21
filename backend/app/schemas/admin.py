from __future__ import annotations

from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)


class AdminPublic(BaseModel):
    id: int
    username: str

    model_config = {"from_attributes": True}

