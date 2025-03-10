-- Create chat_sessions table to store active chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
  lead_id BIGINT REFERENCES leads(id),
  user_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_lead_id ON chat_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);

-- Update messages table to include chat_session_id field if not already there
ALTER TABLE messages ADD COLUMN IF NOT EXISTS chat_session_id UUID;
CREATE INDEX IF NOT EXISTS idx_messages_chat_session_id ON messages(chat_session_id);

-- Add RLS policies for chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public access for creation through the API
CREATE POLICY "Allow public to insert chat sessions" 
  ON chat_sessions FOR INSERT 
  WITH CHECK (true);

-- Only allow authorized users to view sessions
CREATE POLICY "Allow authenticated users to view all chat sessions" 
  ON chat_sessions FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow public to query their own chat sessions using session_id
CREATE POLICY "Allow public to select their own chat sessions" 
  ON chat_sessions FOR SELECT  
  USING (session_id::text = current_setting('request.headers')::json->>'x-chat-session-id', false);

-- Add RLS policies for messages related to chat sessions
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow public to insert messages with a valid chat_session_id
CREATE POLICY "Allow public to insert messages with chat_session_id" 
  ON messages FOR INSERT 
  WITH CHECK (chat_session_id IS NOT NULL);

-- Allow public to query messages using chat_session_id
CREATE POLICY "Allow public to select messages from their chat session" 
  ON messages FOR SELECT 
  USING (chat_session_id::text = current_setting('request.headers')::json->>'x-chat-session-id', false);

-- Allow authenticated users to view all messages
CREATE POLICY "Allow authenticated users to view all messages" 
  ON messages FOR SELECT 
  TO authenticated 
  USING (true);
