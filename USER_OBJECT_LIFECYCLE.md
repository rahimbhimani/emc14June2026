# User Object Lifecycle Post-Login

## Overview
This document explains where and how the user object is set after login, and how to access organization details (name, icon, logo) at different levels of your application.

## Login Flow

### 1. Login API (`/api/login/`)
**File:** `server/api/login.post.ts`

```typescript
// User is fetched from fake-db
const dbUser = db.users.find(u => u.email === email && u.password === password)

// Organization details are fetched from MongoDB
organizationDetails = await emcOrganization.findOne({
  organizationId: dbUser.organizationId,
})

// Organization data is attached to user object
Object.assign(user, {
  organizationName: organization.name,
  organizationIcon: organization.icon,
  organizationLogo: organization.logo,
  organizationDetails: organization,  // Full object with all fields
})

// User object is returned with all fields:
return { user }
```

**User object structure at this point:**
```javascript
{
  id: 1,
  email: 'admin@demo.com',
  fullName: 'Jack Smith',
  organizationId: 12313,
  organizationCode: 'ORG000001',
  organizationName: 'Emirates Cargo Management',
  organizationIcon: 'mdi:building-outline',
  organizationLogo: 'https://via.placeholder.com/100?text=ECM',
  organizationDetails: {
    id: 12313,
    organizationId: 12313,
    code: 'ORG000001',
    name: 'Emirates Cargo Management',
    icon: 'mdi:building-outline',
    logo: 'https://via.placeholder.com/100?text=ECM',
    description: '...',
    email: '...',
    // ... other fields
  }
}
```

### 2. NextAuth JWT Callback
**File:** `server/api/auth/[...].ts`

```typescript
jwt: async ({ token, user }) => {
  if (user) {
    // All these fields are stored in the JWT token
    token.organizationId = user.organizationId
    token.organizationCode = user.organizationCode
    token.organizationName = user.organizationName
    token.organizationIcon = user.organizationIcon
    token.organizationLogo = user.organizationLogo
    token.organizationDetails = user.organizationDetails
  }
  return token
}
```

### 3. NextAuth Session Callback
**File:** `server/api/auth/[...].ts`

```typescript
async session({ session, token }) {
  if (session.user) {
    // All token fields are copied to session.user
    session.user.organizationId = token.organizationId
    session.user.organizationCode = token.organizationCode
    session.user.organizationName = token.organizationName
    session.user.organizationIcon = token.organizationIcon
    session.user.organizationLogo = token.organizationLogo
    session.user.organizationDetails = token.organizationDetails
  }
  return session
}
```

### 4. Frontend (Browser)
**Files:** `pages/login.vue`, `pages/loginOriginal.vue`, `pages/loginRahim.vue`

```typescript
// After successful login
const { user } = sessionData.value!

// User object has organization details
useCookie('userData').value = user
useCookie('organizationId').value = user.organizationId
useCookie('organizationName').value = user.organizationName
useCookie('organizationIcon').value = user.organizationIcon
useCookie('organizationLogo').value = user.organizationLogo

// User is also available through session
ability.update(user.abilityRules ?? [])
navigateTo('/', { replace: true })
```

## Accessing User Object Post-Login

### Method 1: From NextAuth Session (Recommended)
```vue
<script setup>
const { data: sessionData } = useAuth()

// Access user from session
const user = computed(() => sessionData.value?.user)
</script>

<template>
  <div>
    <p>{{ user?.organizationName }}</p>
    <img :src="user?.organizationLogo" />
    <i :class="user?.organizationIcon"></i>
  </div>
</template>
```

### Method 2: Using useOrgDetails Composable
```vue
<script setup>
const { organization } = useOrgDetails()
// organization is reactive computed from session or cookies
</script>

<template>
  <div>
    <p>{{ organization.value?.name }}</p>
    <img :src="organization.value?.logo" />
  </div>
</template>
```

### Method 3: From Cookies
```typescript
const orgName = useCookie('organizationName').value
const orgIcon = useCookie('organizationIcon').value
const orgLogo = useCookie('organizationLogo').value
```

