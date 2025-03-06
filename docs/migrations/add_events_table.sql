-- Migration to add the events table for storing calendar events

-- Create Events Table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    all_day BOOLEAN DEFAULT TRUE,
    event_type TEXT NOT NULL, -- 'birthday', 'litter_milestone', 'heat_reminder', 'vet_appointment', 'custom'
    related_type TEXT, -- 'dog', 'litter', 'heat', 'puppy', etc.
    related_id INTEGER,
    color TEXT,
    notify BOOLEAN DEFAULT FALSE,
    notify_days_before INTEGER DEFAULT 0,
    recurring TEXT, -- 'none', 'daily', 'weekly', 'monthly', 'yearly'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add comments for clarity
COMMENT ON TABLE events IS 'Stores calendar events for the breeder app';
COMMENT ON COLUMN events.event_type IS 'Type of event: birthday, litter_milestone, heat_reminder, vet_appointment, custom';
COMMENT ON COLUMN events.related_type IS 'Type of related entity: dog, litter, heat, puppy, etc.';
COMMENT ON COLUMN events.related_id IS 'ID of the related entity';
COMMENT ON COLUMN events.recurring IS 'Recurrence pattern: none, daily, weekly, monthly, yearly';

-- Create RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy for user to see only their own events
CREATE POLICY "Users can view their own events" ON events 
    FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE id = auth.uid()));

-- Policy for user to insert their own events
CREATE POLICY "Users can insert their own events" ON events 
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE id = auth.uid()));

-- Policy for user to update their own events
CREATE POLICY "Users can update their own events" ON events 
    FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE id = auth.uid()));

-- Policy for user to delete their own events
CREATE POLICY "Users can delete their own events" ON events 
    FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE id = auth.uid()));

-- Create the event_rules table for custom automation rules
CREATE TABLE IF NOT EXISTS event_rules (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL, -- 'litter_created', 'heat_recorded', 'dog_birthday', etc.
    conditions JSONB,
    action_type TEXT NOT NULL, -- 'create_event', 'send_notification'
    action_data JSONB NOT NULL, -- includes delay in days, event details, etc.
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add RLS policies for event_rules
ALTER TABLE event_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_rules
CREATE POLICY "Users can view their own event rules" ON event_rules 
    FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own event rules" ON event_rules 
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own event rules" ON event_rules 
    FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own event rules" ON event_rules 
    FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE id = auth.uid()));