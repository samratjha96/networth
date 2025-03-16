# Argos - Net Worth Tracking Application PRD

## Project Overview

**Argos** is a web-based personal finance application designed to help users track and visualize their net worth over time. The name "Argos" references the all-seeing guardian from Greek mythology, positioning the app as a vigilant guardian of the user's financial health. The tagline "Your all-seeing financial guardian" reinforces this concept.

## Purpose and Goals

The primary goals of Argos are to:

1. Provide users with a clear, real-time view of their total net worth
2. Allow tracking of various financial accounts (assets and liabilities)
3. Visualize changes in net worth over time with adaptive resolution charting
4. Identify best and worst-performing financial assets
5. Offer both local storage and cloud-based data persistence options
6. Support user authentication for secure data access

## Target Audience

- Individuals who want to track their personal finances
- Users who have multiple financial accounts and need a consolidated view
- People interested in visualizing their financial growth over time
- Users who value data privacy (local storage option) and accessibility (cloud storage option)

## Features

### Core Features

1. **Account Management**
   - Add, edit, and delete financial accounts
   - Support for various account types:
     - Assets: Checking, Savings, Brokerage, Retirement, 401K, Car, Real Estate
     - Liabilities: Credit Card, Loan, Mortgage
   - Multi-currency support (USD, EUR, GBP, JPY, CAD, AUD)

2. **Net Worth Dashboard**
   - Current total net worth display
   - Net worth change visualization (amount and percentage)
   - Period comparison (daily, weekly, monthly, yearly)
   - Best and worst performing account highlighting
   - Test mode toggle for demonstration purposes

3. **Net Worth History**
   - Historical net worth tracking with multiple time ranges
   - Adaptive resolution visualization that optimizes data points based on viewport
   - Significant event identification in charts
   - Time range selector (1D, 1W, 1M, 1Y, All)

4. **User Authentication**
   - Email/password authentication
   - Google OAuth integration
   - Secure data storage in Supabase backend
   - Seamless transition between local and cloud data

### User Interface

1. **Main Dashboard**
   - Header: Navigation and authentication controls
   - Top section: Net worth summary cards
   - Middle section: Net worth chart visualization with time range controls
   - Bottom section: Accounts list with toggle between assets and liabilities

2. **Authentication System**
   - Sign-in/Sign-up dialog with form validation
   - Google authentication option
   - Error messaging for authentication issues

3. **Account Management Dialogs**
   - Add account dialog with form fields for account details
   - Edit account functionality
   - Delete account confirmation
   - Form validation with error messaging

## Technical Architecture

### Frontend Framework

- React 18 with TypeScript
- Functional components with hooks for state management
- Vite for build and development environment

### UI Components and Styling

- Tailwind CSS for styling
- shadcn/ui component library with Radix UI primitives
- Responsive design with mobile breakpoint detection
- Modern design with animation and transitions

### Data Visualization

- Recharts for chart visualization
- Adaptive resolution system that optimizes data points based on viewport
- Interactive tooltips and time range selection

### State Management

- Zustand for global state management
- React hooks for local state management
- Custom hooks for shared state logic
- Context providers for feature-specific state

### Data Storage

- Dual-storage architecture:
  - Browser localStorage for offline and privacy-focused use
  - Supabase backend for cloud storage and multi-device sync
- Factory pattern to seamlessly switch between storage backends
- Test mode for demonstration purposes

### Authentication

- Supabase authentication integration
- Email/password authentication flow
- OAuth integration for Google login
- Session management and persistence

### Deployment

- Docker containerization support
- Environment variable configuration
- Production build optimization

### Key Components

1. **Pages**
   - Index.tsx - Main dashboard page

2. **Components**
   - Header - Navigation and authentication UI
   - AuthProvider - Authentication state provider
   - SignInDialog - Authentication form
   - SignInButton - Authentication trigger
   - NetWorthSummary - Displays current net worth and change metrics
   - NetWorthChart - Visualizes net worth history over time with adaptive resolution
   - NetWorthChartContainer - Wrapper for chart with additional controls
   - AccountsList - Displays all accounts with toggle between assets/liabilities
   - AccountsPanel - Renders the appropriate accounts based on selection
   - AddAccountDialog - Form for adding/editing accounts
   - TestModeToggle - Enables test mode for demonstration

3. **Hooks**
   - use-accounts - Manages account data and CRUD operations
   - use-networth-history - Manages historical net worth data
   - use-adaptive-networth-history - Handles adaptive resolution data processing
   - use-account-performance - Calculates account performance metrics
   - use-time-range - Manages time range selection state
   - use-database - Provides access to the current database implementation
   - use-mobile - Detects mobile viewport for responsive design
   - use-toast - Manages toast notifications

4. **Stores**
   - auth-store - Manages authentication state and operations
   - database-store - Manages database configuration and state

5. **Libraries and Utilities**
   - database.ts - Handles local storage data operations
   - supabase-database.ts - Handles Supabase backend integration
   - database-factory.ts - Manages switching between storage backends
   - base-database.ts - Defines base database interface
   - adaptive-resolution.ts - Handles chart data point optimization
   - utils.ts - Utility functions for formatting and calculations
   - mock-data.ts - Test data generation
   - test-mode-context.tsx - Manages test mode state

## Current State of the Project

The application is now a fully functional net worth tracking application with both local and cloud storage options:

1. **Completed Features**
   - Full account management (add, edit, delete)
   - Net worth calculation and visualization with adaptive resolution
   - Historical tracking of net worth with multiple time ranges
   - Performance tracking for accounts
   - User authentication with email/password and Google OAuth
   - Dual storage backend (local and Supabase)
   - Test mode for demonstration
   - Responsive design for desktop and mobile

2. **Technical Implementation**
   - Zustand state management
   - Supabase backend integration
   - Docker containerization
   - Environment variable configuration
   - Type-safe codebase with TypeScript
   - Component-based architecture with shadcn/ui

## Future Enhancements

Potential future improvements could include:

1. **Advanced Features**
   - Financial goal setting and tracking
   - Financial institution API integration for automatic balance updates
   - Detailed reporting and analytics dashboard
   - Export functionality for reports and data
   - Notifications for significant changes in net worth
   - Budget tracking and integration with net worth

2. **Enhanced Visualization**
   - Additional chart types (pie charts for asset allocation, etc.)
   - Forecasting and trend analysis
   - Custom reporting periods
   - More detailed event tracking in charts

3. **Advanced User Management**
   - Account sharing for families or partners
   - User profiles and preferences
   - Multiple portfolios or account groups
   - User activity logging

## Technical Dependencies

Key external libraries used in the project:

- React 18 and React DOM
- React Router DOM for navigation
- Zustand for state management
- Recharts for data visualization
- Radix UI components via shadcn/ui
- TailwindCSS for styling
- date-fns for date manipulation
- Supabase for backend integration
- React Query for API data fetching
- React Hook Form for form handling
- Zod for validation
- Various utility libraries (clsx, tailwind-merge, etc.)

## Development Setup

The project is built with modern frontend tooling:

- Vite as the build tool and development server
- TypeScript for type safety
- ESLint and Prettier for code quality
- Docker configuration for containerized development and deployment
- Environment variable management for configuration 