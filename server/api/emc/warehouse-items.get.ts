/**
 * Get Associated and All Products for Warehouse
 * 
 * GET /api/emc/warehouse-items?organizationId=12313&status=active&parentContainerId=WH-MUM-01
 * 
 * Returns both:
 * - Associated items (already attached to the warehouse)
 * - All available products (from emcInvItem)
 */

import { ContainerAssociation } from '~/server/models/ContainerAssociation'
import { emcInvItem } from '~/server/models/emcInvItem'

interface GetWarehouseItemsResponse {
  success: boolean
  data?: {
    associated: any[]
    allProducts: any[]
  }
  error?: string
}

export default defineEventHandler(async (event): Promise<GetWarehouseItemsResponse> => {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('🔵 [API] Get Warehouse Items (Associated + All Products)')
    console.log('='.repeat(80))

    // Get query parameters
    const query = getQuery(event)
    const organizationId = query.organizationId
      ? parseInt(query.organizationId as string)
      : 12313
    const status = (query.status as string) || 'active'
    const parentContainerId = query.parentContainerId as string

    console.log(`📦 Organization ID: ${organizationId}`)
    console.log(`📦 Status: ${status}`)
    console.log(`📦 Parent Container ID: ${parentContainerId}`)

    // Validate parentContainerId
    if (!parentContainerId) {
      return {
        success: false,
        error: 'parentContainerId is required'
      }
    }

    // ===== FETCH ASSOCIATED ITEMS =====
    console.log('\n📌 Fetching associated items...')
    const associations = await ContainerAssociation.find({
      organizationId,
      parentContainerId,
      status: status || undefined
    }).lean()

    const associatedItemIds = new Set<string>()
    const associatedItems: any[] = []

    for (const assoc of associations) {
      if (assoc.childContainerIds && Array.isArray(assoc.childContainerIds)) {
        for (const childId of assoc.childContainerIds) {
          associatedItemIds.add(childId)

          // Fetch the item details
          const item = await emcInvItem.findOne({ _id: childId }).lean()
          if (item) {
            associatedItems.push({
              _id: item._id?.toString() || item._id,
              id: item._id?.toString() || item._id,
              sku: item.gbItem?.ItemSKU,
              name: item.gbItem?.Name,
              label: item.gbItem?.Name,
              lifecycle: item.lifecycle || 'ACTIVE',
              organizationId: item.organizationId ?? organizationId,  // Use query param org if item doesn't have one
              type: 'Item',
              category: item.gbItem?.CategoryType?.title || 'Product',
              description: item.gbItem?.ItemSKU ? `SKU: ${item.gbItem.ItemSKU}` : undefined,
              manufacturer: item.gbManufacturer?.tbInvCompany?.tbsManuDtls?.ManufactureName,
              isAssociated: true
            })
          }
        }
      }
    }

    console.log(`✅ Found ${associatedItems.length} associated items`)

    // ===== FETCH ALL PRODUCTS =====
    console.log('\n📌 Fetching all products...')

    // First, check collection info
    const collection = emcInvItem.collection
    console.log(`📦 Collection name: ${collection.name}`)
    console.log(`📦 MongoDB URI: ${process.env.MONGODB_URI || 'not set'}`)

    // Count total documents
    const totalCount = await emcInvItem.countDocuments()
    console.log(`📦 Total documents in collection: ${totalCount}`)

    // Try to fetch all without lean first
    const allProductsWithLean = await emcInvItem.find().lean()
    console.log(`📦 Raw query result (with .lean()): ${allProductsWithLean.length} items found`)

    if (allProductsWithLean.length > 0) {
      console.log('📦 Sample item:', JSON.stringify(allProductsWithLean[0], null, 2))
    } else {
      // Try without lean to see if there's a difference
      const allProductsNoLean = await emcInvItem.find()
      console.log(`📦 Raw query result (without .lean()): ${allProductsNoLean.length} items found`)

      if (allProductsNoLean.length > 0) {
        console.log('📦 Sample item (no lean):', JSON.stringify(allProductsNoLean[0], null, 2))
      }
    }

    const transformedProducts = allProductsWithLean.map((item: any) => ({
      _id: item._id?.toString(),
      id: item._id?.toString(),

      sku: item.gbItem?.ItemSKU,
      name: item.gbItem?.Name,
      label: item.gbItem?.Name,

      lifecycle: item.lifecycle ?? 'ACTIVE',

      organizationId: item.organizationId ?? organizationId,  // Use query param org if item doesn't have one

      type: 'Item',
      category: item.gbItem?.CategoryType?.title || 'Product',

      description: item.gbItem?.ItemSKU
        ? `SKU: ${item.gbItem.ItemSKU}`
        : undefined,

      manufacturer: item.gbManufacturer?.tbInvCompany?.tbsManuDtls?.ManufactureName,

      isAssociated: associatedItemIds.has(item._id?.toString())
    }))

    console.log(`✅ Found ${transformedProducts.length} total products`)

    return {
      success: true,
      data: {
        associated: associatedItems,
        allProducts: transformedProducts
      }
    }
  } catch (error) {
    console.error('❌ Error fetching warehouse items:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch warehouse items'
    }
  }
})
