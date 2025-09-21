# PocketBase Migration Plan

## Overview

This document outlines the migration plan from Supabase to PocketBase for the Argos net worth tracking application.

## Current Supabase Integration Analysis

### 1. Architecture Overview

- **Data Layer**: Abstract `DataService` interface with `SupabaseDataService` implementation
- **Authentication**: Supabase Auth with email/password and OAuth2 support
- **Database**: PostgreSQL with RLS policies and stored procedures
- **Real-time**: Not currently implemented (no subscriptions found)
- **File Storage**: Not currently used in the application

### 2. Current Supabase Dependencies

```
Dependencies found in:
- package.json: @supabase/supabase-js v2.49.1
- src/lib/supabase.ts: Client initialization
- src/api/supabase-api.ts: API abstraction layer
- src/services/SupabaseDataService.ts: Service implementation
- src/store/auth-store.ts: Authentication state management
- src/contexts/AppDataContext.tsx: Data provider switching
```

### 3. Database Schema Analysis

Based on the API calls, the current schema includes:

**Collections (Tables):**

1. `accounts` - User financial accounts
   - id, user_id, name, type, currency, is_debt, created, updated
2. `hourly_account_values` - Historical account values
   - account_id, user_id, hour_start, value
3. `networth_history` - Historical net worth snapshots
   - user_id, date, value
4. Users table - Managed by Supabase Auth

**Key Features:**

- Row Level Security (RLS) policies
- Stored procedures: `calculate_account_performance`
- Hourly data aggregation
- Multi-currency support

### 4. Current Authentication Flow

- Email/password authentication
- OAuth2 support (configured but implementation not visible)
- JWT tokens with automatic refresh
- Session persistence via localStorage
- Dual mode: authenticated (Supabase) vs demo (localStorage)

## PocketBase Capabilities Analysis

### 1. Core Features

- **Database**: Embedded SQLite with full SQL support
- **Authentication**: Built-in auth with email/password, OAuth2, OTP
- **Real-time**: WebSocket subscriptions
- **File Handling**: Built-in file upload and storage
- **Admin Dashboard**: Web UI for data management
- **API**: REST-like API with filtering, sorting, pagination
- **Extensions**: Go/JavaScript hooks for custom logic

### 2. Authentication Features

- Multiple auth methods: email/password, OAuth2, OTP
- Multi-factor authentication support
- JWT tokens (non-renewable for security)
- Built-in user management
- Custom validation rules
- User impersonation (admin feature)

### 3. Database Features

- SQLite with full SQL support
- Collections (equivalent to tables)
- Field types: text, number, bool, email, url, date, select, relation, file, json
- Built-in validation rules
- Before/after hooks via JavaScript/Go
- Migrations system
- Backup and restore

### 4. API Features

- RESTful API with automatic generation
- Real-time subscriptions
- File upload support
- Batch operations
- Advanced filtering and sorting
- Custom API endpoints via hooks

## Migration Strategy

### Phase 1: Setup and Preparation

1. **Environment Setup**

   - Install PocketBase binary
   - Create basic collections schema
   - Set up development environment
   - Configure authentication methods

2. **Schema Migration**

   - Design PocketBase collections equivalent to current tables
   - Map data types and relationships
   - Set up validation rules
   - Configure authentication collection

3. **New Service Implementation**
   - Create `PocketbaseDataService` implementing existing `DataService` interface
   - Implement all required methods to match current API
   - Add error handling and data transformation
   - Maintain backward compatibility with existing hooks

### Phase 2: Core Functionality Implementation

1. **Authentication Migration**

   - Replace Supabase auth with PocketBase auth
   - Update auth store to use PocketBase tokens
   - Maintain existing auth flow patterns
   - Test OAuth2 integration if needed

2. **Data Operations**

   - Implement CRUD operations for accounts
   - Implement net worth history tracking
   - Migrate account performance calculations
   - Add real-time subscriptions (enhancement)

3. **Configuration Updates**
   - Update environment variables
   - Update Docker configuration
   - Update build and deployment scripts

### Phase 3: Testing and Optimization

1. **Testing**

   - Unit tests for new data service
   - Integration tests for auth flow
   - End-to-end testing with real data
   - Performance testing

2. **Data Migration Tools** (for future use)
   - Export utilities from Supabase
   - Import utilities for PocketBase
   - Data validation scripts

### Phase 4: Deployment and Rollout

1. **Production Setup**

   - Deploy PocketBase server
   - Configure production authentication
   - Set up monitoring and backups
   - Update CI/CD pipelines

