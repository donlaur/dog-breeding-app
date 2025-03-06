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

-- Add a policy for the service_role (the API server typically uses this role)
CREATE POLICY "Allow service_role full access to events" 
  ON events 
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable authenticated users to select events
CREATE POLICY "Allow authenticated users to select events" 
  ON events 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Enable authenticated users to insert events
CREATE POLICY "Allow authenticated users to insert events" 
  ON events 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Enable authenticated users to update events
CREATE POLICY "Allow authenticated users to update events" 
  ON events 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable authenticated users to delete events
CREATE POLICY "Allow authenticated users to delete events" 
  ON events 
  FOR DELETE 
  TO authenticated
  USING (true);

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

-- Add a policy for the service_role (the API server typically uses this role)
CREATE POLICY "Allow service_role full access to event_rules" 
  ON event_rules 
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable authenticated users to select event_rules
CREATE POLICY "Allow authenticated users to select event_rules" 
  ON event_rules 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Enable authenticated users to insert event_rules
CREATE POLICY "Allow authenticated users to insert event_rules" 
  ON event_rules 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Enable authenticated users to update event_rules
CREATE POLICY "Allow authenticated users to update event_rules" 
  ON event_rules 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Enable authenticated users to delete event_rules
CREATE POLICY "Allow authenticated users to delete event_rules" 
  ON event_rules 
  FOR DELETE 
  TO authenticated
  USING (true);