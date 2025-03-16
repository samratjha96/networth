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

### Getting Started

1. Make sure you have Node.js installed (LTS version recommended)
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. For production build:
```bash
npm run build
```

5. To preview production build:
```bash
npm run preview
```

6. To run type checking:
```bash
npm run typecheck
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

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (optional backend)

