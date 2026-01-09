-- Function to get total amount donated
CREATE OR REPLACE FUNCTION get_total_donations()
RETURNS DECIMAL AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(amount), 0) FROM donations);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to everyone (or at least anon/authenticated)
GRANT EXECUTE ON FUNCTION get_total_donations() TO anon, authenticated, service_role;
