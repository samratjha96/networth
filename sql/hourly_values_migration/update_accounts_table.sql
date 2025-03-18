-- After migrating data, remove the balance column from accounts table
ALTER TABLE accounts DROP COLUMN balance; 