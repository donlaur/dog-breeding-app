"""add photos table

Revision ID: add_photos_table
Revises: c650ca65f0d6
Create Date: 2023-05-03 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_photos_table'
down_revision = 'c650ca65f0d6'
branch_labels = None
depends_on = None


def upgrade():
    # Create the photos table for all types of entities
    op.create_table(
        'photos',
        sa.Column('id', sa.BigInteger, primary_key=True),
        sa.Column('related_type', sa.String, nullable=False, comment='Type of entity (dog, litter, puppy)'),
        sa.Column('related_id', sa.BigInteger, nullable=False, comment='ID of the related entity'),
        sa.Column('url', sa.String, nullable=False, comment='URL to the photo'),
        sa.Column('original_filename', sa.String, nullable=True, comment='Original filename'),
        sa.Column('is_cover', sa.Boolean, nullable=False, default=False, comment='Whether this is the cover photo'),
        sa.Column('order', sa.Integer, nullable=False, default=0, comment='Display order for photos'),
        sa.Column('caption', sa.String, nullable=True, comment='Optional caption for the photo'),
        sa.Column('created_at', sa.TIMESTAMP, server_default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.TIMESTAMP, server_default=sa.func.current_timestamp())
    )
    
    # Create an index for faster lookups
    op.create_index('idx_photos_related', 'photos', ['related_type', 'related_id'])
    
    # Create a unique constraint to ensure only one cover photo per entity
    op.create_index(
        'idx_photos_cover', 
        'photos', 
        ['related_type', 'related_id', 'is_cover'],
        unique=True, 
        postgresql_where=sa.text('is_cover = true')
    )


def downgrade():
    op.drop_index('idx_photos_cover')
    op.drop_index('idx_photos_related')
    op.drop_table('photos')