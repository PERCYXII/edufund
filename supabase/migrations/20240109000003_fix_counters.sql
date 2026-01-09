-- Function to get total unique donors including anonymous
CREATE OR REPLACE FUNCTION get_total_unique_donors()
RETURNS INTEGER AS $$
BEGIN
  -- Count distinct emails + anonymous transactions (null/empty email)
  RETURN (
    SELECT 
       COUNT(DISTINCT guest_email) + 
       COUNT(*) FILTER (WHERE guest_email IS NULL OR guest_email = '')
    FROM donations 
    WHERE status IN ('received', 'completed')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get total donations sum
CREATE OR REPLACE FUNCTION get_total_donations()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE status IN ('received', 'completed'));
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_total_unique_donors() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_total_donations() TO anon, authenticated, service_role;
