# PRD: Supabase to PocketBase Migration

## Project Overview

### Problem Statement

The Argos net worth tracking application currently relies on Supabase as its backend service. While Supabase provides excellent functionality, migrating to PocketBase offers opportunities for reduced complexity, lower operational costs, and enhanced development experience through self-hosting and a simplified architecture.

### Solution

Migrate the application backend from Supabase (PostgreSQL + Auth + Edge Functions) to PocketBase (SQLite + Built-in Auth + JavaScript/Go Hooks) while maintaining all existing functionality and improving the overall developer and deployment experience.

## Goals and Objectives

### Primary Goals

1. **Maintain Feature Parity**: Ensure all existing functionality continues to work seamlessly
2. **Improve Developer Experience**: Simplify local development and testing
3. **Reduce Operational Complexity**: Move from cloud-dependent to self-hosted solution
4. **Cost Optimization**: Eliminate ongoing Supabase subscription costs
5. **Enhanced Capabilities**: Leverage PocketBase's built-in real-time features

### Success Criteria

- ✅ All existing features work without degradation
- ✅ Authentication flow preserved (email/password, OAuth2 if configured)
- ✅ Data integrity maintained during transition
- ✅ Performance equals or exceeds current implementation
- ✅ Deployment complexity reduced
- ✅ Development setup time reduced by 50%+

## Target Users

### Primary Users

- **Developers**: Improved local development experience, simpler deployment
- **End Users**: Seamless transition with no feature loss, potential performance improvements
- **System Administrators**: Simplified infrastructure management

### User Stories

1. **As a developer**, I want to run the entire application stack locally without cloud dependencies
2. **As an end user**, I want my financial data to remain secure and accessible without service interruption
3. **As a system administrator**, I want a simpler deployment and backup process

## Technical Requirements

### Functional Requirements

#### Authentication

- ✅ Email/password authentication
- ✅ JWT token management with refresh capability
- ✅ Session persistence across browser sessions
- ✅ Secure logout functionality
- ⭐ OAuth2 support (Google, GitHub, etc.) - if currently configured
- ⭐ Multi-factor authentication (enhancement)

#### Data Management

- ✅ Account CRUD operations (Create, Read, Update, Delete)
- ✅ Account value history tracking (hourly snapshots)
- ✅ Net worth calculation and history
- ✅ Account performance metrics calculation
- ✅ Multi-currency support
- ✅ Data validation and sanitization

#### API Features

- ✅ RESTful API endpoints matching current interface
- ✅ Query filtering and sorting
- ✅ Pagination support
- ✅ Error handling and validation
- ⭐ Real-time data synchronization (enhancement)
- ⭐ Batch operations support (enhancement)

### Non-Functional Requirements

#### Performance

- Response times ≤ 200ms for typical queries
- Support for concurrent user sessions
- Efficient data aggregation for historical views
- Scalable file storage (if needed in future)

#### Security

- Secure authentication with JWT tokens
- Data encryption at rest and in transit
- Input validation and sanitization
- Role-based access control
- Rate limiting and DDoS protection

#### Reliability

- 99.9% uptime requirement
- Automated backup and recovery
- Data consistency guarantees
- Graceful error handling and recovery

#### Maintainability

- Clean, documented codebase
- Modular architecture supporting future enhancements
- Comprehensive test coverage (>80%)
- Clear separation between business logic and data access

## Architecture

### Current Architecture (Supabase)

```
Frontend (React) → DataService Interface → SupabaseDataService → Supabase API → PostgreSQL
                                      ↓
                                 Supabase Auth
```

### Target Architecture (PocketBase)

```
Frontend (React) → DataService Interface → PocketbaseDataService → PocketBase API → SQLite
                                      ↓
                                 PocketBase Auth
```

### Key Components

#### Data Service Layer

- **DataService Interface**: Unchanged, maintains existing contract
- **PocketbaseDataService**: New implementation using PocketBase SDK
- **MockDataService**: Unchanged, continues to support demo mode

#### Authentication Layer

