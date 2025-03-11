"""add health records tables

Revision ID: add_health_records_tables
Revises: add_customer_info_to_puppies
Create Date: 2025-03-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = 'add_health_records_tables'
down_revision = 'bc3d88c35e52'  # This should match add_customer_info_to_puppies
branch_labels = None
depends_on = None


def upgrade():
    # Create health_records table - general health records for dogs/puppies
    op.create_table(
        'health_records',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('dog_id', sa.Integer, sa.ForeignKey('dogs.id', ondelete='CASCADE'), nullable=True),
        sa.Column('puppy_id', sa.Integer, sa.ForeignKey('puppies.id', ondelete='CASCADE'), nullable=True),
        sa.Column('record_date', sa.DateTime, nullable=False),
        sa.Column('record_type', sa.String(50), nullable=False),  # examination, surgery, treatment, etc.
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('performed_by', sa.String(255), nullable=True),  # vet, breeder, etc.
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('attachments', JSONB, nullable=True),  # Array of file URLs
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint('(dog_id IS NOT NULL) OR (puppy_id IS NOT NULL)', name='health_records_dog_or_puppy_check')
    )
    
    # Create vaccinations table
    op.create_table(
        'vaccinations',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('dog_id', sa.Integer, sa.ForeignKey('dogs.id', ondelete='CASCADE'), nullable=True),
        sa.Column('puppy_id', sa.Integer, sa.ForeignKey('puppies.id', ondelete='CASCADE'), nullable=True),
        sa.Column('vaccine_name', sa.String(255), nullable=False),
        sa.Column('vaccine_type', sa.String(100), nullable=True),  # core, non-core, etc.
        sa.Column('administration_date', sa.DateTime, nullable=False),
        sa.Column('expiration_date', sa.DateTime, nullable=True),
        sa.Column('administered_by', sa.String(255), nullable=True),
        sa.Column('lot_number', sa.String(100), nullable=True),
        sa.Column('manufacturer', sa.String(255), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('proof_document', sa.String(255), nullable=True),  # URL to vaccination certificate
        sa.Column('next_due_date', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint('(dog_id IS NOT NULL) OR (puppy_id IS NOT NULL)', name='vaccinations_dog_or_puppy_check')
    )
    
    # Create weight_records table
    op.create_table(
        'weight_records',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('dog_id', sa.Integer, sa.ForeignKey('dogs.id', ondelete='CASCADE'), nullable=True),
        sa.Column('puppy_id', sa.Integer, sa.ForeignKey('puppies.id', ondelete='CASCADE'), nullable=True),
        sa.Column('weight', sa.Float, nullable=False),
        sa.Column('weight_unit', sa.String(10), nullable=False, server_default='lbs'),
        sa.Column('measurement_date', sa.DateTime, nullable=False),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint('(dog_id IS NOT NULL) OR (puppy_id IS NOT NULL)', name='weight_records_dog_or_puppy_check')
    )
    
    # Create medication_records table
    op.create_table(
        'medication_records',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('dog_id', sa.Integer, sa.ForeignKey('dogs.id', ondelete='CASCADE'), nullable=True),
        sa.Column('puppy_id', sa.Integer, sa.ForeignKey('puppies.id', ondelete='CASCADE'), nullable=True),
        sa.Column('medication_name', sa.String(255), nullable=False),
        sa.Column('dosage', sa.String(100), nullable=True),
        sa.Column('administration_date', sa.DateTime, nullable=False),
        sa.Column('end_date', sa.DateTime, nullable=True),
        sa.Column('frequency', sa.String(100), nullable=True),  # once, daily, weekly, etc.
        sa.Column('prescribed_by', sa.String(255), nullable=True),
        sa.Column('reason', sa.Text, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint('(dog_id IS NOT NULL) OR (puppy_id IS NOT NULL)', name='medication_records_dog_or_puppy_check')
    )
    
    # Create health_condition_templates table - for breed-specific conditions
    op.create_table(
        'health_condition_templates',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('breed_id', sa.Integer, sa.ForeignKey('dog_breeds.id'), nullable=True),
        sa.Column('condition_name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('symptoms', JSONB, nullable=True),
        sa.Column('test_recommendations', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP'))
    )
    
    # Create health_conditions table - for diagnosed conditions
    op.create_table(
        'health_conditions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('dog_id', sa.Integer, sa.ForeignKey('dogs.id', ondelete='CASCADE'), nullable=True),
        sa.Column('puppy_id', sa.Integer, sa.ForeignKey('puppies.id', ondelete='CASCADE'), nullable=True),
        sa.Column('template_id', sa.Integer, sa.ForeignKey('health_condition_templates.id'), nullable=True),
        sa.Column('condition_name', sa.String(255), nullable=False),
        sa.Column('diagnosis_date', sa.DateTime, nullable=True),
        sa.Column('diagnosed_by', sa.String(255), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),  # active, resolved, managed, etc.
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('treatment_plan', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.CheckConstraint('(dog_id IS NOT NULL) OR (puppy_id IS NOT NULL)', name='health_conditions_dog_or_puppy_check')
    )
    
    # Add indexes for faster lookups
    op.create_index('idx_health_records_dog_id', 'health_records', ['dog_id'])
    op.create_index('idx_health_records_puppy_id', 'health_records', ['puppy_id'])
    op.create_index('idx_vaccinations_dog_id', 'vaccinations', ['dog_id'])
    op.create_index('idx_vaccinations_puppy_id', 'vaccinations', ['puppy_id'])
    op.create_index('idx_vaccinations_next_due_date', 'vaccinations', ['next_due_date'])
    op.create_index('idx_weight_records_dog_id', 'weight_records', ['dog_id'])
    op.create_index('idx_weight_records_puppy_id', 'weight_records', ['puppy_id'])
    op.create_index('idx_medication_records_dog_id', 'medication_records', ['dog_id'])
    op.create_index('idx_medication_records_puppy_id', 'medication_records', ['puppy_id'])
    op.create_index('idx_health_conditions_dog_id', 'health_conditions', ['dog_id'])
    op.create_index('idx_health_conditions_puppy_id', 'health_conditions', ['puppy_id'])


def downgrade():
    op.drop_table('health_conditions')
    op.drop_table('health_condition_templates')
    op.drop_table('medication_records')
    op.drop_table('weight_records')
    op.drop_table('vaccinations')
    op.drop_table('health_records')