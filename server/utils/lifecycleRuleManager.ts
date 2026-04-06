/**
 * Lifecycle Rules Management & Versioning
 * 
 * Utilities for managing lifecycle rules with version control,
 * cache invalidation, and audit trail.
 * 
 * Use this when:
 * - Adding/updating rules in production
 * - Rolling back to previous rule versions
 * - Auditing rule changes
 * - Invalidating caches after updates
 */

import type { ObjectId } from 'mongodb'
import { getRuleCacheStats, invalidateRuleCache } from './emcLifeCycleEngine'

export interface LifecycleRuleVersion {
  action: string
  entityType: string
  version: number

  allowedRoles: string[]
  preConditions: any[]
  crossEntityConditions: any[]
  childConditions: any[]
  postUpdates: any[]

  cascade: boolean
  isActive: boolean
  priority: number
  description: string

  createdAt: Date
  createdBy: string
  createdReason: string
}

export interface RuleChangeAudit {
  _id?: ObjectId
  action: string
  entityType: string

  previousVersion: number
  newVersion: number

  previousState: any
  newState: any

  changedBy: string
  changedReason: string
  changedAt: Date

  rollbackable: boolean
}

/**
 * Create a new rule version
 * 
 * Instead of updating a rule in place, create a new version.
 * This allows rollback if the rule causes issues.
 */
