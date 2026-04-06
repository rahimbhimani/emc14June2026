/**
 * Get Active Products API Endpoint
 * 
 * GET /api/emc/inventory/active-products
 * 
 * Returns list of products (emcInvItem) for the organization.
 * Products without a lifecycle attribute are treated as ACTIVE.
 * These are products that can be received into warehouse.
 */

import { emcInvItem } from '~/server/models/emcInvItem'

interface GetActiveProductsResponse {
    success: boolean
    data?: any[]
    error?: string
}

export default defineEventHandler(async (event): Promise<GetActiveProductsResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('🔵 [API] Get Active Products Called')
        console.log('='.repeat(80))

        // Get query parameters
        const query = getQuery(event)
        const organizationId = query.organizationId
            ? parseInt(query.organizationId as string)
            : 12313

        console.log(`📦 Organization ID: ${organizationId}`)

        // Fetch all products (lifecycle will be handled in transformation)
        const products = await emcInvItem.find({
            organizationId
        }).lean()

        console.log(`✅ Found ${products.length} products`)

        // Transform data for frontend
        // Default lifecycle to 'ACTIVE' if not specified
        const transformedProducts = products.map((p: any) => ({
            _id: p._id?.toString() || p._id,
            sku: p.sku,
            name: p.name,
            lifecycle: p.lifecycle || 'ACTIVE',  // ← Default to ACTIVE if not set
            organizationId: p.organizationId
        }))

        console.log(`📦 Returning ${transformedProducts.length} products`)

        return {
            success: true,
            data: transformedProducts
        }
    } catch (error) {
        console.error('❌ Error fetching products:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch products'
        }
    }
})
