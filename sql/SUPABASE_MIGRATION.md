# Migrating to Supabase

This document outlines how to migrate the Net Worth app from using browser localStorage to Supabase for persistent, user-specific storage.

## Overview

The migration enables:
- User authentication with email/password
- Secure, per-user data storage in Supabase
- Seamless fallback to localStorage when offline or not logged in
- Data persistence across devices

## Setup Instructions

### 1. Create a Supabase Project

1. Sign up at [Supabase](https://supabase.com/) and create a new project
2. Note your Supabase URL and anon key (public API key)

### 2. Set Up Database Tables

1. In your Supabase dashboard, go to the SQL Editor
2. Copy and run the SQL from `sql/supabase-schema.sql`
3. This will create:
   - The `accounts` table for storing user accounts
   - The `networth_history` table for storing historical net worth data
   - Appropriate indexes and security policies

### 3. Configure Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Configure Email Auth by enabling "Email Signup"
3. Optionally, set up other authentication providers as needed

### 4. Configure Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_USE_SUPABASE=true
```

## Integration Details

The codebase has been updated with:

1. **Database Factory Pattern**:
   - `DatabaseFactory` class that can switch between backends
   - Transparent API that doesn't require frontend changes

2. **Supabase Implementation**:
   - `SupabaseDatabase` class implementing the `DatabaseProvider` interface
   - User-specific data filtering for all operations
   - Proper error handling

3. **Authentication Provider**:
   - React context for authentication state
   - Automatic user ID management for database operations
   - Seamless switching between localStorage and Supabase

## Usage in Components

### Setting Up Authentication

Wrap your application with the `AuthProvider`:

```tsx
import { AuthProvider } from '@/components/AuthProvider';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

### Using Authentication

Use the `useAuth` hook to access authentication functions:

```tsx
import { useAuth } from '@/components/AuthProvider';

function LoginForm() {
  const { signIn, isLoading } = useAuth();
  
  // Use signIn function in your form handler
}
```

### Accessing the Database

Use the database factory to get the current database implementation:

```tsx
import { getDatabase } from '@/lib/database-factory';

async function fetchAccounts() {
  const db = getDatabase();
  const accounts = await db.getAllAccounts();
  return accounts;
}
```

## Migration Strategy

For existing users with data in localStorage:

1. After they sign up, detect if they have existing localStorage data
2. Offer to migrate their data to their new account
3. Upload existing accounts and history to Supabase

Example migration function:

```typescript
async function migrateLocalStorageToSupabase(userId: string) {
  // Get local data
  const localDb = mockDb;
  const accounts = await localDb.getAllAccounts();
  const history = await localDb.getNetworthHistory(0);
  
  // Set user ID for Supabase DB
  supabaseDb.setUserId(userId);
  
  // Migrate accounts
  for (const account of accounts) {
    await supabaseDb.insertAccount(account);
  }
  
  // Migrate history (if needed)
  // Note: The history will be automatically updated when accounts are inserted
}
```

## Testing

To test the Supabase implementation:

1. Set `NEXT_PUBLIC_USE_SUPABASE=true` in your environment
2. Run the application and register a new user
3. Verify that data is stored in Supabase by checking the tables

## Fallback Mechanism

The implementation includes automatic fallback to localStorage when:
1. A user is not authenticated
2. There are network connectivity issues
3. The environment variable `NEXT_PUBLIC_USE_SUPABASE` is set to `false` 