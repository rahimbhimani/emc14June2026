import { emcOrganizationContainerConfig } from '~/server/models/emcOrganizationContainerConfig'
import type { UserContext } from '~/types/emcContainer'

interface ConfigResponse {
  success: boolean
  data?: any
  error?: string
}

export default defineEventHandler(async (event): Promise<ConfigResponse> => {
  try {
    console.log('=== EMC Config API Called ===')

    // Get user context from session/auth (mock for now)
    const userContext: UserContext = {
      id: 'user-123',
      organizationId: 12313,
      roles: [
        { id: 9090, name: 'Admin' },
        { id: 9091, name: 'Manager' }
      ]
    }

    console.log('User Context:', userContext)

    // Get query parameters
    const query = getQuery(event)
    console.log('Query:', query)
    const configType = query.type as string | undefined

    if (!configType) {
      return {
        success: false,
        error: 'Missing required query parameter: type'
      }
    }

    // Handle different config types
    if (configType === 'organizationConfigs') {
      // Fetch organization container configs from database
      const orgConfigs = await emcOrganizationContainerConfig.findOne({
        organizationId: userContext.organizationId
      }).lean()

      if (!orgConfigs) {
        return {
          success: false,
          error: `No configuration found for organization ${userContext.organizationId}`
        }
      }

      console.log('Organization configs found:', orgConfigs)

      return {
        success: true,
        data: orgConfigs
      }
    }

    return {
      success: false,
      error: `Unknown config type: ${configType}`
    }
  } catch (error) {
    console.error('Config API Error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch configuration'
    }
  }
})
