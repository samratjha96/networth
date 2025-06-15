# Argos - Net Worth Tracking Application Design Document

## 1. Executive Summary

Argos is a personal finance application designed to help users track and visualize their net worth over time. Named after the all-seeing guardian from Greek mythology, Argos serves as a vigilant guardian of the user's financial health. The application provides a comprehensive view of a user's assets and liabilities, calculates net worth, and visualizes financial trends over various time periods.

## 2. Core Functionality

### 2.1 Key Features

1. **Net Worth Tracking**

   - Real-time calculation of total net worth based on user accounts
   - Historical tracking of net worth over time with multiple time ranges
   - Visualization of net worth changes with percentage and absolute values

2. **Account Management**

   - Support for multiple account types (assets and liabilities)
   - Add, edit, and delete financial accounts
   - Track account balances over time
   - Multi-currency support

3. **Data Visualization**

   - Interactive charts with adaptive resolution based on selected time range
   - Time range selection (daily, weekly, monthly, yearly, all-time)
   - Significant financial event highlighting
   - Performance metrics for individual accounts

4. **Data Persistence**

   - Dual-storage architecture with localStorage and cloud options
   - Seamless transition between storage backends
   - Optional test mode with mock data

5. **User Authentication**
   - Email/password authentication
   - Google OAuth integration
   - Secure data storage with user isolation

## 3. Architecture Overview

### 3.1 High-Level Architecture

Argos follows a modern frontend architecture with:

1. **React Components** - Functional UI components with hooks
2. **Global State Management** - Zustand stores for application state
3. **Data Layer** - Abstract database interface with multiple implementations
4. **Authentication Layer** - Supabase Auth integration
5. **Visualization Layer** - Recharts-based interactive charts

### 3.2 Technology Stack

1. **Frontend Framework**: React with TypeScript
2. **Build Tool**: Vite
3. **UI Components**: shadcn/ui (built on Radix UI)
4. **Styling**: Tailwind CSS
5. **State Management**: Zustand
6. **Data Fetching**: React Query
7. **Authentication**: Supabase Auth
8. **Data Storage**:
   - Local: Browser localStorage
   - Cloud: Supabase
9. **Data Visualization**: Recharts
10. **Form Handling**: React Hook Form with Zod validation
11. **Routing**: React Router DOM

## 4. Data Model

### 4.1 Core Entities

#### 4.1.1 Account

```typescript
interface Account {
  id: string;
  name: string;
  type: AccountType; // Asset or Debt type
  isDebt?: boolean;
  currency: CurrencyCode;
}
```

#### 4.1.2 AccountWithValue

```typescript
interface AccountWithValue extends Account {
  balance: number;
}
```

#### 4.1.3 AccountValue (Historical)

```typescript
interface AccountValue {
  accountId: string;
  hourStart: Date;
  value: number;
}
```

#### 4.1.4 NetWorthSnapshot

```typescript
interface NetWorthSnapshot {
  timestamp: Date;
  value: number;
}
```

#### 4.1.5 AccountPerformance

```typescript
interface AccountPerformance {
  accountId: string;
  changeAmount: number;
  changePercent: number;
  periodStart: Date;
  periodEnd: Date;
}
```

### 4.2 Type Enumerations

#### 4.2.1 Account Types

```typescript
type AssetType =
  | "Checking"
  | "Savings"
  | "Brokerage"
  | "Retirement"
  | "401K"
  | "Car"
  | "Real Estate";

type DebtType = "Credit Card" | "Loan" | "Mortgage";

type AccountType = AssetType | DebtType;
```

#### 4.2.2 Currency Types

```typescript
type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CAD" | "AUD";
```

#### 4.2.3 Time Range Types

```typescript
type TimeRange = "1D" | "1W" | "1M" | "1Y" | "ALL";
```

## 5. Component Architecture

### 5.1 Page Structure

#### 5.1.1 Main Dashboard Page (Index.tsx)

- Displays overall app structure
- Contains Header, NetWorthSummary, NetWorthChart, and AccountsList
- Handles initial data loading and user authentication status

### 5.2 Core Components

#### 5.2.1 Header Component

- Application navigation
- Authentication controls (Sign In/Sign Out)
- App branding and title

#### 5.2.2 Authentication Components

- AuthProvider: Manages authentication state and user session
- SignInButton: Trigger for authentication flow
- SignInDialog: Modal dialog for authentication
- SignInForm: Form for email/password and social login

#### 5.2.3 Net Worth Summary Components

- NetWorthSummary: Displays current net worth and performance metrics
- Shows total net worth, change amount, and percentage

#### 5.2.4 Net Worth Visualization Components

- NetWorthChart: Main chart visualization of net worth over time
- TimeRangeSelector: Controls for time period selection
- ChartTooltip: Tooltip for displaying data points
- State handling for loading, error, and empty states

#### 5.2.5 Account Management Components

- AccountsList: Main container for account display with assets/liabilities tabs
- AccountsPanel: Renders account list with actions
- AddAccountDialog: Form for adding and editing accounts

#### 5.2.6 Database Components

- DatabaseProvider: Context provider for database access
- DebugAuthStatus: Debugging component for auth state (development only)

### 5.3 UI Component Library

The application uses a comprehensive UI component library based on shadcn/ui with Radix UI primitives:

- Dialog, Popover, Tooltip components
- Form inputs and validation
- Cards, Buttons, and other UI elements
- Toast notifications

## 6. State Management

### 6.1 Global State Stores

#### 6.1.1 Auth Store

- Manages authentication state
- Handles sign in, sign out, and session persistence
- Tracks current user information

