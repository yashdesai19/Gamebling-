from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.admin import Admin
from app.schemas.admin import AdminLoginRequest, AdminPublic
from app.schemas.auth import Token


router = APIRouter(prefix="/admin", tags=["admin"])

class AdminChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/login", response_model=Token)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)) -> Token:
    admin = db.scalar(select(Admin).where(Admin.username == payload.username))
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    admin.last_login_at = datetime.now(timezone.utc)
    db.add(admin)
    db.commit()

    token = create_access_token(subject=str(admin.id), audience="admin")
    return Token(access_token=token)


@router.get("/me", response_model=AdminPublic)
def admin_me(current_admin: Admin = Depends(get_current_admin)) -> Admin:
    return current_admin


@router.post("/change_password")
def admin_change_password(
    payload: AdminChangePasswordRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin),
) -> dict[str, str]:
    if not verify_password(payload.current_password, current_admin.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid current password")
    current_admin.password_hash = hash_password(payload.new_password)
    db.add(current_admin)
    db.commit()
    return {"status": "ok"}

