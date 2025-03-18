-- Function to calculate account performance over a time period
CREATE OR REPLACE FUNCTION calculate_account_performance(
  user_id_param UUID,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
) 
RETURNS TABLE (
  account_id UUID,
  account_name TEXT,
  account_type TEXT,
  is_debt BOOLEAN,
  start_value NUMERIC,
  end_value NUMERIC,
  absolute_change NUMERIC,
  percent_change NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH start_values AS (
    SELECT 
      hav.account_id,
      hav.value,
      hav.hour_start
    FROM 
      hourly_account_values hav
    WHERE 
      hav.user_id = user_id_param AND
      hav.hour_start <= start_date
    ORDER BY 
      hav.account_id, hav.hour_start DESC
  ),
  filtered_start_values AS (
    SELECT DISTINCT ON (account_id) 
      account_id, value
    FROM 
      start_values
  ),
  end_values AS (
    SELECT 
      hav.account_id,
      hav.value,
      hav.hour_start
    FROM 
      hourly_account_values hav
    WHERE 
      hav.user_id = user_id_param AND
      hav.hour_start <= end_date
    ORDER BY 
      hav.account_id, hav.hour_start DESC
  ),
  filtered_end_values AS (
    SELECT DISTINCT ON (account_id) 
      account_id, value
    FROM 
      end_values
  )
  SELECT 
    a.id AS account_id,
    a.name AS account_name,
    a.type AS account_type,
    a.is_debt,
    COALESCE(sv.value, 0) AS start_value,
    COALESCE(ev.value, 0) AS end_value,
    COALESCE(ev.value, 0) - COALESCE(sv.value, 0) AS absolute_change,
    CASE 
      WHEN COALESCE(ABS(sv.value), 0) = 0 THEN 
        CASE 
          WHEN COALESCE(ev.value, 0) > 0 THEN 100.0
          WHEN COALESCE(ev.value, 0) < 0 THEN -100.0
          ELSE 0.0
        END
      ELSE 
        ((COALESCE(ev.value, 0) - COALESCE(sv.value, 0)) / ABS(COALESCE(sv.value, 0))) * 100.0
    END AS percent_change
  FROM 
    accounts a
  LEFT JOIN 
    filtered_start_values sv ON a.id = sv.account_id
  LEFT JOIN 
    filtered_end_values ev ON a.id = ev.account_id
  WHERE 
    a.user_id = user_id_param
  ORDER BY 
    percent_change DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 