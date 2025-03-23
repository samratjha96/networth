-- Migration to fix the column name case
ALTER TABLE accounts RENAME COLUMN "isDebt" TO is_debt;
