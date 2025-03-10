-- Migration: 001_initial_schema.sql
-- Created: 2025-03-10
-- Description: Initial schema migration for core tables

-- This migration assumes the auth.users table already exists (created by Supabase)

-- Create customers table if not exists
CREATE TABLE IF NOT EXISTS public.customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    country VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create customers policy
CREATE POLICY customers_user_policy ON public.customers
    FOR ALL
    USING (auth.uid() = user_id);

-- Create index on customers
CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers (user_id);
CREATE INDEX IF NOT EXISTS customers_email_idx ON public.customers (email);
