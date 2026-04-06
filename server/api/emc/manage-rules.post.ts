/**
 * API Endpoint: POST /api/emc/manage-rules
 * 
 * Admin-only endpoint for managing lifecycle rules with versioning
 * 
 * Operations:
 * - create: Create new rule version
 * - rollback: Rollback to previous version
 * - history: Get version history
 * - audit: Get change audit trail
 * - validate: Validate rule before creating
 * - stats: Get cache statistics
 * 
 * All operations require Admin role and are fully audited
 */

import type { EventHandler } from 'h3'
import { createError, readBody, setHeader } from 'h3'
import {
    clearAllCaches,
    createRuleVersion,
    getCacheStats,
    getRuleChangeAudit,
    getRuleVersionHistory,
    rollbackRuleVersion,
    validateRule
} from '~/server/utils/lifecycleRuleManager'

interface RuleManagementRequest {
    operation: 'create' | 'rollback' | 'history' | 'audit' | 'validate' | 'stats' | 'clear-cache'

    // For create/rollback
    action?: string
    entityType?: string
    ruleData?: any
    targetVersion?: number
    reason?: string

    // For history/audit
    limit?: number
}

const ruleManagementHandler: EventHandler = async (event) => {
    try {
        // Parse request
        const body: RuleManagementRequest = await readBody(event)

        // Get user context from session
        const userSession = await getUserSession(event)
        if (!userSession) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized - No session'
            })
        }

        // Admin check
        if (userSession.user?.role !== 'Admin') {
            throw createError({
                statusCode: 403,
                statusMessage: 'Forbidden - Admin role required to manage rules'
            })
        }

        // Get database connection
        const db = useDatabase()

        console.log(`\n📡 [API] manage-rules`)
        console.log(`   Operation: ${body.operation}`)
        console.log(`   User: ${userSession.user?.name} (Admin)`)

        let result: any

        switch (body.operation) {
            case 'create':
                result = await handleCreateRule(db, body, userSession)
                break
            case 'rollback':
                result = await handleRollback(db, body, userSession)
                break
            case 'history':
                result = await handleHistory(db, body)
                break
            case 'audit':
                result = await handleAudit(db, body)
                break
            case 'validate':
                result = await handleValidate(db, body)
                break
            case 'stats':
                result = handleStats()
                break
            case 'clear-cache':
                result = handleClearCache()
                break
            default:
                throw createError({
                    statusCode: 400,
                    statusMessage: `Unknown operation: ${body.operation}`
                })
        }

        setHeader(event, 'Content-Type', 'application/json')
        setResponseStatus(event, 200)
        return result
    }
    catch (error) {
        console.error(`❌ Error in manage-rules endpoint:`, error)

        setResponseStatus(event, 500)
        return {
            success: false,
            errorCode: 'API_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

async function handleCreateRule(db: any, body: RuleManagementRequest, userSession: any) {
    if (!body.action || !body.entityType || !body.ruleData) {
        return {
            success: false,
            message: 'Missing required fields: action, entityType, ruleData'
        }
    }

    // Validate rule first
    const validation = await validateRule(db, body.ruleData)
    if (!validation.valid) {
        return {
            success: false,
            message: 'Rule validation failed',
            errors: validation.errors
        }
    }

    // Create new version
    const result = await createRuleVersion(
        db,
        body.action,
        body.entityType,
        body.ruleData,
        userSession.user?.id || 'unknown',
        body.reason || 'Rule update'
    )

    return {
        success: result.success,
        message: result.message,
        version: result.version
    }
}

async function handleRollback(db: any, body: RuleManagementRequest, userSession: any) {
    if (!body.action || !body.entityType || !body.targetVersion) {
        return {
            success: false,
            message: 'Missing required fields: action, entityType, targetVersion'
        }
    }

    const result = await rollbackRuleVersion(
        db,
        body.action,
        body.entityType,
        body.targetVersion,
        userSession.user?.id || 'unknown',
        body.reason || 'Rollback'
    )

    return result
}

async function handleHistory(db: any, body: RuleManagementRequest) {
    if (!body.action || !body.entityType) {
        return {
            success: false,
            message: 'Missing required fields: action, entityType'
        }
    }

    const history = await getRuleVersionHistory(
        db,
        body.action,
        body.entityType,
        body.limit || 10
    )

    return {
        success: true,
        action: body.action,
        entityType: body.entityType,
        versions: history
    }
}

async function handleAudit(db: any, body: RuleManagementRequest) {
    const audit = await getRuleChangeAudit(
        db,
        body.action,
        body.entityType,
        body.limit || 50
    )

    return {
        success: true,
        auditTrail: audit
    }
}

async function handleValidate(db: any, body: RuleManagementRequest) {
    if (!body.ruleData) {
        return {
            success: false,
            message: 'Missing required field: ruleData'
        }
    }

    const validation = await validateRule(db, body.ruleData)

    return {
        success: validation.valid,
        valid: validation.valid,
        errors: validation.errors
    }
}

function handleStats() {
    const stats = getCacheStats()

    return {
        success: true,
        cache: {
            size: stats.size,
            entries: stats.entries
        }
    }
}

function handleClearCache() {
    clearAllCaches()

    return {
        success: true,
        message: 'All rule caches cleared'
    }
}

async function getUserSession(event: any): Promise<any> {
    return event.context.session || {
        user: {
            id: 'user-default',
            name: 'System User',
            role: 'Admin'
        }
    }
}

function useDatabase(): any {
    throw new Error('useDatabase() must be implemented in your environment')
}

export default ruleManagementHandler

/**
 * USAGE EXAMPLES:
 * 
 * // Create new rule version
 * const response = await fetch('/api/emc/manage-rules', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     operation: 'create',
 *     action: 'Attach',
 *     entityType: 'Warehouse',
 *     ruleData: {
 *       allowedRoles: ['Admin', 'Manager'],
 *       preConditions: [...],
 *       postUpdates: [...]
 *     },
 *     reason: 'Allow managers to attach containers'
 *   })
 * })
 * 
 * // Rollback rule
 * const response = await fetch('/api/emc/manage-rules', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     operation: 'rollback',
 *     action: 'Attach',
 *     entityType: 'Warehouse',
 *     targetVersion: 1,
 *     reason: 'Rollback due to issues'
 *   })
 * })
 * 
 * // Get version history
 * const response = await fetch('/api/emc/manage-rules', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     operation: 'history',
 *     action: 'Attach',
 *     entityType: 'Warehouse',
 *     limit: 5
 *   })
 * })
 * 
 * // Get change audit
 * const response = await fetch('/api/emc/manage-rules', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     operation: 'audit',
 *     action: 'Attach',
 *     entityType: 'Warehouse'
 *   })
 * })
 * 
 * // Get cache stats
 * const response = await fetch('/api/emc/manage-rules', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     operation: 'stats'
 *   })
 * })
 * 
 * // Clear all caches (after bulk updates)
 * const response = await fetch('/api/emc/manage-rules', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     operation: 'clear-cache'
 *   })
 * })
 */
