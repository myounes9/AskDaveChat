-- Add RLS policy to allow authenticated users to insert leads
-- This is needed for the upsert operation in the callback flow if a lead
-- record doesn't already exist for the conversation.

-- Drop the policy if it exists to ensure idempotency
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON public.leads;

-- Create the policy
CREATE POLICY "Allow authenticated users to insert leads" ON public.leads
  FOR INSERT -- Specify this policy is for INSERT operations
  WITH CHECK (auth.role() = 'authenticated'); -- Allow insert if user is logged in

-- Grant INSERT permission on leads table to authenticated role
-- Note: Granting permissions is usually idempotent
GRANT INSERT ON TABLE public.leads TO authenticated;
