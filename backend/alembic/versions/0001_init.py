"""init tables

Revision ID: 0001_init
Revises: 
Create Date: 2026-04-14
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "admins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_admins_username", "admins", ["username"], unique=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("wallet_balance", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("kyc_status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("wallet_balance >= 0", name="ck_users_wallet_balance_nonnegative"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_phone", "users", ["phone"], unique=True)

    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("short_name", sa.String(length=10), nullable=False),
        sa.Column("logo", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_teams_name", "teams", ["name"], unique=True)
    op.create_index("ix_teams_short_name", "teams", ["short_name"], unique=True)

    op.create_table(
        "matches",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("team1_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("team2_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("match_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("venue", sa.String(length=255), nullable=False),
        sa.Column("toss_winner_team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="SET NULL"), nullable=True),
        sa.Column("match_winner_team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="SET NULL"), nullable=True),
        sa.Column("match_status", sa.String(length=20), nullable=False, server_default="scheduled"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_matches_team1_id", "matches", ["team1_id"], unique=False)
    op.create_index("ix_matches_team2_id", "matches", ["team2_id"], unique=False)
    op.create_index("ix_matches_match_date", "matches", ["match_date"], unique=False)
    op.create_index("ix_matches_match_status", "matches", ["match_status"], unique=False)

    op.create_table(
        "bets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("match_id", sa.Integer(), sa.ForeignKey("matches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bet_type", sa.String(length=20), nullable=False, server_default="toss"),
        sa.Column("predicted_winner_team_id", sa.Integer(), sa.ForeignKey("teams.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("bet_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("odds", sa.Numeric(10, 4), nullable=False, server_default="1.9800"),
        sa.Column("potential_payout", sa.Numeric(12, 2), nullable=False),
        sa.Column("bet_status", sa.String(length=20), nullable=False, server_default="placed"),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("user_id", "match_id", "bet_type", name="uq_bets_user_match_type"),
        sa.CheckConstraint("bet_amount > 0", name="ck_bets_amount_positive"),
        sa.CheckConstraint("odds >= 1", name="ck_bets_odds_min_one"),
        sa.CheckConstraint("potential_payout >= 0", name="ck_bets_payout_nonnegative"),
    )
    op.create_index("ix_bets_user_id", "bets", ["user_id"], unique=False)
    op.create_index("ix_bets_match_id", "bets", ["match_id"], unique=False)
    op.create_index("ix_bets_bet_type", "bets", ["bet_type"], unique=False)
    op.create_index("ix_bets_bet_status", "bets", ["bet_status"], unique=False)

    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("transaction_type", sa.String(length=50), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("payment_method", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("reference", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("amount <> 0", name="ck_transactions_amount_nonzero"),
    )
    op.create_index("ix_transactions_user_id", "transactions", ["user_id"], unique=False)
    op.create_index("ix_transactions_transaction_type", "transactions", ["transaction_type"], unique=False)
    op.create_index("ix_transactions_status", "transactions", ["status"], unique=False)

    op.create_table(
        "withdrawals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("bank_details", sa.String(length=500), nullable=True),
        sa.Column("upi_id", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("admin_id", sa.Integer(), sa.ForeignKey("admins.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_withdrawals_user_id", "withdrawals", ["user_id"], unique=False)
    op.create_index("ix_withdrawals_status", "withdrawals", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_withdrawals_status", table_name="withdrawals")
    op.drop_index("ix_withdrawals_user_id", table_name="withdrawals")
    op.drop_table("withdrawals")

    op.drop_index("ix_transactions_status", table_name="transactions")
    op.drop_index("ix_transactions_transaction_type", table_name="transactions")
    op.drop_index("ix_transactions_user_id", table_name="transactions")
    op.drop_table("transactions")

    op.drop_index("ix_bets_bet_status", table_name="bets")
    op.drop_index("ix_bets_bet_type", table_name="bets")
    op.drop_index("ix_bets_match_id", table_name="bets")
    op.drop_index("ix_bets_user_id", table_name="bets")
    op.drop_table("bets")

    op.drop_index("ix_matches_match_status", table_name="matches")
    op.drop_index("ix_matches_match_date", table_name="matches")
    op.drop_index("ix_matches_team2_id", table_name="matches")
    op.drop_index("ix_matches_team1_id", table_name="matches")
    op.drop_table("matches")

    op.drop_index("ix_teams_short_name", table_name="teams")
    op.drop_index("ix_teams_name", table_name="teams")
    op.drop_table("teams")

    op.drop_index("ix_users_phone", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_admins_username", table_name="admins")
    op.drop_table("admins")

