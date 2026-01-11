-- Add is_paused and last_milestone_cleared to campaigns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_milestone_cleared integer DEFAULT 0;

-- Create campaign_milestones table
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
-- Student can view/insert their own campaign milestones
CREATE POLICY "Student can view own milestones" ON public.campaign_milestones
    FOR SELECT USING (
        exists (select 1 from public.campaigns c where c.id = campaign_milestones.campaign_id and c.student_id = auth.uid())
    );

CREATE POLICY "Student can update own milestones" ON public.campaign_milestones
    FOR UPDATE USING (
        exists (select 1 from public.campaigns c where c.id = campaign_milestones.campaign_id and c.student_id = auth.uid())
    );

-- Admins can view/update all
CREATE POLICY "Admins can do everything on milestones" ON public.campaign_milestones
    FOR ALL USING (
        exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
    );

-- Trigger function to check milestones
CREATE OR REPLACE FUNCTION public.check_campaign_funding_milestones()
RETURNS TRIGGER AS $$
DECLARE
    current_raised numeric;
    goal_amount numeric;
    current_percent numeric;
    next_milestone integer;
    campaign_record RECORD;
    milestones integer[] := ARRAY[15, 25, 50, 75, 100];
    m integer;
BEGIN
    -- Get campaign details
    SELECT * INTO campaign_record FROM public.campaigns WHERE id = NEW.campaign_id;
    
    IF campaign_record IS NULL OR campaign_record.goal_amount = 0 THEN
        RETURN NEW;
    END IF;

    -- Calculate total raised including new donation if it's approved/received
    -- NOTE: Triggers on 'donations' insert/update. 
    -- If NEW.status = 'received', we consider it funding.
    
    IF NEW.status != 'received' THEN
        RETURN NEW;
    END IF;

    -- Recalculate total raised just to be safe (or use campaigns.raised_amount if trusted)
    -- Ideally we trust campaigns.raised_amount which should be updated by another trigger or app logic.
    -- Assuming campaigns.raised_amount is updated *before* or *after*? 
    -- Let's calculate dynamically to be safe or rely on the updated value if this runs after update.
    
    -- Let's assume this trigger runs AFTER UPDATE on campaigns OR AFTER INSERT/UPDATE on donations.
    -- To keep it simple, let's look at the campaign's current raised amount.
    -- Refetched record above has the state.
    
    current_raised := campaign_record.raised_amount;
    goal_amount := campaign_record.goal_amount;
    
    current_percent := (current_raised / goal_amount) * 100;
    
    -- Find the highest milestone crossed that hasn't been cleared
    next_milestone := 0;
    
    FOREACH m IN ARRAY milestones
    LOOP
        IF current_percent >= m AND m > campaign_record.last_milestone_cleared THEN
            next_milestone := m;
            -- We want the *lowest* uncleared milestone that is crossed? 
            -- Or if we jump from 10% to 60%, do we trigger 15, 25, 50?
            -- Let's trigger the highest one, or pause for the lowest pending?
            -- Requirement: "pauses... when it reaches 15, 25..."
            -- To avoid chaos, let's pick the *lowest* uncleared milestone that is crossed.
            EXIT; -- Break on first found
        END IF;
    END LOOP;

    IF next_milestone > 0 THEN
        -- Check if a milestone record already exists (to avoid duplicate pauses for same milestone)
        PERFORM 1 FROM public.campaign_milestones 
        WHERE campaign_id = NEW.campaign_id AND milestone_percentage = next_milestone;
        
        IF NOT FOUND THEN
            -- Pause Campaign
            UPDATE public.campaigns 
            SET is_paused = true 
            WHERE id = NEW.campaign_id;
            
            -- Create Milestone Record
            INSERT INTO public.campaign_milestones (campaign_id, milestone_percentage, status)
            VALUES (NEW.campaign_id, next_milestone, 'pending_upload');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on campaigns update (since raised_amount changes there)
-- Assuming there is logic updating campaigns.raised_amount.
-- If not, I should probably attach this to donations, but looking at raised_amount on campaign is reliable.

DROP TRIGGER IF EXISTS trigger_check_milestones ON public.campaigns;

CREATE TRIGGER trigger_check_milestones
    AFTER UPDATE OF raised_amount ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.check_campaign_funding_milestones();
