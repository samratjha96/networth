-- Schema for Networth app Supabase setup
-- Run this in the Supabase SQL Editor to create the necessary tables and policies

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts table (without balance column)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_debt BOOLEAN DEFAULT FALSE,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hourly account values table
CREATE TABLE IF NOT EXISTS hourly_account_values (
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  hour_start TIMESTAMPTZ NOT NULL,
  value NUMERIC(15, 2) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, hour_start)
);

-- Networth history table
CREATE TABLE IF NOT EXISTS networth_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  value NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);
CREATE INDEX IF NOT EXISTS hourly_account_values_account_id_idx ON hourly_account_values(account_id);
CREATE INDEX IF NOT EXISTS hourly_account_values_hour_start_idx ON hourly_account_values(hour_start);
CREATE INDEX IF NOT EXISTS hourly_account_values_user_id_idx ON hourly_account_values(user_id);
CREATE INDEX IF NOT EXISTS networth_history_user_id_idx ON networth_history(user_id);
CREATE INDEX IF NOT EXISTS networth_history_date_idx ON networth_history(date);

-- Enable Row Level Security on tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_account_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE networth_history ENABLE ROW LEVEL SECURITY;

-- Create policies for accounts table
CREATE POLICY "Users can only view their own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for hourly_account_values table
CREATE POLICY "Users can only view their own account values"
  ON hourly_account_values FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own account values"
  ON hourly_account_values FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own account values"
  ON hourly_account_values FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own account values"
  ON hourly_account_values FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for networth_history table
CREATE POLICY "Users can only view their own networth history"
  ON networth_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own networth history"
  ON networth_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own networth history"
  ON networth_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own networth history"
  ON networth_history FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update the updated_at timestamp for accounts
CREATE TRIGGER set_accounts_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger to auto-update the updated_at timestamp for hourly_account_values
CREATE TRIGGER set_hourly_account_values_updated_at
BEFORE UPDATE ON hourly_account_values
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

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