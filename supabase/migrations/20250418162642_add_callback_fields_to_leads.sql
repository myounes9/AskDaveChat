-- Add columns to store callback scheduling information on the leads table

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS callback_date TEXT NULL, -- Storing formatted date for simplicity
ADD COLUMN IF NOT EXISTS callback_time_slot TEXT NULL; -- e.g., 'morning', 'afternoon'

-- Note: We are using TEXT for date for simplicity.
-- A TIMESTAMPTZ or DATE type might be better if complex date querying/scheduling is needed later.
-- Consider adding constraints or checks if specific formats are required for time_slot.
