-- Fix donation notification trigger to handle guest donations
-- This prevents the null value constraint error when a guest donates

CREATE OR REPLACE FUNCTION public.handle_new_donation_student_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    v_campaign_title TEXT;
    v_should_notify BOOLEAN := FALSE;
BEGIN
    -- Determine if we should notify
    IF TG_OP = 'INSERT' THEN
        IF NEW.payment_status = 'completed' THEN
            v_should_notify := TRUE;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
            v_should_notify := TRUE;
        END IF;
    END IF;

    IF v_should_notify THEN
        -- Get student_id and campaign title
        SELECT student_id, title INTO v_student_id, v_campaign_title 
        FROM public.campaigns 
        WHERE id = NEW.campaign_id;

        -- 1. Notify the student (if exists)
        IF v_student_id IS NOT NULL THEN
            BEGIN
                INSERT INTO public.notifications (user_id, title, message, type, data, read)
                VALUES (
                    v_student_id,
                    'New Donation Received!',
                    'You received a donation of R' || (NEW.amount / 100)::TEXT || ' for your campaign "' || v_campaign_title || '".',
                    'donation_received',
                    jsonb_build_object('donation_id', NEW.id, 'campaign_id', NEW.campaign_id, 'amount', NEW.amount),
                    false
                );
            EXCEPTION WHEN OTHERS THEN
                -- Ignore errors to prevent failing the donation update
                NULL;
            END;
        END IF;
        
        -- 2. Notify the donor (only if registered user)
        IF NEW.donor_id IS NOT NULL THEN
            BEGIN
                INSERT INTO public.notifications (user_id, title, message, type, data, read)
                VALUES (
                    NEW.donor_id,
                    'Donation Successful',
                    'Your donation of R' || (NEW.amount / 100)::TEXT || ' to "' || v_campaign_title || '" was successful. Thank you for your support!',
                    'payment_made',
                    jsonb_build_object('donation_id', NEW.id, 'campaign_id', NEW.campaign_id, 'amount', NEW.amount),
                    false
                );
            EXCEPTION WHEN OTHERS THEN
                -- Ignore errors
                NULL;
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
