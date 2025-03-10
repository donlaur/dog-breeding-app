-- Migration: 003_messaging_system.sql
-- Created: 2025-03-10
-- Description: Adds messaging system tables for communication with leads and customers

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    sender_type VARCHAR(50) NOT NULL, -- breeder, customer, lead, system
    sender_id UUID,
    lead_id UUID REFERENCES public.leads(id),
    customer_id INTEGER REFERENCES public.customers(id),
    message_type VARCHAR(20) DEFAULT 'text', -- text, media, system
    media_urls TEXT, -- JSON array of media URLs
    media_type VARCHAR(20), -- image, video, document
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Comments for documentation
COMMENT ON TABLE public.messages IS 'Table for storing messages between breeders and leads/customers';
COMMENT ON COLUMN public.messages.sender_type IS 'Type of sender: breeder, customer, lead, system';
COMMENT ON COLUMN public.messages.message_type IS 'Type of message: text, media, system';
COMMENT ON COLUMN public.messages.media_type IS 'Type of media: image, video, document';

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own messages
CREATE POLICY messages_user_policy ON public.messages
    FOR ALL
    USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS messages_lead_id_idx ON public.messages (lead_id);
CREATE INDEX IF NOT EXISTS messages_customer_id_idx ON public.messages (customer_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON public.messages (user_id);
