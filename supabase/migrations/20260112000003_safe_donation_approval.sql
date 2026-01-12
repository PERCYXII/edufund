-- Safe Donation Approval RPC
-- Use this function to approve donations without triggering notification errors

-- Drop existing trigger that might be causing issues
DROP TRIGGER IF EXISTS on_donation_completed ON public.donations;
DROP TRIGGER IF EXISTS tr_donation_notification ON public.donations;

-- Create safe admin approval function
CREATE OR REPLACE FUNCTION public.admin_approve_donation(p_donation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_campaign_id UUID;
    v_student_id UUID;
    v_campaign_title TEXT;
    v_amount DECIMAL;
BEGIN
    -- 1. Get donation details
    SELECT campaign_id, amount INTO v_campaign_id, v_amount
    FROM public.donations
    WHERE id = p_donation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Donation not found';
    END IF;

    -- 2. Update donation status
    UPDATE public.donations
    SET payment_status = 'completed'
    WHERE id = p_donation_id;

    -- 3. Update campaign stats (raised_amount and donors)
    IF v_campaign_id IS NOT NULL THEN
        UPDATE public.campaigns
        SET 
            raised_amount = (
                SELECT COALESCE(SUM(amount), 0)
                FROM public.donations
                WHERE campaign_id = v_campaign_id
                AND payment_status = 'completed'
            ),
            donors = (
                SELECT COUNT(DISTINCT 
                    CASE 
                        WHEN donor_id IS NOT NULL THEN donor_id::text
                        WHEN guest_email IS NOT NULL AND guest_email != '' THEN guest_email
                        ELSE 'anonymous_' || id::text 
                    END
                )
                FROM public.donations
                WHERE campaign_id = v_campaign_id
                AND payment_status = 'completed'
            )
        WHERE id = v_campaign_id;

        -- 4. Get student for notification (optional, safe)
        SELECT student_id, title INTO v_student_id, v_campaign_title
        FROM public.campaigns
        WHERE id = v_campaign_id;

        -- 5. Create notification only if student exists
        IF v_student_id IS NOT NULL THEN
            BEGIN
                INSERT INTO public.notifications (user_id, title, message, type)
                VALUES (
                    v_student_id,
                    'New Donation Received!',
                    'A supporter donated R' || v_amount || ' to your campaign "' || COALESCE(v_campaign_title, 'Campaign') || '".',
                    'donation_received'
                );
            EXCEPTION WHEN OTHERS THEN
                -- Ignore notification errors, the main operation succeeded
                NULL;
            END;
        END IF;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (admins will use it)
GRANT EXECUTE ON FUNCTION public.admin_approve_donation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_donation(UUID) TO service_role;
