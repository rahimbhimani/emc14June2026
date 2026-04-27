# Organization Details on User Login

## Overview
This feature stores organization details (Name, Icon, Logo) from the `emcOrganization` collection when a user logs in. The organization information is then made available throughout the application via session data, cookies, and composables.

## Architecture

### 1. Database Model
**File:** `server/models/emcOrganization.ts`

Defines the `emcOrganization` collection with fields:
- `organizationId` (Number, unique) - Links to user's organization
- `name` (String, required) - Organization name
- `code` (String) - Organization code
- `icon` (String) - Icon URL/reference
- `logo` (String) - Logo URL/reference
- `description` (String) - Organization description
- Additional fields: email, phone, address, city, country, isActive

### 2. Login Flow
When a user logs in via `/api/login/`:
1. User credentials are validated
2. Organization details are fetched from `emcOrganization` collection
3. Organization data is attached to user object in response
4. NextAuth passes data through JWT and session callbacks
5. Frontend stores organization details in cookies

### 3. Data Flow

```
User Login
    ↓
/api/login.post.ts (validate user)
    ↓
Fetch emcOrganization by organizationId
    ↓
Attach org details to user object
    ↓
NextAuth JWT callback (store in token)
    ↓
NextAuth Session callback (store in session)
    ↓
Frontend stores in cookies
    ↓
Available via useAuth() or useOrgDetails()
```

## Implementation Details

### Files Modified/Created

1. **server/models/emcOrganization.ts** (NEW)
   - Mongoose schema for organization collection
   - Interface: `IemcOrganization`

2. **server/api/login.post.ts** (MODIFIED)
   - Added organization details fetching
   - Attaches org data to user object before response

3. **server/api/auth/[...].ts** (MODIFIED)
   - JWT callback: stores organization fields in token
   - Session callback: passes token fields to session.user

4. **next-auth.d.ts** (MODIFIED)
   - Updated `UserAdditionalData` interface
   - Added fields: organizationId, organizationCode, organizationName, organizationIcon, organizationLogo

5. **pages/login.vue, loginOriginal.vue, loginRahim.vue** (MODIFIED)
   - Store organization details in cookies after successful login

6. **composables/useOrganization.ts** (NEW)
   - Access organization data from cookies
   - Methods: clearOrganization()

7. **composables/useOrgDetails.ts** (NEW)
   - Access organization from session or cookies
   - Reactive computed property

8. **server/api/organization/get-organization.get.ts** (NEW)
   - Protected endpoint to fetch organization details
   - Returns organization by user's organizationId

9. **server/utils/seedOrganization.ts** (NEW)
   - Seed function for test organization data

## Usage Examples

### In Components

```typescript
<script setup>
// Option 1: Using useOrgDetails (from session first, fallback to cookie)
const { organization } = useOrgDetails()

// Option 2: Using useOrganization (from cookie)
const { organizationName, organizationIcon, organizationLogo } = useOrganization()
</script>

<template>
  <div>
    <img :src="organization.logo" />
    <h1>{{ organization.name }}</h1>
  </div>
</template>
```

### In Composables
```typescript
export function useMyComposable() {
  const { organization } = useOrgDetails()
  
  const displayOrgName = computed(() => organization.value?.name)
  
  return { displayOrgName }
}
```

### Direct Session Access
```typescript
const { data: sessionData } = useAuth()
const orgName = sessionData.value?.user?.organizationName
const orgIcon = sessionData.value?.user?.organizationIcon
```

### API Call
```typescript
// Fetch fresh organization data
const { organization } = await $fetch('/api/organization/get-organization')
```

## Database Seeding

Run the seed function to populate test data:

```typescript
import { seedOrganizationData } from '~/server/utils/seedOrganization'

await seedOrganizationData()
```

This creates organizations for:
- Organization ID 12313: Emirates Cargo Management
- Organization ID 12314: Global Logistics Inc
- Organization ID 12315: Asian Trade Partners

## NextAuth Types Extension

The user session now includes:
```typescript
session.user = {
  // ... existing fields
  organizationId: number
  organizationCode: string
  organizationName: string
  organizationIcon: string
  organizationLogo: string
}
```

## Cookie Storage

Organization details are stored in these cookies:
- `organizationId`
- `organizationName`
- `organizationIcon`
- `organizationLogo`

These allow access to org data even when session is not available.

## Error Handling

- If organization not found: Returns user data without org details (graceful fallback)
- Missing organizationId on user: Org details remain null
- Database errors: Logged to console, application continues functioning

## Security Considerations

1. Organization data is fetched on every login (fresh data)
2. Protected API endpoint requires valid session
3. User can only access their own organization data
4. Data passed through secure JWT tokens

## Testing

1. Seed organization data:
```bash
npm run seed:org
```

2. Login with test credentials:
- Email: admin@demo.com
- Password: admin
- Organization: Emirates Cargo Management (12313)

3. Verify in browser:
- Check cookies: `organizationName`, `organizationIcon`, etc.
- Check session: `useAuth()` should have org details
- Check console: Organization data logged on login

## Future Enhancements

1. Cache organization data with TTL
2. Update organization details without re-login
3. Multi-organization support
4. Organization switching feature
5. Organization settings panel
