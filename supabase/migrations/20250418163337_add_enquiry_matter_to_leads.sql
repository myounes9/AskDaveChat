-- Add column to store the reason/enquiry matter for a callback request

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS enquiry_matter TEXT NULL;
