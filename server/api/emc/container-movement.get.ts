import { ContainerMovement } from '~/server/models/ContainerMovement'
import type { UserContext } from '~/types/emcContainer'

interface MovementResponse {
    success: boolean
    data?: any[]
    error?: string
}

export default defineEventHandler(async (event): Promise<MovementResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('📋 [API] Get Container Movement History')
        console.log('='.repeat(80))

        const userContext: UserContext = {
            id: 'user-123',
            organizationId: 12313,
            roles: [
                { id: 9090, name: 'Admin' },
                { id: 9091, name: 'Manager' },
            ],
        }

        const query = getQuery(event)
        const containerId = query.containerId as string | undefined

        console.log('🔍 Query params:', { containerId, orgId: userContext.organizationId })

        if (!containerId) {
            console.log('❌ Missing containerId parameter')
            return {
                success: false,
                error: 'Missing required query parameter: containerId',
            }
        }

        // Debug: Check total movements in DB
        const totalMovements = await ContainerMovement.countDocuments({
            organizationId: userContext.organizationId
        })
        console.log(`📊 Total movements in DB for org ${userContext.organizationId}: ${totalMovements}`)

        // Build query
        const searchQuery = {
            organizationId: userContext.organizationId,
            $or: [
                { childContainerId: containerId },
                { parentContainerId: containerId },
            ],
        }

        console.log('🔎 Search query:', JSON.stringify(searchQuery, null, 2))

        const movements = await ContainerMovement.find(searchQuery)
            .sort({ movedAt: -1, createdAt: -1 })
            .lean()

        console.log(`✅ Found ${movements?.length || 0} movements for container: ${containerId}`)

        if (movements && movements.length > 0) {
            console.log('📋 Movement details:')
            movements.slice(0, 5).forEach((m: any, idx: number) => {
                console.log(`   [${idx + 1}] Type: ${m.movementType} | Parent: ${m.parentContainerId} | Child: ${m.childContainerId} | Date: ${m.movedAt || m.createdAt}`)
            })
        }

        console.log('='.repeat(80))
        return {
            success: true,
            data: movements,
        }
    } catch (error) {
        console.error('❌ Container movement history API error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch movement history',
        }
    }
})
