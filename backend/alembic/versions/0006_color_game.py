"""add color game tables

Revision ID: 0006_color_game
Revises: 0005_match_live_fields
Create Date: 2026-04-21
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0006_color_game"
down_revision = "0005_match_live_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "color_rounds",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("lock_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("result_color", sa.String(length=10), nullable=True),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("round_number > 0", name="ck_color_rounds_round_number_positive"),
    )
    op.create_index("ix_color_rounds_round_number", "color_rounds", ["round_number"], unique=True)
    op.create_index("ix_color_rounds_status", "color_rounds", ["status"], unique=False)
    op.create_index("ix_color_rounds_started_at", "color_rounds", ["started_at"], unique=False)
    op.create_index("ix_color_rounds_result_color", "color_rounds", ["result_color"], unique=False)

    op.create_table(
        "color_bets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("round_id", sa.Integer(), sa.ForeignKey("color_rounds.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chosen_color", sa.String(length=10), nullable=False),
        sa.Column("bet_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="placed"),
        sa.Column("actual_payout", sa.Numeric(12, 2), nullable=True),
        sa.Column("commission", sa.Numeric(12, 2), nullable=True),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("user_id", "round_id", name="uq_color_bets_user_round"),
        sa.CheckConstraint("bet_amount > 0", name="ck_color_bets_amount_positive"),
    )
    op.create_index("ix_color_bets_user_id", "color_bets", ["user_id"], unique=False)
    op.create_index("ix_color_bets_round_id", "color_bets", ["round_id"], unique=False)
    op.create_index("ix_color_bets_chosen_color", "color_bets", ["chosen_color"], unique=False)
    op.create_index("ix_color_bets_status", "color_bets", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_color_bets_status", table_name="color_bets")
    op.drop_index("ix_color_bets_chosen_color", table_name="color_bets")
    op.drop_index("ix_color_bets_round_id", table_name="color_bets")
    op.drop_index("ix_color_bets_user_id", table_name="color_bets")
    op.drop_table("color_bets")

    op.drop_index("ix_color_rounds_result_color", table_name="color_rounds")
    op.drop_index("ix_color_rounds_started_at", table_name="color_rounds")
    op.drop_index("ix_color_rounds_status", table_name="color_rounds")
    op.drop_index("ix_color_rounds_round_number", table_name="color_rounds")
    op.drop_table("color_rounds")
