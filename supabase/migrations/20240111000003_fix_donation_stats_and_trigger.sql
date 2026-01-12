-- Fix Stats RPCs and Add Campaign Raised Trigger

-- 1. Create function to update campaign raised amount
CREATE OR REPLACE FUNCTION public.update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only relevant for donations with a campaign_id
    IF NEW.campaign_id IS NOT NULL THEN
        -- Calculate new total raised for this campaign
        -- We only count donations that are 'completed'
        UPDATE public.campaigns
        SET raised_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.donations
            WHERE campaign_id = NEW.campaign_id
            AND payment_status = 'completed'
        )
        WHERE id = NEW.campaign_id;
    END IF;
    
    -- If updating, we might need to update the OLD campaign too (e.g. if campaign_id changed, though unlikely)
    IF TG_OP = 'UPDATE' AND OLD.campaign_id IS NOT NULL AND OLD.campaign_id != NEW.campaign_id THEN
         UPDATE public.campaigns
        SET raised_amount = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.donations
            WHERE campaign_id = OLD.campaign_id
            AND payment_status = 'completed'
        )
        WHERE id = OLD.campaign_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS tr_update_campaign_stats ON public.donations;
CREATE TRIGGER tr_update_campaign_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_campaign_stats();

-- 3. Fix RPCs to use 'payment_status' instead of 'status'
CREATE OR REPLACE FUNCTION get_total_unique_donors()
RETURNS INTEGER AS $$
BEGIN
  -- Count distinct emails + anonymous transactions (null/empty email)
  -- guest_email might not exist in all environments if not added, checking for it safely?
  -- Assuming guest_email exists based on previous policies referencing it
  RETURN (
    SELECT 
       COUNT(DISTINCT guest_email) + 
       COUNT(*) FILTER (WHERE guest_email IS NULL OR guest_email = '')
    FROM public.donations 
    WHERE payment_status = 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_total_donations()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(amount), 0) FROM public.donations WHERE payment_status = 'completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Initial Sync (Optional but recommended to fix existing data)
WITH calculated_stats AS (
    SELECT campaign_id, SUM(amount) as total
    FROM public.donations
    WHERE payment_status = 'completed'
    AND campaign_id IS NOT NULL
    GROUP BY campaign_id
)
UPDATE public.campaigns
SET raised_amount = calculated_stats.total
FROM calculated_stats
WHERE public.campaigns.id = calculated_stats.campaign_id;
