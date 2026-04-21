"""add user bank_details and upi_id

Revision ID: 0002_user_bank_details
Revises: 0001_init
Create Date: 2026-04-14
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0002_user_bank_details"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("bank_details", sa.String(length=500), nullable=True))
    op.add_column("users", sa.Column("upi_id", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "upi_id")
    op.drop_column("users", "bank_details")

