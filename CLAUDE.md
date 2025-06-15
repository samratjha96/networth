# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Argos is a personal finance application designed to help users track and visualize their net worth over time. The application provides a comprehensive view of a user's assets and liabilities, calculates net worth, and visualizes financial trends over various time periods.

## Development Commands

### Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Formatting and linting
npm run lint      # Runs prettier and eslint
npm run format    # Runs prettier only
```

### Deployment

The application is containerized with Docker and can be deployed using:

```bash
# Build and run the Docker container
docker-compose up --build -d

# Stop running containers
docker-compose down
```

## Architecture

### High-Level Architecture

Argos follows a modern frontend architecture with:

1. **React Components** - Functional UI components with hooks
2. **Global State Management** - Zustand stores for application state
3. **Data Layer** - Abstract database interface with multiple implementations
4. **Authentication Layer** - Supabase Auth integration
5. **Visualization Layer** - Recharts-based interactive charts

### Key Technology Stack

- Frontend Framework: React with TypeScript
- Build Tool: Vite
- UI Components: shadcn/ui (built on Radix UI)
- Styling: Tailwind CSS
- State Management: Zustand
- Data Fetching: React Query
- Authentication: Supabase Auth
- Data Storage:
  - Local: Browser localStorage
  - Cloud: Supabase
- Data Visualization: Recharts

### Important Design Patterns

1. **Database Factory Pattern**

   - The application uses a factory pattern to switch between localStorage and Supabase backends
   - Interface: `DatabaseProvider` provides a common API regardless of storage backend
   - Implementation: `SupabaseDatabase` and `MockDatabase` classes

2. **React Context for Authentication**

   - `AuthProvider` manages user authentication state
   - Provides methods for sign-in/sign-out
   - Handles session persistence

3. **Global State Stores**
   - `accounts-store.ts`: Manages account data and operations
   - `auth-store.ts`: Manages authentication state
   - `time-range-store.ts`: Manages chart time range selection

## Environment Configuration

This project uses Vite as its build tool, which requires environment variables to be prefixed with `VITE_` to be accessible in the client-side code.

### Required Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key for client-side operations
- `VITE_USE_SUPABASE`: Set to "true" to use Supabase backend, or "false" to use local storage

### Optional Test Variables

- `VITE_SUPABASE_TEST_USER_EMAIL`: Test user email for development
- `VITE_SUPABASE_TEST_USER_PASSWORD`: Test user password for development

## File Structure

### Key Directories

- `/src/components/`: React components
  - `/src/components/chart/`: Chart-related components
  - `/src/components/ui/`: UI components based on shadcn/ui
- `/src/hooks/`: Custom React hooks
- `/src/store/`: Zustand stores
- `/src/contexts/`: React contexts
- `/src/lib/`: Utility functions and libraries
- `/src/types/`: TypeScript type definitions
- `/src/api/`: API and query definitions
- `/sql/`: SQL migration scripts for Supabase

### Important Files

- `src/App.tsx`: Main application component with providers
- `src/pages/Index.tsx`: Main dashboard page
- `src/api/supabase-api.ts`: Supabase API integration
- `src/components/AuthProvider.tsx`: Authentication provider
- `src/lib/supabase.ts`: Supabase client configuration

## Data Model

The core entities in this application are:

1. **Account**: Represents a financial account (asset or liability)

   ```typescript
   interface Account {
     id: string;
     name: string;
     type: AccountType; // Asset or Debt type
     isDebt?: boolean;
     currency: CurrencyCode;
   }
   ```

2. **AccountWithValue**: Account with current balance

   ```typescript
   interface AccountWithValue extends Account {
     balance: number;
   }
   ```

3. **AccountValue**: Historical account value

   ```typescript
   interface AccountValue {
     accountId: string;
     hourStart: Date;
     value: number;
   }
   ```

4. **NetWorthSnapshot**: Historical net worth at a point in time
   ```typescript
   interface NetWorthSnapshot {
     timestamp: Date;
     value: number;
   }
   ```

## Common Development Workflows

### Adding a New Component

When adding a new component:

1. Follow the existing component structure
2. Use shadcn/ui components for UI elements
3. Use Tailwind CSS for styling
4. Implement TypeScript interfaces for props
5. Use custom hooks for business logic

### Working with the Database Layer

To access the database:

```tsx
import { useAccounts } from "@/hooks/use-accounts";

function MyComponent() {
  const { accounts, isLoading, error } = useAccounts();

  // Use accounts data
}
```

### Authentication Patterns

For authentication-related functionality:

```tsx
import { useAuth } from "@/components/AuthProvider";

function LoginComponent() {
  const { user, signIn, signOut } = useAuth();

  // Handle authentication
}
```
