-- Fix dependencies to allow user archiving/deletion
-- 1. When a Student is deleted (archived), cascade delete their Campaigns
ALTER TABLE public.campaigns
DROP CONSTRAINT IF EXISTS campaigns_student_id_fkey;

ALTER TABLE public.campaigns
ADD CONSTRAINT campaigns_student_id_fkey
FOREIGN KEY (student_id)
REFERENCES public.students(id)
ON DELETE CASCADE;

-- 2. When a Student is deleted, cascade delete their Verification Requests
ALTER TABLE public.verification_requests
DROP CONSTRAINT IF EXISTS verification_requests_student_id_fkey;

ALTER TABLE public.verification_requests
ADD CONSTRAINT verification_requests_student_id_fkey
FOREIGN KEY (student_id)
REFERENCES public.students(id)
ON DELETE CASCADE;

-- 3. When a Campaign is deleted, cascade delete its Donations
-- (This is necessary if we cascade delete campaigns when student is deleted)
ALTER TABLE public.donations
DROP CONSTRAINT IF EXISTS donations_campaign_id_fkey;

ALTER TABLE public.donations
ADD CONSTRAINT donations_campaign_id_fkey
FOREIGN KEY (campaign_id)
REFERENCES public.campaigns(id)
ON DELETE CASCADE;

-- 4. When a Donor is deleted (archived), SET NULL for their Donations
-- We want to keep the donation record, but anonymize the source
ALTER TABLE public.donations
DROP CONSTRAINT IF EXISTS donations_donor_id_fkey;

ALTER TABLE public.donations
ADD CONSTRAINT donations_donor_id_fkey
FOREIGN KEY (donor_id)
REFERENCES public.donors(id)
ON DELETE SET NULL;
