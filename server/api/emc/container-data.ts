import type { ContainerResponse, UserContext } from '~/types/emcContainer'
import { getContainersByOrganization } from '~/utils/emcContainerData'

export default defineEventHandler(async (event): Promise<ContainerResponse> => {
  try {
    console.log('=== EMC Container API Called ===')

    // Get user context from session/auth (mock for now)
    // In production, this would come from your auth system
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
    const filterType = query.type as string | undefined
    const lifecycle = query.lifecycle as string | undefined

    console.log('Query params:', { filterType, lifecycle })

    // Fetch containers for user's organization
    let containers = getContainersByOrganization(userContext.organizationId)

    console.log('Containers fetched for org:', containers.length)

    // Filter by type if provided
    if (filterType) {
      containers = containers.filter(c => c.type === filterType)
      console.log('Filtered by type:', containers.length)
    }

    // Filter by lifecycle if provided
    if (lifecycle) {
      containers = containers.filter(c => c.lifecycle === lifecycle)
      console.log('Filtered by lifecycle:', containers.length)
    }

    // Filter actions based on user roles
    const containersWithFilteredActions = containers.map(container => {
      if (!container.actions || container.actions.length === 0) {
        return {
          ...container,
          _hadActions: false
        }
      }

      const filteredActions = container.actions.filter(action => {
        // Check if user has required role for this action
        if (action.roles && action.roles.length > 0) {
          const hasRole = action.roles.some(role =>
            userContext.roles.some(userRole => userRole.id === role.id)
          )
          return hasRole
        }
        return true // If no roles specified, action is available to all
      })

      return {
        ...container,
        actions: filteredActions,
        _hadActions: true
      }
    })

    // Filter out containers that have no matching actions for user's roles
    const availableContainers = containersWithFilteredActions.filter((container: any) => {
      const hadActions = container._hadActions

      // If container originally had actions, user MUST have at least one matching action
      if (hadActions) {
        const hasMatchingActions = container.actions && container.actions.length > 0
        if (!hasMatchingActions) {
          console.log(`Container ${container.id} filtered out: had actions but no matching roles`)
        }
        return hasMatchingActions
      }

      // If container originally had no actions, check container-level roles only
      if (container.roles && container.roles.length > 0) {
        const hasRole = container.roles.some((role: any) =>
          userContext.roles.some(userRole => userRole.id === role.id)
        )
        if (!hasRole) {
          console.log(`Container ${container.id} filtered out: no matching container-level roles`)
        }
        return hasRole
      }

      // Container has no actions and no roles - exclude it
      console.log(`Container ${container.id} filtered out: no actions and no roles`)
      return false
    }).map((container: any) => {
      // Remove the tracking property before returning
      const { _hadActions, ...rest } = container
      return rest
    })

    console.log('Returning containers with filtered actions')
    console.log('Available Containers:', availableContainers.length)
    console.log('User Roles in API:', userContext.roles)

    // Log each container's actions for debugging
    availableContainers.forEach((c: any) => {
      console.log(`Container: ${c.id} (${c.label}) - Actions: ${c.actions?.length || 0}`)
      c.actions?.forEach((a: any) => {
        console.log(`  - Action: ${a.id} (${a.label}) - Required Roles: ${a.roles?.map((r: any) => r.id).join(', ')}`)
      })
    })
    console.log('Finally Available Containers:', availableContainers.length)
    return {
      success: true,
      data: availableContainers
    }
  } catch (error) {
    console.error('Container API error:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch containers'
    }
  }
})
