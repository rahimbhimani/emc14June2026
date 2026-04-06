/**
 * Container Data Retrieval & Query Service
 * 
 * Dedicated retrieval layer for all container, inventory, and sales queries.
 * All queries follow multi-organization isolation pattern using organizationId.
 * 
 * This service is SEPARATE from the lifecycle engine.
 * Lifecycle engine: State transitions & operations
 * Query service: Data retrieval & aggregations
 * 
 * Performance:
 * - Bulk fetch where possible (avoid N+1 queries)
 * - Multi-organization isolation on all queries
 * - Indexes required on: organizationId, parentId, containerId, itemId, etc.
 * 
 * @author Rahim Bhimani
 * @date February 22, 2026
 * @version 1.0 - Query Service
 */


// ============================================================================
// TYPES
// ============================================================================

export interface ContainerQueryResult {
    success: boolean
    errorCode?: string
    message: string
    data?: any
}

export interface TrolleyViewmodel {
    trolley: any
    parent?: any // Warehouse or Flight
    items: Array<{
        item: any
        quantityPlanned: number
        quantityLoaded: number
        quantitySold: number
        quantityDamaged: number
        quantityReturned: number
        quantityRemaining: number
        salesValue: number
    }>
    inventory: {
        totalPlanned: number
        totalLoaded: number
        totalSold: number
        totalDamaged: number
        totalReturned: number
        totalRemaining: number
    }
    sales: {
        totalTransactions: number
        totalSalesValue: number
        transactions: any[]
    }
    movementHistory: any[]
}

export interface WarehouseViewmodel {
    warehouse: any
    items: Array<{
        item: any
        quantityOnHand: number
        quantityReserved: number
        quantityAvailable: number
        totalValue: number
    }>
    summary: {
        totalStock: number
        totalReserved: number
        totalAvailable: number
        totalValue: number
    }
    trolleys: any[]
}

// ============================================================================
// 1️⃣ RETRIEVE SINGLE CONTAINER
// ============================================================================

export async function getSingleContainer(
    db: any,
    containerId: string,
    organizationId: number
): Promise<ContainerQueryResult> {
    try {
        const container = await db.collection('emcContainers').findOne({
            id: containerId,
            organizationId
        })

        if (!container) {
            return {
                success: false,
                errorCode: 'CONTAINER_NOT_FOUND',
                message: `Container ${containerId} not found`
            }
        }

        return {
            success: true,
            message: 'Container retrieved',
            data: container
        }
    } catch (error) {
        return {
            success: false,
            errorCode: 'QUERY_ERROR',
            message: error instanceof Error ? error.message : String(error)
        }
    }
}

// ============================================================================
// 2️⃣ RETRIEVE PARENT CONTAINER
// ============================================================================

export async function getParentContainer(
    db: any,
    container: any,
    organizationId: number
): Promise<ContainerQueryResult> {
    try {
        if (!container.parentId) {
            return {
                success: true,
                message: 'No parent container',
                data: null
            }
        }

        const parent = await db.collection('emcContainers').findOne({
            _id: container.parentId,
            organizationId
        })

        if (!parent) {
            return {
                success: false,
                errorCode: 'PARENT_NOT_FOUND',
                message: `Parent container not found`
            }
        }

        return {
            success: true,
            message: 'Parent container retrieved',
            data: parent
        }
    } catch (error) {
        return {
            success: false,
            errorCode: 'QUERY_ERROR',
            message: error instanceof Error ? error.message : String(error)
        }
    }
}

// ============================================================================
// 3️⃣ RETRIEVE CHILD CONTAINERS
// ============================================================================

export async function getChildContainers(
    db: any,
    container: any,
    organizationId: number
): Promise<ContainerQueryResult> {
    try {
        if (!container.childIds || container.childIds.length === 0) {
            return {
                success: true,
                message: 'No child containers',
                data: []
            }
        }

        const children = await db
            .collection('emcContainers')
            .find({
                _id: { $in: container.childIds },
                organizationId
            })
            .toArray()

        return {
            success: true,
            message: `Retrieved ${children.length} child containers`,
            data: children
        }
    } catch (error) {
        return {
            success: false,
            errorCode: 'QUERY_ERROR',
            message: error instanceof Error ? error.message : String(error)
        }
    }
}

// ============================================================================
// 4️⃣ RETRIEVE ITEMS INSIDE A TROLLEY
// ============================================================================

