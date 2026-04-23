from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MatchStatus
from app.models.mixins import TimestampMixin


class Match(TimestampMixin, Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True)

    team1_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False, index=True)
    team2_id: Mapped[int] = mapped_column(ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False, index=True)

    match_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    toss_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    venue: Mapped[str] = mapped_column(String(255), nullable=False)

    toss_winner_team_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
    )
    match_winner_team_id: Mapped[int | None] = mapped_column(
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
    )

    match_status: Mapped[str] = mapped_column(String(20), nullable=False, default=MatchStatus.scheduled.value, index=True)

    # External/live feed fields (CricAPI sync)
    external_match_id: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True, index=True)
    live_score: Mapped[str | None] = mapped_column(String(500), nullable=True)
    live_over: Mapped[str | None] = mapped_column(String(50), nullable=True)
    live_status_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    team1: Mapped["Team"] = relationship(foreign_keys=[team1_id])
    team2: Mapped["Team"] = relationship(foreign_keys=[team2_id])
    toss_winner: Mapped["Team | None"] = relationship(foreign_keys=[toss_winner_team_id])
    match_winner: Mapped["Team | None"] = relationship(foreign_keys=[match_winner_team_id])


from app.models.team import Team  # noqa: E402

