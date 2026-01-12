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

- `VITE_POCKETBASE_URL`: Your PocketBase server URL (e.g., http://localhost:8090)

### Optional Variables

- `VITE_POCKETBASE_TEST_USER_EMAIL`: Test user email for development
- `VITE_POCKETBASE_TEST_USER_PASSWORD`: Test user password for development
- `VITE_USE_MOCK`: Set to "true" to use demo data instead of PocketBase

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

In the codebase, Vite environment variables are accessed like:

```javascript
const pocketBaseUrl = import.meta.env.VITE_POCKETBASE_URL;
const useMock = import.meta.env.VITE_USE_MOCK === "true";
```

> **Important**: Do not use `process.env` as it's not available in Vite client-side code.

## Database Administration

This project includes a powerful database exploration and maintenance tool for debugging user data issues and managing the PocketBase database.

### Database Explorer Script

The `scripts/database.js` script provides comprehensive database analysis and maintenance capabilities:

```bash
# List all users in the database
node scripts/database.js users

# Complete data exploration for a specific user
node scripts/database.js explore <userId>

# Analyze account values and mappings
node scripts/database.js accounts <userId>

# Analyze net worth history
node scripts/database.js networth <userId>

# Clean up problematic data entries
node scripts/database.js cleanup <userId>
```

### Required Environment Variables for Database Scripts

For database administration scripts, set these environment variables:

```bash
POCKETBASE_URL=your-pocketbase-url
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password
```

### Example Usage

```bash
# Explore all data for a user (comprehensive analysis)
node scripts/database.js explore abc123xyz

# Output includes:
# - Account analysis with values and data points
# - Net worth history analysis
# - Data issue identification
# - Expected vs actual net worth comparison
```

The database explorer helps identify and resolve common issues like:

- Accounts showing $0 values due to mapping problems
- Net worth charts dropping to zero from problematic entries
- Missing or corrupted historical data
- Data synchronization issues between accounts and net worth history

## Technologies

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- PocketBase (backend database)
