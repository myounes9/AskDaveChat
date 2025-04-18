-- Add new columns to the conversations table
ALTER TABLE conversations
ADD COLUMN channel TEXT,           -- e.g., 'website_widget', 'whatsapp', 'api'
ADD COLUMN start_url TEXT,         -- URL where the conversation started
ADD COLUMN ip_address INET,        -- Store the client's IP address
ADD COLUMN user_agent TEXT;        -- Store the client's User-Agent string

-- Note: We are not adding geo_location or user_id yet to keep this step focused.
-- They can be added in separate migrations if needed later.

-- Add status column to the leads table
ALTER TABLE leads
ADD COLUMN status TEXT DEFAULT 'new'; -- Default status for new leads

-- Optional: Add check constraint for lead status if desired
-- ALTER TABLE leads
-- ADD CONSTRAINT lead_status_check CHECK (status IN ('new', 'contacted', 'qualified', 'disqualified', 'converted'));

-- Rerun grants on modified tables just in case (often not needed for ADD COLUMN)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE leads TO service_role;

-- Add policies if needed for frontend access (examples below)
-- Example: Allow users to see their own conversations based on metadata email
-- CREATE POLICY "Allow user select based on email" ON conversations
-- FOR SELECT USING (metadata->>'userEmail' = auth.email());

-- Example: Allow users to see leads linked to their conversations
-- CREATE POLICY "Allow user select leads via conversation" ON leads
-- FOR SELECT USING (
--  EXISTS (
--    SELECT 1 FROM conversations c
--    WHERE c.id = leads.conversation_id AND c.metadata->>'userEmail' = auth.email()
--  )
-- );