-- Remove Campaign Pausing Feature
-- 1. Drop trigger
DROP TRIGGER IF EXISTS trigger_check_milestones ON public.campaigns;

-- 2. Drop function
DROP FUNCTION IF EXISTS public.check_campaign_funding_milestones();

-- 3. Drop table (cascade will handle policies)
DROP TABLE IF EXISTS public.campaign_milestones CASCADE;

-- 4. Remove columns from campaigns
ALTER TABLE public.campaigns 
DROP COLUMN IF EXISTS is_paused,
DROP COLUMN IF EXISTS last_milestone_cleared;

-- 5. Update admin stats RPC to exclude pause check
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_donors', (SELECT count(DISTINCT donor_id) FROM public.donations WHERE payment_status = 'completed'),
        'total_funds', (SELECT coalesce(sum(amount), 0) FROM public.donations WHERE payment_status = 'completed'),
        'funded_students', (SELECT count(DISTINCT student_id) FROM public.campaigns WHERE raised_amount >= goal_amount),
        'total_universities', (SELECT count(*) FROM public.universities),
        'active_campaigns', (SELECT count(*) FROM public.campaigns WHERE status = 'active'),
        'pending_verifications', (SELECT count(*) FROM public.verification_requests WHERE status = 'pending'),
        'pending_campaigns', (SELECT count(*) FROM public.campaigns WHERE status = 'pending')
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
