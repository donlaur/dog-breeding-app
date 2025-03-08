"""add application form tables

Revision ID: fa2d88c34e51
Revises: add_cms_pages_table
Create Date: 2025-03-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = 'fa2d88c34e51'
down_revision = 'add_cms_pages_table'
branch_labels = None
depends_on = None


def upgrade():
    # Create application_forms table
    op.create_table(
        'application_forms',
        sa.Column('id', UUID(), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('breeder_id', UUID(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'))
    )

    # Create form_questions table
    op.create_table(
        'form_questions',
        sa.Column('id', UUID(), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('form_id', UUID(), sa.ForeignKey('application_forms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('question_type', sa.String(), nullable=False),
        sa.Column('is_required', sa.Boolean(), server_default='true'),
        sa.Column('order_position', sa.Integer(), nullable=False),
        sa.Column('options', JSONB(), nullable=True),  # For select, radio, checkbox options
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'))
    )

    # Create form_submissions table
    op.create_table(
        'form_submissions',
        sa.Column('id', UUID(), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('form_id', UUID(), sa.ForeignKey('application_forms.id'), nullable=False),
        sa.Column('puppy_id', UUID(), sa.ForeignKey('puppies.id'), nullable=True),  # NULL if applying for waitlist
        sa.Column('applicant_name', sa.String(), nullable=False),
        sa.Column('applicant_email', sa.String(), nullable=False),
        sa.Column('applicant_phone', sa.String(), nullable=True),
        sa.Column('status', sa.String(), server_default='pending'),  # pending, approved, rejected, waitlist
        sa.Column('responses', JSONB(), nullable=False),  # Stores all question responses
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'))
    )
    
    # Create indexes
    op.create_index('idx_form_questions_form_id', 'form_questions', ['form_id'])
    op.create_index('idx_form_submissions_form_id', 'form_submissions', ['form_id'])
    op.create_index('idx_form_submissions_puppy_id', 'form_submissions', ['puppy_id'])
    op.create_index('idx_form_submissions_status', 'form_submissions', ['status'])


def downgrade():
    op.drop_table('form_submissions')
    op.drop_table('form_questions')
    op.drop_table('application_forms')