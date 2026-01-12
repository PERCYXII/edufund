-- Fix notification trigger to handle NULL user_id safely
-- Run this in your Supabase SQL Editor

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_donation_completed ON public.donations;

-- Create a safe notification function
CREATE OR REPLACE FUNCTION public.handle_donation_notification()
RETURNS TRIGGER AS $$
DECLARE
    student_user_id UUID;
    campaign_title TEXT;
BEGIN
    -- Only proceed if payment status changed to completed
    IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
        -- Only notify for campaign donations (not platform donations)
        IF NEW.campaign_id IS NOT NULL THEN
            -- Get student from campaign
            SELECT student_id, title INTO student_user_id, campaign_title
            FROM public.campaigns
            WHERE id = NEW.campaign_id;

            -- Only notify if student exists
            IF student_user_id IS NOT NULL THEN
                INSERT INTO public.notifications (user_id, title, message, type)
                VALUES (
                    student_user_id, 
                    'New Donation Received!', 
                    'A supporter donated R' || NEW.amount || ' to your campaign "' || COALESCE(campaign_title, 'Campaign') || '".',
                    'donation_received'
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on donations update
CREATE TRIGGER on_donation_completed
    AFTER UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_donation_notification();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_donation_notification() TO authenticated, service_role;
