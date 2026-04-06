/**
 * API Endpoint: POST /api/emc/lifecycle-action
 * 
 * Wraps the lifecycle engine and handles HTTP request/response
 * 
 * Maps: config.engineAction → lifecycleRules.action
 * 
 * Request body:
 * {
 *   entityId: string,           // Container ID
 *   action: string,             // From config (e.g., "Attach")
 *   parentId?: string,          // Parent container ID
 *   childrenIds?: string[],     // Child container IDs
 *   override?: boolean,         // Admin override
 *   reason?: string             // Free-text reason
 * }
 */

import type { EventHandler } from 'h3'
import { createError, readBody, setHeader } from 'h3'

interface LifecycleActionRequest {
  entityId: string
  action: string
  parentId?: string
  childrenIds?: string[]
  override?: boolean
  reason?: string
}

const lifecycleActionHandler: EventHandler = async (event) => {
  try {
    // Parse request
    const body: LifecycleActionRequest = await readBody(event)

    // Get user context from session
    const userSession = await getUserSession(event)
    if (!userSession) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - No session'
      })
    }

    // Get database connection
    const db = useDatabase()
    const organizationId = userSession.user?.organizationId

    // Validate required fields
    if (!body.entityId || !body.action) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: entityId, action'
      })
    }

    console.log(`\n📡 [API] lifecycle-action`)
    console.log(`   Entity: ${body.entityId}`)
    console.log(`   Action: ${body.action}`)
    console.log(`   User: ${userSession.user?.name} (${userSession.user?.role})`)

    // ⭐ Execute lifecycle engine
    const result = await emcExecuteLifecycleAction({
      entityId: body.entityId,
      action: body.action,
      userId: userSession.user?.id || 'unknown',
      userName: userSession.user?.name || 'Unknown',
      userRole: userSession.user?.role || 'User',
      userCode: userSession.user?.code || '',

      parentId: body.parentId,
      childrenIds: body.childrenIds,

      reason: body.reason,
      override: body.override,

      organizationId,

      db
    })

    // Set response headers
    setHeader(event, 'Content-Type', 'application/json')

    // Return result
    if (result.success) {
      setResponseStatus(event, 200)
      return {
        success: true,
        data: {
          action: result.action,
          entityId: result.entityId,
          entityType: result.entityType,
          message: result.message,

          previousState: result.previousState,
          newState: result.newState,
          changedDimensions: result.changedDimensions,

          cascade: result.cascade,
          auditId: result.auditId,
          transactionId: result.transactionId
        }
      }
    } else {
      setResponseStatus(event, 400)
      return {
        success: false,
        errorCode: result.errorCode,
        message: result.message,
        auditId: result.auditId,
        transactionId: result.transactionId
      }
    }
  }
  catch (error) {
    console.error(`❌ Error in lifecycle-action endpoint:`, error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      setResponseStatus(event, 401)
      return {
        success: false,
        errorCode: 'UNAUTHORIZED',
        message: error.message
      }
    }

    setResponseStatus(event, 500)
    return {
      success: false,
      errorCode: 'API_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export default lifecycleActionHandler

/**
 * Helper: Get user session
 */
async function getUserSession(event: any): Promise<any> {
  // Implementation depends on your auth system
  // Example: NextAuth, middleware, headers, etc.

  // For this example, we'll assume session is in context
  return event.context.session || {
    user: {
      id: 'user-default',
      name: 'System User',
      code: 'SYS',
      role: 'Admin',
      organizationId: 12313
    }
  }
}

/**
 * Helper: Get database connection
 */
function useDatabase(): any {
  // Return your MongoDB database connection
  // Implementation depends on your setup
  // Example: return mongoClient.db('emc-db')

  // Placeholder - implement per your project structure
  throw new Error('useDatabase() must be implemented in your environment')
}

/**
 * USAGE EXAMPLE:
 * 
 * const response = await fetch('/api/emc/lifecycle-action', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     entityId: 'ware-001',
 *     action: 'Attach',
 *     parentId: 'ware-root',
 *     reason: 'Linking warehouse to parent'
 *   })
 * })
 * 
 * const result = await response.json()
 * 
 * if (result.success) {
 *   console.log('State updated:', result.data.changedDimensions)
 * } else {
 *   console.error('Failed:', result.errorCode, result.message)
 * }
 */
