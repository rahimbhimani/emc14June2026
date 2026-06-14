import { getToken } from 'next-auth/jwt'
import type { H3Event } from 'h3'
import { createError, getHeaders, parseCookies } from 'h3'

async function resolveToken(event: H3Event) {
  // Re-use token already verified by the auth middleware when available.
  if (event.context.token)
    return event.context.token

  return getToken({
    req: { cookies: parseCookies(event), headers: getHeaders(event) } as any,
    secret: process.env.AUTH_SECRET || 'secret',
    secureCookie: (process.env.AUTH_ORIGIN || '').startsWith('https://'),
  }).catch(() => null)
}

export async function setAuthOnlyRoute(event: H3Event, statusMessage: string = 'You must be signed in to access this API.') {
  const token = await resolveToken(event)

  if (!token) {
    throw createError({
      statusCode: 403,
      statusMessage,
    })
  }

  return token
}

export async function getUser(event: H3Event) {
  const token = await resolveToken(event)
  return token ? buildUser(token) : null
}

export async function getUserFromEvent(event: H3Event, errorMessage: string = 'Unauthorized - User session required') {
  const token = await resolveToken(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: errorMessage,
    })
  }

  return buildUser(token)
}

function buildUser(token: Record<string, unknown>) {
  return {
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
}
