-- Create the leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT,
    email TEXT, -- Consider adding NOT NULL constraint if email is always required
    phone TEXT,
    interest TEXT, -- What the user was interested in
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL, -- Link to the conversation
    raw_data JSONB -- Store the raw arguments from OpenAI just in case
);

-- Add index on email for faster lookups (optional)
CREATE INDEX idx_leads_email ON leads(email);

-- Add index on conversation_id (optional)
CREATE INDEX idx_leads_conversation_id ON leads(conversation_id);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to insert their own leads (adjust based on your auth setup)
-- For now, let's allow service_role full access internally from Edge Function
-- Policies might be needed if you query leads directly from the frontend later.
-- Example (adjust): CREATE POLICY "Allow authenticated insert" ON leads FOR INSERT TO authenticated WITH CHECK (true);
-- Example (adjust): CREATE POLICY "Allow individual select" ON leads FOR SELECT USING (auth.uid() = user_id); -- If you add a user_id column

-- Grant access to the service_role (used by Edge Functions)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE leads TO service_role;
-- Note: If you chose SERIAL PRIMARY KEY instead of UUID, you'd need sequence grants:
-- GRANT USAGE, SELECT ON SEQUENCE leads_id_seq TO service_role; 

-- Grant access to authenticated role if needed for frontend access later
-- GRANT SELECT, INSERT ON TABLE leads TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE leads_id_seq TO authenticated;