export async function getItemsInTrolley(
    db: any,
    trolleyId: string,
    organizationId: number
): Promise<ContainerQueryResult> {
    try {
        // Step 1: Get container inventory records (items in trolley)
        const containerInventoryRecords = await db
            .collection('containerInventory')
            .find({
                containerId: new (require('mongodb')).ObjectId(trolleyId),
                organizationId
            })
            .toArray()

        if (containerInventoryRecords.length === 0) {
            return {
                success: true,
                message: 'No items in trolley',
                data: []
            }
        }

        // Step 2: Extract item IDs
        const itemIds = containerInventoryRecords.map((inv: any) =>
            new (require('mongodb')).ObjectId(inv.itemId)
        )

        // Step 3: Bulk fetch item master data
        const items = await db
            .collection('emcContainers')
            .find({
                _id: { $in: itemIds },
                type: 'Item',
                organizationId
            })
            .toArray()

        // Step 4: Join application layer
        const itemsMap = new Map(items.map((item: any) => [item._id.toString(), item]))

        const result = containerInventoryRecords.map((inv: any) => {
            const item = itemsMap.get(inv.itemId.toString())
            const quantityRemaining =
                (inv.quantityLoaded || 0) -
                (inv.quantitySold || 0) -
                (inv.quantityDamaged || 0) -
                (inv.quantityReturned || 0)

            return {
                item,
                quantityPlanned: inv.quantityPlanned || 0,
                quantityLoaded: inv.quantityLoaded || 0,
                quantitySold: inv.quantitySold || 0,
                quantityDamaged: inv.quantityDamaged || 0,
                quantityReturned: inv.quantityReturned || 0,
                quantityRemaining,
                inventoryStatus: inv.inventoryStatus || 'ACTIVE'
            }
        })

        return {
            success: true,
            message: `Retrieved ${result.length} items`,
            data: result
        }
    } catch (error) {
        return {
            success: false,
            errorCode: 'QUERY_ERROR',
            message: error instanceof Error ? error.message : String(error)
        }
    }
}

// ============================================================================
// 5️⃣ RETRIEVE WAREHOUSE STOCK FOR AN ITEM
// ============================================================================

export async function getWarehouseStock(
    db: any,
    warehouseId: string,
    itemId: string,
    organizationId: number
): Promise<ContainerQueryResult> {
    try {
        const stock = await db.collection('warehouseInventory').findOne({
            warehouseId: new (require('mongodb')).ObjectId(warehouseId),
            itemId: new (require('mongodb')).ObjectId(itemId),
            organizationId
        })

        if (!stock) {
            return {
                success: false,
                errorCode: 'STOCK_NOT_FOUND',
                message: `Stock not found for item in warehouse`
            }
        }

        return {
            success: true,
            message: 'Warehouse stock retrieved',
            data: {
                quantityOnHand: stock.quantityOnHand || 0,
                quantityReserved: stock.quantityReserved || 0,
                quantityAvailable: stock.quantityAvailable || 0
            }
        }
    } catch (error) {
        return {
            success: false,
            errorCode: 'QUERY_ERROR',
            message: error instanceof Error ? error.message : String(error)
        }
    }
}

// ============================================================================
// 6️⃣ RETRIEVE SALES FOR A TROLLEY
// ============================================================================

export async function getSalesForTrolley(
    db: any,
    trolleyId: string,
    organizationId: number
): Promise<ContainerQueryResult> {
    try {
        const trolleyObjId = new (require('mongodb')).ObjectId(trolleyId)

        // Retrieve all transactions
        const transactions = await db
            .collection('salesTransactions')
            .find({
                containerId: trolleyObjId,
                organizationId
            })
            .toArray()

        // Calculate totals
        const totals = await db
            .collection('salesTransactions')
            .aggregate([
                {
                    $match: {
                        containerId: trolleyObjId,
                        organizationId,
                        reversed: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalTransactions: { $sum: 1 },
                        totalSalesValue: { $sum: '$totalAmount' },
                        totalQuantity: { $sum: '$quantity' }
                    }
                }
            ])
            .toArray()

        return {
            success: true,
            message: 'Sales retrieved',
            data: {
                transactions,
                summary: totals[0] || {
                    totalTransactions: 0,
                    totalSalesValue: 0,
                    totalQuantity: 0
                }
            }
        }
    } catch (error) {
        return {
            success: false,
            errorCode: 'QUERY_ERROR',
            message: error instanceof Error ? error.message : String(error)
        }
    }
}

// ============================================================================
// 7️⃣ RETRIEVE MOVEMENT HISTORY
// ============================================================================

export async function getMovementHistory(
    db: any,
    containerId: string,
    organizationId: number
): Promise<ContainerQueryResult> {
    try {
        const movements = await db
            .collection('containerMovement')
            .find({
                containerId: new (require('mongodb')).ObjectId(containerId),
                organizationId
            })
            .sort({ movedAt: -1 })
            .toArray()

        return {
            success: true,
            message: `Retrieved ${movements.length} movements`,
            data: movements
        }
    } catch (error) {
        return {
            success: false,
            errorCode: 'QUERY_ERROR',
            message: error instanceof Error ? error.message : String(error)
        }
    }
}

// ============================================================================
// 8️⃣ RETRIEVE FULL TROLLEY VIEW MODEL
// ============================================================================

