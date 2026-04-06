import { emcContainers } from '~/server/models/emcContainers'

export const updateContainerLifecycles = async (): Promise<any> => {
    try {
        console.log('🔄 Starting lifecycle migration...')

        // Define the mapping from old to new lifecycle values
        const lifecycleMapping: Record<string, string> = {
            'Available': 'READY',
            'In Progress': 'ACTIVE',
            'Attached': 'ACTIVE',
            'In Use': 'ACTIVE',
            'Maintenance': 'CLOSED',
            'Closed': 'CLOSED',
            'Archived': 'ARCHIVED'
        }

        const results = {
            total: 0,
            updated: 0,
            skipped: 0,
            details: [] as Array<{ id: string, from: string, to: string }>
        }

        // Find all containers
        const allContainers = await emcContainers.find({})
        results.total = allContainers.length

        console.log(`📊 Found ${results.total} containers to check`)

        for (const container of allContainers) {
            const currentLifecycle = container.lifecycle
            const newLifecycle = lifecycleMapping[currentLifecycle]

            if (newLifecycle && newLifecycle !== currentLifecycle) {
                // Update the container
                container.lifecycle = newLifecycle as any
                container.updatedAt = new Date()
                await container.save()

                results.updated++
                results.details.push({
                    id: container.id,
                    from: currentLifecycle,
                    to: newLifecycle
                })

                console.log(`✅ Updated ${container.id}: ${currentLifecycle} → ${newLifecycle}`)
            } else {
                results.skipped++
                console.log(`⏭️  Skipped ${container.id}: ${currentLifecycle} (already valid or no mapping)`)
            }
        }

        console.log('\n📈 Migration Summary:')
        console.log(`   Total containers: ${results.total}`)
        console.log(`   Updated: ${results.updated}`)
        console.log(`   Skipped: ${results.skipped}`)

        return {
            success: true,
            message: 'Lifecycle migration completed successfully',
            results
        }
    } catch (error) {
        console.error('❌ Error during lifecycle migration:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            error
        }
    }
}
