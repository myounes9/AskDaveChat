-- Add geographic columns to the conversations table (populated by backend function)
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT; 