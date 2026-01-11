-- Create a function to notify admins when a milestone is submitted for review
CREATE OR REPLACE FUNCTION public.notify_admins_of_milestone_submission()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
    campaign_title TEXT;
    student_name TEXT;
BEGIN
    -- Only proceed if status changed to 'pending_review'
    IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
        
        -- Get campaign and student details for the message
        SELECT c.title, s.first_name || ' ' || s.last_name INTO campaign_title, student_name
        FROM public.campaigns c
        JOIN public.students s ON c.student_id = s.id
        WHERE c.id = NEW.campaign_id;

        -- Loop through all admins and insert a notification
        FOR admin_record IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                created_at,
                read
            ) VALUES (
                admin_record.id,
                'Fee Statement Review Required',
                'Campaign "' || COALESCE(campaign_title, 'Unknown') || '" has a new fee statement pending review.',
                'info',
                NOW(),
                false
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_milestone_submission ON public.campaign_milestones;
CREATE TRIGGER on_milestone_submission
    AFTER UPDATE ON public.campaign_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_of_milestone_submission();
