import { getContainerTypeByKey } from '~/server/config/containerTypes'
import { Container } from '~/server/models/Container'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)

        const { typeKey, name, parentContainerId, attributes } = body

        // Validate required fields
        if (!typeKey || !name) {
            throw createError({
                statusCode: 400,
                message: 'Missing required fields: typeKey and name are required',
            })
        }

        // Validate type exists
        const containerType = getContainerTypeByKey(typeKey)
        if (!containerType) {
            throw createError({
                statusCode: 400,
                message: `Invalid typeKey: ${typeKey}`,
            })
        }

        // Validate required attributes
        const requiredAttrs = containerType.attributesSchema
            .filter(attr => attr.required && attr.section === 'primary')
            .map(attr => attr.key)

        const missingAttrs = requiredAttrs.filter(key => !attributes || !attributes[key])
        if (missingAttrs.length > 0) {
            throw createError({
                statusCode: 400,
                message: `Missing required attributes: ${missingAttrs.join(', ')}`,
            })
        }

        // If parentContainerId provided, validate it exists
        if (parentContainerId) {
            const parentExists = await Container.findById(parentContainerId)
            if (!parentExists) {
                throw createError({
                    statusCode: 404,
                    message: `Parent container not found: ${parentContainerId}`,
                })
            }

            // Validate parent allows this child type
            const parentType = getContainerTypeByKey(parentExists.typeKey)
            if (parentType && !parentType.allowedChildTypes.includes(typeKey)) {
                throw createError({
                    statusCode: 400,
                    message: `${containerType.label} cannot be placed in ${parentType.label}`,
                })
            }
        }

        // Get user info (in real app, from session/auth)
        // For now, using mock data
        const userId = 'current_user' // TODO: Get from auth session
        const organizationId = 'org-001' // TODO: Get from auth session

        // Create container
        const container = new Container({
            name,
            typeKey,
            parentContainerId: parentContainerId || null,
            fixed: containerType.fixedDefault,
            status: 'ACTIVE',
            attributes: attributes || {},
            organizationId,
            createdBy: userId,
        })

        await container.save()

        return {
            success: true,
            data: container.toObject(),
            message: `${containerType.label} created successfully`,
        }

    } catch (error: any) {
        console.error('Error creating container:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            message: error.message || 'Failed to create container',
        })
    }
})
