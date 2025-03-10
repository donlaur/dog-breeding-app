-- Migration: 004_health_management.sql
-- Created: 2025-03-10
-- Description: Adds Health Management tables for dog and puppy health tracking

-- Create health_records table
CREATE TABLE IF NOT EXISTS public.health_records (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    dog_id INTEGER, -- Reference to the dog
    puppy_id INTEGER, -- Reference to the puppy
    vet_name VARCHAR(255),
    attachments TEXT, -- JSON array of file URLs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create vaccinations table
CREATE TABLE IF NOT EXISTS public.vaccinations (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    dog_id INTEGER,
    puppy_id INTEGER,
    lot_number VARCHAR(100),
    expiration_date DATE,
    administered_by VARCHAR(255),
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create medications table
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    dog_id INTEGER,
    puppy_id INTEGER,
    prescribed_by VARCHAR(255),
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create weight_records table
CREATE TABLE IF NOT EXISTS public.weight_records (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    unit VARCHAR(10) DEFAULT 'lbs',
    dog_id INTEGER,
    puppy_id INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create health_conditions table
CREATE TABLE IF NOT EXISTS public.health_conditions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date_diagnosed DATE NOT NULL,
    dog_id INTEGER,
    puppy_id INTEGER,
    diagnosed_by VARCHAR(255),
    severity VARCHAR(50),
    treatment_plan TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    date_resolved DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Create health_condition_templates table
CREATE TABLE IF NOT EXISTS public.health_condition_templates (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    severity_scale TEXT, -- JSON structure for severity scale
    common_symptoms TEXT, -- JSON array of common symptoms
    common_treatments TEXT, -- JSON array of common treatments
    breed_specific BOOLEAN DEFAULT FALSE,
    breed_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_condition_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY health_records_policy ON public.health_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY vaccinations_policy ON public.vaccinations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY medications_policy ON public.medications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY weight_records_policy ON public.weight_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY health_conditions_policy ON public.health_conditions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY health_condition_templates_policy ON public.health_condition_templates FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS health_records_dog_id_idx ON public.health_records (dog_id);
CREATE INDEX IF NOT EXISTS health_records_puppy_id_idx ON public.health_records (puppy_id);
CREATE INDEX IF NOT EXISTS vaccinations_dog_id_idx ON public.vaccinations (dog_id);
CREATE INDEX IF NOT EXISTS vaccinations_puppy_id_idx ON public.vaccinations (puppy_id);
CREATE INDEX IF NOT EXISTS vaccinations_next_due_date_idx ON public.vaccinations (next_due_date);
CREATE INDEX IF NOT EXISTS medications_dog_id_idx ON public.medications (dog_id);
CREATE INDEX IF NOT EXISTS medications_puppy_id_idx ON public.medications (puppy_id);
CREATE INDEX IF NOT EXISTS weight_records_dog_id_idx ON public.weight_records (dog_id);
CREATE INDEX IF NOT EXISTS weight_records_puppy_id_idx ON public.weight_records (puppy_id);
CREATE INDEX IF NOT EXISTS health_conditions_dog_id_idx ON public.health_conditions (dog_id);
CREATE INDEX IF NOT EXISTS health_conditions_puppy_id_idx ON public.health_conditions (puppy_id);
