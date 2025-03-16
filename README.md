# Welcome to your Lovable project

## Project info

**URL**: https://networth.techbrohomelab.xyz

## Environment Setup

This project uses Vite as its build tool, which requires environment variables to be prefixed with `VITE_` to be accessible in the client-side code.

### Setup Instructions

1. Create a `.env` file in the root of your project
2. Copy the contents from `.env.example` 
3. Update the values as needed for your environment
4. Make sure to restart the Vite dev server after making changes to environment variables

### Required Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key for client-side operations
- `VITE_USE_SUPABASE`: Set to "true" to use Supabase backend, or "false" to use local storage

### Dependency Installation

We use dotenv-expand for enhanced environment variable handling:

```bash
npm install --save-dev dotenv-expand
```

### Environment Variable Access

In the codebase, these variables are accessed using Vite's environment variable syntax:

```javascript
// Correct way to access Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';
```

Key components using these environment variables:
- `src/lib/supabase-database.ts` - Database connection
- `src/lib/database-factory.ts` - Database backend selection
- `src/components/AuthProvider.tsx` - Authentication setup

### Configuration

The Vite configuration (vite.config.ts) has been updated to properly load and expose these environment variables to the client-side code:

```typescript
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // ... other config
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_USE_SUPABASE': JSON.stringify(env.VITE_USE_SUPABASE),
    }
  }
});
```

> **Important**: Do not use `process.env` as it's not available in Vite client-side code.

## How can I edit this code?

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (optional backend)

