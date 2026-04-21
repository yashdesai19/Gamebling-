from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import TransactionStatus, TransactionType
from app.models.transaction import Transaction
from app.models.user import User


class WalletService:
    def __init__(self, db: Session):
        self.db = db

    def _lock_user(self, user_id: int) -> User:
        user = self.db.scalar(select(User).where(User.id == user_id).with_for_update())
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def credit(
        self,
        *,
        user_id: int,
        amount: Decimal,
        transaction_type: TransactionType,
        payment_method: str | None = None,
        reference: str | None = None,
        status: TransactionStatus = TransactionStatus.succeeded,
    ) -> Transaction:
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")

        user = self._lock_user(user_id)
        user.wallet_balance = (user.wallet_balance or Decimal("0.00")) + amount

        tx = Transaction(
            user_id=user_id,
            transaction_type=transaction_type.value,
            amount=amount,
            payment_method=payment_method,
            status=status.value,
            reference=reference or str(uuid4()),
        )
        self.db.add_all([user, tx])
        return tx

    def debit(
        self,
        *,
        user_id: int,
        amount: Decimal,
        transaction_type: TransactionType,
        payment_method: str | None = None,
        reference: str | None = None,
        status: TransactionStatus = TransactionStatus.succeeded,
    ) -> Transaction:
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")

        user = self._lock_user(user_id)
        current = user.wallet_balance or Decimal("0.00")
        if current < amount:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")

        user.wallet_balance = current - amount

        tx = Transaction(
            user_id=user_id,
            transaction_type=transaction_type.value,
            amount=-amount,
            payment_method=payment_method,
            status=status.value,
            reference=reference or str(uuid4()),
        )
        self.db.add_all([user, tx])
        return tx

