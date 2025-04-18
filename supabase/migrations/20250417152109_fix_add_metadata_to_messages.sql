    -- Add the metadata column to the messages table.
    -- We know it doesn't exist based on the previous check.
    ALTER TABLE public.messages
    ADD COLUMN metadata JSONB;

    -- Ensure service_role has permissions (might be redundant but safe)
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.messages TO service_role;