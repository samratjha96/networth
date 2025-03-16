-- Schema for Networth app Supabase setup
-- Run this in the Supabase SQL Editor to create the necessary tables and policies

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance NUMERIC(15, 2) NOT NULL, -- Supports positive and negative values
  is_debt BOOLEAN DEFAULT FALSE,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
CREATE INDEX IF NOT EXISTS networth_history_user_id_idx ON networth_history(user_id);
CREATE INDEX IF NOT EXISTS networth_history_date_idx ON networth_history(date);

-- Enable Row Level Security on tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
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