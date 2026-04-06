import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {

  return {
    success: true,
    containers: [
      {
        id: 'WH-001',
        label: 'Main Warehouse',
        type: 'Warehouse',
        category: 'Fixed',
        lifecycle: 'ACTIVE',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
        availableActions: [
          {
            id: 'stockreceipt',
            label: 'Stock Receipt in Warehouse',
            engineAction: 'STOCK_RECEIPT'
          },
          {
            id: 'viewDetails',
            label: 'View Details'
          }
        ]
      },
      {
        id: 'TROLLEY-001',
        label: 'Trolley 01',
        type: 'Trolley',
        category: 'Mobile',
        lifecycle: 'READY',
        imageUrl: '/images/emcImages/Trolley.jpg',
        availableActions: [
          {
            id: 'assignToFlight',
            label: 'Assign to Flight',
            engineAction: 'ASSIGN_TO_FLIGHT'
          },
          {
            id: 'startLoading',
            label: 'Start Loading',
            engineAction: 'START_LOADING'
          }
        ]
      },
      {
        id: 'FLIGHT-6E201',
        label: 'Flight 6E201',
        type: 'Flight',
        category: 'Mobile',
        lifecycle: 'ACTIVE',
        imageUrl: '/images/emcImages/Flight.jpg',
        availableActions: [
          {
            id: 'seal',
            label: 'Seal (Customs)',
            engineAction: 'SEAL_TROLLEY'
          },
          {
            id: 'close',
            label: 'Close Trolley',
            engineAction: 'CLOSE_TROLLEY'
          }
        ]
      },
      {
        id: 'ITEM-123',
        label: 'Perfume Bottle 100ml',
        type: 'Item',
        category: 'Product',
        lifecycle: 'READY',
        imageUrl: '/images/emcImages/Items.jpg',
        availableActions: [
          {
            id: 'transferItem',
            label: 'Transfer Item',
            engineAction: 'TRANSFER_ITEM'
          }
        ]
      }
    ]
  }
})
