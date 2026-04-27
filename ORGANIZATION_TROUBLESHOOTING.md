# Organization Population Troubleshooting

## Issue: Organization Details Not Populated on Login

If organization data (name, icon, logo) is not appearing after login, follow these steps to diagnose and fix the issue.

### Step 1: Verify Organization Data Exists

**Option A: Check via API**

```bash
# Check if organizations are seeded
curl http://localhost:3000/api/seed/check-organizations
```

Expected response:
```json
{
  "success": true,
  "totalCount": 3,
  "sample": [
    {
      "_id": "...",
      "organizationId": 12313,
      "name": "Emirates Cargo Management",
      "icon": "mdi:building-outline",
      "logo": "https://via.placeholder.com/100?text=ECM"
    }
  ]
}
```

**Option B: Check MongoDB directly**

```javascript
// In MongoDB shell
use emc_db  // or your database name
db.emcOrganization.find().pretty()
```

### Step 2: Seed Organization Data

If no organizations found, seed the data:

**Option A: Via API Call**

```bash
curl -X POST http://localhost:3000/api/seed/organizations
```

Expected response:
```json
{
  "success": true,
  "message": "Organization data seeded successfully"
}
```

**Option B: Manually via MongoDB**

```javascript
db.emcOrganization.insertMany([
  {
    organizationId: 12313,
    name: 'Emirates Cargo Management',
    code: 'ORG000001',
    icon: 'mdi:building-outline',
    logo: 'https://via.placeholder.com/100?text=ECM',
    description: 'Emirates Cargo Management - Air Cargo Solutions',
    isActive: true
  },
  {
    organizationId: 12314,
    name: 'Global Logistics Inc',
    code: 'ORG000002',
    icon: 'mdi:truck-outline',
    logo: 'https://via.placeholder.com/100?text=GLI',
    description: 'Global Logistics Inc - International Shipping',
    isActive: true
  },
  {
    organizationId: 12315,
    name: 'Asian Trade Partners',
    code: 'ORG000003',
    icon: 'mdi:factory',
    logo: 'https://via.placeholder.com/100?text=ATP',
    description: 'Asian Trade Partners - Regional Distribution',
    isActive: true
  }
])
```

### Step 3: Verify User Has Organization ID

Check if the user in the fake database has an organizationId:

```javascript
// File: server/fake-db/auth/index.ts
// User must have organizationId field:

{
  id: 1,
  email: 'admin@demo.com',
  password: 'admin',
  organizationId: 12313,  // <- This field MUST exist
  organizationCode: 'ORG000001',
  // ... other fields
}
```

If missing, add it manually.

### Step 4: Test Login Flow

1. **Clear browser cookies:**
   - Open DevTools (F12)
   - Go to Application → Cookies
   - Delete all cookies for localhost

2. **Check server logs:**
   - Watch terminal running `npm run dev`
   - Look for messages like:
     - `"Fetching organization for ID: 12313"`
     - `"Organization found: {...}"`
     - `"Organization details attached to user"`

3. **Login with test credentials:**
   ```
   Email: admin@demo.com
   Password: admin
   ```

4. **Verify in browser:**
   - Open DevTools → Application → Cookies
   - Check for cookies:
     - `organizationId`: 12313
     - `organizationName`: Emirates Cargo Management
     - `organizationIcon`: mdi:building-outline
     - `organizationLogo`: URL

### Step 5: Test Organization Retrieval

In any Vue component, verify access to organization:

```vue
<script setup>
const { organization } = useOrgDetails()
</script>

<template>
  <div>
    <pre>{{ JSON.stringify(organization, null, 2) }}</pre>
  </div>
</template>
```

Expected output:
```json
{
  "id": 12313,
  "name": "Emirates Cargo Management",
  "icon": "mdi:building-outline",
  "logo": "https://via.placeholder.com/100?text=ECM",
  "code": "ORG000001"
}
```

## Common Issues & Solutions

### Issue 1: MongoDB Connection Failed

**Symptom:** Console shows `ECONNREFUSED` or connection timeout

**Solution:**
```bash
# Verify MongoDB is running
mongosh

# Or check connection string in .env
MONGODB_URI=mongodb://localhost:27017/emc_db
```

### Issue 2: Organization Collection Doesn't Exist

**Symptom:** API returns `totalCount: 0`

**Solution:**
- Run seed API endpoint: `POST /api/seed/organizations`
- Or manually insert data via MongoDB

### Issue 3: User organizationId is null/undefined

**Symptom:** Organization fetch is skipped in login

**Solution:**
- Edit user in `server/fake-db/auth/index.ts`
- Add `organizationId: 12313` to user object
- Save file and restart dev server

### Issue 4: Session Not Carrying Organization Data

**Symptom:** Session exists but `organizationName` is undefined

**Solution:**
- Clear cookies in browser
- Logout and login again
- Check NextAuth callbacks in `server/api/auth/[...].ts`
- Verify JWT and session callbacks include org fields

### Issue 5: Cookies Not Set

**Symptom:** Organization data shows in session but not in cookies

**Solution:**
- Check login page code
- Verify `useCookie()` calls are present in login function
- Check browser cookie settings (not private browsing)
- Verify cookies aren't being cleared after login

## Debug Checklist

- [ ] MongoDB connection verified
- [ ] Organization data seeded (check via `/api/seed/check-organizations`)
- [ ] User has `organizationId` field
- [ ] Login API logs show organization fetch
- [ ] Cookies set after login (check DevTools)
- [ ] Session includes organization fields (check useAuth())
- [ ] Component can access via `useOrgDetails()`

## Manual Fix Steps

If all else fails, manually fix the issue:

```typescript
// 1. In your component or page
import { seedOrganizationData } from '~/server/utils/seedOrganization'

// 2. On app load, manually seed:
onMounted(async () => {
  try {
    await seedOrganizationData()
    console.log('Organizations seeded')
  } catch (err) {
    console.error('Seed failed:', err)
  }
})

// 3. Then login
```

## Performance Notes

- Organization data is fetched on every login (not cached)
- Seed function runs automatically on app startup
- Seed only takes ~50ms after first run (due to deleteMany)
- Organization queries are indexed by organizationId

## Next Steps

1. Check logs via step 4 above
2. Run diagnostic endpoint: `/api/seed/check-organizations`
3. Seed data if needed: `POST /api/seed/organizations`
4. Clear cookies and login again
5. Verify in browser DevTools
