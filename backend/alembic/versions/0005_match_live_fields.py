"""add live fields to matches

Revision ID: 0005_match_live_fields
Revises: 0004_make_phone_nullable
Create Date: 2026-04-15
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0005_match_live_fields"
down_revision = "0004_make_phone_nullable"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("matches", sa.Column("external_match_id", sa.String(length=100), nullable=True))
    op.add_column("matches", sa.Column("live_score", sa.String(length=500), nullable=True))
    op.add_column("matches", sa.Column("live_over", sa.String(length=50), nullable=True))
    op.add_column("matches", sa.Column("live_status_text", sa.String(length=255), nullable=True))
    op.add_column("matches", sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_matches_external_match_id"), "matches", ["external_match_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_matches_external_match_id"), table_name="matches")
    op.drop_column("matches", "last_synced_at")
    op.drop_column("matches", "live_status_text")
    op.drop_column("matches", "live_over")
    op.drop_column("matches", "live_score")
    op.drop_column("matches", "external_match_id")

