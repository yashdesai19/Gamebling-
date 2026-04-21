from __future__ import annotations

from decimal import Decimal
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin


class ColorRound(TimestampMixin, Base):
    __tablename__ = "color_rounds"

    id: Mapped[int] = mapped_column(primary_key=True)
    round_number: Mapped[int] = mapped_column(nullable=False, index=True, unique=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True, default="open")

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    lock_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    result_color: Mapped[str | None] = mapped_column(String(10), nullable=True, index=True)
    settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    bets: Mapped[list["ColorBet"]] = relationship(back_populates="round")

    __table_args__ = (
        CheckConstraint("round_number > 0", name="ck_color_rounds_round_number_positive"),
    )


class ColorBet(TimestampMixin, Base):
    __tablename__ = "color_bets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    round_id: Mapped[int] = mapped_column(ForeignKey("color_rounds.id", ondelete="CASCADE"), nullable=False, index=True)

    chosen_color: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    bet_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True, default="placed")

    actual_payout: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    commission: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship()
    round: Mapped[ColorRound] = relationship(back_populates="bets")

    __table_args__ = (
        CheckConstraint("bet_amount > 0", name="ck_color_bets_amount_positive"),
    )


from app.models.user import User  # noqa: E402
