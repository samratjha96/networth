-- Function to get the latest value for an account
CREATE OR REPLACE FUNCTION get_current_account_value(account_id_param UUID)
RETURNS NUMERIC AS $$
DECLARE
  current_value NUMERIC;
BEGIN
  SELECT value INTO current_value
  FROM hourly_account_values
  WHERE account_id = account_id_param
  ORDER BY hour_start DESC
  LIMIT 1;
  
  RETURN COALESCE(current_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 