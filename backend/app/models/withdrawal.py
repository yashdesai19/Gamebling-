from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class Withdrawal(TimestampMixin, Base):
    __tablename__ = "withdrawals"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    bank_details: Mapped[str | None] = mapped_column(String(500), nullable=True)
    upi_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    admin_id: Mapped[int | None] = mapped_column(ForeignKey("admins.id", ondelete="SET NULL"), nullable=True)
    hold_reference: Mapped[str | None] = mapped_column(String(200), nullable=True)

    user: Mapped["User"] = relationship()
    admin: Mapped["Admin | None"] = relationship()


from app.models.admin import Admin  # noqa: E402
from app.models.user import User  # noqa: E402

