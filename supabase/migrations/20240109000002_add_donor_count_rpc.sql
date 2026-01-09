-- Function to get total unique donors based on email
CREATE OR REPLACE FUNCTION get_total_unique_donors()
RETURNS INTEGER AS $$
BEGIN
  -- Count distinct emails from successful donations
  RETURN (SELECT COUNT(DISTINCT guest_email) FROM donations WHERE status = 'received');
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_total_unique_donors() TO anon, authenticated, service_role;
