# Authentication System Migration Plan

This document outlines the plan to migrate from the current mixed authentication approach to a standardized authentication system.

## Overview

The current system has several issues:
- Multiple competing authentication approaches
- Inconsistent state management between localStorage and React context
- Authentication headers applied inconsistently
- Profile ID management is scattered across components

The new system provides:
- Centralized session management
- Consistent API client with auth headers
- Standardized React Query hooks
- Clear separation of concerns

## Migration Steps

### 1. Infrastructure Setup (Completed)

- [x] Create `session.ts` for standardized session management
- [x] Create centralized API client with auth interceptors
- [x] Update AuthContext to use the session management
- [x] Create specialized React Query hooks

### 2. Component Migration

For each component that uses the old authentication system:

1. Replace `useData` with specialized hooks:
   ```jsx
   // Before
   const { createDog } = useData();
   
   // After
   const createDogMutation = useCreateDog();
   ```

2. Update API calls:
   ```jsx
   // Before
   await createDog(data);
   
   // After
   await createDogMutation.mutateAsync(data);
   ```

3. Use the new `useAuth` hook instead of the old one:
   ```jsx
   // Before
   const { user } = useAuth();
   
   // After - same import, but uses the new context
   const { user, session, ensureProfile } = useAuth();
   ```

### 3. API Route Updates

Update all API routes to:
1. Check for standardized auth headers
2. Handle profile ID consistently
3. Ensure proper error handling and status codes

### 4. Authentication Flow Updates

1. Update login/logout to use the session management system
2. Ensure profile creation happens at the right time
3. Make sure all authenticated requests include the right headers

### 5. Testing Plan

1. Test login and session persistence
2. Test automatic profile creation
3. Test authenticated API requests
4. Test session expiration and refresh
5. Verify correct behavior across page refreshes

### 6. Deployment Strategy

1. Deploy infrastructure changes first
2. Implement login/logout updates
3. Migrate components one at a time, starting with simpler ones
4. Add thorough logging and monitoring
5. Have a rollback plan if issues arise

## Timeline

- **Week 1**: Infrastructure setup and initial component migrations
- **Week 2**: Complete component migrations and testing
- **Week 3**: Handle edge cases, optimize, and improve error handling
- **Week 4**: Deploy to production with careful monitoring

## Risks and Mitigation

1. **Session conflicts with old auth system**
   - Mitigation: Clear storage during migration

2. **React Query cache invalidation issues**
   - Mitigation: Add extra invalidation logic during transition

3. **Profile ID synchronization problems**
   - Mitigation: Add additional profile checks during the transition period

4. **Performance impact from additional auth checks**
   - Mitigation: Add caching and minimize redundant API calls 