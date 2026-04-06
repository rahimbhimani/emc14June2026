import { getServerSession } from '#auth'
import type { H3Event } from 'h3'
import { createError } from 'h3'

export async function setAuthOnlyRoute(event: H3Event, statusMessage: string = 'You must be signed in to access this API.') {
  const session = await getServerSession(event)

  if (!session) {
    throw createError({
      statusCode: 403,
      statusMessage,
    })
  }

  return session
}

/**
 * Get the current authenticated user from the event
 * @param event - H3Event from the API handler
 * @returns The user object or null if not authenticated
 */
export async function getUser(event: H3Event) {
  const session = await getServerSession(event)
  return session?.user || null
}

/**
 * Get the current user from the event (throws if not authenticated)
 * @param event - H3Event from the API handler
 * @param errorMessage - Custom error message if user is not authenticated
 * @returns The user object (guaranteed to exist)
 * @throws createError with 401 status if user is not authenticated
 */
export async function getUserFromEvent(event: H3Event, errorMessage: string = 'Unauthorized - User session required') {
  const session = await getServerSession(event)

  if (!session?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: errorMessage,
    })
  }

  return session.user
}
