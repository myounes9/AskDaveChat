-- Create widget_configurations table
CREATE TABLE public.widget_configurations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL UNIQUE,
    theme_color TEXT NOT NULL DEFAULT '#000000',
    initial_message TEXT NOT NULL DEFAULT 'Hi there! How can I help?',
    require_email_first BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for clarity
COMMENT ON TABLE public.widget_configurations IS 'Stores configuration settings for the chat widget per client/domain.';
COMMENT ON COLUMN public.widget_configurations.identifier IS 'Unique identifier for the configuration (e.g., domain name or API key).';
COMMENT ON COLUMN public.widget_configurations.theme_color IS 'Hex color code for the widget theme.';
COMMENT ON COLUMN public.widget_configurations.initial_message IS 'The first message displayed by the assistant.';
COMMENT ON COLUMN public.widget_configurations.require_email_first IS 'Whether the widget should ask for email before starting chat.';

-- Enable Row Level Security (Recommended)
ALTER TABLE public.widget_configurations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (so the widget can fetch settings)
CREATE POLICY "Allow anonymous read access"
ON public.widget_configurations
FOR SELECT
USING (true);

-- Allow AUTHENTICATED users to update/insert (adjust role check if needed)
DROP POLICY IF EXISTS "Allow admin full access" ON public.widget_configurations; -- Drop old policy first
CREATE POLICY "Allow authenticated users to manage configurations"
ON public.widget_configurations
FOR ALL -- Allows INSERT, UPDATE, DELETE
USING (auth.role() = 'authenticated') -- Check if user is logged in
WITH CHECK (auth.role() = 'authenticated'); 