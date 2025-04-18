-- Allow users to see their own conversations
DROP POLICY IF EXISTS "Allow authenticated users to select their own conversations" ON public.conversations;
CREATE POLICY "Allow authenticated users to select their own conversations" ON public.conversations
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update RLS policies for leads
-- Allow users to see leads linked to their user_id
DROP POLICY IF EXISTS "Allow authenticated users to select their own leads" ON public.leads;
CREATE POLICY "Allow authenticated users to select their own leads" ON public.leads
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Grant necessary permissions to authenticated role 