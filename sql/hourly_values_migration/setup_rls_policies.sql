-- Enable RLS on hourly_account_values
ALTER TABLE hourly_account_values ENABLE ROW LEVEL SECURITY;

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

-- Add trigger to auto-update the updated_at timestamp
CREATE TRIGGER set_hourly_account_values_updated_at
BEFORE UPDATE ON hourly_account_values
FOR EACH ROW
EXECUTE FUNCTION update_timestamp(); 