import { emcContainers } from '~/server/models/emcContainers'
import { emcOrganizationContainerConfig } from '~/server/models/emcOrganizationContainerConfig'
import type { UserContext } from '~/types/emcContainer'

interface ConfigResponse {
  success: boolean
  data?: any
  error?: string
}

export default defineEventHandler(async (event): Promise<ConfigResponse> => {
  try {
    console.log('=== EMC Container Management API Called ===')

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
    const resourceType = query.type as string | undefined

    if (!resourceType) {
      return {
        success: false,
        error: 'Missing required query parameter: type'
      }
    }

    // Handle different resource types
    if (resourceType === 'organizationConfigs') {
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

      console.log('Organization configs found:', orgConfigs.configs?.length || 0)

      return {
        success: true,
        data: orgConfigs
      }
    }

    if (resourceType === 'containers') {
      // Get query filters (separate from resourceType)
      const lifecycle = query.lifecycle as string | undefined
      const containerType = query.containerType as string | undefined

      // Fetch containers for organization from database
      let query_obj: any = { organizationId: userContext.organizationId }

      if (lifecycle) {
        query_obj.lifecycle = lifecycle
      }

      if (containerType) {
        query_obj.type = containerType
      }

      console.log('Container query object:', query_obj)

      const containers = await emcContainers.find(query_obj).lean()

      console.log(`Containers found: ${containers.length}`)
      console.log(`   Organization filtering: org=${userContext.organizationId}`)
      if (containerType) {
        console.log(`   Type filtering: type=${containerType}`)
      }

      // Debug: Show all containers for this org/type
      containers.forEach((c: any) => {
        console.log(`     - ${c.id} (${c.type}) - lifecycle: ${c.lifecycle}, org: ${c.organizationId}`)
      })

      return {
        success: true,
        data: containers
      }
    }

    return {
      success: false,
      error: `Unknown resource type: ${resourceType}`
    }
  } catch (error) {
    console.error('Container Management API Error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch container management data'
    }
  }
})

