-- Fix handle_campaign_completed function to use correct column names
CREATE OR REPLACE FUNCTION public.handle_campaign_completed()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if campaign just reached its goal
    -- Using raised_amount and goal_amount as per schema
    IF NEW.raised_amount >= NEW.goal_amount AND (OLD.raised_amount IS NULL OR OLD.raised_amount < NEW.goal_amount) THEN
        PERFORM public.notify_admins(
            'Campaign Fully Funded!',
            'The campaign "' || NEW.title || '" has reached its goal!',
            'campaign_update',
            jsonb_build_object('campaign_id', NEW.id, 'goal', NEW.goal_amount, 'raised', NEW.raised_amount)
        );
        
        -- Also notify the student
        INSERT INTO public.notifications (user_id, title, message, type, data, read)
        VALUES (
            NEW.student_id,
            'Your Campaign is Funded!',
            'Congratulations! Your campaign "' || NEW.title || '" has been fully funded.',
            'campaign_update',
            jsonb_build_object('campaign_id', NEW.id),
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add restriction to prevent changing goal_amount after donations have been received
CREATE OR REPLACE FUNCTION public.prevent_goal_change_after_donation()
RETURNS TRIGGER AS $$
BEGIN
    -- If donations have already been received (raised_amount > 0)
    IF OLD.raised_amount > 0 THEN
        -- Check if goal_amount is being changed
        IF NEW.goal_amount != OLD.goal_amount THEN
            RAISE EXCEPTION 'Cannot change the goal amount once donations have been received.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the restriction trigger
DROP TRIGGER IF EXISTS tr_prevent_goal_change ON public.campaigns;
CREATE TRIGGER tr_prevent_goal_change
    BEFORE UPDATE OF goal_amount ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_goal_change_after_donation();
