import { emcOrganizationContainerConfig } from '~/server/models/emcOrganizationContainerConfig'

export default defineEventHandler(async (event) => {
  try {
    console.log('🌱 Reseeding Organization Container Configs with new lifecycle values...')

    const organizationId = 12313

    // Delete existing data
    const deleteResult = await emcOrganizationContainerConfig.deleteMany({ organizationId })
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing config documents`)

    // New seed data with correct NEW lifecycle preconditions
    const seedData = {
      organizationId,
      configs: [
        {
          id: 'CONFIG-WAREHOUSE',
          label: 'Warehouse',
          organizationId,
          category: 'Fixed',
          type: 'Warehouse',
          description: 'Warehouse Management',
          icon: 'mdi:warehouse',
          imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
          canContain: ['ULD', 'Item'],
          masterActions: {
            Create: {
              id: 'create',
              label: 'Create New Warehouse',
              icon: 'mdi:plus',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }]
            }
          },
          actions: [
            {
              id: 'addItems',
              label: 'Add Items',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'viewDetails',
              label: 'View Details',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            }
          ]
        },
        {
          id: 'CONFIG-ULD',
          label: 'ULD Container',
          organizationId,
          category: 'Mobile',
          type: 'ULD',
          description: 'Unit Load Device Container',
          icon: 'mdi:package-variant-closed',
          imageUrl: '/images/emcImages/ULD.jpg',
          canContain: ['Item'],
          masterActions: {
            Create: {
              id: 'create',
              label: 'Create New ULD',
              icon: 'mdi:plus',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            }
          },
          actions: [
            {
              id: 'attachToWarehouse',
              label: 'Attach to Warehouse',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'loadItems',
              label: 'Load Items',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9092, name: 'Operator' }]
            }
          ]
        },
        {
          id: 'CONFIG-ITEM',
          label: 'Item',
          organizationId,
          category: 'Product',
          type: 'Item',
          description: 'Product Item',
          icon: 'mdi:tag-multiple',
          imageUrl: '/images/emcImages/Items.jpg',
          canContain: [],
          masterActions: {
            Create: {
              id: 'create',
              label: 'Create New Item',
              icon: 'mdi:plus',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }]
            }
          },
          actions: [
            {
              id: 'viewDetails',
              label: 'View Details',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
            },
            {
              id: 'transferItem',
              label: 'Transfer',
              precondition: { lifecycle: ['READY'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            }
          ]
        },
        {
          id: 'CONFIG-FLIGHT',
          label: 'Flight',
          organizationId,
          category: 'Mobile',
          type: 'Flight',
          description: 'Aircraft Flight Container',
          icon: 'mdi:airplane',
          imageUrl: '/images/emcImages/Flight.jpg',
          canContain: ['Trolley', 'Crew'],
          masterActions: {
            Create: {
              id: 'create',
              label: 'Create New Flight',
              icon: 'mdi:plus',
              precondition: { lifecycle: ['READY', 'ACTIVE', 'DRAFT'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            }
          },
          actions: [
            {
              id: 'attach',
              label: 'Attach',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'startLoading',
              label: 'Start Loading',
              precondition: { lifecycle: ['READY'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
            },
            {
              id: 'confirmLoad',
              label: 'Confirm Load',
              precondition: { lifecycle: ['ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
            },
            {
              id: 'seal',
              label: 'Seal Flight',
              precondition: { lifecycle: ['ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'open',
              label: 'Reopen Flight',
              precondition: { lifecycle: ['CLOSED'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'reconcile',
              label: 'Reconcile',
              precondition: { lifecycle: ['ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'close',
              label: 'Close Flight',
              precondition: { lifecycle: ['ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'loadTrolley',
              label: 'Load Trolley',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
            },
            {
              id: 'viewDetails',
              label: 'View Details',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
            }
          ]
        },
        {
          id: 'CONFIG-TROLLEY',
          label: 'Trolley',
          organizationId,
          category: 'Mobile',
          type: 'Trolley',
          description: 'Airline Trolley Container',
          icon: 'mdi:cart',
          imageUrl: '/images/emcImages/Trolley.jpg',
          canContain: ['Item'],
          masterActions: {
            Create: {
              id: 'create',
              label: 'Create New Trolley',
              icon: 'mdi:plus',
              precondition: { lifecycle: ['READY', 'ACTIVE', 'DRAFT'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            }
          },
          actions: [
            {
              id: 'attach',
              label: 'Attach to Flight',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'loadItems',
              label: 'Load Items',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
            },
            {
              id: 'seal',
              label: 'Seal Trolley',
              precondition: { lifecycle: ['ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'reconcile',
              label: 'Reconcile',
              precondition: { lifecycle: ['ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'close',
              label: 'Close Trolley',
              precondition: { lifecycle: ['ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'viewDetails',
              label: 'View Details',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
            }
          ]
        },
        {
          id: 'CONFIG-CREW',
          label: 'Crew',
          organizationId,
          category: 'Personnel',
          type: 'Crew',
          description: 'Flight Crew Member',
          icon: 'mdi:human-greeting',
          imageUrl: 'https://images.unsplash.com/photo-1552391881-721bd49ca88b',
          canContain: [],
          masterActions: {
            Create: {
              id: 'create',
              label: 'Add Crew Member',
              icon: 'mdi:plus',
              precondition: { lifecycle: ['READY', 'ACTIVE', 'DRAFT'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            }
          },
          actions: [
            {
              id: 'assignToFlight',
              label: 'Assign to Flight',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
            },
            {
              id: 'viewDetails',
              label: 'View Details',
              precondition: { lifecycle: ['READY', 'ACTIVE'] },
              roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
            }
          ]
        }
      ]
    }

    // Create new config document
    const result = await emcOrganizationContainerConfig.create(seedData)
    console.log('✅ Organization container configs reseeded successfully with NEW lifecycle preconditions:', result._id)

    return {
      success: true,
      message: 'Configs reseeded successfully',
      deletedCount: deleteResult.deletedCount,
      newConfigId: result._id,
      configsCount: result.configs.length
    }
  } catch (error) {
    console.error('❌ Error reseeding configs:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reseed configs'
    }
  }
})
