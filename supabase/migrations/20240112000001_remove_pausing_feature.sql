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
