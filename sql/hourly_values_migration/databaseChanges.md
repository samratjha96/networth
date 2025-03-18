# Account Value History Tracking - Database Changes

## Overview

### Current Data Model
The current data model stores account information in the `accounts` table with a static balance that represents the value at a given moment in time. While this approach is simple, it does not allow for historical analysis or performance tracking over different time periods.

```
accounts table:
- id (UUID)
- user_id (UUID)
- name (TEXT)
- type (TEXT)
- balance (NUMERIC)
- is_debt (BOOLEAN)
- currency (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

The `networth_history` table tracks the overall networth at various points in time, but does not provide granular data at the account level.

### Core Problem
With the current model, we cannot:
1. Track an individual account's performance over time
2. Compare accounts based on performance for different time periods
3. Generate visualizations showing account value trends
4. Calculate metrics like best/worst performing accounts accurately

## Proposed Changes

### 1. Refactor Accounts Table
Modify the `accounts` table to focus on metadata rather than current value:

```sql
ALTER TABLE accounts
DROP COLUMN balance;
```

The `accounts` table will now serve primarily as a registry of accounts with their metadata.

### 2. Create Hourly Account Values Table
Add a new table to track hourly snapshots of account values:

```sql
CREATE TABLE IF NOT EXISTS hourly_account_values (
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  hour_start TIMESTAMPTZ NOT NULL,
  value NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, hour_start)
);

-- Add user_id column for RLS policies
ALTER TABLE hourly_account_values 
ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS hourly_account_values_account_id_idx ON hourly_account_values(account_id);
CREATE INDEX IF NOT EXISTS hourly_account_values_hour_start_idx ON hourly_account_values(hour_start);
CREATE INDEX IF NOT EXISTS hourly_account_values_user_id_idx ON hourly_account_values(user_id);
```

### 3. Row Level Security Policies
Implement RLS policies for the new table:

```sql
-- Enable RLS
ALTER TABLE hourly_account_values ENABLE ROW LEVEL SECURITY;

-- Create policies
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
```

### 4. Trigger for Updated Timestamp
Add a trigger to update the timestamp:

```sql
-- Add trigger to auto-update the updated_at timestamp
CREATE TRIGGER set_hourly_account_values_updated_at
BEFORE UPDATE ON hourly_account_values
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

## Migration Strategy

1. **Data Migration**:
   - For each account, create an initial hourly_account_values entry using the current balance
   - The hour_start should be set to the nearest hour boundary before now()
   - The user_id should match the account's user_id

2. **Code Migration**:
   - Update the database access layer to read the most recent value from hourly_account_values instead of the balance field
   - Update performance calculation logic to use time series data

## Implementation Plan

### Phase 1: Schema Updates
1. Create the new hourly_account_values table with RLS policies
2. Migrate existing balance data to the new table
3. Update the accounts table schema (temporarily keep the balance column for backward compatibility)

### Phase 2: Code Updates
1. Update data access layer to read/write account values to the new table
2. Implement new methods for fetching historical data and calculating performance
3. Update UI components to display historical performance data

### Phase 3: Finalization
1. Remove the balance column from the accounts table after ensuring all code uses the new structure
2. Update all affected queries and functions

## Performance Considerations

### Database Performance
- The hourly_account_values table will grow continuously
- Consider implementing a retention policy for older data (e.g., aggregate to daily after X months)
- Proper indexing is crucial for time-based queries

### Data Storage Estimate
- Assuming 10 accounts per user, hourly snapshots, and 10,000 users:
  - 10 × 24 × 365 × 10,000 = ~87.6 million rows per year
  - Storage requirements: ~20-30 GB per year depending on compression

## Core Use Case: Performance Tracking

### Example Query: Calculate Account Performance
```sql
-- Example query to calculate performance over a given time period
SELECT 
  a.id, 
  a.name, 
  a.type,
  a.is_debt,
  start_value.value AS start_value,
  end_value.value AS end_value,
  ((end_value.value - start_value.value) / NULLIF(ABS(start_value.value), 0)) * 100 AS percent_change
FROM 
  accounts a
JOIN 
  hourly_account_values start_value 
  ON a.id = start_value.account_id
JOIN 
  hourly_account_values end_value 
  ON a.id = end_value.account_id
WHERE 
  a.user_id = 'user-uuid-here'
  AND start_value.hour_start = (
    SELECT MAX(hour_start) 
    FROM hourly_account_values 
    WHERE account_id = a.id AND hour_start <= 'start-date-here'
  )
  AND end_value.hour_start = (
    SELECT MAX(hour_start) 
    FROM hourly_account_values 
    WHERE account_id = a.id AND hour_start <= 'end-date-here'
  )
ORDER BY 
  percent_change DESC;
```

This query can identify the best and worst performing accounts for any time range by comparing the earliest and latest values within that range.

## API Changes

The following API methods will need updating:

1. `getAllAccounts()` - Return metadata from accounts table and latest value from hourly_account_values
2. `addAccount()` - Create account metadata and initial value entry
3. `updateAccount()` - Update metadata and add new value entry if value changed
4. `deleteAccount()` - Remove account and all related historical values
5. New method: `getAccountValueHistory(accountId, startDate, endDate)` - Fetch historical values

## Frontend Impact

The frontend will be enhanced with:

1. Performance comparison charts showing account growth over time
2. Ability to select different time ranges for performance analysis
3. Highlighting of best/worst performing accounts based on selected period

## Conclusion

These changes will significantly enhance the application's ability to track and analyze account performance over time, enabling more meaningful insights for users while maintaining backward compatibility during the transition. 