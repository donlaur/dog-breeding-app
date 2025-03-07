-- Fix script for application forms schema mismatch

-- First create the uuid-ossp extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create customers table with integer id
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    country VARCHAR(50) DEFAULT 'USA',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Create application_forms table with integer id instead of UUID
CREATE TABLE IF NOT EXISTS application_forms (
    id SERIAL PRIMARY KEY,
    breeder_id UUID REFERENCES auth.users(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create form_questions table with integer id instead of UUID
CREATE TABLE IF NOT EXISTS form_questions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES application_forms(id) ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    description TEXT,
    question_type VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    order_position INTEGER NOT NULL,
    options JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on form_id
CREATE INDEX IF NOT EXISTS idx_form_questions_form_id ON form_questions(form_id);

-- Create form_submissions table with integer id instead of UUID
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES application_forms(id) NOT NULL,
    puppy_id INTEGER REFERENCES puppies(id),
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    responses JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_puppy_id ON form_submissions(puppy_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);

-- Add needed columns to puppies table
ALTER TABLE puppies 
ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reservation_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS sale_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS transaction_notes TEXT,
ADD COLUMN IF NOT EXISTS application_id INTEGER REFERENCES form_submissions(id) ON DELETE SET NULL;

-- Add index on status
CREATE INDEX IF NOT EXISTS idx_puppies_status ON puppies(status);