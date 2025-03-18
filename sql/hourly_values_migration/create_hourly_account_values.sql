-- Create hourly account values table
CREATE TABLE IF NOT EXISTS hourly_account_values (
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  hour_start TIMESTAMPTZ NOT NULL,
  value NUMERIC(15, 2) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, hour_start)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS hourly_account_values_account_id_idx ON hourly_account_values(account_id);
CREATE INDEX IF NOT EXISTS hourly_account_values_hour_start_idx ON hourly_account_values(hour_start);
CREATE INDEX IF NOT EXISTS hourly_account_values_user_id_idx ON hourly_account_values(user_id);