2. **Gradual Migration**
   - Feature flags for backend switching
   - Parallel running for validation
   - User migration strategy
   - Rollback procedures

## Key Differences and Considerations

### 1. Database Differences

| Feature           | Supabase (PostgreSQL) | PocketBase (SQLite)  |
| ----------------- | --------------------- | -------------------- |
| Database Type     | PostgreSQL            | SQLite               |
| Scalability       | High (cloud)          | Medium (single file) |
| Concurrent Writes | Excellent             | Good                 |
| SQL Features      | Full PostgreSQL       | Standard SQL         |
| Stored Procedures | Yes                   | Via hooks only       |
| RLS               | Native                | Via API rules        |

### 2. Authentication Differences

| Feature         | Supabase          | PocketBase          |
| --------------- | ----------------- | ------------------- |
| JWT Handling    | Automatic refresh | Manual refresh      |
| Session Storage | Configurable      | Built-in auth store |
| OAuth2          | Full support      | Full support        |
| Multi-factor    | Limited           | Full support        |
| User Management | Separate service  | Built-in            |

### 3. API Differences

| Feature          | Supabase          | PocketBase           |
| ---------------- | ----------------- | -------------------- |
| API Style        | PostgREST         | Custom REST          |
| Real-time        | Pub/Sub           | WebSocket            |
| File Upload      | Separate service  | Built-in             |
| Filtering        | PostgreSQL syntax | Custom filter syntax |
| Batch Operations | Limited           | Built-in             |

## Implementation Approach

### 1. Service Layer Strategy

- Keep existing `DataService` interface unchanged
- Create new `PocketbaseDataService` implementation
- Update `AppDataContext` to switch between services
- Maintain backward compatibility during transition

### 2. Authentication Strategy

- Replace Supabase client with PocketBase client
- Update auth store to handle PocketBase tokens
- Maintain existing auth flow patterns
- Add PocketBase-specific features (MFA, etc.)

### 3. Schema Mapping

```typescript
// Current Supabase schema -> PocketBase collections
accounts -> accounts_collection
hourly_account_values -> account_values_collection
networth_history -> networth_history_collection
users (auth) -> users_collection (built-in auth)
```

### 4. Data Type Mapping

```typescript
// PostgreSQL -> SQLite/PocketBase
UUID -> text (15-char PocketBase IDs)
timestamp with timezone -> datetime
boolean -> bool
text -> text
numeric -> number
json/jsonb -> json
```

## Benefits of Migration

### 1. Simplified Architecture

- Single binary deployment
- Embedded database (no separate DB server)
- Built-in admin interface
- Reduced infrastructure complexity

### 2. Cost Reduction

- No cloud database costs
- Self-hosted option
- Simpler scaling model
- Reduced operational overhead

### 3. Enhanced Features

- Built-in real-time subscriptions
- Better file handling
- More flexible authentication options
- Custom business logic via hooks

### 4. Development Experience

- Faster local development
- Better debugging tools
- Simpler data modeling
- More intuitive API

## Risks and Mitigation

### 1. Performance Risks

- **Risk**: SQLite performance limitations with high concurrency
- **Mitigation**: Profile performance, implement connection pooling, consider horizontal scaling

### 2. Feature Parity Risks

- **Risk**: Missing Supabase-specific features
- **Mitigation**: Implement equivalent functionality via PocketBase hooks

### 3. Data Migration Risks

- **Risk**: Data loss or corruption during migration
- **Mitigation**: Extensive testing, backup procedures, gradual rollout

### 4. Learning Curve Risks

- **Risk**: Team unfamiliarity with PocketBase
- **Mitigation**: Training, documentation, proof of concept phase

## Success Metrics

1. **Functional Requirements**

   - All existing features working correctly
   - Authentication flow maintained
   - Data consistency preserved
   - Performance meets or exceeds current levels

2. **Technical Requirements**

   - Reduced deployment complexity
   - Improved development experience
   - Enhanced real-time capabilities
   - Maintainable codebase

3. **Business Requirements**
   - Reduced operational costs
   - Improved system reliability
   - Faster feature development
   - Better user experience

## Next Steps

1. **Proof of Concept**

   - Set up basic PocketBase instance
   - Implement core data operations
   - Test authentication flow
   - Validate performance characteristics

2. **Detailed Implementation Planning**

   - Break down tasks by feature area
   - Estimate effort and timeline
   - Identify dependencies and risks
   - Plan testing strategy

3. **Stakeholder Alignment**
   - Review plan with team
   - Get approval for approach
   - Establish timeline and milestones
   - Set up monitoring and success criteria
