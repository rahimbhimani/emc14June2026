import { ContainerAssociation } from '~/server/models/ContainerAssociation'
import { emcContainers } from '~/server/models/emcContainers'
import { emcInventoryMovements } from '~/server/models/emcInventoryMovements'
import type { UserContext } from '~/types/emcContainer'

interface TrolleyTransferResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

/**
 * Transfer trolley to flight
 * 
 * Request body:
 * - organizationId: number
 * - flightId: string
 * - trolleyId: string
 * - performedBy: string
 * 
 * Creates or updates ContainerAssociation to link trolley to flight
 */
export default defineEventHandler(async (event): Promise<TrolleyTransferResponse> => {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('🚁 [API] Trolley Transfer (Trolley → Flight)')
    console.log('='.repeat(80))

    // Get user context
    const userContext: UserContext = {
      id: 'user-123',
      organizationId: 12313,
      roles: [
        { id: 9090, name: 'Admin' },
        { id: 9091, name: 'Manager' }
      ]
    }

    // Parse request body
    const body = await readBody(event)
    const { flightId, trolleyId, performedBy } = body

    console.log('📦 Request:')
    console.log(`   Flight: ${flightId}`)
    console.log(`   Trolley: ${trolleyId}`)
    console.log(`   Performed By: ${performedBy}`)

    // Validate inputs
    if (!flightId || !trolleyId || !performedBy) {
      throw new Error('Missing required fields: flightId, trolleyId, performedBy')
    }

    const orgId = userContext.organizationId

    console.log('\n✅ Validation passed')

    // Step 1: Verify flight exists
    console.log('\n🔍 Verifying flight container...')
    const flight = await emcContainers.findOne({
      organizationId: orgId,
      id: flightId,
      type: 'Flight'
    }).lean()

    if (!flight) {
      throw new Error(`Flight not found: ${flightId}`)
    }
    console.log(`   ✅ Flight found: ${flight.label || flightId}`)

    // Step 2: Verify trolley exists
    console.log('\n🔍 Verifying trolley container...')
    const trolley = await emcContainers.findOne({
      organizationId: orgId,
      id: trolleyId,
      type: 'Trolley'
    }).lean()

    if (!trolley) {
      throw new Error(`Trolley not found: ${trolleyId}`)
    }
    console.log(`   ✅ Trolley found: ${trolley.label || trolleyId}`)

    // Step 3: Check if trolley is already associated to a flight
    console.log('\n🔍 Checking for existing associations...')
    const existingAssociation = await ContainerAssociation.findOne({
      organizationId: orgId,
      parentContainerType: 'Flight',
      childContainerIds: trolleyId,
      status: 'active'
    }).lean()

    if (existingAssociation) {
      throw new Error(`Trolley ${trolleyId} is already loaded to flight ${existingAssociation.parentContainerId}`)
    }
    console.log('   ✅ Trolley is not yet associated to any flight')

    // Step 4: Create or update association
    console.log('\n🔗 Creating association...')
    const association = await ContainerAssociation.findOneAndUpdate(
      {
        organizationId: orgId,
        parentContainerId: flightId,
        parentContainerType: 'Flight',
        actionId: 'LOAD_TROLLEY',
        status: 'active'
      },
      {
        $addToSet: { childContainerIds: trolleyId }, // Add trolley to existing association or create new
        $set: {
          actionLabel: 'Load Trolley to Flight',
          parentContainerLabel: flight.label || flightId,
          organizationId: orgId,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    )

    console.log(`   ✅ Association created/updated`)

    // Step 5: Log movement
    console.log('\n📝 Logging inventory movement...')
    const movement = await emcInventoryMovements.create({
      organizationId: orgId,
      containerId: trolleyId,
      containerType: 'Trolley',
      sourceContainer: trolleyId,
      sourceContainerType: 'Trolley',
      destinationContainer: flightId,
      destinationContainerType: 'Flight',
      movementType: 'LOAD_TO_FLIGHT',
      quantity: 1, // One trolley loaded
      performedBy: performedBy,
      performedAt: new Date(),
      remarks: `Loaded trolley ${trolleyId} to flight ${flightId}`
    })

    console.log(`   ✅ Movement logged`)

    console.log('\n' + '='.repeat(80))
    return {
      success: true,
      message: `Trolley ${trolleyId} successfully loaded to flight ${flightId}`,
      data: {
        association: association,
        movement: movement
      }
    }
  } catch (error) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ Error transferring trolley to flight')
    console.error('='.repeat(80))
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }

    return {
      success: false,
      message: 'Failed to transfer trolley to flight',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
