-- Ensure donors column exists
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS donors INTEGER DEFAULT 0;

-- Update the stats function to include donor count
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

    -- If platform donation (campaign_id is null), do nothing
    IF target_campaign_id IS NULL THEN
        RETURN NULL;
    END IF;

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
                    WHEN guest_email IS NOT NULL THEN guest_email
                    ELSE 'transaction_' || id::text 
                END
            )
            FROM public.donations
            WHERE campaign_id = target_campaign_id
            AND payment_status = 'completed'
        )
    WHERE id = target_campaign_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger to ensure it covers all events properly (it was already defined but ensuring safety)
DROP TRIGGER IF EXISTS tr_update_campaign_stats ON public.donations;
CREATE TRIGGER tr_update_campaign_stats
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_campaign_stats();

-- Recalculate for all campaigns to backfill data
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.campaigns LOOP
        UPDATE public.campaigns
        SET 
            raised_amount = (
                SELECT COALESCE(SUM(amount), 0)
                FROM public.donations
                WHERE campaign_id = r.id
                AND payment_status = 'completed'
            ),
            donors = (
                SELECT COUNT(DISTINCT 
                    CASE 
                        WHEN donor_id IS NOT NULL THEN donor_id::text
                        WHEN guest_email IS NOT NULL THEN guest_email
                        ELSE 'transaction_' || id::text 
                    END
                )
                FROM public.donations
                WHERE campaign_id = r.id
                AND payment_status = 'completed'
            )
        WHERE id = r.id;
    END LOOP;
END $$;
