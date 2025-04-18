-- Create widget_events table
CREATE TABLE public.widget_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    conversation_id uuid NULL REFERENCES public.conversations(id) ON DELETE SET NULL,
    thread_id TEXT NULL,
    event_type TEXT NOT NULL,
    event_details JSONB NULL
);

-- Add comments
COMMENT ON TABLE public.widget_events IS 'Logs specific UI interaction events within the chat widget.';
COMMENT ON COLUMN public.widget_events.conversation_id IS 'References the conversation this event belongs to (if available).';
COMMENT ON COLUMN public.widget_events.thread_id IS 'OpenAI thread ID associated with the event (if available).';
COMMENT ON COLUMN public.widget_events.event_type IS 'Type of the event (e.g., button_click, flow_start).';
COMMENT ON COLUMN public.widget_events.event_details IS 'JSONB object containing contextual details about the event.';

-- Optional: Indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_widget_events_conversation_id ON public.widget_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_widget_events_event_type ON public.widget_events(event_type);
CREATE INDEX IF NOT EXISTS idx_widget_events_created_at ON public.widget_events(created_at DESC);

-- Enable Row Level Security (If needed, depends on access pattern)
-- ALTER TABLE public.widget_events ENABLE ROW LEVEL SECURITY;
-- Example Policy (Allow service_role to insert):
-- CREATE POLICY "Allow service_role to insert events" 
-- ON public.widget_events FOR INSERT 
-- WITH CHECK (auth.role() = 'service_role');
-- Example Policy (Allow authenticated users to read their events - requires user_id column)
-- CREATE POLICY "Allow users to read their events" 
-- ON public.widget_events FOR SELECT 
-- USING (auth.uid() = user_id); 
-- For now, RLS is disabled as the logging function will use service_role. 