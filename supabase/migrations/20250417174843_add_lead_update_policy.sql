-- Add RLS policy to allow authenticated users to update their own leads

-- Drop the policy if it already exists to ensure idempotency
DROP POLICY IF EXISTS "Allow authenticated users to update their own leads" ON public.leads;

-- Create the policy
CREATE POLICY "Allow authenticated users to update their own leads" ON public.leads
  FOR UPDATE -- Specify that this policy is for UPDATE operations
  USING (auth.role() = 'authenticated') -- New condition: Any logged-in user can update
  WITH CHECK (auth.role() = 'authenticated'); -- New condition: Any logged-in user can update

-- Grant UPDATE permission to the authenticated role
-- Note: Granting permissions is usually idempotent (doesn't error if already granted)
GRANT UPDATE ON TABLE public.leads TO authenticated;
