from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserPublic
from app.schemas.wallet import BankDetails, WalletResponse


router = APIRouter(prefix="/users", tags=["users"])


class ProfileUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    phone: str | None = Field(default=None, min_length=8, max_length=20)

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


@router.get("/profile", response_model=UserPublic)
def get_profile(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/profile", response_model=UserPublic)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    if payload.username is not None:
        current_user.username = payload.username
    if payload.phone is not None:
        current_user.phone = payload.phone

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/wallet", response_model=WalletResponse)
def get_wallet(current_user: User = Depends(get_current_user)) -> WalletResponse:
    return WalletResponse(wallet_balance=current_user.wallet_balance)


@router.get("/bank_details", response_model=BankDetails)
def get_bank_details(current_user: User = Depends(get_current_user)) -> BankDetails:
    return BankDetails(bank_details=current_user.bank_details, upi_id=current_user.upi_id)


@router.put("/bank_details", response_model=BankDetails)
def put_bank_details(
    payload: BankDetails,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BankDetails:
    current_user.bank_details = payload.bank_details
    current_user.upi_id = payload.upi_id
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return BankDetails(bank_details=current_user.bank_details, upi_id=current_user.upi_id)


@router.post("/change_password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid current password")
    current_user.password_hash = hash_password(payload.new_password)
    db.add(current_user)
    db.commit()
    return {"status": "ok"}
