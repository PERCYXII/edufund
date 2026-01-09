-- Migration: fix_landing_stats_visibility
-- Description: Ensures landing page stats are visible to anonymous users by updating RPCs to SECURITY DEFINER and opening select access to universities and campaigns.

-- 1. Fix RPCs to be SECURITY DEFINER so anonymous users can see aggregate stats
-- (Aggregate stats like total donations and donor counts should be public)

CREATE OR REPLACE FUNCTION get_total_unique_donors()
RETURNS INTEGER AS $$
BEGIN
  -- Count distinct emails + anonymous transactions (null/empty email)
  RETURN (
    SELECT 
       COUNT(DISTINCT guest_email) + 
       COUNT(*) FILTER (WHERE guest_email IS NULL OR guest_email = '')
    FROM public.donations 
    WHERE status IN ('received', 'completed')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_total_donations()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(amount), 0) FROM public.donations WHERE status IN ('received', 'completed'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Allow anonymous users to see the university list and campaign counts
-- This is necessary for the landing page stats to work for non-logged in users

-- Universities
DROP POLICY IF EXISTS "Allow public read access" ON public.universities;
DROP POLICY IF EXISTS "Universities are readable by everyone" ON public.universities;
CREATE POLICY "Universities are readable by everyone" ON public.universities
  FOR SELECT TO public
  USING (true);

-- Ensure Campaigns are readable by everyone (should already be, but let's be explicit)
DROP POLICY IF EXISTS "Public campaigns read" ON public.campaigns;
DROP POLICY IF EXISTS "Campaigns are readable by everyone" ON public.campaigns;
CREATE POLICY "Campaigns are readable by everyone" ON public.campaigns
  FOR SELECT TO public
  USING (true);

-- Ensure Funding Items are readable by everyone
DROP POLICY IF EXISTS "Public funding items read" ON public.funding_items;
DROP POLICY IF EXISTS "Funding items are readable by everyone" ON public.funding_items;
CREATE POLICY "Funding items are readable by everyone" ON public.funding_items
  FOR SELECT TO public
  USING (true);
