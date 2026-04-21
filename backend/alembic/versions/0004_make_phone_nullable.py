"""make users.phone nullable

Revision ID: 0004_make_phone_nullable
Revises: 0003_withdrawal_hold_reference
Create Date: 2026-04-14
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "0004_make_phone_nullable"
down_revision = "0003_withdrawal_hold_reference"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "phone", existing_type=sa.String(length=20), nullable=True)


def downgrade() -> None:
    op.alter_column("users", "phone", existing_type=sa.String(length=20), nullable=False)