- **Auth Store**: Updated to work with PocketBase tokens and user objects
- **Auth Provider**: Modified to use PocketBase authentication methods
- **Session Management**: Adapted for PocketBase session handling patterns

#### Database Schema

- **Collections**: Map current PostgreSQL tables to PocketBase collections
- **Validation Rules**: Implement business rules using PocketBase validation
- **Relationships**: Maintain data relationships using PocketBase relation fields

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Goal**: Set up basic PocketBase infrastructure and core services

#### Tasks:

1. **Environment Setup**

   - Install and configure PocketBase development server
   - Create docker configuration for PocketBase
   - Set up development environment documentation

2. **Schema Design**

   - Design PocketBase collections matching current database schema
   - Define field types, validation rules, and relationships
   - Create migration scripts for schema setup

3. **Basic Service Implementation**

   - Create `PocketbaseDataService` class structure
   - Implement basic CRUD operations for accounts
   - Set up error handling and response transformation

4. **Authentication Foundation**
   - Set up PocketBase authentication configuration
   - Update auth store to handle PocketBase tokens
   - Implement basic login/logout functionality

### Phase 2: Core Features (Week 3-4)

**Goal**: Implement all essential data operations and authentication

#### Tasks:

1. **Complete Data Operations**

   - Implement account management (CRUD)
   - Add account value history tracking
   - Implement net worth calculations
   - Add account performance metrics

2. **Authentication Complete**

   - Implement full authentication flow
   - Add session management and token refresh
   - Test authentication edge cases
   - Add OAuth2 support if needed

3. **Data Migration Tools**

   - Create export utilities for Supabase data
   - Create import utilities for PocketBase
   - Implement data validation scripts

4. **Integration Testing**
   - Unit tests for new data service
   - Integration tests for authentication
   - End-to-end functionality testing

### Phase 3: Enhancement & Optimization (Week 5-6)

**Goal**: Add enhancements and optimize performance

#### Tasks:

1. **Real-time Features**

   - Implement real-time data subscriptions
   - Add live updates for account changes
   - Test real-time performance and reliability

2. **Performance Optimization**

   - Profile and optimize database queries
   - Implement efficient data aggregation
   - Add caching where appropriate

3. **Production Readiness**

   - Set up production PocketBase configuration
   - Implement backup and recovery procedures
   - Create monitoring and alerting

4. **Documentation**
   - Update deployment documentation
   - Create troubleshooting guides
   - Document new features and capabilities

### Phase 4: Deployment & Migration (Week 7-8)

**Goal**: Deploy to production and migrate users

#### Tasks:

1. **Production Deployment**

   - Deploy PocketBase server infrastructure
   - Configure production authentication and security
   - Set up monitoring and backup systems

2. **Gradual Migration**

   - Implement feature flags for backend switching
   - Test parallel running with subset of users
   - Monitor performance and stability

3. **User Migration**

   - Execute data migration procedures
   - Communicate changes to users
   - Monitor for issues and provide support

4. **Cleanup**
   - Decommission Supabase resources
   - Remove deprecated code
   - Update documentation and processes

## Database Schema Migration

### Current Schema (Supabase/PostgreSQL)

```sql
-- Users managed by Supabase Auth
-- accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    type account_type NOT NULL,
    currency currency_code NOT NULL,
    is_debt BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- hourly_account_values table
CREATE TABLE hourly_account_values (
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    value NUMERIC NOT NULL,
    PRIMARY KEY (account_id, hour_start)
);

-- networth_history table
CREATE TABLE networth_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    value NUMERIC NOT NULL
);
```

### Target Schema (PocketBase Collections)

