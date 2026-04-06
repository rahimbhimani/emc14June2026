/**
 * Database Seed & Migration Script
 * 
 * Sets up the new lifecycle engine collections and updates existing collections
 * Run this once before deploying the lifecycle engine
 * 
 * Steps:
 * 1. Create lifecycleStates collection & insert seeds
 * 2. Create lifecycleRules collection & insert seeds
 * 3. Create lifecycleAudit collection
 * 4. Update emcCollection with new fields
 * 5. Update configs with engineAction mappings
 * 
 * Usage: npm run seed:lifecycle
 */

async function seedLifecycleEngine(mongoClient: any) {
    const db = mongoClient.db('emc-db') // Adjust database name
    const organizationId = 12313

    console.log('\n🌱 [Seed] Starting lifecycle engine setup...\n')

    try {
        // ========================================================================
        // STEP 1: Create lifecycleStates Collection
        // ========================================================================
        console.log('📦 [1/5] Creating lifecycleStates collection...')

        await db.dropCollection('lifecycleStates').catch(() => { }) // Drop if exists
        const lifecycleStatesCollection = await db.createCollection('lifecycleStates')
        await lifecycleStatesCollection.createIndex({ entityType: 1, dimension: 1, code: 1 })

        const lifecycleStatesSeeds = [
            // === LIFECYCLE DIMENSION ===
            // Warehouse
            { entityType: 'Warehouse', dimension: 'lifecycle', code: 'DRAFT', label: 'Draft', isInitial: true, isTerminal: false, order: 0, isActive: true },
            { entityType: 'Warehouse', dimension: 'lifecycle', code: 'READY', label: 'Ready', isInitial: false, isTerminal: false, order: 1, isActive: true },
            { entityType: 'Warehouse', dimension: 'lifecycle', code: 'ACTIVE', label: 'Active', isInitial: false, isTerminal: false, order: 2, isActive: true },
            { entityType: 'Warehouse', dimension: 'lifecycle', code: 'CLOSED', label: 'Closed', isInitial: false, isTerminal: false, order: 3, isActive: true },
            { entityType: 'Warehouse', dimension: 'lifecycle', code: 'ARCHIVED', label: 'Archived', isInitial: false, isTerminal: true, order: 4, isActive: true },

            // ULD
            { entityType: 'ULD', dimension: 'lifecycle', code: 'DRAFT', label: 'Draft', isInitial: true, isTerminal: false, order: 0, isActive: true },
            { entityType: 'ULD', dimension: 'lifecycle', code: 'READY', label: 'Ready', isInitial: false, isTerminal: false, order: 1, isActive: true },
            { entityType: 'ULD', dimension: 'lifecycle', code: 'ACTIVE', label: 'Active', isInitial: false, isTerminal: false, order: 2, isActive: true },
            { entityType: 'ULD', dimension: 'lifecycle', code: 'CLOSED', label: 'Closed', isInitial: false, isTerminal: false, order: 3, isActive: true },
            { entityType: 'ULD', dimension: 'lifecycle', code: 'ARCHIVED', label: 'Archived', isInitial: false, isTerminal: true, order: 4, isActive: true },

            // Item
            { entityType: 'Item', dimension: 'lifecycle', code: 'DRAFT', label: 'Draft', isInitial: true, isTerminal: false, order: 0, isActive: true },
            { entityType: 'Item', dimension: 'lifecycle', code: 'READY', label: 'Ready', isInitial: false, isTerminal: false, order: 1, isActive: true },
            { entityType: 'Item', dimension: 'lifecycle', code: 'ACTIVE', label: 'Active', isInitial: false, isTerminal: false, order: 2, isActive: true },
            { entityType: 'Item', dimension: 'lifecycle', code: 'CLOSED', label: 'Closed', isInitial: false, isTerminal: false, order: 3, isActive: true },
            { entityType: 'Item', dimension: 'lifecycle', code: 'ARCHIVED', label: 'Archived', isInitial: false, isTerminal: true, order: 4, isActive: true },

            // === ASSIGNMENT DIMENSION ===
            { entityType: 'Warehouse', dimension: 'assignment', code: 'NONE', label: 'Not Linked', isInitial: true, isTerminal: false, order: 0, isActive: true },
            { entityType: 'Warehouse', dimension: 'assignment', code: 'LINKED', label: 'Linked', isInitial: false, isTerminal: false, order: 1, isActive: true },
            { entityType: 'ULD', dimension: 'assignment', code: 'NONE', label: 'Not Linked', isInitial: true, isTerminal: false, order: 0, isActive: true },
            { entityType: 'ULD', dimension: 'assignment', code: 'LINKED', label: 'Linked', isInitial: false, isTerminal: false, order: 1, isActive: true },
            { entityType: 'Item', dimension: 'assignment', code: 'NONE', label: 'Not Linked', isInitial: true, isTerminal: false, order: 0, isActive: true },
            { entityType: 'Item', dimension: 'assignment', code: 'LINKED', label: 'Linked', isInitial: false, isTerminal: false, order: 1, isActive: true },

            // === INVENTORY DIMENSION (Optional for all) ===
            { entityType: 'ANY', dimension: 'inventory', code: 'NA', label: 'Not Applicable', isInitial: true, isTerminal: false, order: 0, isActive: true },
            { entityType: 'ANY', dimension: 'inventory', code: 'EMPTY', label: 'Empty', isInitial: false, isTerminal: false, order: 1, isActive: true },
            { entityType: 'ANY', dimension: 'inventory', code: 'PLANNING', label: 'Planning', isInitial: false, isTerminal: false, order: 2, isActive: true },
            { entityType: 'ANY', dimension: 'inventory', code: 'LOADED', label: 'Loaded', isInitial: false, isTerminal: false, order: 3, isActive: true },
            { entityType: 'ANY', dimension: 'inventory', code: 'RECONCILED', label: 'Reconciled', isInitial: false, isTerminal: false, order: 4, isActive: true },

            // === LOCATION DIMENSION ===
            { entityType: 'ANY', dimension: 'location', code: 'NA', label: 'Not Applicable', isInitial: true, isTerminal: false, order: 0, isActive: true },
            { entityType: 'ANY', dimension: 'location', code: 'WAREHOUSE', label: 'Warehouse', isInitial: false, isTerminal: false, order: 1, isActive: true },
            { entityType: 'ANY', dimension: 'location', code: 'FLIGHT', label: 'In Flight', isInitial: false, isTerminal: false, order: 2, isActive: true },

            // === CONTROL DIMENSION ===
            { entityType: 'ANY', dimension: 'control', code: 'NA', label: 'Not Applicable', isInitial: true, isTerminal: false, order: 0, isActive: true },
            { entityType: 'ANY', dimension: 'control', code: 'UNLOCKED', label: 'Unlocked', isInitial: false, isTerminal: false, order: 1, isActive: true },
            { entityType: 'ANY', dimension: 'control', code: 'SEALED', label: 'Sealed', isInitial: false, isTerminal: false, order: 2, isActive: true },
            { entityType: 'ANY', dimension: 'control', code: 'OPENED', label: 'Opened', isInitial: false, isTerminal: false, order: 3, isActive: true },
            { entityType: 'ANY', dimension: 'control', code: 'LOCKED', label: 'Locked', isInitial: false, isTerminal: false, order: 4, isActive: true },

            // === OPERATION DIMENSION ===
            { entityType: 'ANY', dimension: 'operation', code: 'NA', label: 'Not Applicable', isInitial: true, isTerminal: false, order: 0, isActive: true },
            { entityType: 'ANY', dimension: 'operation', code: 'SCHEDULED', label: 'Scheduled', isInitial: false, isTerminal: false, order: 1, isActive: true },
            { entityType: 'ANY', dimension: 'operation', code: 'PLANNING', label: 'Planning', isInitial: false, isTerminal: false, order: 2, isActive: true },
            { entityType: 'ANY', dimension: 'operation', code: 'LOADING', label: 'Loading', isInitial: false, isTerminal: false, order: 3, isActive: true },
            { entityType: 'ANY', dimension: 'operation', code: 'IN_FLIGHT', label: 'In Flight', isInitial: false, isTerminal: false, order: 4, isActive: true },
            { entityType: 'ANY', dimension: 'operation', code: 'LANDING', label: 'Landing', isInitial: false, isTerminal: false, order: 5, isActive: true },
            { entityType: 'ANY', dimension: 'operation', code: 'RECONCILING', label: 'Reconciling', isInitial: false, isTerminal: false, order: 6, isActive: true },
            { entityType: 'ANY', dimension: 'operation', code: 'COMPLETED', label: 'Completed', isInitial: false, isTerminal: true, order: 7, isActive: true }
        ]

        const statesResult = await lifecycleStatesCollection.insertMany(lifecycleStatesSeeds)
        console.log(`   ✅ Inserted ${statesResult.insertedIds.length} lifecycle states`)

        // ========================================================================
        // STEP 2: Create lifecycleRules Collection
        // ========================================================================
        console.log('\n📦 [2/5] Creating lifecycleRules collection...')

        await db.dropCollection('lifecycleRules').catch(() => { })
        const lifecycleRulesCollection = await db.createCollection('lifecycleRules')
        await lifecycleRulesCollection.createIndex({ action: 1, entityType: 1, isActive: 1 })
        await lifecycleRulesCollection.createIndex({ priority: -1 })

        const lifecycleRulesSeeds = [
            // ACTIVATE: DRAFT → READY
            {
                action: 'Activate',
                entityType: 'ANY',
                allowedRoles: ['Admin'],
                preConditions: [{ dimension: 'lifecycle', allowedValues: ['DRAFT'] }],
                crossEntityConditions: [],
                childConditions: [],
                postUpdates: [{ target: 'SELF', dimension: 'lifecycle', value: 'READY' }],
                cascade: false,
                isActive: true,
                version: 1,
                priority: 10,
                description: 'Activate a draft container to ready state',
                createdAt: new Date(),
                createdBy: 'system',
                createdReason: 'Initial seed'
            },

            // ATTACH: Parent READY→ACTIVE, Child READY→ACTIVE, assignment NONE→LINKED
            {
                action: 'Attach',
                entityType: 'ANY',
                allowedRoles: ['Admin', 'Manager'],
                preConditions: [
                    { dimension: 'lifecycle', allowedValues: ['READY', 'ACTIVE'] }
                ],
                crossEntityConditions: [
                    {
                        parentType: 'ANY',
                        dimension: 'lifecycle',
                        allowedValues: ['READY', 'ACTIVE']
                    }
                ],
                childConditions: [],
                postUpdates: [
                    { target: 'SELF', dimension: 'assignment', value: 'LINKED' },
                    { target: 'SELF', dimension: 'lifecycle', value: 'ACTIVE' },
                    { target: 'PARENT', dimension: 'lifecycle', value: 'ACTIVE' }
                ],
                cascade: false,
                isActive: true,
                version: 1,
                priority: 10,
                description: 'Attach a container to its parent container'
            },

            // DETACH: assignment LINKED→NONE, parent ACTIVE→READY if no more children
            {
                action: 'Detach',
                entityType: 'ANY',
                allowedRoles: ['Admin'],
                preConditions: [
                    { dimension: 'lifecycle', allowedValues: ['ACTIVE'] },
                    { dimension: 'assignment', allowedValues: ['LINKED'] }
                ],
                crossEntityConditions: [],
                childConditions: [],
                postUpdates: [
                    { target: 'SELF', dimension: 'assignment', value: 'NONE' }
                    // Parent status is computed: if no more children, ACTIVE → READY
                ],
                cascade: false,
                isActive: true,
                version: 1,
                priority: 10,
                description: 'Detach a container from its parent'
            },

            // CLOSE: ACTIVE→CLOSED, cascade to all ACTIVE children
            {
                action: 'Close',
                entityType: 'ANY',
                allowedRoles: ['Admin'],
                preConditions: [
                    { dimension: 'lifecycle', allowedValues: ['ACTIVE'] }
                ],
                crossEntityConditions: [],
                childConditions: [],
                postUpdates: [
                    { target: 'SELF', dimension: 'lifecycle', value: 'CLOSED' }
                ],
                cascade: true,
                isActive: true,
                version: 1,
                priority: 10,
                description: 'Close a container and cascade to all descendant containers'
            },

            // REOPEN: CLOSED→READY
            {
                action: 'Reopen',
                entityType: 'ANY',
                allowedRoles: ['Admin'],
                preConditions: [
                    { dimension: 'lifecycle', allowedValues: ['CLOSED'] }
                ],
                crossEntityConditions: [],
                childConditions: [],
                postUpdates: [
                    { target: 'SELF', dimension: 'lifecycle', value: 'READY' }
                ],
                cascade: false,
                isActive: true,
                version: 1,
                priority: 10,
                description: 'Reopen a closed container'
            },

            // ARCHIVE: Any→ARCHIVED, recursive cascade to all descendants
            {
                action: 'Archive',
                entityType: 'ANY',
                allowedRoles: ['Admin'],
                preConditions: [], // Any state
                crossEntityConditions: [],
                childConditions: [],
                postUpdates: [
                    { target: 'SELF', dimension: 'lifecycle', value: 'ARCHIVED' }
                ],
                cascade: true,
                isActive: true,
                version: 1,
                priority: 15,
                description: 'Archive a container and all its descendants'
            }
        ]

        const rulesResult = await lifecycleRulesCollection.insertMany(lifecycleRulesSeeds)
        console.log(`   ✅ Inserted ${rulesResult.insertedIds.length} lifecycle rules`)

        // ========================================================================
        // STEP 3: Create lifecycleAudit Collection
        // ========================================================================
        console.log('\n📦 [3/6] Creating lifecycleAudit collection...')

        await db.dropCollection('lifecycleAudit').catch(() => { })
        const lifecycleAuditCollection = await db.createCollection('lifecycleAudit')
        await lifecycleAuditCollection.createIndex({ entityId: 1 })
        await lifecycleAuditCollection.createIndex({ action: 1 })
        await lifecycleAuditCollection.createIndex({ executedAt: -1 })
        await lifecycleAuditCollection.createIndex({ transactionId: 1 })

        console.log(`   ✅ Collection created (empty - will populate on use)`)

        // ========================================================================
        // STEP 4: Create ruleChangeAudit Collection (for rule versioning)
        // ========================================================================
        console.log('\n📦 [4/6] Creating ruleChangeAudit collection...')

        await db.dropCollection('ruleChangeAudit').catch(() => { })
        const ruleChangeAuditCollection = await db.createCollection('ruleChangeAudit')
        await ruleChangeAuditCollection.createIndex({ action: 1, entityType: 1 })
        await ruleChangeAuditCollection.createIndex({ changedAt: -1 })
        await ruleChangeAuditCollection.createIndex({ changedBy: 1 })

        console.log(`   ✅ Collection created (empty - will populate when rules are updated)`)

        // ========================================================================
        // STEP 5: Update emcCollection with new fields
        // ========================================================================
        console.log('\n📦 [5/6] Updating emcCollection with new state dimensions...')

        const updateResult = await db.collection('emcCollection').updateMany(
            { organizationId },
            {
                $set: {
                    lifecycle: 'DRAFT',
                    assignment: 'NONE',
                    inventory: 'NA',
                    location: 'NA',
                    control: 'NA',
                    operation: 'NA',
                    parentId: null,
                    childIds: [],
                    currentStateVersion: 1
                },
                $setOnInsert: {
                    stateHistory: []
                }
            }
        )

        console.log(`   ✅ Updated ${updateResult.modifiedCount} containers`)

        // ========================================================================
        // STEP 6: Update Config Collection with engineAction
        // ========================================================================
        console.log('\n📦 [6/6] Updating config collection with engineAction mappings...')

        const configsCollection = db.collection('configs')

        // Get all configs
        const allConfigs = await configsCollection.find({ organizationId }).toArray()

        for (const config of allConfigs) {
            const updatedConfigs = config.configs.map((cfg: any) => {
                // Map action IDs to engineAction values
                const actionMap: Record<string, string> = {
                    activate: 'Activate',
                    attach: 'Attach',
                    detach: 'Detach',
                    close: 'Close',
                    reopen: 'Reopen',
                    archive: 'Archive'
                }

                return {
                    ...cfg,
                    actions: (cfg.actions || []).map((action: any) => ({
                        ...action,
                        engineAction: actionMap[action.id] || action.id
                    }))
                }
            })

            await configsCollection.updateOne(
                { _id: config._id },
                { $set: { configs: updatedConfigs } }
            )
        }

        console.log(`   ✅ Updated ${allConfigs.length} config sets`)

        console.log('\n✅ [SUCCESS] Lifecycle engine setup complete!\n')

        return {
            success: true,
            summary: {
                lifecycleStates: statesResult.insertedIds.length,
                lifecycleRules: rulesResult.insertedIds.length,
                containersUpdated: updateResult.modifiedCount,
                configsUpdated: allConfigs.length
            }
        }
    }
    catch (error) {
        console.error(`\n❌ [ERROR] Seed failed:`, error)
        throw error
    }
}

export default seedLifecycleEngine

/**
 * USAGE IN NUXT:
 * 
 * // Add to package.json scripts:
 * "seed:lifecycle": "node -r ts-node/register seed-lifecycle.ts"
 * 
 * // Or run directly:
 * import seedLifecycleEngine from './seed-lifecycle'
 * const mongoClient = new MongoClient('mongodb://localhost:27017')
 * await mongoClient.connect()
 * const result = await seedLifecycleEngine(mongoClient)
 * await mongoClient.close()
 * 
 * console.log('Seed summary:', result.summary)
 */
