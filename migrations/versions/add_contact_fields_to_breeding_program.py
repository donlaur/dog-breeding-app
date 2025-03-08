"""add contact fields to breeding program

Revision ID: 54a38d725e9c
Revises: 67e7ed5b767b
Create Date: 2023-03-05

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '54a38d725e9c'
down_revision = '67e7ed5b767b'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to breeding_programs table
    op.add_column('breeding_programs', sa.Column('address', sa.Text(), nullable=True))
    op.add_column('breeding_programs', sa.Column('phone', sa.Text(), nullable=True))


def downgrade():
    # Remove columns if needed
    op.drop_column('breeding_programs', 'phone')
    op.drop_column('breeding_programs', 'address')