```javascript
// users collection (built-in auth)
{
  "name": "users",
  "type": "auth",
  "system": true,
  "schema": [
    {
      "name": "name",
      "type": "text",
      "required": false
    },
    {
      "name": "avatar",
      "type": "file",
      "required": false
    }
  ]
}

// accounts collection
{
  "name": "accounts",
  "type": "base",
  "schema": [
    {
      "name": "user",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true
      }
    },
    {
      "name": "name",
      "type": "text",
      "required": true,
      "options": {
        "min": 1,
        "max": 100
      }
    },
    {
      "name": "type",
      "type": "select",
      "required": true,
      "options": {
        "values": ["checking", "savings", "investment", "credit_card", "loan", "mortgage", "other"]
      }
    },
    {
      "name": "currency",
      "type": "select",
      "required": true,
      "options": {
        "values": ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF"]
      }
    },
    {
      "name": "is_debt",
      "type": "bool",
      "required": false
    }
  ]
}

// account_values collection
{
  "name": "account_values",
  "type": "base",
  "schema": [
    {
      "name": "account",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "accounts",
        "cascadeDelete": true
      }
    },
    {
      "name": "user",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true
      }
    },
    {
      "name": "hour_start",
      "type": "date",
      "required": true
    },
    {
      "name": "value",
      "type": "number",
      "required": true
    }
  ]
}

// networth_history collection
{
  "name": "networth_history",
  "type": "base",
  "schema": [
    {
      "name": "user",
      "type": "relation",
      "required": true,
      "options": {
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true
      }
    },
    {
      "name": "date",
      "type": "date",
      "required": true
    },
    {
      "name": "value",
      "type": "number",
      "required": true
    }
  ]
}
```

## Risk Assessment

### High Risk

1. **Data Migration Complexity**

   - **Risk**: Data loss or corruption during migration from PostgreSQL to SQLite
   - **Mitigation**: Extensive testing, backup procedures, gradual rollout with rollback plan

2. **Performance Degradation**
   - **Risk**: SQLite performance may not match PostgreSQL for complex queries
   - **Mitigation**: Performance testing, query optimization, caching strategies

### Medium Risk

3. **Feature Compatibility**

   - **Risk**: PocketBase may not support all current Supabase features
   - **Mitigation**: Detailed feature mapping, custom implementations via hooks where needed

4. **Learning Curve**
   - **Risk**: Team unfamiliarity with PocketBase development patterns
   - **Mitigation**: Training sessions, documentation, proof of concept phase

### Low Risk

5. **Deployment Complexity**
   - **Risk**: New deployment procedures may introduce issues
   - **Mitigation**: Containerization, infrastructure as code, staging environment testing

## Success Metrics

### Technical Metrics

- **Performance**: API response times ≤ current baseline (200ms)
- **Reliability**: 99.9% uptime maintained
- **Test Coverage**: >80% code coverage achieved
- **Deployment Time**: <15 minutes for full deployment
- **Local Setup**: <5 minutes for new developer onboarding

### Business Metrics

- **Cost Reduction**: Eliminate Supabase subscription costs
- **Development Velocity**: Faster feature development cycle
- **User Satisfaction**: No user-facing regressions
- **System Reliability**: Reduced infrastructure dependencies

## Dependencies and Constraints

### Dependencies

- PocketBase stable release (v0.30.0+)
- Team availability for migration work
- Stakeholder approval for architecture changes

### Constraints

- Zero downtime requirement during migration
- No data loss tolerance
- Maintain existing user experience
- Complete migration within 8-week timeline

## Communication Plan

### Stakeholders

- **Development Team**: Weekly progress updates, technical decisions
- **Product Team**: Milestone reviews, feature validation
- **Infrastructure Team**: Deployment planning, security review
- **End Users**: Migration announcement, support during transition

### Milestones

1. **Week 2**: Foundation complete, basic PocketBase service operational
2. **Week 4**: Core features implemented, ready for integration testing
3. **Week 6**: Production-ready implementation, performance validated
4. **Week 8**: Migration complete, Supabase decommissioned

## Conclusion

The migration from Supabase to PocketBase represents a strategic move toward simplified architecture, reduced operational overhead, and enhanced development experience. By maintaining the existing `DataService` interface and implementing a gradual migration approach, we can ensure zero-downtime transition while unlocking the benefits of PocketBase's integrated platform.

The comprehensive plan outlined above provides a structured approach to achieving this migration while minimizing risks and maximizing the benefits for both development teams and end users.
