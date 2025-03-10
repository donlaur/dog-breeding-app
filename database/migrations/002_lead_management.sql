-- Migration: 002_lead_management.sql
-- Created: 2025-03-10
-- Description: Adds tables for lead management system

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'new',
    source VARCHAR(100) DEFAULT 'website',
    notes TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    initial_message TEXT,
    preferred_contact VARCHAR(50),
    interested_in TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    customer_id INTEGER REFERENCES public.customers(id) NULL
);

-- Comments for documentation
COMMENT ON TABLE public.leads IS 'Table for storing potential customer leads';
COMMENT ON COLUMN public.leads.status IS 'Status can be: new, contacted, qualified, negotiating, converted, lost';
COMMENT ON COLUMN public.leads.source IS 'Where the lead came from: website, referral, social media, event, other';
COMMENT ON COLUMN public.leads.interested_in IS 'Array of interests: puppies, stud service, etc.';
COMMENT ON COLUMN public.leads.preferred_contact IS 'Preferred contact method: email, phone, etc.';

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own leads
CREATE POLICY leads_user_policy ON public.leads
    FOR ALL
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads (user_id);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);
