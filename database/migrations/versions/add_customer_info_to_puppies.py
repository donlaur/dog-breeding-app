"""add customer reference to puppies

Revision ID: bc3d88c35e52
Revises: fa2d88c34e51
Create Date: 2025-03-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

# revision identifiers, used by Alembic.
revision = 'bc3d88c35e52'
down_revision = 'fa2d88c34e51'
branch_labels = None
depends_on = None


def upgrade():
    # Create customers table first
    op.create_table(
        'customers',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('address', sa.String(255), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('state', sa.String(50), nullable=True),
        sa.Column('zip', sa.String(20), nullable=True),
        sa.Column('country', sa.String(50), nullable=True, server_default='USA'),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Create index on email for faster lookups
    op.create_index('idx_customers_email', 'customers', ['email'])
    
    # Add customer_id and transaction details to puppies table
    op.add_column('puppies', sa.Column('customer_id', sa.Integer, nullable=True))
    op.add_column('puppies', sa.Column('reservation_date', sa.DateTime, nullable=True))
    op.add_column('puppies', sa.Column('sale_date', sa.DateTime, nullable=True))
    op.add_column('puppies', sa.Column('transaction_notes', sa.Text, nullable=True))
    op.add_column('puppies', sa.Column('application_id', sa.Integer, nullable=True))
    
    # Add an index on status for faster queries
    op.create_index('idx_puppies_status', 'puppies', ['status'])
    
    # Add foreign key to customers table
    op.create_foreign_key(
        'fk_puppies_customer',
        'puppies', 'customers',
        ['customer_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Add foreign key to form_submissions if the puppy is linked to an application
    op.create_foreign_key(
        'fk_puppies_application',
        'puppies', 'form_submissions',
        ['application_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade():
    op.drop_constraint('fk_puppies_application', 'puppies', type_='foreignkey')
    op.drop_constraint('fk_puppies_customer', 'puppies', type_='foreignkey')
    op.drop_index('idx_puppies_status')
    op.drop_column('puppies', 'application_id')
    op.drop_column('puppies', 'transaction_notes')
    op.drop_column('puppies', 'sale_date')
    op.drop_column('puppies', 'reservation_date')
    op.drop_column('puppies', 'customer_id')
    op.drop_index('idx_customers_email')
    op.drop_table('customers')