import { ContainerAssociation } from '~/server/models/ContainerAssociation'
import { emcContainers } from '~/server/models/emcContainers'
import { emcInvItem } from '~/server/models/emcInvItem'
import { updateContainerStatus } from '~/server/utils/containerStatusManager'
import type { UserContext } from '~/types/emcContainer'

interface AssociationPayload {
  actionId: string
  actionLabel: string
  parentContainerId: string
  parentContainerType: string
  childContainerIds: string[]
  organizationId: string | number
  quantity?: number
}

interface AssociationResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

export default defineEventHandler(async (event): Promise<AssociationResponse> => {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('🔵 [API] EMC Container Association API Called')
    console.log('='.repeat(80))

    // Get user context from session/auth (mock for now)
    const userContext: UserContext = {
      id: 'user-123',
      organizationId: 12313,
      roles: [
        { id: 9090, name: 'Admin' },
        { id: 9091, name: 'Manager' }
      ]
    }
    const userName = 'Rahim Bhimani'
    const userCode = 'EMP-001'

    console.log('👤 User Context:', JSON.stringify(userContext, null, 2))

    // Parse request body
    const body = await readBody<AssociationPayload>(event)
    console.log('📦 Association Payload Received:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.parentContainerId || !body.childContainerIds || body.childContainerIds.length === 0) {
      console.log('❌ Validation failed: Missing required fields')
      return {
        success: false,
        error: 'Missing required fields: parentContainerId and childContainerIds'
      }
    }

    console.log('✅ Validation passed')


    // Validate organization ID matches user's organization
    const orgId = typeof body.organizationId === 'string' ? parseInt(body.organizationId) : body.organizationId
    if (orgId !== userContext.organizationId && body.organizationId !== 'default') {
      console.log('❌ Organization mismatch:', orgId, 'vs', userContext.organizationId)
      return {
        success: false,
        error: 'Unauthorized: Organization ID mismatch'
      }
    }

    console.log('🔍 Looking up parent container:', body.parentContainerId)
    const parentContainer = await emcContainers.findOne({
      id: body.parentContainerId,
      organizationId: userContext.organizationId,
    }).lean()

    if (!parentContainer) {
      console.log('❌ Parent container not found:', body.parentContainerId)
      return {
        success: false,
        error: `Parent container not found: ${body.parentContainerId}`,
      }
    }
    console.log('✅ Parent found:', parentContainer.id, 'Type:', parentContainer.type, 'Status:', parentContainer.lifecycle)

    console.log('🔍 Looking up child containers/items:', body.childContainerIds)

    // First, try to find as containers
    let childContainers = await emcContainers.find({
      id: { $in: body.childContainerIds },
      organizationId: userContext.organizationId,
    }).lean()

    // If no containers found and parent is Warehouse, try to find as inventory products
    const foundProductIds = new Set<string>()
    if (childContainers.length === 0 && parentContainer.type === 'Warehouse') {
      console.log('   📦 No containers found, checking for inventory products...')

      const products = await emcInvItem.find({
        _id: { $in: body.childContainerIds }
      }).lean()

      if (products.length > 0) {
        console.log(`   ✅ Found ${products.length} product(s) in inventory`)
        // Convert products to container-like objects for processing
        for (const product of products) {
          foundProductIds.add(product._id?.toString() || '')
          childContainers.push({
            id: product._id?.toString() || product._id,
            type: 'Item',
            label: product.name,
            sku: product.sku,
            lifecycle: product.lifecycle || 'ACTIVE',
            organizationId: userContext.organizationId,
            _id: product._id
          } as any)
        }
      }
    }

    if (childContainers.length === 0) {
      console.log('❌ No valid child containers or products found')
      return {
        success: false,
        error: 'No valid child containers or products found for association',
      }
    }
    console.log(`✅ Found ${childContainers.length} child item(s) to process`)

    let movementsCreated = 0
    let stockReceiptData: any = null

    // Use status manager for all status transitions
    if (childContainers.length > 0) {
      for (const child of childContainers) {
        console.log(`\n📝 Processing child: ${child.id} (Type: ${child.type}, Status: ${child.lifecycle})`)
        const statusResult = await updateContainerStatus(
          child.id,
          'Attach',
          {
            id: userContext.id,
            name: userName,
            code: userCode,
          },
          body.parentContainerId,
          child.id,
          body.quantity,
          userContext.organizationId
        )

        console.log(`   Status update result:`, statusResult)

        if (!statusResult.success) {
          console.log(`❌ Status update failed: ${statusResult.message}`)
          return {
            success: false,
            error: statusResult.message,
          }
        }

        if (statusResult.success && statusResult.movementRecord) {
          movementsCreated++
          console.log(`✅ Movement record created: ${statusResult.movementRecord._id}`)
        }

        // Capture stock receipt data if available
        if (statusResult.success && statusResult.stockReceipt) {
          stockReceiptData = statusResult.stockReceipt
          console.log(`✅ Stock Receipt completed:`, stockReceiptData)
        }
      }
    }
    console.log(`\n✅ Total movements created: ${movementsCreated}`)

    // Create or update association after successful status transitions
    console.log('\n💾 Creating/updating association document...')
    console.log('   Query:', {
      organizationId: userContext.organizationId,
      parentContainerId: body.parentContainerId,
      parentContainerType: body.parentContainerType,
      status: 'active',
    })
    console.log('   Children to add:', body.childContainerIds)
    console.log('   Quantity per item:', body.quantity)

    // Build itemQuantities update for each child
    const itemQuantitiesUpdate: Record<string, number> = {}
    if (body.quantity && body.quantity > 0) {
      body.childContainerIds.forEach(childId => {
        itemQuantitiesUpdate[childId] = body.quantity as number
      })
      console.log('   Item quantities to store:', itemQuantitiesUpdate)
    }

    const associationDoc = await ContainerAssociation.findOneAndUpdate(
      {
        organizationId: userContext.organizationId,
        parentContainerId: body.parentContainerId,
        parentContainerType: body.parentContainerType,
        status: 'active',
      },
      {
        $set: {
          actionId: body.actionId,
          actionLabel: body.actionLabel,
          updatedAt: new Date(),
          ...Object.keys(itemQuantitiesUpdate).length > 0 ? {
            itemQuantities: itemQuantitiesUpdate
          } : {}
        },
        $setOnInsert: {
          createdBy: userContext.id,
          createdAt: new Date(),
        },
        $addToSet: {
          childContainerIds: { $each: body.childContainerIds },
        },
      },
      {
        new: true,
        upsert: true,
      }
    )

    console.log('✅ Association upserted in database:', associationDoc?._id)
    console.log('   Association details:', {
      _id: associationDoc._id,
      parentContainerId: associationDoc.parentContainerId,
      childCount: associationDoc.childContainerIds?.length
    })

    // Return success response
    console.log('\n🎉 Returning success response')
    return {
      success: true,
      data: {
        id: associationDoc._id,
        organizationId: associationDoc.organizationId,
        parentContainerId: associationDoc.parentContainerId,
        childContainerIds: associationDoc.childContainerIds,
        actionLabel: associationDoc.actionLabel,
        status: associationDoc.status,
        createdAt: associationDoc.createdAt,
        movementSummary: {
          movementsCreated,
        },
        stockReceipt: stockReceiptData,
        message: `Successfully created association for action: ${body.actionLabel}`
      },
      message: `Successfully created association`
    }
  } catch (error) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ [API] Association API Error!')
    console.error('='.repeat(80))
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    console.error('='.repeat(80))

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create association'
    }
  }
})

