/**
 * Get Warehouses API Endpoint
 * 
 * GET /api/emc/container-management/warehouses
 * 
 * Returns list of non-archived warehouses for the organization.
 */

import { emcContainers } from '~/server/models/emcContainers'

interface GetWarehousesResponse {
    success: boolean
    data?: any[]
    error?: string
}

export default defineEventHandler(async (event): Promise<GetWarehousesResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('🔵 [API] Get Warehouses Called')
        console.log('='.repeat(80))

        // Get query parameters
        const query = getQuery(event)
        const organizationId = query.organizationId
            ? parseInt(query.organizationId as string)
            : 12313

        console.log(`📦 Organization ID: ${organizationId}`)

        // Fetch non-archived warehouses
        const warehouses = await emcContainers.find({
            organizationId,
            type: 'Warehouse',
            lifecycle: { $ne: 'ARCHIVED' }
        }).lean()

        console.log(`✅ Found ${warehouses.length} warehouses`)

        // Transform data for frontend
        const transformedWarehouses = warehouses.map((w: any) => ({
            id: w.id,
            label: w.label,
            lifecycle: w.lifecycle,
            organizationId: w.organizationId,
            description: w.description
        }))

        return {
            success: true,
            data: transformedWarehouses
        }
    } catch (error) {
        console.error('❌ Error fetching warehouses:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch warehouses'
        }
    }
})
