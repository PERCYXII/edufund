-- 1. Re-add Campaign Milestones and Pausing Feature
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'quick')),
ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_milestone_cleared integer DEFAULT 0;

-- Create campaign_milestones table if not exists
CREATE TABLE IF NOT EXISTS public.campaign_milestones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    milestone_percentage integer NOT NULL,
    status text NOT NULL DEFAULT 'pending_upload' CHECK (status IN ('pending_upload', 'pending_review', 'approved', 'rejected')),
    proof_url text,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.campaign_milestones ENABLE ROW LEVEL SECURITY;

-- Policies for campaign_milestones
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Student can view own milestones') THEN
        CREATE POLICY "Student can view own milestones" ON public.campaign_milestones
            FOR SELECT USING (
                exists (select 1 from public.campaigns c where c.id = campaign_milestones.campaign_id and c.student_id = auth.uid())
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Student can update own milestones') THEN
        CREATE POLICY "Student can update own milestones" ON public.campaign_milestones
            FOR UPDATE USING (
                exists (select 1 from public.campaigns c where c.id = campaign_milestones.campaign_id and c.student_id = auth.uid())
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can do everything on milestones') THEN
        CREATE POLICY "Admins can do everything on milestones" ON public.campaign_milestones
            FOR ALL USING (
                exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
            );
    END IF;
END $$;

-- Trigger function to check milestones
CREATE OR REPLACE FUNCTION public.check_campaign_funding_milestones()
RETURNS TRIGGER AS $$
DECLARE
    current_raised numeric;
    goal_amount numeric;
    current_percent numeric;
    next_milestone integer;
    campaign_record RECORD;
    milestones integer[] := ARRAY[50, 80]; -- Pausing at 50% and 80%
    m integer;
BEGIN
    -- Get campaign details
    SELECT * INTO campaign_record FROM public.campaigns WHERE id = NEW.id;

    IF campaign_record IS NULL OR campaign_record.goal_amount = 0 OR campaign_record.status != 'active' THEN
        RETURN NEW;
    END IF;

    current_raised := campaign_record.raised_amount;
    goal_amount := campaign_record.goal_amount;
    current_percent := (current_raised / goal_amount) * 100;

    -- Find the lowest milestone crossed that hasn't been cleared
    next_milestone := 0;
    FOREACH m IN ARRAY milestones
    LOOP
        IF current_percent >= m AND m > campaign_record.last_milestone_cleared THEN
            next_milestone := m;
            EXIT;
        END IF;
    END LOOP;

    IF next_milestone > 0 THEN
        -- Check if a milestone record already exists (to avoid duplicate pauses for same milestone)
        PERFORM 1 FROM public.campaign_milestones
        WHERE campaign_id = NEW.id AND milestone_percentage = next_milestone;

        IF NOT FOUND THEN
            -- Pause Campaign
            UPDATE public.campaigns
            SET is_paused = true
            WHERE id = NEW.id;

            -- Create Milestone Record
            INSERT INTO public.campaign_milestones (campaign_id, milestone_percentage, status)
            VALUES (NEW.id, next_milestone, 'pending_upload');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on campaigns update (since raised_amount changes there)
DROP TRIGGER IF EXISTS trigger_check_milestones ON public.campaigns;
CREATE TRIGGER trigger_check_milestones
    AFTER UPDATE OF raised_amount ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.check_campaign_funding_milestones();

-- 2. Stats RPC Updates
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
        'active_campaigns', (SELECT count(*) FROM public.campaigns WHERE status = 'active' AND NOT is_paused),
        'pending_verifications', (SELECT count(*) FROM public.verification_requests WHERE status = 'pending'),
        'pending_campaigns', (SELECT count(*) FROM public.campaigns WHERE status = 'pending')
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
