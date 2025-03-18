-- Migrate existing account balances to hourly_account_values
INSERT INTO hourly_account_values (account_id, user_id, hour_start, value)
SELECT 
  id AS account_id,
  user_id,
  date_trunc('hour', now()) AS hour_start,
  CASE WHEN is_debt THEN -balance ELSE balance END AS value
FROM 
  accounts
ON CONFLICT (account_id, hour_start) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now(); 