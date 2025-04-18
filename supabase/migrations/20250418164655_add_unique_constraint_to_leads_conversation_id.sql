-- Add a unique constraint to the conversation_id column in the leads table
-- This is required for the ON CONFLICT clause used in the upsert operation.

-- Drop constraint first if it exists for idempotency
ALTER TABLE public.leads
DROP CONSTRAINT IF EXISTS leads_conversation_id_key;

-- Add the unique constraint
ALTER TABLE public.leads
ADD CONSTRAINT leads_conversation_id_key UNIQUE (conversation_id);

-- Note: Unique constraints in PostgreSQL allow multiple NULL values.
-- This is acceptable here because we only upsert based on conversation_id
-- when we actually have callback details to save, implying a linked conversation exists.