#### 6.1.2 Database Store

- Manages database configuration
- Stores user ID and database backend preference
- Provides methods to switch between storage backends

#### 6.1.3 Accounts Store

- Manages account data and operations
- Provides methods for CRUD operations on accounts
- Handles account balance updates

#### 6.1.4 Time Range Store

- Manages selected time range for charts
- Provides methods to update time range

### 6.2 Local Component State

- React hooks for component-specific state
- Form state with React Hook Form
- UI state (modal visibility, loading states, etc.)

## 7. Data Layer

### 7.1 Database Abstraction

#### 7.1.1 Database Interface

```typescript
interface DatabaseProvider {
  // Account operations
  getAccounts(): Promise<AccountWithValue[]>;
  addAccount(account: Omit<AccountWithValue, "id">): Promise<AccountWithValue>;
  updateAccount(account: AccountWithValue): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  // Net worth history operations
  getNetWorthHistory(
    startDate: Date,
    endDate: Date,
  ): Promise<NetWorthSnapshot[]>;
  getAccountValueHistory(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AccountValue[]>;

  // Performance operations
  getAccountPerformance(
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AccountPerformance>;
}
```

### 7.2 Database Implementations

#### 7.2.1 Mock Database (localStorage)

- Stores data in browser localStorage
- Provides offline functionality
- Generates mock data for demonstration

#### 7.2.2 Supabase Database

- Cloud storage with Supabase backend
- User authentication integration
- Real-time data sync

#### 7.2.3 Database Factory

- Creates the appropriate database provider based on configuration
- Handles fallback mechanisms for authentication
- Provides a unified interface for database operations

## 8. Authentication System

### 8.1 Authentication Flows

#### 8.1.1 Email/Password Authentication

- Sign up with email and password
- Sign in with email and password
- Password reset functionality

#### 8.1.2 Social Authentication

- Google OAuth integration
- Single sign-on flow

### 8.2 Authorization

- User-based data isolation
- Authenticated vs. unauthenticated states
- Storage backend selection based on auth state

## 9. Data Visualization

### 9.1 Chart System

#### 9.1.1 Net Worth Chart

- Area chart showing net worth over time
- Interactive data points
- Responsive design for different screen sizes

#### 9.1.2 Adaptive Resolution

- Dynamic data point density based on viewport size
- Intelligent data aggregation for large datasets
- Maintains visual fidelity across time ranges

#### 9.1.3 Event Detection

- Identifies significant financial events
- Highlights important data points on charts
- Provides context for major net worth changes

## 10. Responsive Design

### 10.1 Viewport Adaptations

- Mobile-optimized layouts
- Responsive chart sizes and data density
- Touch-friendly controls for mobile users

### 10.2 Component Adaptations

- Simplified navigation on mobile
- Adapted form layouts for different screen sizes
- Optimized data visualizations for smaller screens

## 11. User Experience Flows

### 11.1 First-Time User Flow

1. User arrives at the application
2. Views the dashboard with test mode data
3. Signs up for an account (optional)
4. Adds first financial account
5. Sees initial net worth calculation

### 11.2 Account Management Flow

1. User navigates to account section
2. Views existing accounts (assets/liabilities)
3. Adds, edits, or deletes accounts
4. Sees real-time net worth updates

### 11.3 Data Visualization Flow

1. User views net worth chart
2. Selects different time ranges
3. Interacts with chart data points
4. Identifies trends and significant events

### 11.4 Authentication Flow

1. User clicks sign-in button
2. Enters credentials or selects social login
3. Gets authenticated and sees personal data
4. Can sign out to clear session

## 12. Testing Strategy

### 12.1 Test Mode

- Toggleable test mode with mock data
- Demonstrates application functionality without real data
- Consistent test data for demonstration purposes

### 12.2 Testing Approaches

- Component unit tests
- Integration tests for key user flows
- End-to-end testing for critical paths

## 13. Performance Optimizations

### 13.1 Data Loading

- Query caching with React Query
- Selective refetching based on dependencies
- Loading state management

### 13.2 Rendering Optimizations

- Memoization of expensive calculations
- Lazy loading of components
- Virtualization for long lists

### 13.3 Build Optimizations

- Code splitting for better loading performance
- Asset optimization with Vite
- Compression for production builds

## 14. Security Considerations

### 14.1 Authentication Security

- Secure password handling
- Token-based authentication
- Session management

### 14.2 Data Security

- User data isolation
- Client-side encryption options
- Secure API communication

## 15. Deployment Architecture

### 15.1 Containerization

- Docker configuration for consistent environments
- Multi-stage builds for optimized images
- Environment variable management

### 15.2 Hosting

- Static site hosting for frontend
- Supabase for backend services
- CI/CD pipeline integration

## 16. Future Enhancements

### 16.1 Additional Features

- Financial goal setting and tracking
- Budget integration with net worth tracking
- Notifications for significant financial events
- Export functionality for reports
- Additional account types and categories

### 16.2 Technical Improvements

- Advanced analytics and forecasting
- API integrations with financial institutions
- Offline-first architecture enhancements
- Performance optimizations for larger datasets

## 17. Conclusion

Argos provides a comprehensive solution for personal net worth tracking with a focus on usability, data visualization, and flexibility in data storage. The application's architecture allows for both offline and cloud-based usage, catering to different user preferences for data privacy and accessibility.

The modular design enables future enhancements while maintaining a solid foundation of core functionality. By combining modern frontend technologies with powerful visualization capabilities, Argos delivers a valuable tool for users to monitor and improve their financial health.
