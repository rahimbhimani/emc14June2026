import type { ContainerConfig } from '~/types/emcContainerConfig'

interface OrganizationContainerConfigs {
  organizationId: number
  configs: ContainerConfig[]
}

export const containerConfigs: OrganizationContainerConfigs[] = [
  {
    organizationId: 12313,
    configs: [
      {
        id: 'CONFIG-WAREHOUSE',
        label: 'Warehouse',
        organizationId: 12313,
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
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }]
          }
        },
        actions: [
          {
            id: 'create',
            label: 'Create New',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }]
          },
          {
            id: 'attach',
            label: 'Add Items',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }],
            attachableContainers: [
              { type: 'ULD', lifecycle: ['Available'] },
              { type: 'Item', lifecycle: ['Available'] }
            ]
          }
        ]
      },
      {
        id: 'CONFIG-ULD',
        label: 'ULD Container',
        organizationId: 12313,
        category: 'Mobile',
        type: 'ULD',
        description: 'Unit Load Device Container',
        icon: 'mdi:package-variant-closed',
        imageUrl: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b',
        canContain: ['Item'],
        masterActions: {
          Create: {
            id: 'create',
            label: 'Create New ULD',
            icon: 'mdi:plus',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
          }
        },
        actions: [
          {
            id: 'attach',
            label: 'Attach to Warehouse',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }],
            attachableContainers: [
              { type: 'Warehouse', lifecycle: ['Available'] }
            ]
          },
          {
            id: 'loadItems',
            label: 'Load Items',
            precondition: { lifecycle: ['Available', 'In Use'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9092, name: 'Operator' }]
          }
        ]
      },
      {
        id: 'CONFIG-ITEM',
        label: 'Item',
        organizationId: 12313,
        category: 'Product',
        type: 'Item',
        description: 'Product Item',
        icon: 'mdi:tag-multiple',
        imageUrl: 'https://images.unsplash.com/photo-1588872657378-c92197cc60db',
        canContain: [],
        masterActions: {
          Create: {
            id: 'create',
            label: 'Create New Item',
            icon: 'mdi:plus',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }]
          }
        },
        actions: [
          {
            id: 'viewDetails',
            label: 'View Details',
            precondition: { lifecycle: ['Available', 'In Use'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          },
          {
            id: 'transfer',
            label: 'Transfer',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
          }
        ]
      },
      {
        id: 'CONFIG-FLIGHT',
        label: 'Flight',
        organizationId: 12313,
        category: 'Mobile',
        type: 'Flight',
        description: 'Aircraft Flight Container',
        icon: 'mdi:airplane',
        imageUrl: 'https://images.unsplash.com/photo-1552391881-721bd49ca88b',
        canContain: ['Trolley'],
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
        organizationId: 12313,
        category: 'Mobile',
        type: 'Trolley',
        description: 'Airline Trolley Container',
        icon: 'mdi:cart',
        imageUrl: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b',
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
            id: 'loadItems',
            label: 'Load Items',
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
        id: 'CONFIG-CREW',
        label: 'Crew',
        organizationId: 12313,
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
]

export const getConfigsByOrganization = (organizationId: number): ContainerConfig[] => {
  const orgConfigs = containerConfigs.find(org => org.organizationId === organizationId)
  return orgConfigs?.configs || []
}

export const getConfigByType = (type: string, organizationId: number): ContainerConfig | undefined => {
  const orgConfigs = containerConfigs.find(org => org.organizationId === organizationId)
  return orgConfigs?.configs.find(c => c.type === type)
}
