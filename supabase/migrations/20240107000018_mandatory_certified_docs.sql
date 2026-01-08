-- Migration to update verification requests with mandatory documents
-- This migration corresponds to the update requiring all students to provide 
-- certified ID, enrollment, transcript, and fee statement documents.

ALTER TABLE public.verification_requests 
ADD COLUMN IF NOT EXISTS id_url TEXT,
ADD COLUMN IF NOT EXISTS enrollment_url TEXT,
ADD COLUMN IF NOT EXISTS academic_record_url TEXT,
ADD COLUMN IF NOT EXISTS fee_statement_url TEXT;

-- Update the RPC to handle these
CREATE OR REPLACE FUNCTION public.create_verification_request(
  p_student_id UUID,
  p_id_url TEXT,
  p_enrollment_url TEXT,
  p_academic_record_url TEXT,
  p_fee_statement_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- We'll keep document_type and document_url for compatibility if needed, 
  -- but we'll primarily use the new specific columns.
  INSERT INTO public.verification_requests (
    student_id, 
    id_url, 
    enrollment_url, 
    academic_record_url, 
    fee_statement_url, 
    status,
    document_type,
    document_url
  )
  VALUES (
    p_student_id, 
    p_id_url, 
    p_enrollment_url, 
    p_academic_record_url, 
    p_fee_statement_url, 
    'pending',
    'certified_documents',
    p_id_url -- Use ID as the primary doc URL for now
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;
