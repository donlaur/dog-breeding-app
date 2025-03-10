-- Migration: 006_forms_documents_and_programs.sql
-- Created: 2025-03-10
-- Description: Forms, documents, and breeding program management tables

-- Create application_forms table
CREATE TABLE IF NOT EXISTS public.application_forms (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    form_fields JSONB, -- JSON structure containing form fields
    required_fields TEXT[], -- Array of required field names
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create form_questions table
CREATE TABLE IF NOT EXISTS public.form_questions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES public.application_forms(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- text, textarea, select, radio, checkbox, etc.
    options JSONB, -- For select, radio, checkbox types
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER,
    section VARCHAR(100),
    help_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS public.form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES public.application_forms(id),
    customer_id INTEGER REFERENCES public.customers(id),
    lead_id UUID REFERENCES public.leads(id),
    submission_data JSONB NOT NULL, -- JSON object containing all form responses
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, reviewed, approved, rejected
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    category VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT FALSE,
    related_dog_id INTEGER REFERENCES public.dogs(id),
    related_puppy_id INTEGER REFERENCES public.puppies(id),
    related_litter_id INTEGER REFERENCES public.litters(id),
    related_customer_id INTEGER REFERENCES public.customers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create file_uploads table
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id),
    related_entity_type VARCHAR(50), -- 'dog', 'puppy', 'customer', 'litter', etc.
    related_entity_id INTEGER,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create breeding_programs table
CREATE TABLE IF NOT EXISTS public.breeding_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goals TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    primary_breed_id INTEGER REFERENCES public.dog_breeds(id),
    secondary_breed_id INTEGER REFERENCES public.dog_breeds(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create program_users table (for managing users with access to breeding programs)
CREATE TABLE IF NOT EXISTS public.program_users (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES public.breeding_programs(id),
    user_id UUID REFERENCES auth.users(id),
    role VARCHAR(50) NOT NULL, -- owner, admin, editor, viewer
    added_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create breeder_program_associations table
CREATE TABLE IF NOT EXISTS public.breeder_program_associations (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES public.breeding_programs(id),
    breeder_name VARCHAR(255) NOT NULL,
    breeder_email VARCHAR(255),
    breeder_phone VARCHAR(100),
    breeder_website VARCHAR(255),
    breeder_location VARCHAR(255),
    association_type VARCHAR(100), -- 'partner', 'mentor', 'mentee', 'collaborator'
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create events and event_rules tables
CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100) NOT NULL, -- 'health_check', 'breeding', 'show', 'training', etc.
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    related_dog_id INTEGER REFERENCES public.dogs(id),
    related_puppy_id INTEGER REFERENCES public.puppies(id),
    related_litter_id INTEGER REFERENCES public.litters(id),
    related_heat_id INTEGER REFERENCES public.heats(id),
    notes TEXT,
    reminder BOOLEAN DEFAULT FALSE,
    reminder_time INTERVAL,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.event_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100) NOT NULL,
    rule_type VARCHAR(100) NOT NULL, -- 'reminder', 'notification', 'automation'
    conditions JSONB, -- JSON structure defining when rule applies
    actions JSONB, -- JSON structure defining what happens when rule is triggered
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'unread', -- 'unread', 'read', 'replied', 'archived'
    replied_at TIMESTAMPTZ,
    replied_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create pages table (for website pages)
CREATE TABLE IF NOT EXISTS public.pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT,
    meta_description VARCHAR(255),
    meta_keywords VARCHAR(255),
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.application_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeding_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeder_program_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY application_forms_policy ON public.application_forms FOR ALL USING (auth.uid() = user_id);
CREATE POLICY form_questions_policy ON public.form_questions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY form_submissions_policy ON public.form_submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY documents_policy ON public.documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY file_uploads_policy ON public.file_uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY breeding_programs_policy ON public.breeding_programs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY program_users_policy ON public.program_users FOR ALL USING (auth.uid() = user_id OR user_id IN (SELECT user_id FROM public.program_users WHERE program_id = public.breeding_programs.id));
CREATE POLICY breeder_program_associations_policy ON public.breeder_program_associations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY events_policy ON public.events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY event_rules_policy ON public.event_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY contact_messages_policy ON public.contact_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY pages_policy ON public.pages FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS form_questions_form_id_idx ON public.form_questions (form_id);
CREATE INDEX IF NOT EXISTS form_submissions_form_id_idx ON public.form_submissions (form_id);
CREATE INDEX IF NOT EXISTS form_submissions_customer_id_idx ON public.form_submissions (customer_id);
CREATE INDEX IF NOT EXISTS form_submissions_lead_id_idx ON public.form_submissions (lead_id);
CREATE INDEX IF NOT EXISTS documents_related_dog_id_idx ON public.documents (related_dog_id);
CREATE INDEX IF NOT EXISTS documents_related_customer_id_idx ON public.documents (related_customer_id);
CREATE INDEX IF NOT EXISTS file_uploads_related_entity_idx ON public.file_uploads (related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS program_users_program_id_idx ON public.program_users (program_id);
CREATE INDEX IF NOT EXISTS program_users_user_id_idx ON public.program_users (user_id);
CREATE INDEX IF NOT EXISTS breeder_program_associations_program_id_idx ON public.breeder_program_associations (program_id);
CREATE INDEX IF NOT EXISTS events_start_date_idx ON public.events (start_date);
CREATE INDEX IF NOT EXISTS events_related_dog_id_idx ON public.events (related_dog_id);
CREATE INDEX IF NOT EXISTS pages_slug_idx ON public.pages (slug);
