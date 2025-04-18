-- Migration script to create tables for chat conversation logging

-- Create the conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id TEXT UNIQUE NOT NULL,  -- OpenAI thread ID
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB NULL                -- For any extra context (e.g., user ID, initial page)
);

-- Add index on thread_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_thread_id ON public.conversations(thread_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists first to ensure idempotency
DROP TRIGGER IF EXISTS set_conversations_timestamp ON public.conversations;

-- Trigger to automatically update updated_at on conversations table
CREATE TRIGGER set_conversations_timestamp
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Create the messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'error')), -- Added system/error roles
    content TEXT NOT NULL,
    openai_message_id TEXT NULL, -- Store OpenAI message ID if available
    run_id TEXT NULL,            -- Store OpenAI run ID for assistant messages
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index on conversation_id for faster message lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Optional: Add index on created_at for sorting messages
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable Row Level Security (RLS) on the tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust as needed):
-- Allow service_role full access (needed for edge functions)
-- Drop policies first for idempotency
DROP POLICY IF EXISTS "Allow service_role access" ON public.conversations;
CREATE POLICY "Allow service_role access" ON public.conversations FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Allow service_role access" ON public.messages;
CREATE POLICY "Allow service_role access" ON public.messages FOR ALL TO service_role USING (true);

-- NOTE: Policies related to the 'leads' table are NOT included in this file.
-- They belong in subsequent migration files where the 'leads' table exists.
