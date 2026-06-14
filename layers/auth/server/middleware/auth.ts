import { createError, defineEventHandler, getHeaders, getRequestURL, parseCookies } from 'h3'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATTERNS: RegExp[] = [
  /\/api\/auth(\/|$)/,               // All NextAuth routes (/api/auth/*)
  /\/api\/login(\/|$)/,              // Credential login endpoint
  /\/api\/users\/by-keycloak-id\//,  // Called server-to-server during JWT callback
  /\/api\/emc\/seed-users(\/|$)/,    // One-time seed endpoint (no session exists yet)
  /\/api\/emc\/onOrganizationOnboarding(\/|$)/,
]

export default defineEventHandler(async event => {
  const pathname = getRequestURL(event).pathname

  // Only guard /api/ routes — SSR page requests pass through untouched
  if (!pathname.includes('/api/'))
    return

  if (PUBLIC_PATTERNS.some(p => p.test(pathname)))
    return

  const cookies = parseCookies(event)

  // Use getToken directly — avoids the preparedAuthjsHandler initialization
  // chain that getServerSession depends on, which can silently return null
  // during dev server restarts or cold starts.
  const token = await getToken({
    req: { cookies, headers: getHeaders(event) } as any,
    secret: process.env.AUTH_SECRET || 'secret',
    secureCookie: (process.env.AUTH_ORIGIN || '').startsWith('https://'),
  }).catch(() => null)

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: { message: 'A valid session is required to access this resource.' },
    })
  }

  // Expose token fields via event context so handlers don't need to re-verify
  event.context.token = token
  event.context.user = {
    id: (token.id ?? token.sub) as string,
    name: token.fullName as string,
    fullName: token.fullName as string,
    username: token.username as string,
    avatar: token.avatar as string,
    role: token.role as string,
    abilityRules: token.abilityRules as any[],
    organizationId: token.organizationId as number,
    organizationCode: token.organizationCode as string,
    organizationName: token.organizationName as string,
    organizationIcon: token.organizationIcon as string,
    organizationLogo: token.organizationLogo as string,
    organizationDetails: token.organizationDetails as any,
  }
  event.context.session = { user: event.context.user }
})
