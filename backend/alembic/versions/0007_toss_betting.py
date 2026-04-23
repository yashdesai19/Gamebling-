"""add toss time to matches

Revision ID: 0007_toss_betting
Revises: af696632583f
Create Date: 2026-04-22
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0007_toss_betting"
down_revision = "af696632583f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("matches", sa.Column("toss_time", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_matches_toss_time"), "matches", ["toss_time"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_matches_toss_time"), table_name="matches")
    op.drop_column("matches", "toss_time")
