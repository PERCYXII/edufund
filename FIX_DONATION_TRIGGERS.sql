-- ============================================
-- COMPREHENSIVE DONATION TRIGGER FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL triggers on donations table
DROP TRIGGER IF EXISTS on_donation_completed ON public.donations;
DROP TRIGGER IF EXISTS tr_donation_notification ON public.donations;
DROP TRIGGER IF EXISTS tr_update_campaign_stats ON public.donations;
DROP TRIGGER IF EXISTS trigger_donation_notification ON public.donations;
DROP TRIGGER IF EXISTS on_new_donation ON public.donations;

-- Step 2: Drop potentially broken notification functions
DROP FUNCTION IF EXISTS public.handle_new_donation() CASCADE;
DROP FUNCTION IF EXISTS public.handle_donation_notification() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_donation() CASCADE;

-- Step 3: Create SAFE campaign stats update function (no notifications)
CREATE OR REPLACE FUNCTION public.update_campaign_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_campaign_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_campaign_id := OLD.campaign_id;
    ELSE
        target_campaign_id := NEW.campaign_id;
    END IF;

    -- Skip platform donations
    IF target_campaign_id IS NULL THEN
        IF (TG_OP = 'DELETE') THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    -- Update campaign stats
    UPDATE public.campaigns
    SET 
        raised_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.donations
            WHERE campaign_id = target_campaign_id
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
            WHERE campaign_id = target_campaign_id
            AND payment_status = 'completed'
        )
    WHERE id = target_campaign_id;
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create ONLY the stats trigger (no notification trigger)
CREATE TRIGGER tr_update_campaign_stats
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_stats();

-- Step 5: Create safe RPC for admin approval
CREATE OR REPLACE FUNCTION public.admin_approve_donation(p_donation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_campaign_id UUID;
    v_student_id UUID;
    v_campaign_title TEXT;
    v_amount DECIMAL;
BEGIN
    -- Get donation details
    SELECT campaign_id, amount INTO v_campaign_id, v_amount
    FROM public.donations
    WHERE id = p_donation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Donation not found';
    END IF;

    -- Update donation status
    UPDATE public.donations
    SET payment_status = 'completed'
    WHERE id = p_donation_id;

    -- Stats are handled by trigger automatically
    
    -- Try to create notification (ignore errors)
    IF v_campaign_id IS NOT NULL THEN
        SELECT student_id, title INTO v_student_id, v_campaign_title
        FROM public.campaigns
        WHERE id = v_campaign_id;

        IF v_student_id IS NOT NULL THEN
            BEGIN
                INSERT INTO public.notifications (user_id, title, message, type)
                VALUES (
                    v_student_id,
                    'New Donation Received!',
                    'A supporter donated R' || v_amount || ' to "' || COALESCE(v_campaign_title, 'your campaign') || '".',
                    'donation_received'
                );
            EXCEPTION WHEN OTHERS THEN
                -- Silently ignore notification errors
                NULL;
            END;
        END IF;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_approve_donation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_donation(UUID) TO service_role;

-- Step 6: Verify - List remaining triggers on donations
SELECT tgname AS trigger_name 
FROM pg_trigger 
WHERE tgrelid = 'public.donations'::regclass 
AND NOT tgisinternal;
