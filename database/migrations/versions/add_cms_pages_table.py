"""add cms pages table

Revision ID: 5e4a76d8a312
Revises: 400a67d5474d
Create Date: 2025-03-05

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5e4a76d8a312'
down_revision = '400a67d5474d'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'pages',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False, unique=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('template', sa.String(50), nullable=False, server_default='default'),
        sa.Column('status', sa.String(20), nullable=False, server_default='published'),
        sa.Column('meta_description', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Create index on slug for faster lookups
    op.create_index('idx_pages_slug', 'pages', ['slug'], unique=True)


def downgrade():
    op.drop_index('idx_pages_slug')
    op.drop_table('pages')