-- FIX: Ensure notifications logic handles missing user_id gracefully
-- It seems the trigger 'create_notification_on_donation' (if it exists) is failing.
-- Since we cannot easily modify the trigger without migration privileges, this file must be run by the user.

-- 1. Check if the function exists and redefine it to be safer
CREATE OR REPLACE FUNCTION public.handle_new_donation()
RETURNS TRIGGER AS $$
DECLARE
    student_user_id UUID;
    campaign_title TEXT;
    donor_name TEXT;
BEGIN
    -- Only proceed if payment is completed
    IF NEW.payment_status = 'completed' THEN
        
        -- Get Campaign Details (to find the student)
        SELECT student_id, title INTO student_user_id, campaign_title
        FROM public.campaigns
        WHERE id = NEW.campaign_id;

        -- Determine donor name
        IF NEW.is_anonymous THEN
            donor_name := 'A supporter';
        ELSE
           -- Try to get name from donor_id if possible, or use 'A supporter'
           -- Here we assume we don't have donor name in donation table directly unless joined
           donor_name := 'A supporter';
        END IF;

        -- NOTIFY STUDENT (The recipient)
        -- Only insert if we found a student_id (user_id)
        IF student_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (
                student_user_id, 
                'New Donation Received! 🎉', 
                donor_name || ' donated R' || NEW.amount || ' to your campaign "' || campaign_title || '".',
                'donation_received'
            );
        END IF;

        -- NOTIFY DONOR (if not anonymous and we have their user_id?)
        -- The error 'null value in column user_id' suggests we might be trying to notify the DONOR but donor_id is null?
        -- Or maybe the student_id was null above?
        -- If the donation has a 'donor_id' column that links to auth.users, we can notify them.
        -- Assuming 'donor_id' exists on donations table.
        
        -- IF NEW.donor_id IS NOT NULL THEN
        --    INSERT INTO public.notifications (user_id, title, message, type)
        --    VALUES (
        --        NEW.donor_id,
        --        'Donation Successful',
        --        'Thank you for your donation of R' || NEW.amount || ' to "' || campaign_title || '".',
        --        'payment_made'
        --    );
        -- END IF;
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger if needed (this part usually doesn't change if trigger name is same)
-- DROP TRIGGER IF EXISTS on_donation_created ON public.donations;
-- CREATE TRIGGER on_donation_created
--    AFTER UPDATE ON public.donations
--    FOR EACH ROW
--    EXECUTE FUNCTION public.handle_new_donation();
