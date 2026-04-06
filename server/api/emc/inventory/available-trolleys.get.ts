import { ContainerAssociation } from '~/server/models/ContainerAssociation'
import { emcContainers } from '~/server/models/emcContainers'
import type { UserContext } from '~/types/emcContainer'

interface AvailableTrolleysResponse {
    success: boolean
    data?: any[]
    error?: string
}

/**
 * Get all available trolleys that can be loaded into a flight
 * Returns trolleys that are not yet associated to a parent container
 * GET /api/emc/inventory/available-trolleys
 */
export default defineEventHandler(async (event): Promise<AvailableTrolleysResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('🚁 [API] Get Available Trolleys (for Flight Loading)')
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

        const orgId = userContext.organizationId
        console.log(`🔍 Fetching available trolleys for org: ${orgId}`)

        // Step 1: Get all trolleys in READY, ACTIVE, or DRAFT status
        console.log('📊 Fetching trolleys from database...')
        const allTrolleys = await emcContainers.find({
            organizationId: orgId,
            type: 'Trolley',
            lifecycle: { $in: ['READY', 'ACTIVE', 'DRAFT'] }
        }).lean()

        console.log(`   Found ${allTrolleys?.length || 0} trolleys`)

        if (!allTrolleys || allTrolleys.length === 0) {
            console.log('⚠️  No trolleys found')
            return {
                success: true,
                data: []
            }
        }

        // Step 2: Get all existing associations where trolley is a child of a Flight
        console.log('📌 Fetching existing flight-trolley associations...')
        const flightAssociations = await ContainerAssociation.find({
            organizationId: orgId,
            parentContainerType: 'Flight',
            status: 'active'
        }).lean()

        // Step 2B: Also get ALL associations to find items loaded into trolleys
        console.log('📌 Fetching all associations for item counting...')
        const allAssociations = await ContainerAssociation.find({
            organizationId: orgId,
            status: 'active'
        }).lean()

        // Create a set of trolley IDs that are already associated to flights
        const associatedTrolleyIds = new Set<string>()
        if (flightAssociations && flightAssociations.length > 0) {
            flightAssociations.forEach((assoc: any) => {
                if (assoc.childContainerIds && Array.isArray(assoc.childContainerIds)) {
                    assoc.childContainerIds.forEach((id: string) => {
                        associatedTrolleyIds.add(id)
                    })
                }
            })
        }

        console.log(`   Found ${associatedTrolleyIds.size} trolleys already in flights`)

        // Step 3: Filter out trolleys that are already associated
        const availableTrolleys = allTrolleys.filter(
            (trolley: any) => !associatedTrolleyIds.has(trolley.id)
        )

        console.log(`✅ Available trolleys: ${availableTrolleys.length}`)

        // Step 4: Get item count for each trolley
        console.log('📦 Fetching item counts for available trolleys...')
        const trolleysWithItemCount = availableTrolleys.map((trolley: any) => {
            // Count items associated to this trolley (where trolley is the parent container)
            const itemCount = allAssociations
                .filter((assoc: any) => assoc.parentContainerId === trolley.id && assoc.parentContainerType === 'Trolley')
                .reduce((count: number, assoc: any) => {
                    return count + (assoc.childContainerIds?.length || 0)
                }, 0)

            console.log(`   Trolley ${trolley.label}: ${itemCount} items`)

            return {
                _id: trolley._id?.toString(),
                trolleyId: trolley.id,
                trolleyLabel: trolley.label || trolley.id,
                type: trolley.type,
                lifecycle: trolley.lifecycle,
                itemsCount: itemCount,
                createdAt: trolley.createdAt,
                lastModified: trolley.lastModified
            }
        })

        console.log('📋 Sample available trolleys:')
        trolleysWithItemCount.slice(0, 3).forEach((trolley: any) => {
            console.log(`   - ${trolley.trolleyLabel} (${trolley.lifecycle}): ${trolley.itemsCount} items`)
        })

        console.log('\n' + '='.repeat(80))
        return {
            success: true,
            data: trolleysWithItemCount
        }
    } catch (error) {
        console.error('\n' + '='.repeat(80))
        console.error('❌ Error fetching available trolleys')
        console.error('='.repeat(80))
        console.error('Error:', error)
        if (error instanceof Error) {
            console.error('Message:', error.message)
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch available trolleys'
        }
    }
})
