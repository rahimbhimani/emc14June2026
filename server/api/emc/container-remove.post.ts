import { ContainerAssociation } from '~/server/models/ContainerAssociation'
import { emcContainers } from '~/server/models/emcContainers'
import { updateContainerStatus } from '~/server/utils/containerStatusManager'
import type { UserContext } from '~/types/emcContainer'

interface RemovePayload {
    parentContainerId: string
    childContainerId: string
    organizationId: string | number
}

interface RemoveResponse {
    success: boolean
    data?: any
    error?: string
    message?: string
}

export default defineEventHandler(async (event): Promise<RemoveResponse> => {
    try {
        console.log('\n' + '='.repeat(80))
        console.log('🔵 [API] EMC Container Remove Called')
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
        const body = await readBody<RemovePayload>(event)
        console.log('📦 Remove Payload:', JSON.stringify(body, null, 2))

        // Validate required fields
        if (!body.parentContainerId || !body.childContainerId) {
            console.log('❌ Validation failed: Missing required fields')
            return {
                success: false,
                error: 'Missing required fields: parentContainerId and childContainerId'
            }
        }

        console.log('✅ Validation passed')

        // Validate organization ID matches user's organization
        const orgId = typeof body.organizationId === 'string' ? parseInt(body.organizationId) : body.organizationId
        if (orgId !== userContext.organizationId && body.organizationId !== 'default') {
            console.log('❌ Organization mismatch')
            return {
                success: false,
                error: 'Unauthorized: Organization ID mismatch'
            }
        }

        console.log('🔍 Looking up parent container:', body.parentContainerId)
        const parentContainer = await emcContainers.findOne({
            id: body.parentContainerId,
            organizationId: userContext.organizationId,
        })

        console.log('🔍 Looking up child container:', body.childContainerId)
        const childContainer = await emcContainers.findOne({
            id: body.childContainerId,
            organizationId: userContext.organizationId,
        })

        if (!parentContainer || !childContainer) {
            console.log('❌ Parent found:', !!parentContainer, 'Child found:', !!childContainer)
            return {
                success: false,
                error: 'Parent or child container not found',
            }
        }

        console.log('✅ Both containers found')

        // Check if association exists
        const association = await ContainerAssociation.findOne({
            parentContainerId: body.parentContainerId,
            childContainerIds: body.childContainerId,
            organizationId: userContext.organizationId,
            status: 'active',
        })

        if (!association) {
            console.log('❌ Association not found')
            return {
                success: false,
                error: 'Association not found between parent and child containers',
            }
        }

        console.log('✅ Association found:', association._id)

        // Remove child from association FIRST so status manager can correctly count remaining children
        console.log('\n💾 Removing child ID from association document')
        await ContainerAssociation.updateOne(
            { _id: association._id },
            {
                $pull: { childContainerIds: body.childContainerId },
                $set: { updatedAt: new Date() },
            }
        )

        const refreshedAssociation = await ContainerAssociation.findById(association._id).lean()
        console.log('   Refreshed association childCount:', refreshedAssociation?.childContainerIds?.length || 0)

        if (refreshedAssociation && (!refreshedAssociation.childContainerIds || refreshedAssociation.childContainerIds.length === 0)) {
            console.log('✅ No more children, marking association as inactive')
            await ContainerAssociation.updateOne(
                { _id: association._id },
                { $set: { status: 'inactive', updatedAt: new Date() } }
            )
        }

        // NOW use status manager to handle status updates (after association is removed)
        console.log('\n🔧 Calling updateContainerStatus with action: Detach')
        const statusResult = await updateContainerStatus(
            body.childContainerId,
            'Detach',
            {
                id: userContext.id,
                name: userName,
                code: userCode,
            },
            body.parentContainerId,
            body.childContainerId
        )

        console.log('   Status result:', statusResult)

        if (!statusResult.success) {
            console.log('❌ Status update failed:', statusResult.message)
            return {
                success: false,
                error: statusResult.message,
            }
        }

        console.log('✅ Status updated successfully')

        console.log('✅ Association updated after detach:', association._id)

        // Return success response
        console.log('\n🎉 Returning success response')
        return {
            success: true,
            data: {
                parentContainerId: body.parentContainerId,
                childContainerId: body.childContainerId,
                updatedContainers: statusResult.updatedContainers,
                associationRemoved: true,
                message: statusResult.message,
            },
            message: 'Successfully detached container association'
        }
    } catch (error) {
        console.error('\n' + '='.repeat(80))
        console.error('❌ [API] Remove Container Error!')
        console.error('='.repeat(80))
        console.error('Error:', error)
        if (error instanceof Error) {
            console.error('Message:', error.message)
            console.error('Stack:', error.stack)
        }
        console.error('='.repeat(80))

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to detach container association'
        }
    }
})
