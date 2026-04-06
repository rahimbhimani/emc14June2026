import { updateContainerLifecycles } from '~/server/utils/updateContainerLifecycles'

export default defineEventHandler(async (event) => {
    try {
        console.log('=== Lifecycle Migration API Called ===')

        // Only allow POST requests for safety
        if (event.method !== 'POST') {
            return {
                success: false,
                error: 'Only POST requests are allowed for migration'
            }
        }

        // Execute the migration
        const result = await updateContainerLifecycles()

        return result
    } catch (error) {
        console.error('Error in migration API:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Migration failed'
        }
    }
})
