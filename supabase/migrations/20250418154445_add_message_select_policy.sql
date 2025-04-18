-- Add RLS policy to allow authenticated users to select messages
-- belonging to conversations they are allowed to see.

-- Drop the policy if it already exists to ensure idempotency
DROP POLICY IF EXISTS "Allow authenticated users to select related messages" ON public.messages;

-- Create the policy
CREATE POLICY "Allow authenticated users to select related messages" ON public.messages
  FOR SELECT
  USING (
    -- Check if the user has SELECT permission on the parent conversation
    -- This leverages the existing RLS policy on the 'conversations' table.
    EXISTS (
      SELECT 1
      FROM public.conversations conv
      WHERE conv.id = messages.conversation_id
      -- Implicitly checks the SELECT policy on 'conversations' for the current user
    )
    AND auth.role() = 'authenticated' -- Ensure the user is actually logged in
  );

-- Grant SELECT permission on messages table to authenticated role
-- Note: Granting permissions is usually idempotent
GRANT SELECT ON TABLE public.messages TO authenticated;
