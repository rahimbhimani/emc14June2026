import type { IContainer } from '~/server/models/emcContainers'
import { emcContainers as EMCContainer } from '~/server/models/emcContainers'

export const seed_EMCContainers = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding EMC Containers...')

    // Delete existing data for organization 12313
    const deleteResult = await EMCContainer.deleteMany({ organizationId: 12313 })
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing container documents`)
    }

    // Hardcoded sample data
    const seedData: IContainer[] = [
      {
        id: 'WHDEL01',
        organizationId: 12313,
        label: 'Delhi Warehouse',
        category: 'Fixed',
        type: 'Warehouse',
        description: 'This holds eComm shipments',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
        specialHandlingNotes: 'Temperature controlled 18-25°C',
        typeData: {
          address: {
            address1: 'Rue 1',
            address2: 'Hubli',
            city: {
              id: '1123',
              code: 'DEL',
              name: 'Delhi'
            }
          },
          contactPerson: 'Rajesh Kumar',
          contactPhone: '+91-9876543210',
          operatingHours: 'Mon-Sun 08:00-22:00',
          capacity: {
            weight: 5000,
            volume: 2500,
            unitWeight: 'MT',
            unitVolume: 'CBM'
          }
        },
        actions: [
          {
            id: 'create',
            label: 'Create New',
            icon: 'mdi:plus',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
          },
          {
            id: 'attach',
            label: 'Attach Items',
            icon: 'mdi:link',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
          },
          {
            id: 'edit',
            label: 'Edit',
            icon: 'mdi:pencil',
            precondition: { lifecycle: ['Available', 'Maintenance'] },
            roles: [{ id: 9090, name: 'Admin' }]
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: 'mdi:trash-can',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }]
          }
        ]
      },
      {
        id: 'WHMUM02',
        organizationId: 12313,
        label: 'Mumbai Warehouse',
        category: 'Fixed',
        type: 'Warehouse',
        description: 'Western region fulfillment center',
        lifecycle: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
        typeData: {
          address: {
            address1: 'Port Avenue',
            address2: 'Mumbai',
            city: {
              id: '2001',
              code: 'BOM',
              name: 'Mumbai'
            }
          },
          contactPerson: 'Amit Patel',
          contactPhone: '+91-9123456789',
          operatingHours: 'Mon-Sat 06:00-20:00',
          capacity: {
            weight: 8000,
            volume: 4000,
            unitWeight: 'MT',
            unitVolume: 'CBM'
          }
        }
      },
      {
        id: 'ULD-001',
        organizationId: 12313,
        label: 'Standard ULD Container A',
        category: 'Mobile',
        type: 'ULD',
        description: 'Standard cargo container',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b',
        typeData: {
          dimensions: {
            length: 2.43,
            width: 1.56,
            height: 1.64
          },
          weight: 1500,
          capacity: {
            weight: 1500,
            volume: 6.2,
            unitWeight: 'KG',
            unitVolume: 'CBM'
          },
          material: 'Aluminum',
          manufactured: '2022-05-15'
        },
        actions: [
          {
            id: 'attach',
            label: 'Attach to Warehouse',
            icon: 'mdi:link',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
          },
          {
            id: 'loadItems',
            label: 'Load Items',
            icon: 'mdi:package',
            precondition: { lifecycle: ['Available', 'In Use'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9092, name: 'Operator' }]
          },
          {
            id: 'maintenance',
            label: 'Send to Maintenance',
            icon: 'mdi:wrench',
            precondition: { lifecycle: ['Available', 'In Use'] },
            roles: [{ id: 9090, name: 'Admin' }]
          }
        ]
      },
      {
        id: 'ULD-002',
        organizationId: 12313,
        label: 'Premium ULD Container B',
        category: 'Mobile',
        type: 'ULD',
        description: 'Premium insulated container for temperature-sensitive items',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b',
        typeData: {
          dimensions: {
            length: 2.43,
            width: 1.56,
            height: 1.64
          },
          weight: 2000,
          capacity: {
            weight: 1200,
            volume: 5.5,
            unitWeight: 'KG',
            unitVolume: 'CBM'
          },
          material: 'Fiberglass',
          manufactured: '2023-01-10',
          insulated: true,
          temperatureRange: '-20 to 8°C'
        }
      },
      {
        id: 'ULD-003',
        organizationId: 12313,
        label: 'Heavy Duty ULD Container C',
        category: 'Mobile',
        type: 'ULD',
        description: 'Heavy duty container for bulk items',
        lifecycle: 'CLOSED',
        imageUrl: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b',
        specialHandlingNotes: 'Currently under repair - wheel replacement in progress',
        typeData: {
          dimensions: {
            length: 3.0,
            width: 2.0,
            height: 2.0
          },
          weight: 3000,
          capacity: {
            weight: 2500,
            volume: 12.0,
            unitWeight: 'KG',
            unitVolume: 'CBM'
          },
          material: 'Steel',
          manufactured: '2021-08-20'
        }
      },
      {
        id: 'ITEM-SKU001',
        organizationId: 12313,
        label: 'Product',
        category: 'Product',
        type: 'Item',
        description: 'Dell XPS 15 Laptop',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b',
        typeData: {
          sku: 'SKU-DELL-XPS-15',
          barcode: '8675309123456',
          manufacturer: 'Dell Inc.',
          weight: 2.0,
          dimensions: {
            length: 0.35,
            width: 0.24,
            height: 0.02
          },
          category: 'Electronics',
          unitPrice: 1299.99,
          stock: 150
        },
        actions: [
          {
            id: 'viewDetails',
            label: 'View Details',
            icon: 'mdi:eye',
            precondition: { lifecycle: ['Available', 'In Use'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          },
          {
            id: 'transfer',
            label: 'Transfer',
            icon: 'mdi:arrow-right',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
          },
          {
            id: 'updateStock',
            label: 'Update Stock',
            icon: 'mdi:pencil',
            precondition: { lifecycle: ['Available', 'In Use'] },
            roles: [{ id: 9090, name: 'Admin' }]
          },
          {
            id: 'retire',
            label: 'Retire Item',
            icon: 'mdi:trash-can',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }]
          }
        ]
      },
      {
        id: 'ITEM-SKU002',
        organizationId: 12313,
        label: 'Product',
        category: 'Supplies',
        type: 'Item',
        description: '500 sheets A4 white paper ream',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b',
        typeData: {
          sku: 'SKU-PAPER-A4-500',
          barcode: '8675309654321',
          manufacturer: 'ITC Limited',
          weight: 2.5,
          dimensions: {
            length: 0.30,
            width: 0.21,
            height: 0.05
          },
          category: 'Office Supplies',
          unitPrice: 4.5,
          stock: 1200
        },
        actions: [
          {
            id: 'viewDetails',
            label: 'View Details',
            icon: 'mdi:eye',
            precondition: { lifecycle: ['Available', 'In Use'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          },
          {
            id: 'transfer',
            label: 'Transfer',
            icon: 'mdi:arrow-right',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          },
          {
            id: 'reorder',
            label: 'Reorder Stock',
            icon: 'mdi:plus-circle',
            precondition: { lifecycle: ['Available'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
          }
        ]
      },
      {
        id: 'FLIGHT-001',
        organizationId: 12313,
        label: 'Emirates Flight EK-501',
        category: 'Mobile',
        type: 'Flight',
        description: 'Daily scheduled flight from Dubai to London',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1552391881-721bd49ca88b',
        typeData: {
          flightNumber: 'EK-501',
          airline: 'Emirates',
          aircraft: 'Boeing 777',
          origin: 'DXB',
          destination: 'LHR',
          departureTime: '14:00',
          arrivalTime: '19:30',
          flightDate: '2026-02-23',
          capacity: {
            weight: 50000,
            volume: 150,
            unitWeight: 'KG',
            unitVolume: 'CBM'
          }
        },
        actions: [
          {
            id: 'loadTrolley',
            label: 'Load Trolley',
            icon: 'mdi:plus',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          },
          {
            id: 'viewDetails',
            label: 'View Details',
            icon: 'mdi:eye',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          }
        ]
      },
      {
        id: 'FLIGHT-002',
        organizationId: 12313,
        label: 'Air India Flight AI-302',
        category: 'Mobile',
        type: 'Flight',
        description: 'Daily scheduled flight from Mumbai to Singapore',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1552391881-721bd49ca88b',
        typeData: {
          flightNumber: 'AI-302',
          airline: 'Air India',
          aircraft: 'Airbus A350',
          origin: 'BOM',
          destination: 'SIN',
          departureTime: '22:30',
          arrivalTime: '04:15',
          flightDate: '2026-02-24',
          capacity: {
            weight: 45000,
            volume: 140,
            unitWeight: 'KG',
            unitVolume: 'CBM'
          }
        },
        actions: [
          {
            id: 'loadTrolley',
            label: 'Load Trolley',
            icon: 'mdi:plus',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          },
          {
            id: 'viewDetails',
            label: 'View Details',
            icon: 'mdi:eye',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          }
        ]
      },
      {
        id: 'TROLLEY-001',
        organizationId: 12313,
        label: 'Service Trolley A-100',
        category: 'Mobile',
        type: 'Trolley',
        description: 'Standard airline service trolley for beverages and snacks',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b',
        typeData: {
          trolleyCode: 'A-100',
          trolleyType: 'Beverage Service',
          capacity: {
            weight: 200,
            volume: 0.8,
            unitWeight: 'KG',
            unitVolume: 'CBM'
          },
          compartments: 3,
          lastMaintenance: '2026-02-15'
        },
        actions: [
          {
            id: 'loadItems',
            label: 'Load Items',
            icon: 'mdi:package',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          },
          {
            id: 'viewDetails',
            label: 'View Details',
            icon: 'mdi:eye',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          }
        ]
      },
      {
        id: 'TROLLEY-002',
        organizationId: 12313,
        label: 'Meal Service Trolley M-200',
        category: 'Mobile',
        type: 'Trolley',
        description: 'Premium meal service trolley for main course service',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1570710891163-6d3b5c47248b',
        typeData: {
          trolleyCode: 'M-200',
          trolleyType: 'Meal Service',
          capacity: {
            weight: 300,
            volume: 1.2,
            unitWeight: 'KG',
            unitVolume: 'CBM'
          },
          compartments: 4,
          lastMaintenance: '2026-02-18'
        },
        actions: [
          {
            id: 'loadItems',
            label: 'Load Items',
            icon: 'mdi:package',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          },
          {
            id: 'viewDetails',
            label: 'View Details',
            icon: 'mdi:eye',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          }
        ]
      },
      {
        id: 'CREW-001',
        organizationId: 12313,
        label: 'John Smith',
        category: 'Personnel',
        type: 'Crew',
        description: 'Senior Flight Attendant',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        typeData: {
          employeeId: 'EMP-2024-001',
          designation: 'Senior Flight Attendant',
          department: 'Cabin Crew',
          qualification: 'CRM Certified',
          joinDate: '2020-01-15',
          certifications: ['First Aid', 'Safety Training', 'CRM']
        },
        actions: [
          {
            id: 'assignToFlight',
            label: 'Assign to Flight',
            icon: 'mdi:airplane-check',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
          },
          {
            id: 'viewDetails',
            label: 'View Details',
            icon: 'mdi:eye',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          }
        ]
      },
      {
        id: 'CREW-002',
        organizationId: 12313,
        label: 'Sarah Johnson',
        category: 'Personnel',
        type: 'Crew',
        description: 'Flight Attendant',
        lifecycle: 'READY',
        imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
        typeData: {
          employeeId: 'EMP-2023-045',
          designation: 'Flight Attendant',
          department: 'Cabin Crew',
          qualification: 'CRM Certified',
          joinDate: '2023-06-20',
          certifications: ['First Aid', 'Safety Training']
        },
        actions: [
          {
            id: 'assignToFlight',
            label: 'Assign to Flight',
            icon: 'mdi:airplane-check',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }]
          },
          {
            id: 'viewDetails',
            label: 'View Details',
            icon: 'mdi:eye',
            precondition: { lifecycle: ['READY', 'ACTIVE'] },
            roles: [{ id: 9090, name: 'Admin' }, { id: 9091, name: 'Manager' }, { id: 9092, name: 'Operator' }]
          }
        ]
      }
    ]

    // Create and save the documents
    const result = await EMCContainer.insertMany(seedData)
    console.log(`✅ EMC Containers seeded successfully: ${result.length} containers created`)
  } catch (error) {
    console.error('❌ Error seeding EMC Containers:', error)
    throw error
  }
}
