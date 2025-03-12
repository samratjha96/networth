# Argos - Net Worth Tracking Application PRD

## Project Overview

**Argos** is a web-based personal finance application designed to help users track and visualize their net worth over time. The name "Argos" references the all-seeing guardian from Greek mythology, positioning the app as a vigilant guardian of the user's financial health. The tagline "Your all-seeing financial guardian" reinforces this concept.

## Purpose and Goals

The primary goals of Argos are to:

1. Provide users with a clear, real-time view of their total net worth
2. Allow tracking of various financial accounts (assets and liabilities)
3. Visualize changes in net worth over time
4. Identify best-performing financial assets

## Target Audience

- Individuals who want to track their personal finances
- Users who have multiple financial accounts and need a consolidated view
- People interested in visualizing their financial growth over time

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
   - Period comparison (monthly)
   - Best performing account highlight

3. **Net Worth History**
   - Historical net worth tracking
   - Visual chart representation
   - Period filtering options

### User Interface

1. **Main Dashboard**
   - Top section: Net worth summary cards
   - Middle section: Net worth chart visualization
   - Bottom section: Accounts list with toggle between assets and liabilities

2. **Account Management Dialogs**
   - Add account dialog with form fields for account details
   - Edit account functionality
   - Delete account confirmation

## Technical Architecture

### Frontend Framework

- React with TypeScript
- Functional components with hooks for state management
- Vite for build and development environment

### UI Components and Styling

- Tailwind CSS for styling
- shadcn/ui component library
- Responsive design for different screen sizes

### Data Visualization

- Recharts for chart visualization

### State Management

- React hooks for local state management
- Custom hooks for shared state logic

### Data Storage

- Browser localStorage for data persistence
- Mock database implementation that simulates API calls

### Key Components

1. **Pages**
   - Index.tsx - Main dashboard page

2. **Components**
   - NetWorthSummary - Displays current net worth and change metrics
   - NetWorthChart - Visualizes net worth history over time
   - AccountsList - Displays all accounts with toggle between assets/liabilities
   - AccountsPanel - Renders the appropriate accounts based on selection
   - AddAccountDialog - Form for adding/editing accounts

3. **Hooks**
   - use-accounts - Manages account data and CRUD operations
   - use-networth-history - Manages historical net worth data
   - use-mobile - Detects mobile viewport for responsive design

4. **Libraries and Utilities**
   - database.ts - Handles data storage and retrieval
   - utils.ts - Utility functions like currency formatting
   - types.ts - TypeScript type definitions

## Current State of the Project

The application is currently in development with core functionality implemented:

1. **Completed Features**
   - Account management (add, edit, delete)
   - Net worth calculation and visualization
   - Historical tracking of net worth
   - Basic UI implementation

2. **Technical Implementation**
   - Data is stored in localStorage
   - Mock database implementation simulates a real backend
   - Functional UI with responsive design

3. **Limitations**
   - No user authentication or multiple user support
   - Data is only stored locally in the browser
   - Limited currency conversion functionality
   - Fixed/simulated growth rate for "best performing account"

## Future Enhancements

Potential future improvements could include:

1. **Backend Integration**
   - Replace localStorage with a real database
   - User authentication and account management
   - Data synchronization across devices

2. **Advanced Features**
   - Financial goal setting and tracking
   - Financial institution integration for automatic balance updates
   - More detailed reporting and analytics
   - Export functionality for reports
   - Notifications for significant changes in net worth

3. **Enhanced Visualization**
   - Additional chart types and visualizations
   - Asset allocation views
   - Forecasting and trend analysis

## Technical Dependencies

Key external libraries used in the project:

- React and React DOM
- React Router DOM
- Recharts for data visualization
- Radix UI components via shadcn/ui
- TailwindCSS for styling
- date-fns for date manipulation
- React Query for potential future API integration
- Various utility libraries (clsx, tailwind-merge, etc.)

## Development Setup

The project is built with modern frontend tooling:

- Vite as the build tool and development server
- TypeScript for type safety
- ESLint for code quality
- Docker configuration available for containerized development and deployment 