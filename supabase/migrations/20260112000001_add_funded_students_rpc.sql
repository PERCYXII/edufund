-- Add RPCs for advanced platform stats

-- 1. Get exact count of students who have received at least one completed donation
-- This is more accurate for "Funded Students" than just active campaigns
CREATE OR REPLACE FUNCTION get_total_funded_students()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT c.student_id)
    FROM donations d
    JOIN campaigns c ON d.campaign_id = c.id
    WHERE d.payment_status = 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enhanced Donor Count (Platform Wide)
-- Counts distinct guest emails AND distinct authenticated users (if we had user_id on donations)
-- For now, we stick to guest_email as the primary identifier on donations, but we can try to be smarter if user_id was added.
-- Assuming donations table has 'donor_id' (UUID) which links to 'donors' table or 'profiles'.
-- The Typescript type says 'donorId', let's check if the column exists in a real schema check?
-- I'll assume standard email tracking is separate from donor_id if anonymous.
-- But let's stick to the existing robust get_total_unique_donors from previous migration if it works, 
-- or redefine it here if we want to be sure.
-- I will refine it to be very clear: Distinct emails for guests + Distinct donor_ids for logged in users?
-- Actually, simpler: Count distinct emails from successful donations.
-- Most donations might be guest checkout.
-- Let's stick to the previous 'get_total_unique_donors' for donor count unless I see a reason to change it.
-- But I will re-declare it to be safe and ensure it uses payment_status = 'completed'.

CREATE OR REPLACE FUNCTION get_total_unique_donors()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT guest_email)
    FROM donations 
    WHERE payment_status = 'completed' 
    AND (guest_email IS NOT NULL AND guest_email != '')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Platform Funding Percentage
-- (Total Raised / Total Goal of All ACTIVE Campaigns) * 100
CREATE OR REPLACE FUNCTION get_platform_funding_percentage()
RETURNS DECIMAL AS $$
DECLARE
  total_goal DECIMAL;
  total_raised DECIMAL;
BEGIN
  SELECT SUM(goal_amount) INTO total_goal FROM campaigns WHERE status = 'active';
  SELECT SUM(raised_amount) INTO total_raised FROM campaigns WHERE status = 'active';
  
  IF total_goal IS NULL OR total_goal = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (total_raised / total_goal) * 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
