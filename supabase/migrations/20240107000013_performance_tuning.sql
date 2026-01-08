-- Add indexes for foreign keys and frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_students_university_id ON public.students(university_id);
CREATE INDEX IF NOT EXISTS idx_students_verification_status ON public.students(verification_status);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at);

CREATE INDEX IF NOT EXISTS idx_campaigns_student_id ON public.campaigns(student_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON public.campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_urgent ON public.campaigns(is_urgent);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at);

CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON public.donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON public.donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at);

-- Create a secure RPC function to get dashboard stats efficiently
-- This avoids fetching thousands of rows just to count/sum them
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_funded DECIMAL(12,2);
    active_campaigns_count INTEGER;
    pending_verifications_count INTEGER;
    total_universities_count INTEGER;
    disabled_profiles_count INTEGER;
BEGIN
    -- Calculate total funded efficiently
    SELECT COALESCE(SUM(amount), 0) INTO total_funded FROM public.donations;

    -- Count active campaigns
    SELECT COUNT(*) INTO active_campaigns_count FROM public.campaigns WHERE status = 'active';

    -- Count pending verifications
    -- We can get this from students table directly or verification_requests
    -- Based on frontend, it uses students where verification_status = 'pending'
    SELECT COUNT(*) INTO pending_verifications_count FROM public.students WHERE verification_status = 'pending';

    -- Count universities
    SELECT COUNT(*) INTO total_universities_count FROM public.universities;

    -- Count disabled profiles
    SELECT COUNT(*) INTO disabled_profiles_count FROM public.disabled_profiles;

    RETURN jsonb_build_object(
        'totalFunded', total_funded,
        'activeCampaigns', active_campaigns_count,
        'pendingVerifications', pending_verifications_count,
        'totalUniversities', total_universities_count,
        'disabledProfiles', disabled_profiles_count
    );
END;
$$;