### Method 4: Full Organization Details
```typescript
const { data: sessionData } = useAuth()
const fullOrganization = sessionData.value?.user?.organizationDetails
```

## Where Icon and Logo Are Set

### 1. Database Level
**Model:** `server/models/emcOrganization.ts`
- `icon`: Stored as string (e.g., 'mdi:building-outline')
- `logo`: Stored as string URL (e.g., 'https://via.placeholder.com/100?text=ECM')

### 2. Login API Level
**File:** `server/api/login.post.ts`
- Fetches from `emcOrganization` collection
- Attaches to user object as:
  - `organizationIcon`: organization.icon
  - `organizationLogo`: organization.logo
  - Full details in `organizationDetails` object

### 3. NextAuth Token Level
**File:** `server/api/auth/[...].ts` (JWT callback)
- `token.organizationIcon = user.organizationIcon`
- `token.organizationLogo = user.organizationLogo`
- `token.organizationDetails = user.organizationDetails`

### 4. Session Level
**File:** `server/api/auth/[...].ts` (Session callback)
- `session.user.organizationIcon = token.organizationIcon`
- `session.user.organizationLogo = token.organizationLogo`
- `session.user.organizationDetails = token.organizationDetails`

### 5. Frontend Level
**Files:** `pages/login.vue`, etc.
- Stored in cookies
- Available through `useAuth()` session
- Available through `useOrgDetails()` composable

## Debugging User Object

### 1. Check Login API Response
```bash
# Send login request
curl -X POST http://localhost:3000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin"}'

# Response should include:
{
  "user": {
    "organizationName": "Emirates Cargo Management",
    "organizationIcon": "mdi:building-outline",
    "organizationLogo": "https://via.placeholder.com/100?text=ECM",
    "organizationDetails": { ... }
  }
}
```

### 2. Check Server Logs
When logging in, you should see:
```
organizationDetails from DB: { organizationId: 12313, name: 'Emirates Cargo Management', ... }
User object after org attachment: { 
  organizationName: 'Emirates Cargo Management',
  organizationIcon: 'mdi:building-outline',
  organizationLogo: 'https://...'
}
```

### 3. Check Browser Session
```typescript
const { data: sessionData } = useAuth()
console.log(sessionData.value?.user)
// Should show all organization fields
```

### 4. Check Browser Cookies
Open DevTools → Application → Cookies → localhost:3000
- `organizationId`: 12313
- `organizationName`: Emirates Cargo Management
- `organizationIcon`: mdi:building-outline
- `organizationLogo`: https://...

## Common Issues and Solutions

### Issue: organizationIcon/Logo showing as null
**Solution:**
1. Check if organization data exists in DB: `/api/seed/check-organizations`
2. Seed if needed: `POST /api/seed/organizations`
3. Check login API logs for "organizationDetails from DB"
4. Verify data is not null using the endpoint above

### Issue: Session not showing organization fields
**Solution:**
1. Clear cookies in browser
2. Logout and login again
3. Check NextAuth callbacks are properly configured
4. Verify JWT callback is storing all fields
5. Verify session callback is copying from token

### Issue: User object different in different components
**Solution:**
- Session is asynchronous
- Use `computed()` or `watch()` to track changes
- Session may not be immediately available after redirect
- Use cookies as fallback if session not ready

## Type Definitions

**File:** `next-auth.d.ts`

```typescript
interface UserAdditionalData {
  organizationId?: number
  organizationCode?: string
  organizationName?: string
  organizationIcon?: string
  organizationLogo?: string
  organizationDetails?: {
    id?: number
    organizationId?: number
    code?: string
    name?: string
    icon?: string | null
    logo?: string | null
    description?: string | null
    // ... other fields
  }
}
```

## Summary

1. **Login API** (`/api/login/`) fetches organization from DB and attaches to user
2. **JWT Callback** stores all organization fields in token
3. **Session Callback** copies token fields to session.user
4. **Frontend** accesses via `useAuth()` session or cookies
5. **Organization Details** (name, icon, logo) are available at all levels

The user object should contain all organization information throughout the entire application after login.
