-- Add verification_document_url to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS verification_document_url TEXT;

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name = 'verification_document_url';
