from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routers.auth import login as auth_login
from app.api.routers.auth import register as auth_register
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserPublic


router = APIRouter(tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    return auth_register(payload, db)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    return auth_login(payload, db)

