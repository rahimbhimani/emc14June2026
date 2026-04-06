import { ContainerAssociation } from '~/server/models/ContainerAssociation'
import type { UserContext } from '~/types/emcContainer'

interface AssociationResponse {
    success: boolean
    data?: any[]
    error?: string
    message?: string
}

export default defineEventHandler(async (event): Promise<AssociationResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('🔵 [API] Get Container Associations Called')
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

        console.log('👤 User Context:', JSON.stringify(userContext, null, 2))

        // Get query parameters
        const query = getQuery(event)
        const parentContainerId = query.parentContainerId as string | undefined

        console.log('📦 Query params:', { parentContainerId })

        let queryObj: any = {
            organizationId: userContext.organizationId,
            status: 'active'
        }

        if (parentContainerId) {
            queryObj.parentContainerId = parentContainerId
            console.log('🔍 Looking up associations for parent:', parentContainerId)
        }

        console.log('📊 Database query object:', JSON.stringify(queryObj))

        // Debug: Check total associations in collection for this org
        const totalAssociations = await ContainerAssociation.countDocuments({ organizationId: userContext.organizationId })
        console.log(`📈 Total associations in DB for org ${userContext.organizationId}: ${totalAssociations}`)

        // Debug: Show all associations for this org
        if (totalAssociations > 0) {
            const allAssocs = await ContainerAssociation.find({ organizationId: userContext.organizationId }).lean()
            console.log('📋 All associations for this org:')
            allAssocs.forEach((assoc: any) => {
                console.log(`   - Parent: ${assoc.parentContainerId}, Children: ${assoc.childContainerIds?.join(', ')}`)
            })
        }

        const associations = await ContainerAssociation.find(queryObj).lean()

        console.log(`✅ Found ${associations?.length || 0} association(s) matching query`)

        if (associations && associations.length > 0) {
            console.log('   Associations:', JSON.stringify(associations.map(a => ({
                id: a._id,
                parentId: a.parentContainerId,
                childCount: a.childContainerIds?.length || 0,
                children: a.childContainerIds
            })), null, 2))
        }

        console.log('\n🎉 Returning associations')
        return {
            success: true,
            data: associations || [],
            message: `Found ${associations?.length || 0} association(s)`
        }
    } catch (error) {
        console.error('\n' + '='.repeat(80))
        console.error('❌ [API] Get Associations Error!')
        console.error('='.repeat(80))
        console.error('Error:', error)
        if (error instanceof Error) {
            console.error('Message:', error.message)
            console.error('Stack:', error.stack)
        }
        console.error('='.repeat(80))

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch associations'
        }
    }
})
