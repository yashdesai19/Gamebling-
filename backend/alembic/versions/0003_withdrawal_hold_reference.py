"""add withdrawal hold_reference

Revision ID: 0003_withdrawal_hold_reference
Revises: 0002_user_bank_details
Create Date: 2026-04-14
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0003_withdrawal_hold_reference"
down_revision = "0002_user_bank_details"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("withdrawals", sa.Column("hold_reference", sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column("withdrawals", "hold_reference")

