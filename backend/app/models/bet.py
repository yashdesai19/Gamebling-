from __future__ import annotations

from decimal import Decimal
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import BetStatus, BetType
from app.models.mixins import TimestampMixin


class Bet(TimestampMixin, Base):
    __tablename__ = "bets"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)

    bet_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True, default=BetType.toss.value)
    predicted_winner_team_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False)

    bet_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    odds: Mapped[Decimal] = mapped_column(Numeric(10, 4), nullable=False, default=Decimal("1.9800"))
    potential_payout: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    bet_status: Mapped[str] = mapped_column(String(20), nullable=False, index=True, default=BetStatus.placed.value)
    settled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship()
    match: Mapped["Match"] = relationship()
    predicted_team: Mapped["Team"] = relationship(foreign_keys=[predicted_winner_team_id])

    __table_args__ = (
        UniqueConstraint("user_id", "match_id", "bet_type", name="uq_bets_user_match_type"),
        CheckConstraint("bet_amount > 0", name="ck_bets_amount_positive"),
        CheckConstraint("odds >= 1", name="ck_bets_odds_min_one"),
        CheckConstraint("potential_payout >= 0", name="ck_bets_payout_nonnegative"),
    )


from app.models.match import Match  # noqa: E402
from app.models.team import Team  # noqa: E402
from app.models.user import User  # noqa: E402

