-- Make campaign_id nullable to support platform donations
ALTER TABLE public.donations 
ALTER COLUMN campaign_id DROP NOT NULL;

-- Add a check constraint to ensure that either campaign_id is set OR it's a platform donation
-- (Optional, but good practice. For now, we'll just allow NULL)