export async function createRuleVersion(
  db: any,
  action: string,
  entityType: string,
  ruleData: any,
  userId: string,
  reason: string
): Promise<{ success: boolean; version: number; message: string }> {
  try {
    console.log(`\n📝 [RuleManager] Creating new rule version`)
    console.log(`   Action: ${action}, Type: ${entityType}`)
    console.log(`   Reason: ${reason}`)

    // Get current version
    const currentRule = await db.collection('lifecycleRules').findOne({
      action,
      entityType,
      isActive: true
    })

    const nextVersion = (currentRule?.version || 0) + 1

    // Create new version document
    const newRuleVersion: LifecycleRuleVersion = {
      action,
      entityType,
      version: nextVersion,

      allowedRoles: ruleData.allowedRoles || (currentRule?.allowedRoles || []),
      preConditions: ruleData.preConditions || (currentRule?.preConditions || []),
      crossEntityConditions: ruleData.crossEntityConditions || (currentRule?.crossEntityConditions || []),
      childConditions: ruleData.childConditions || (currentRule?.childConditions || []),
      postUpdates: ruleData.postUpdates || (currentRule?.postUpdates || []),

      cascade: ruleData.cascade !== undefined ? ruleData.cascade : (currentRule?.cascade || false),
      isActive: true,
      priority: ruleData.priority || (currentRule?.priority || 10),
      description: ruleData.description || (currentRule?.description || ''),

      createdAt: new Date(),
      createdBy: userId,
      createdReason: reason
    }

    // Insert new version
    const result = await db.collection('lifecycleRules').insertOne(newRuleVersion)

    // Mark old version as inactive (keep for history)
    if (currentRule) {
      await db.collection('lifecycleRules').updateOne(
        { _id: currentRule._id },
        { $set: { isActive: false } }
      )
      console.log(`   ✅ Previous version ${currentRule.version} marked inactive`)
    }

    // Invalidate cache for this rule
    invalidateRuleCache(action, entityType)
    console.log(`   ✅ Cache invalidated for: ${action}/${entityType}`)

    // Audit the change
    await auditRuleChange(db, action, entityType, currentRule?.version || 0, nextVersion, currentRule, newRuleVersion, userId, reason)
    console.log(`   ✅ Change audited`)

    console.log(`✅ Rule version ${nextVersion} created successfully`)

    return {
      success: true,
      version: nextVersion,
      message: `Rule version ${nextVersion} created for ${action}/${entityType}`
    }
  }
  catch (error) {
    console.error(`❌ Error creating rule version:`, error)
    return {
      success: false,
      version: 0,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Rollback a rule to a previous version
 */
export async function rollbackRuleVersion(
  db: any,
  action: string,
  entityType: string,
  targetVersion: number,
  userId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`\n⏮️  [RuleManager] Rolling back rule to version ${targetVersion}`)
    console.log(`   Action: ${action}, Type: ${entityType}`)
    console.log(`   Reason: ${reason}`)

    // Find target version
    const targetRule = await db.collection('lifecycleRules').findOne({
      action,
      entityType,
      version: targetVersion
    })

    if (!targetRule) {
      return {
        success: false,
        message: `Version ${targetVersion} not found for ${action}/${entityType}`
      }
    }

    // Get current version
    const currentRule = await db.collection('lifecycleRules').findOne({
      action,
      entityType,
      isActive: true
    })

    // Create rollback version (increment from current)
    const rollbackVersion = (currentRule?.version || 0) + 1

    const rollbackRuleVersion: LifecycleRuleVersion = {
      action,
      entityType,
      version: rollbackVersion,

      allowedRoles: targetRule.allowedRoles,
      preConditions: targetRule.preConditions,
      crossEntityConditions: targetRule.crossEntityConditions,
      childConditions: targetRule.childConditions,
      postUpdates: targetRule.postUpdates,

      cascade: targetRule.cascade,
      isActive: true,
      priority: targetRule.priority,
      description: `[ROLLBACK from v${currentRule.version} to v${targetVersion}] ${targetRule.description}`,

      createdAt: new Date(),
      createdBy: userId,
      createdReason: reason
    }

    // Insert rollback version
    const result = await db.collection('lifecycleRules').insertOne(rollbackRuleVersion)

    // Mark current version as inactive
    if (currentRule) {
      await db.collection('lifecycleRules').updateOne(
        { _id: currentRule._id },
        { $set: { isActive: false } }
      )
    }

    // Invalidate cache
    invalidateRuleCache(action, entityType)
    console.log(`   ✅ Cache invalidated`)

    // Audit the rollback
    await auditRuleChange(db, action, entityType, currentRule?.version || 0, rollbackVersion, currentRule, rollbackRuleVersion, userId, reason)

    console.log(`✅ Rule rolled back to version ${targetVersion} (new version: ${rollbackVersion})`)

    return {
      success: true,
      message: `Rule rolled back from v${currentRule?.version || 0} to v${targetVersion} (created v${rollbackVersion})`
    }
  }
  catch (error) {
    console.error(`❌ Error rolling back rule:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get rule version history
 */
export async function getRuleVersionHistory(
  db: any,
  action: string,
  entityType: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const history = await db.collection('lifecycleRules')
      .find({
        action,
        entityType
      })
      .sort({ version: -1 })
      .limit(limit)
      .toArray()

    return history
  }
  catch (error) {
    console.error(`❌ Error fetching rule history:`, error)
    return []
  }
}

/**
 * Internal: Audit rule changes
 */
async function auditRuleChange(
  db: any,
  action: string,
  entityType: string,
  previousVersion: number,
  newVersion: number,
  previousState: any,
  newState: any,
  userId: string,
  reason: string
): Promise<void> {
  try {
    const audit: RuleChangeAudit = {
      action,
      entityType,
      previousVersion,
      newVersion,
      previousState: previousState || {},
      newState,
      changedBy: userId,
      changedReason: reason,
      changedAt: new Date(),
      rollbackable: true
    }

    await db.collection('ruleChangeAudit').insertOne(audit)
  }
  catch (error) {
    console.warn(`⚠️  Failed to audit rule change:`, error)
    // Don't fail the operation if audit fails
  }
}

/**
 * Get all rule changes (audit trail for rules)
 */
export async function getRuleChangeAudit(
  db: any,
  action?: string,
  entityType?: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const query: any = {}
    if (action) query.action = action
    if (entityType) query.entityType = entityType

    const audit = await db.collection('ruleChangeAudit')
      .find(query)
      .sort({ changedAt: -1 })
      .limit(limit)
      .toArray()

    return audit
  }
  catch (error) {
    console.error(`❌ Error fetching rule audit:`, error)
    return []
  }
}

/**
 * Validate a rule before creating new version
 */
export async function validateRule(
  db: any,
  ruleData: any
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  // Check required fields
  if (!ruleData.action) errors.push('Missing required field: action')
  if (!ruleData.entityType) errors.push('Missing required field: entityType')
  if (!Array.isArray(ruleData.allowedRoles)) errors.push('allowedRoles must be array')
  if (!Array.isArray(ruleData.postUpdates) || ruleData.postUpdates.length === 0) {
    errors.push('postUpdates must be non-empty array')
  }

  // Validate postUpdates
  for (const update of ruleData.postUpdates || []) {
    if (!['SELF', 'PARENT', 'CHILDREN', 'ALL_DESCENDANTS'].includes(update.target)) {
      errors.push(`Invalid postUpdate.target: ${update.target}`)
    }
    if (!update.dimension || !update.value) {
      errors.push(`postUpdate missing dimension or value`)
    }

    // Check if state exists in lifecycleStates
    const stateExists = await db.collection('lifecycleStates').findOne({
      dimension: update.dimension,
      code: update.value,
      isActive: true
    })
    if (!stateExists) {
      errors.push(`State not found: ${update.dimension}=${update.value}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Export current rule as JSON (for version control)
 */
export async function exportRuleAsJson(
  db: any,
  action: string,
  entityType: string
): Promise<any> {
  const rule = await db.collection('lifecycleRules').findOne({
    action,
    entityType,
    isActive: true
  })

  if (!rule) {
    return null
  }

  // Remove MongoDB metadata
  const { _id, ...cleanRule } = rule
  return cleanRule
}

/**
 * Get cache performance stats
 */
export function getCacheStats() {
  return getRuleCacheStats()
}

/**
 * Clear all caches (use after bulk rule updates)
 */
export function clearAllCaches() {
  invalidateRuleCache()
  console.log(`🗑️  All rule caches cleared`)
}

/**
 * Usage Examples:
 * 
 * // Create a new rule version
 * await createRuleVersion(db, 'Attach', 'Warehouse', {
 *   allowedRoles: ['Admin', 'Manager'],
 *   preConditions: [...],
 *   postUpdates: [...]
 * }, 'user-123', 'Updated to allow managers')
 * 
 * // Rollback if something goes wrong
 * await rollbackRuleVersion(db, 'Attach', 'Warehouse', 1, 'user-123', 'Rollback due to issue')
 * 
 * // Check history
 * const history = await getRuleVersionHistory(db, 'Attach', 'Warehouse')
 * console.log(history)
 * 
 * // Check cache status
 * console.log(getCacheStats())
 */

export default {
  createRuleVersion,
  rollbackRuleVersion,
  getRuleVersionHistory,
  getRuleChangeAudit,
  validateRule,
  exportRuleAsJson,
  getCacheStats,
  clearAllCaches
}
