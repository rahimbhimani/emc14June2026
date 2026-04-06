import { seed_EMCContainers } from '~/server/utils/seedEMCContainers'
import { seed_OrganizationContainerConfigs } from '~/server/utils/seedOrganizationConfigs'

interface SeedResponse {
  success: boolean
  message: string
  data?: any
}

export default defineEventHandler(async (event): Promise<SeedResponse> => {
  try {
    console.log('🚀 Manual Database Seed Triggered')

    // Run seeds
    await seed_OrganizationContainerConfigs()
    await seed_EMCContainers()

    return {
      success: true,
      message: '✅ All seeds completed successfully'
    }
  } catch (error) {
    console.error('❌ Error during seed execution:', error)

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to seed database'
    }
  }
})