export async function getTrolleyViewmodel(
    db: any,
    trolleyId: string,
    organizationId: number
): Promise<ContainerQueryResult> {
    try {
        // Step 1: Get trolley
        const trolleyResult = await getSingleContainer(db, trolleyId, organizationId)
        if (!trolleyResult.success) {
            return trolleyResult
        }
        const trolley = trolleyResult.data

        // Step 2: Get parent (warehouse or flight)
        const parentResult = await getParentContainer(db, trolley, organizationId)
        const parent = parentResult.data || null

        // Step 3: Get items in trolley
        const itemsResult = await getItemsInTrolley(db, trolleyId, organizationId)
        const items = itemsResult.data || []

        // Step 4: Get sales
        const salesResult = await getSalesForTrolley(db, trolleyId, organizationId)
        const sales = salesResult.data || { transactions: [], summary: {} }

        // Step 5: Get movement history
        const movementResult = await getMovementHistory(db, trolleyId, organizationId)
        const movementHistory = movementResult.data || []

        // Step 6: Calculate inventory totals
        const inventory = {
            totalPlanned: items.reduce((sum: number, item: any) => sum + item.quantityPlanned, 0),
            totalLoaded: items.reduce((sum: number, item: any) => sum + item.quantityLoaded, 0),
            totalSold: items.reduce((sum: number, item: any) => sum + item.quantitySold, 0),
            totalDamaged: items.reduce((sum: number, item: any) => sum + item.quantityDamaged, 0),
            totalReturned: items.reduce((sum: number, item: any) => sum + item.quantityReturned, 0),
            totalRemaining: items.reduce((sum: number, item: any) => sum + item.quantityRemaining, 0)
        }

        const viewmodel: TrolleyViewmodel = {
            trolley,
            parent,
            items,
            inventory,
            sales,
            movementHistory
        }

        return {
            success: true,
            message: 'Trolley viewmodel retrieved',
            data: viewmodel
        }
    } catch (error) {
        return {
            success: false,
            errorCode: 'QUERY_ERROR',
            message: error instanceof Error ? error.message : String(error)
        }
    }
}

// ============================================================================
// 🔟 RETRIEVE FULL WAREHOUSE VIEW MODEL
// ============================================================================

export async function getWarehouseViewmodel(
    db: any,
    warehouseId: string,
    organizationId: number
): Promise<ContainerQueryResult> {
    try {
        // Step 1: Get warehouse
        const warehouseResult = await getSingleContainer(db, warehouseId, organizationId)
        if (!warehouseResult.success) {
            return warehouseResult
        }
        const warehouse = warehouseResult.data

        // Step 2: Get child trolleys
        const trolleysResult = await getChildContainers(db, warehouse, organizationId)
        const trolleys = trolleysResult.data || []

        // Step 3: Get warehouse inventory
        const warehouseInv = await db
            .collection('warehouseInventory')
            .find({
                warehouseId: warehouse._id,
                organizationId
            })
            .toArray()

        if (warehouseInv.length === 0) {
            return {
                success: true,
                message: 'Warehouse has no stock',
                data: {
                    warehouse,
                    items: [],
                    summary: {
                        totalStock: 0,
                        totalReserved: 0,
                        totalAvailable: 0,
                        totalValue: 0
                    },
                    trolleys
                }
            }
        }

        // Step 4: Bulk fetch item masters
        const itemIds = warehouseInv.map((inv: any) =>
            new (require('mongodb')).ObjectId(inv.itemId)
        )
        const items = await db
            .collection('emcContainers')
            .find({
                _id: { $in: itemIds },
                type: 'Item',
                organizationId
            })
            .toArray()

        const itemsMap = new Map(items.map((item: any) => [item._id.toString(), item]))

        // Step 5: Join and calculate
        const itemDetails = warehouseInv.map((inv: any) => {
            const item = itemsMap.get(inv.itemId.toString())
            const totalValue = (inv.quantityOnHand || 0) * ((item as any)?.unitPrice || 0)

            return {
                item,
                quantityOnHand: inv.quantityOnHand || 0,
                quantityReserved: inv.quantityReserved || 0,
                quantityAvailable: inv.quantityAvailable || 0,
                totalValue
            }
        })

        // Step 6: Summary
        const summary = {
            totalStock: itemDetails.reduce((sum: number, item: any) => sum + item.quantityOnHand, 0),
            totalReserved: itemDetails.reduce((sum: number, item: any) => sum + item.quantityReserved, 0),
            totalAvailable: itemDetails.reduce((sum: number, item: any) => sum + item.quantityAvailable, 0),
            totalValue: itemDetails.reduce((sum: number, item: any) => sum + item.totalValue, 0)
        }

        const viewmodel: WarehouseViewmodel = {
            warehouse,
            items: itemDetails,
            summary,
            trolleys
        }

        return {
            success: true,
            message: 'Warehouse viewmodel retrieved',
            data: viewmodel
        }
    } catch (error) {
        return {
            success: false,
            errorCode: 'QUERY_ERROR',
            message: error instanceof Error ? error.message : String(error)
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    getSingleContainer,
    getParentContainer,
    getChildContainers,
    getItemsInTrolley,
    getWarehouseStock,
    getSalesForTrolley,
    getMovementHistory,
    getTrolleyViewmodel,
    getWarehouseViewmodel
}
