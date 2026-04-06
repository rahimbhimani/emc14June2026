<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

/* ================= TYPES ================= */
type PlanningMode = 'FLIGHT' | 'TROLLEY'
type Step = 'SELECT_MODE' | 'SELECT_FLIGHT' | 'SELECT_TROLLEY' | 'ITEM_LOADING'
type FlightView = 'card' | 'grid'
type TrolleyView = 'card' | 'grid'

interface Flight {
  id: string
  flightNo: string
  route: string
  departure: string
  aircraft: string
  flightDate: string
  status?: string
}

interface Trolley {
  id: string
  code: string
  type: string
  capacity: number
  status: 'Available' | 'Under Planning' | 'Planned' | 'Onboard' | 'READY' | 'IN_USE'
  location?: string
  manufactureYear?: string
  flight?: string
  destination?: string
}

interface Item {
  id: string
  variantId?: string
  masterItemId?: string
  sku: string
  name: string
  masterName?: string
  category: string
  uom: string
  barcode: string
  manufacturer: string
  image: any
  quantity?: number
  stockStatus?: 'In Stock' | 'Out of Stock'
  loadingStatus?: 'Available' | 'Under Planning' | 'Planned'
  currentStock?: number
  variantDetails?: {
    size?: string
    color?: string
    weight?: string
  }
}

interface TrolleyLoadingStatus {
  [trolleyId: string]: number
}

/* ================= STATE ================= */
const step = ref<Step>('SELECT_MODE')
const selectedMode = ref<PlanningMode | null>(null)

const selectedFlight = ref<Flight | null>(null)
const selectedTrolley = ref<Trolley | null>(null)
const selectedTrolleys = ref<Trolley[]>([])
const selectedItems = ref<Item[]>([])

/* Flight UI */
const flightFilter = ref('')
const flightNumberFilter = ref('')
const flightDateFilter = ref('') // Empty by default to show all flights
const flightStatusFilter = ref<string[]>(['Available', 'Under Planning']) // Default to Available and Under Planning
const flightView = ref<FlightView>('card')

/* Trolley UI */
const trolleyFilter = ref('')
const trolleyFlightFilter = ref('')
const trolleyDestinationFilter = ref('')
const trolleyStatusFilter = ref<string[]>([])
const trolleyView = ref<TrolleyView>('card')

/* Lifecycle */
onMounted(() => {
  // Don't fetch flights on mount, only when user selects FLIGHT mode
})

/* Loading states */
const isLoadingFlights = ref(false)
const flightsError = ref<string | null>(null)
const isLoadingTrolleys = ref(false)
const trolleysError = ref<string | null>(null)
const isLoadingItems = ref(false)
const itemsError = ref<string | null>(null)
const isSavingAssociation = ref(false)
const saveAssociationError = ref<string | null>(null)
const isCompletingFlight = ref(false)
const completionError = ref<string | null>(null)
const isSavingItems = ref(false)
const saveItemsError = ref<string | null>(null)

/* ================= DATA ================= */
const flights = ref<Flight[]>([])
const trolleys = ref<Trolley[]>([])
const items = ref<Item[]>([])
const trolleyLoadingStatus = ref<TrolleyLoadingStatus>({})

/* Items UI */
const itemFilter = ref('')
const itemCategoryFilter = ref('')
const itemStockStatusFilter = ref<string[]>(['In Stock']) // Default to In Stock
const itemLoadingStatusFilter = ref<string[]>([])

/* ================= COMPUTED ================= */
const showLeftPanel = computed(() => step.value !== 'SELECT_MODE')

const activeSection = computed(() =>
  step.value === 'SELECT_FLIGHT'
    ? 'FLIGHT'
    : step.value === 'SELECT_TROLLEY'
      ? 'TROLLEY'
      : step.value === 'ITEM_LOADING'
        ? 'ITEM'
        : null
)

const filteredFlights = computed(() => {
  const q = flightFilter.value.toLowerCase()
  const fnq = flightNumberFilter.value.toLowerCase()

  // Convert date filter from YYYY-MM-DD to DD/MM/YYYY to match MongoDB format
  let formattedDateFilter = ''
  if (flightDateFilter.value) {
    const [year, month, day] = flightDateFilter.value.split('-')
    formattedDateFilter = `${day}/${month}/${year}`
  }

  return flights.value.filter(f => {
    const matchesText =
      !q ||
      f.flightNo.toLowerCase().includes(q) ||
      f.route.toLowerCase().includes(q)

    const matchesFlightNumber =
      !fnq || f.flightNo.toLowerCase().includes(fnq)

    const matchesDate =
      !formattedDateFilter || f.flightDate === formattedDateFilter

    const matchesStatus =
      flightStatusFilter.value.length === 0 ||
      (f.status && flightStatusFilter.value.includes(f.status))

    return matchesText && matchesFlightNumber && matchesDate && matchesStatus
  })
})

const filteredTrolleys = computed(() => {
  const q = trolleyFilter.value.toLowerCase()
  const flightQ = trolleyFlightFilter.value.toLowerCase()
  const destQ = trolleyDestinationFilter.value.toLowerCase()

  let filtered = trolleys.value.filter(t => {
    const matchesSearch =
      !q ||
      t.code.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.status.toLowerCase().includes(q) ||
      (t.location && t.location.toLowerCase().includes(q))

    const matchesFlight =
      !flightQ || (t.flight && t.flight.toLowerCase().includes(flightQ))

    const matchesDestination =
      !destQ || (t.destination && t.destination.toLowerCase().includes(destQ))

    const matchesStatus =
      trolleyStatusFilter.value.length === 0 ||
      (t.status && trolleyStatusFilter.value.includes(t.status))

    return matchesSearch && matchesFlight && matchesDestination && matchesStatus
  })

  // Sort: selected trolleys first, then others
  return filtered.sort((a, b) => {
    const aSelected = isTrolleySelected(a.id)
    const bSelected = isTrolleySelected(b.id)

    if (aSelected && !bSelected) return -1
    if (!aSelected && bSelected) return 1
    return 0
  })
})

const filteredItems = computed(() => {
  const q = itemFilter.value.toLowerCase()
  return items.value.filter(item => {
    const matchesText =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.barcode.toLowerCase().includes(q) ||
      item.manufacturer.toLowerCase().includes(q)

    const matchesCategory =
      !itemCategoryFilter.value || item.category === itemCategoryFilter.value

    const matchesStockStatus =
      itemStockStatusFilter.value.length === 0 ||
      (item.stockStatus && itemStockStatusFilter.value.includes(item.stockStatus))

    const matchesLoadingStatus =
      itemLoadingStatusFilter.value.length === 0 ||
      (item.loadingStatus && itemLoadingStatusFilter.value.includes(item.loadingStatus))

    return matchesText && matchesCategory && matchesStockStatus && matchesLoadingStatus
  })
})

const itemCategories = computed(() => {
  const categories = new Set(items.value.map(item => item.category))
  return Array.from(categories).sort()
})

const canCompleteFlight = computed(() => {
  if (!selectedFlight.value || selectedTrolleys.value.length === 0) return false
  // All selected trolleys must be in 'Planned' status
  return selectedTrolleys.value.every(t => t.status === 'Planned')
})

const isItemSelected = (itemId: string) => {
  return selectedItems.value.some(item => item.id === itemId)
}

const getItemQuantity = (itemId: string) => {
  const item = selectedItems.value.find(item => item.id === itemId)
  return item?.quantity || 1
}

/* ================= ACTIONS ================= */
const fetchPlanningData = async () => {
  console.log('fetchPlanningData called - fetching all data from single API')
  isLoadingFlights.value = true
  isLoadingTrolleys.value = true
  isLoadingItems.value = true
  flightsError.value = null
  trolleysError.value = null
  itemsError.value = null

  try {
    const response = await $fetch<any>('/api/planning/data')

    console.log('API Response:', response)

    if (response.success && response.data) {
      flights.value = response.data.flights || []
      trolleys.value = response.data.trolleys || []
      items.value = response.data.items || []
      trolleyLoadingStatus.value = response.data.trolleyLoadingStatus || {}

      console.log('Data loaded - Flights:', flights.value.length, 'Trolleys:', trolleys.value.length, 'Items:', items.value.length)
    } else {
      const error = response.error || 'Failed to fetch planning data'
      flightsError.value = error
      trolleysError.value = error
      itemsError.value = error
      console.error('Error fetching planning data:', error)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch planning data'
    flightsError.value = errorMsg
    trolleysError.value = errorMsg
    itemsError.value = errorMsg
    console.error('Error fetching planning data:', error)
  } finally {
    isLoadingFlights.value = false
    isLoadingTrolleys.value = false
    isLoadingItems.value = false
  }
}

const fetchTrolleyItemAssociations = async (trolleyId: string) => {
  console.log('Fetching existing item associations for trolley:', trolleyId)

  try {
    const response = await $fetch<any>(`/api/trolley-item?trolleyId=${trolleyId}`)

    console.log('Trolley-Item associations:', response)

    if (response.success && response.data.items) {
      // Pre-select the associated items with their quantities
      const associatedItems = response.data.items
      selectedItems.value = items.value
        .filter(item => associatedItems.some((ai: any) => ai.itemId === item.id))
        .map(item => {
          const assocItem = associatedItems.find((ai: any) => ai.itemId === item.id)
          return { ...item, quantity: assocItem?.quantity || 1 }
        })
      console.log('Pre-selected items:', selectedItems.value.length)
    }
  } catch (error) {
    console.error('Error fetching trolley-item associations:', error)
  }
}

const saveTrolleyItemAssociation = async () => {
  if (!selectedTrolley.value || selectedItems.value.length === 0) {
    console.log('No trolley or items selected')
    return false
  }

  console.log('Saving trolley-item association')
  isSavingItems.value = true
  saveItemsError.value = null

  try {
    const items = selectedItems.value.map(item => ({
      itemId: item.id,
      quantity: item.quantity || 1,
    }))

    const response = await $fetch<any>('/api/trolley-item', {
      method: 'POST',
      body: {
        trolleyId: selectedTrolley.value.id,
        items,
      },
    })

    console.log('Save response:', response)

    if (response.success) {
      // Update trolley status locally
      if (selectedTrolley.value) {
        selectedTrolley.value.status = 'Under Planning'
      }
      const trolley = trolleys.value.find(t => t.id === selectedTrolley.value?.id)
      if (trolley) {
        trolley.status = 'Under Planning'
      }
      // Update loading status
      trolleyLoadingStatus.value[selectedTrolley.value.id] = selectedItems.value.length
      console.log('Association saved successfully')
      return true
    } else {
      saveItemsError.value = response.error || 'Failed to save association'
      console.error('Error saving association:', response.error)
      return false
    }
  } catch (error) {
    saveItemsError.value = error instanceof Error ? error.message : 'Failed to save association'
    console.error('Error saving association:', error)
    return false
  } finally {
    isSavingItems.value = false
  }
}

const removeItemFromTrolley = async (itemId: string) => {
  if (!selectedTrolley.value) return

  if (!confirm('Are you sure you want to remove this item from the trolley?')) {
    return
  }

  console.log('Removing item from trolley:', itemId)

  try {
    const response = await $fetch<any>('/api/remove-trolley-item', {
      method: 'DELETE',
      body: {
        trolleyId: selectedTrolley.value.id,
        itemId,
      },
    })

    if (response.success) {
      // Remove from selected items
      selectedItems.value = selectedItems.value.filter(item => item.id !== itemId)

      // If no items remain, update trolley status to READY
      if (response.data.remainingItems === 0 && selectedTrolley.value) {
        selectedTrolley.value.status = 'READY'
        const trolley = trolleys.value.find(t => t.id === selectedTrolley.value?.id)
        if (trolley) {
          trolley.status = 'READY'
        }
      }

      // Update loading status
      trolleyLoadingStatus.value[selectedTrolley.value.id] = response.data.remainingItems

      console.log('Item removed successfully')
    } else {
      alert('Failed to remove item: ' + response.error)
    }
  } catch (error) {
    console.error('Error removing item:', error)
    alert('Failed to remove item')
  }
}

const toggleItem = (item: Item) => {
  const index = selectedItems.value.findIndex(i => i.id === item.id)
  if (index > -1) {
    // Remove if already selected
    selectedItems.value.splice(index, 1)
  } else {
    // Add if not selected with default quantity of 1
    selectedItems.value.push({ ...item, quantity: 1 })
  }
}

const updateItemQuantity = (itemId: string, quantity: number) => {
  const item = selectedItems.value.find(i => i.id === itemId)
  if (item) {
    // Get the original item to check current stock
    const originalItem = items.value.find(i => i.id === itemId)
    const maxQuantity = originalItem?.currentStock || 999999

    // Ensure quantity is at least 1 and not more than current stock
    item.quantity = Math.max(1, Math.min(quantity, maxQuantity))
  }
}

const fetchFlightTrolleyAssociations = async (flightId: string) => {
  console.log('Fetching existing trolley associations for flight:', flightId)

  try {
    const response = await $fetch<any>(`/api/flight-trolley?flightId=${flightId}`)

    console.log('Flight-Trolley associations:', response)

    if (response.success && response.data.trolleyIds) {
      // Pre-select the associated trolleys
      const associatedTrolleyIds = response.data.trolleyIds
      selectedTrolleys.value = trolleys.value.filter(t =>
        associatedTrolleyIds.includes(t.id)
      )
      console.log('Pre-selected trolleys:', selectedTrolleys.value.length)
    }
  } catch (error) {
    console.error('Error fetching flight-trolley associations:', error)
  }
}

const fetchItems = async () => {
  // Items are already loaded from unified fetch, no need to fetch separately
  console.log('Items already loaded from unified fetch:', items.value.length)
}

const saveFlightTrolleyAssociation = async () => {
  if (!selectedFlight.value || selectedTrolleys.value.length === 0) {
    console.log('No flight or trolleys selected')
    return false
  }

  console.log('Saving flight-trolley association')
  isSavingAssociation.value = true
  saveAssociationError.value = null

  try {
    const trolleyIds = selectedTrolleys.value.map(t => t.id)

    const response = await $fetch<any>('/api/flight-trolley', {
      method: 'POST',
      body: {
        flightId: selectedFlight.value.id,
        trolleyIds,
      },
    })

    console.log('Save response:', response)

    if (response.success) {
      console.log('Association saved successfully')
      return true
    } else {
      saveAssociationError.value = response.error || 'Failed to save association'
      console.error('Error saving association:', response.error)
      return false
    }
  } catch (error) {
    saveAssociationError.value = error instanceof Error ? error.message : 'Failed to save association'
    console.error('Error saving association:', error)
    return false
  } finally {
    isSavingAssociation.value = false
  }
}

const selectMode = (mode: PlanningMode) => {
  console.log('Mode selected:', mode)
  selectedMode.value = mode
  step.value = mode === 'FLIGHT' ? 'SELECT_FLIGHT' : 'SELECT_TROLLEY'

  // Fetch all planning data once when entering workflow
  if (!flights.value.length && !trolleys.value.length) {
    console.log('Calling fetchPlanningData...')
    fetchPlanningData()
  }
}

const selectFlight = async (flight: Flight) => {
  selectedFlight.value = flight
  selectedTrolleys.value = [] // Clear previous selections
  step.value = 'SELECT_TROLLEY'

  // All data is already loaded, no need to fetch trolleys
  console.log('Flight selected:', flight.flightNo)

  // If flight is "Under Planning", fetch and pre-select associated trolleys
  if (flight.status === 'Under Planning') {
    await fetchFlightTrolleyAssociations(flight.id)
  }
}

const selectTrolley = async (trolley: Trolley) => {
  selectedTrolley.value = trolley
  selectedItems.value = [] // Clear previous selections
  step.value = 'ITEM_LOADING'

  // All items are already loaded, no need to fetch
  console.log('Trolley selected:', trolley.code)

  // Always fetch and pre-select associated items if any exist
  await fetchTrolleyItemAssociations(trolley.id)
}

const toggleTrolley = (t: Trolley) => {
  // Allow selection only if status is Available, READY, or Under Planning
  if (t.status !== 'READY' && t.status !== 'Available' && t.status !== 'Under Planning') return

  const index = selectedTrolleys.value.findIndex(trolley => trolley.id === t.id)
  if (index > -1) {
    // Remove if already selected
    selectedTrolleys.value.splice(index, 1)
  } else {
    // Add if not selected
    selectedTrolleys.value.push(t)
  }
}

const isTrolleySelected = (trolleyId: string) => {
  return selectedTrolleys.value.some(t => t.id === trolleyId)
}

const saveTrolleyPlanning = async () => {
  if (selectedTrolleys.value.length === 0) {
    alert('Please select at least one trolley')
    return
  }

  // Save flight-trolley association
  const saved = await saveFlightTrolleyAssociation()
  if (saved) {
    // Show success and reset to allow planning another flight
    alert(`Successfully planned ${selectedTrolleys.value.length} trolley(s) for flight ${selectedFlight.value?.flightNo}`)
    resetFlow()
  }
}

const completeFlightPlanning = async () => {
  if (!selectedFlight.value) {
    alert('No flight selected')
    return
  }

  if (!canCompleteFlight.value) {
    alert('All trolleys must be in "Planned" status before completing flight planning')
    return
  }

  console.log('Completing flight planning')
  isCompletingFlight.value = true
  completionError.value = null

  try {
    const response = await $fetch<any>('/api/update-flight-status', {
      method: 'PATCH',
      body: {
        flightId: selectedFlight.value.id,
        status: 'Planned',
      },
    })

    console.log('Complete response:', response)

    if (response.success) {
      alert(`Flight ${selectedFlight.value.flightNo} planning completed successfully!`)
      resetFlow()
    } else {
      completionError.value = response.error || 'Failed to complete flight planning'
      console.error('Error completing flight:', response.error)
    }
  } catch (error) {
    completionError.value = error instanceof Error ? error.message : 'Failed to complete flight planning'
    console.error('Error completing flight:', error)
  } finally {
    isCompletingFlight.value = false
  }
}

const updateTrolleyStatus = async (trolleyId: string, status: string) => {
  console.log('Updating trolley status:', trolleyId, status)

  try {
    const response = await $fetch<any>('/api/update-trolley-status', {
      method: 'PATCH',
      body: {
        trolleyId,
        status,
      },
    })

    if (response.success) {
      // Update local trolley status
      const trolley = trolleys.value.find(t => t.id === trolleyId)
      if (trolley) {
        trolley.status = status as any
      }
      // Also update in selected trolleys
      const selectedTrolley = selectedTrolleys.value.find(t => t.id === trolleyId)
      if (selectedTrolley) {
        selectedTrolley.status = status as any
      }
      console.log('Trolley status updated successfully')
    } else {
      alert('Failed to update trolley status: ' + response.error)
    }
  } catch (error) {
    console.error('Error updating trolley status:', error)
    alert('Failed to update trolley status')
  }
}

const removeTrolleyFromFlight = async (trolleyId: string) => {
  if (!selectedFlight.value) return

  if (!confirm('Are you sure you want to remove this trolley from the flight?')) {
    return
  }

  console.log('Removing trolley from flight:', trolleyId)

  try {
    const response = await $fetch<any>('/api/remove-flight-trolley', {
      method: 'DELETE',
      body: {
        flightId: selectedFlight.value.id,
        trolleyId,
      },
    })

    if (response.success) {
      // Remove from selected trolleys
      selectedTrolleys.value = selectedTrolleys.value.filter(t => t.id !== trolleyId)

      // Update trolley status in main list
      const trolley = trolleys.value.find(t => t.id === trolleyId)
      if (trolley) {
        trolley.status = 'READY'
      }

      // If no trolleys remain, update flight status to Available
      if (response.data.remainingTrolleys === 0 && selectedFlight.value) {
        selectedFlight.value.status = 'Available'
        // Data is already local, no need to refetch
      }

      console.log('Trolley removed successfully')
    } else {
      alert('Failed to remove trolley: ' + response.error)
    }
  } catch (error) {
    console.error('Error removing trolley:', error)
    alert('Failed to remove trolley')
  }
}

const resetFlow = () => {
  step.value = 'SELECT_MODE'
  selectedMode.value = null
  selectedFlight.value = null
  selectedTrolley.value = null
  selectedTrolleys.value = []
  selectedItems.value = []
  flightFilter.value = ''
  flightNumberFilter.value = ''
  flightDateFilter.value = ''
  flightStatusFilter.value = ['Available', 'Under Planning']
  trolleyFilter.value = ''
  trolleyFlightFilter.value = ''
  trolleyDestinationFilter.value = ''
  trolleyStatusFilter.value = []
  flightView.value = 'card'
  trolleyView.value = 'card'
  itemFilter.value = ''
  itemCategoryFilter.value = ''
  itemStockStatusFilter.value = ['In Stock']
  itemLoadingStatusFilter.value = []
  flights.value = []
  trolleys.value = []
  items.value = []
  trolleyLoadingStatus.value = {}
}

// Watch for filter changes and refetch data
let filterTimeout: NodeJS.Timeout
watch([flightFilter, flightNumberFilter, flightDateFilter, flightStatusFilter], () => {
  if (step.value === 'SELECT_FLIGHT') {
    clearTimeout(filterTimeout)
    filterTimeout = setTimeout(() => {
      // Filtering is done client-side via computed properties
      console.log('Flight filters changed, using computed filteredFlights')
    }, 500)
  }
})

// Watch for trolley filter changes
let trolleyFilterTimeout: NodeJS.Timeout
watch([trolleyFilter, trolleyFlightFilter, trolleyDestinationFilter, trolleyStatusFilter], () => {
  if (step.value === 'SELECT_TROLLEY') {
    clearTimeout(trolleyFilterTimeout)
    trolleyFilterTimeout = setTimeout(() => {
      // Filtering is done client-side via computed properties
      console.log('Trolley filters changed, using computed filteredTrolleys')
    }, 500)
  }
})

// Watch for item filter changes
let itemFilterTimeout: NodeJS.Timeout
watch([itemFilter, itemCategoryFilter, itemStockStatusFilter, itemLoadingStatusFilter], () => {
  if (step.value === 'ITEM_LOADING') {
    clearTimeout(itemFilterTimeout)
    itemFilterTimeout = setTimeout(() => {
      // Filtering is done client-side via computed properties
      console.log('Item filters changed, using computed filteredItems')
    }, 500)
  }
})
</script>

<template>
  <VContainer fluid>
    <VRow>

      <!-- LEFT PANEL -->
      <VCol v-if="showLeftPanel" cols="12" md="3">
        <VCard class="pa-4">
          <div class="text-h6 mb-4">Context</div>

          <VCard class="pa-2 mb-2">
            <strong>Mode</strong><br />{{ selectedMode }}
          </VCard>

          <VCard class="pa-2 mb-2" :color="activeSection === 'FLIGHT' ? 'primary-lighten-5' : undefined">
            <strong>Flight</strong><br />
            <span v-if="selectedFlight">{{ selectedFlight.flightNo }}</span>
            <em v-else>Selecting…</em>
          </VCard>

          <VCard class="pa-2 mb-2" :color="activeSection === 'TROLLEY' ? 'primary-lighten-5' : undefined">
            <strong>{{ selectedMode === 'FLIGHT' ? 'Trolleys' : 'Trolley' }}</strong><br />
            <span v-if="selectedMode === 'FLIGHT' && selectedTrolleys.length > 0">
              {{ selectedTrolleys.length }} selected
              <div class="text-caption mt-1">
                <div v-for="t in selectedTrolleys" :key="t.id">• {{ t.code }}</div>
              </div>
            </span>
            <span v-else-if="selectedMode === 'TROLLEY' && selectedTrolley">
              {{ selectedTrolley.code }}
            </span>
            <em v-else>Selecting…</em>
          </VCard>

          <VCard v-if="selectedMode === 'TROLLEY'" class="pa-2 mb-2"
            :color="activeSection === 'ITEM' ? 'primary-lighten-5' : undefined">
            <strong>Items</strong><br />
            <span v-if="selectedItems.length > 0">
              {{ selectedItems.length }} selected
              <div class="text-caption mt-1">
                <div v-for="item in selectedItems" :key="item.id">• {{ item.name }} (Qty: {{ item.quantity || 1 }})
                </div>
              </div>
            </span>
            <em v-else>Selecting…</em>
          </VCard>

          <VBtn block variant="outlined" color="error" @click="resetFlow">
            Change Selection
          </VBtn>
        </VCard>
      </VCol>

      <!-- RIGHT PANEL -->
      <VCol :md="showLeftPanel ? 9 : 12" cols="12">

        <!-- MODE -->
        <VRow v-if="step === 'SELECT_MODE'" justify="center">
          <VCol md="5">
            <VCard class="pa-6 text-center" hover @click="selectMode('FLIGHT')"
              style=" position: relative; overflow: hidden;cursor: pointer; min-block-size: 280px;">
              <div
                style="position: absolute; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); inset-block: 0; inset-inline: 0; opacity: 0.1;">
              </div>
              <div style="position: relative; z-index: 1;">
                <div class="mb-4"
                  style=" display: flex; align-items: center; justify-content: center; border-radius: 50%;background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); block-size: 120px; inline-size: 120px; margin-block: 0; margin-inline: auto;">
                  <VIcon size="64" icon="mdi:airplane-takeoff" color="white" />
                </div>
                <div class="text-h5 font-weight-bold mb-2">Plan for Flight</div>
                <div class="text-body-2 text-medium-emphasis">Assign trolleys to flights and manage flight planning
                </div>
              </div>
            </VCard>
          </VCol>
          <VCol md="5">
            <VCard class="pa-6 text-center" hover @click="selectMode('TROLLEY')"
              style=" position: relative; overflow: hidden;cursor: pointer; min-block-size: 280px;">
              <div
                style="position: absolute; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); inset-block: 0; inset-inline: 0; opacity: 0.1;">
              </div>
              <div style="position: relative; z-index: 1;">
                <div class="mb-4"
                  style=" display: flex; align-items: center; justify-content: center; border-radius: 50%;background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); block-size: 120px; inline-size: 120px; margin-block: 0; margin-inline: auto;">
                  <VIcon size="64" icon="mdi:cart-outline" color="white" />
                </div>
                <div class="text-h5 font-weight-bold mb-2">Plan for Trolley</div>
                <div class="text-body-2 text-medium-emphasis">Manage trolley assignments and inventory planning</div>
              </div>
            </VCard>
          </VCol>
        </VRow>

        <!-- FLIGHT SELECTION -->
        <template v-if="step === 'SELECT_FLIGHT'">
          <VCard class="mb-4">
            <VCardText>
              <VRow align="center">
                <VCol cols="12" md="3">
                  <VTextField v-model="flightFilter" label="Route" density="compact" clearable />
                </VCol>
                <VCol cols="12" md="3">
                  <VTextField v-model="flightNumberFilter" label="Flight Number" density="compact" clearable />
                </VCol>
                <VCol cols="12" md="2">
                  <VTextField v-model="flightDateFilter" type="date" label="Flight Date" density="compact" clearable />
                </VCol>
                <VCol cols="12" md="2">
                  <VSelect v-model="flightStatusFilter" :items="['Available', 'Under Planning', 'Planned']"
                    label="Status" density="compact" multiple chips clearable />
                </VCol>
                <VCol cols="12" md="2" class="text-right">
                  <VBtn icon="mdi:refresh" variant="tonal" size="small" :loading="isLoadingFlights"
                    @click="fetchPlanningData" class="me-2" />
                  <VBtnToggle v-model="flightView" divided density="compact">
                    <VBtn value="card" icon="mdi:view-grid" />
                    <VBtn value="grid" icon="mdi:view-list" />
                  </VBtnToggle>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Loading Indicator -->
          <VCard v-if="isLoadingFlights" class="mb-4">
            <VCardText class="text-center py-8">
              <VProgressCircular indeterminate color="primary" size="48" class="mb-4" />
              <div class="text-body-2 text-medium-emphasis">Loading flights from database...</div>
            </VCardText>
          </VCard>

          <!-- Error Display -->
          <VAlert v-else-if="flightsError" type="error" variant="tonal" class="mb-4">
            <strong>Error:</strong> {{ flightsError }}
          </VAlert>

          <!-- No Results -->
          <VAlert v-else-if="filteredFlights.length === 0" type="info" variant="tonal" class="mb-4">
            No flights found. Try adjusting your filters.
          </VAlert>

          <VRow v-else-if="flightView === 'card'">
            <VCol v-for="f in filteredFlights" :key="f.id" md="6" cols="12">
              <VCard class="mb-4" hover @click="selectFlight(f)">
                <VCardText>
                  <div class="d-flex justify-space-between align-center mb-2">
                    <div class="text-h6">{{ f.flightNo }}</div>
                    <VChip v-if="f.status" size="small"
                      :color="f.status === 'Available' ? 'success' : f.status === 'Under Planning' ? 'warning' : 'primary'"
                      variant="tonal">
                      {{ f.status }}
                    </VChip>
                  </div>
                  <div>{{ f.route }}</div>
                  <div class="text-caption">{{ f.flightDate }} • {{ f.departure }} • {{ f.aircraft }}</div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <VRow v-else>
            <VCol cols="12">
              <VCard v-for="f in filteredFlights" :key="f.id" class="mb-2" hover @click="selectFlight(f)">
                <VCardText class="d-flex justify-space-between align-center">
                  <div>
                    <strong>{{ f.flightNo }}</strong>
                    <span class="text-caption ms-2">{{ f.flightDate }} • {{ f.departure }}</span>
                  </div>
                  <VChip v-if="f.status" size="small"
                    :color="f.status === 'Available' ? 'success' : f.status === 'Under Planning' ? 'warning' : 'primary'"
                    variant="tonal">
                    {{ f.status }}
                  </VChip>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </template>

        <!-- TROLLEY SELECTION -->
        <template v-if="step === 'SELECT_TROLLEY'">
          <VCard class="mb-4">
            <VCardText>
              <VRow align="center">
                <VCol cols="12" md="2">
                  <VTextField v-model="trolleyFilter" label="Code/Type" density="compact" clearable />
                </VCol>
                <VCol cols="12" md="2">
                  <VTextField v-model="trolleyFlightFilter" label="Flight" density="compact" clearable />
                </VCol>
                <VCol cols="12" md="2">
                  <VTextField v-model="trolleyDestinationFilter" label="Destination" density="compact" clearable />
                </VCol>
                <VCol cols="12" md="3">
                  <VSelect v-model="trolleyStatusFilter" :items="['Available', 'Under Planning', 'Planned', 'Onboard']"
                    label="Status" density="compact" multiple chips clearable />
                </VCol>
                <VCol cols="12" md="3" class="text-right">
                  <VBtn icon="mdi:refresh" variant="tonal" size="small" :loading="isLoadingTrolleys"
                    @click="fetchPlanningData" class="me-2" />
                  <VBtnToggle v-model="trolleyView" divided density="compact">
                    <VBtn value="card" icon="mdi:view-grid" />
                    <VBtn value="grid" icon="mdi:view-list" />
                  </VBtnToggle>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Loading Indicator -->
          <VCard v-if="isLoadingTrolleys" class="mb-4">
            <VCardText class="text-center py-8">
              <VProgressCircular indeterminate color="primary" size="48" class="mb-4" />
              <div class="text-body-2 text-medium-emphasis">Loading trolleys from database...</div>
            </VCardText>
          </VCard>

          <!-- Error Display -->
          <VAlert v-else-if="trolleysError" type="error" variant="tonal" class="mb-4">
            <strong>Error:</strong> {{ trolleysError }}
          </VAlert>

          <!-- No Results -->
          <VAlert v-else-if="filteredTrolleys.length === 0" type="info" variant="tonal" class="mb-4">
            No trolleys found. Try adjusting your filters.
          </VAlert>

          <!-- Save Error -->
          <VAlert v-else-if="saveAssociationError" type="error" variant="tonal" class="mb-4" closable
            @click:close="saveAssociationError = null">
            <strong>Error:</strong> {{ saveAssociationError }}
          </VAlert>

          <VRow v-else-if="trolleyView === 'card'">
            <!-- Single-select trolleys (TROLLEY mode) -->
            <template v-if="selectedMode === 'TROLLEY'">
              <VCol v-for="t in filteredTrolleys" :key="t.id" md="6" cols="12">
                <VCard class="mb-4" hover @click="selectTrolley(t)">
                  <VCardText>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <div class="text-h6">{{ t.code }}</div>
                      <VChip v-if="t.status" size="small"
                        :color="t.status === 'Available' || t.status === 'READY' ? 'success' : t.status === 'Under Planning' ? 'warning' : 'primary'"
                        variant="tonal">
                        {{ t.status }}
                      </VChip>
                    </div>
                    <div>{{ t.type }}</div>
                    <div class="text-caption">Capacity: {{ t.capacity }}</div>
                    <div v-if="t.flight" class="text-caption">Flight: {{ t.flight }}</div>
                    <div v-if="t.destination" class="text-caption">Destination: {{ t.destination }}</div>
                    <div v-if="t.location" class="text-caption">Location: {{ t.location }}</div>
                    <div v-if="trolleyLoadingStatus[t.id]" class="text-caption mt-2">
                      <VChip size="x-small" color="info" variant="tonal">
                        <VIcon start size="x-small">mdi:package-variant</VIcon>
                        {{ trolleyLoadingStatus[t.id] }} items loaded
                      </VChip>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </template>
            <!-- Multi-select trolleys (FLIGHT mode) -->
            <template v-else>
              <VCol v-for="t in filteredTrolleys" :key="t.id" md="4" cols="12">
                <VCard class="mb-4" :class="{ 'border-primary': isTrolleySelected(t.id) }"
                  :color="(t.status === 'READY' || t.status === 'Available') ? (isTrolleySelected(t.id) ? 'primary-lighten-5' : undefined) : 'grey-lighten-3'"
                  @click="toggleTrolley(t)" style=" border: 2px solid transparent;cursor: pointer;">
                  <VCardText>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <div class="text-h6">{{ t.code }}</div>
                      <VCheckbox :model-value="isTrolleySelected(t.id)"
                        :disabled="t.status !== 'READY' && t.status !== 'Available' && t.status !== 'Under Planning'"
                        hide-details density="compact" @click.stop @update:model-value="toggleTrolley(t)" />
                    </div>
                    <div>{{ t.type }}</div>
                    <div class="text-caption">{{ t.capacity }} • {{ t.status }}</div>
                    <div v-if="t.flight" class="text-caption">Flight: {{ t.flight }}</div>
                    <div v-if="t.destination" class="text-caption">Destination: {{ t.destination }}</div>
                    <div v-if="t.location" class="text-caption">Location: {{ t.location }}</div>
                    <div v-if="trolleyLoadingStatus[t.id]" class="text-caption mt-2">
                      <VChip size="x-small" color="info" variant="tonal">
                        <VIcon start size="x-small">mdi:package-variant</VIcon>
                        {{ trolleyLoadingStatus[t.id] }} items
                      </VChip>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </template>
          </VRow>

          <VRow v-else>
            <VCol cols="12">
              <!-- Single-select trolleys (TROLLEY mode) -->
              <template v-if="selectedMode === 'TROLLEY'">
                <VCard v-for="t in filteredTrolleys" :key="t.id" class="mb-2" hover @click="selectTrolley(t)">
                  <VCardText class="d-flex justify-space-between align-center">
                    <div>
                      <strong>{{ t.code }}</strong>
                      <span class="text-caption ms-2">{{ t.type }}{{ t.flight ? ' • ' + t.flight : '' }}{{ t.destination
                        ? ' • ' + t.destination : '' }}</span>
                    </div>
                    <VChip v-if="t.status" size="small"
                      :color="t.status === 'Available' || t.status === 'READY' ? 'success' : t.status === 'Under Planning' ? 'warning' : 'primary'"
                      variant="tonal">
                      {{ t.status }}
                    </VChip>
                  </VCardText>
                </VCard>
              </template>
              <!-- Multi-select trolleys (FLIGHT mode) -->
              <template v-else>
                <VCard v-for="t in filteredTrolleys" :key="t.id" class="mb-2"
                  :class="{ 'border-primary': isTrolleySelected(t.id) }"
                  :color="isTrolleySelected(t.id) ? 'primary-lighten-5' : undefined" @click="toggleTrolley(t)"
                  style=" border: 2px solid transparent;cursor: pointer;">
                  <VCardText class="d-flex justify-space-between align-center">
                    <div>
                      <strong>{{ t.code }}</strong>
                      <span class="text-caption ms-2">{{ t.type }} • {{ t.status }}</span>
                    </div>
                    <VCheckbox :model-value="isTrolleySelected(t.id)"
                      :disabled="t.status !== 'READY' && t.status !== 'Available' && t.status !== 'Under Planning'"
                      hide-details density="compact" @click.stop @update:model-value="toggleTrolley(t)" />
                  </VCardText>
                </VCard>
              </template>
            </VCol>
          </VRow>

          <!-- Continue Button (only for FLIGHT mode) -->
          <VCard v-if="selectedMode === 'FLIGHT' && !isLoadingTrolleys && !trolleysError && filteredTrolleys.length > 0"
            class="mt-4">
            <VCardText>
              <div class="d-flex justify-space-between align-center mb-3">
                <div>
                  <strong>{{ selectedTrolleys.length }}</strong> trolley(s) selected
                </div>
                <VBtn color="primary" :disabled="selectedTrolleys.length === 0" :loading="isSavingAssociation"
                  @click="saveTrolleyPlanning">
                  Save Trolley Planning
                  <VIcon end>mdi:check</VIcon>
                </VBtn>
              </div>

              <!-- Trolley Status Management -->
              <div v-if="selectedFlight && selectedFlight.status === 'Under Planning' && selectedTrolleys.length > 0"
                class="mt-4">
                <VDivider class="mb-3" />
                <div class="text-subtitle-2 mb-2">Mark trolleys as planned:</div>
                <div class="d-flex flex-wrap gap-2">
                  <VChip v-for="t in selectedTrolleys" :key="t.id"
                    :color="t.status === 'Planned' ? 'success' : 'warning'" variant="tonal" closable
                    @click="updateTrolleyStatus(t.id, t.status === 'Planned' ? 'Under Planning' : 'Planned')"
                    @click:close.stop="removeTrolleyFromFlight(t.id)" style="cursor: pointer;">
                    {{ t.code }}: {{ t.status }}
                    <VIcon end size="small">{{ t.status === 'Planned' ? 'mdi:check-circle' : 'mdi:circle-outline' }}
                    </VIcon>
                  </VChip>
                </div>

                <!-- Complete Flight Button -->
                <div class="mt-4">
                  <VAlert v-if="completionError" type="error" variant="tonal" class="mb-3" closable
                    @click:close="completionError = null">
                    {{ completionError }}
                  </VAlert>
                  <VBtn block color="success" size="large" :disabled="!canCompleteFlight" :loading="isCompletingFlight"
                    @click="completeFlightPlanning">
                    Complete Flight Planning
                    <VIcon end>mdi:check-all</VIcon>
                  </VBtn>
                  <div v-if="!canCompleteFlight" class="text-caption text-center mt-2 text-warning">
                    All trolleys must be marked as "Planned" to complete
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </template>

        <!-- ITEM LOADING -->
        <template v-if="step === 'ITEM_LOADING'">
          <VCard class="mb-4">
            <VCardText>
              <div class="text-h6 mb-4">
                <span v-if="selectedMode === 'TROLLEY' && selectedTrolley">
                  Load Items for Trolley: {{ selectedTrolley.code }}
                </span>
                <span v-else>
                  Load Items for {{ selectedTrolleys.length }} Trolley(s)
                  <span v-if="selectedFlight" class="text-body-2 text-medium-emphasis ms-2">
                    (Flight: {{ selectedFlight.flightNo }})
                  </span>
                </span>
              </div>
              <VRow align="center">
                <VCol cols="12" md="3">
                  <VTextField v-model="itemFilter" label="Search (Name, SKU, Barcode)" density="compact" clearable />
                </VCol>
                <VCol cols="12" md="2">
                  <VSelect v-model="itemCategoryFilter" :items="['', ...itemCategories]" label="Category"
                    density="compact" clearable>
                    <template v-slot:item="{ item, props }">
                      <v-list-item v-bind="props">
                        {{ item.value || 'All Categories' }}
                      </v-list-item>
                    </template>
                    <template v-slot:selection="{ item }">
                      {{ item.value || 'All Categories' }}
                    </template>
                  </VSelect>
                </VCol>
                <VCol cols="12" md="2">
                  <VSelect v-model="itemStockStatusFilter" :items="['In Stock', 'Out of Stock']" label="Stock Status"
                    density="compact" multiple chips clearable />
                </VCol>
                <VCol cols="12" md="3">
                  <VSelect v-model="itemLoadingStatusFilter" :items="['Available', 'Under Planning', 'Planned']"
                    label="Loading Status" density="compact" multiple chips clearable />
                </VCol>
                <VCol cols="12" md="2" class="text-right">
                  <VBtn icon="mdi:refresh" variant="tonal" size="small" :loading="isLoadingItems"
                    @click="fetchPlanningData" />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Loading Indicator -->
          <VCard v-if="isLoadingItems" class="mb-4">
            <VCardText class="text-center py-8">
              <VProgressCircular indeterminate color="primary" size="48" class="mb-4" />
              <div class="text-body-2 text-medium-emphasis">Loading items from database...</div>
            </VCardText>
          </VCard>

          <!-- Error Display -->
          <VAlert v-else-if="itemsError" type="error" variant="tonal" class="mb-4">
            <strong>Error:</strong> {{ itemsError }}
          </VAlert>

          <!-- No Results -->
          <VAlert v-else-if="filteredItems.length === 0" type="info" variant="tonal" class="mb-4">
            No items found. Try adjusting your filters.
          </VAlert>

          <!-- Save Error -->
          <VAlert v-else-if="saveItemsError" type="error" variant="tonal" class="mb-4" closable
            @click:close="saveItemsError = null">
            <strong>Error:</strong> {{ saveItemsError }}
          </VAlert>

          <!-- Items List -->
          <VRow v-else>
            <VCol v-for="item in filteredItems" :key="item.id" cols="12" md="6" lg="4">
              <VCard class="mb-3" hover :class="{ 'border-primary': isItemSelected(item.id) }"
                :color="isItemSelected(item.id) ? 'primary-lighten-5' : undefined"
                style="border: 2px solid transparent;">
                <VCardText>
                  <div class="d-flex justify-space-between align-start mb-2">
                    <div>
                      <div class="text-h6">{{ item.name }}</div>
                      <div class="d-flex gap-1 mt-1 flex-wrap">
                        <VChip size="small" color="primary" variant="tonal">
                          {{ item.category }}
                        </VChip>
                        <VChip v-if="item.stockStatus" size="small"
                          :color="item.stockStatus === 'In Stock' ? 'success' : 'error'" variant="tonal">
                          {{ item.stockStatus }}
                        </VChip>
                        <VChip v-if="item.loadingStatus" size="small"
                          :color="item.loadingStatus === 'Available' ? 'info' : item.loadingStatus === 'Under Planning' ? 'warning' : 'primary'"
                          variant="tonal">
                          {{ item.loadingStatus }}
                        </VChip>
                      </div>
                    </div>
                    <VCheckbox :model-value="isItemSelected(item.id)" hide-details density="compact"
                      @update:model-value="toggleItem(item)" />
                  </div>
                  <VDivider class="my-2" />
                  <div class="text-caption">
                    <div><strong>SKU:</strong> {{ item.sku }}</div>
                    <div><strong>Barcode:</strong> {{ item.barcode }}</div>
                    <div><strong>UOM:</strong> {{ item.uom }}</div>
                    <div><strong>Manufacturer:</strong> {{ item.manufacturer }}</div>
                    <div v-if="item.currentStock !== undefined" class="text-success font-weight-bold mt-1">
                      <strong>Current Stock:</strong> {{ item.currentStock }}
                    </div>
                  </div>
                  <div v-if="isItemSelected(item.id)" class="mt-3">
                    <VTextField :model-value="getItemQuantity(item.id)" type="number" label="Quantity" density="compact"
                      min="1" :max="item.currentStock || 999999"
                      :hint="item.currentStock ? `Max: ${item.currentStock}` : ''" persistent-hint
                      @update:model-value="updateItemQuantity(item.id, Number($event))" />
                  </div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <!-- Item Management Controls -->
          <VCard v-if="!isLoadingItems && !itemsError && filteredItems.length > 0" class="mt-4">
            <VCardText>
              <div class="d-flex justify-space-between align-center mb-3">
                <div>
                  <strong>{{ selectedItems.length }}</strong> item(s) selected
                </div>
                <VBtn color="primary" :disabled="selectedItems.length === 0" :loading="isSavingItems"
                  @click="saveTrolleyItemAssociation">
                  Save Item Planning
                  <VIcon end>mdi:check</VIcon>
                </VBtn>
              </div>

              <!-- Selected Items Management -->
              <div
                v-if="selectedTrolley && (selectedTrolley.status === 'Under Planning' || selectedTrolley.status === 'Planned') && selectedItems.length > 0"
                class="mt-4">
                <VDivider class="mb-3" />
                <div class="text-subtitle-2 mb-2">Selected items:</div>
                <div class="d-flex flex-wrap gap-2">
                  <VChip v-for="item in selectedItems" :key="item.id" color="primary" variant="tonal" closable
                    @click:close.stop="removeItemFromTrolley(item.id)">
                    {{ item.name }} (Qty: {{ item.quantity || 1 }})
                  </VChip>
                </div>
              </div>
            </VCardText>
          </VCard>
        </template>

      </VCol>
    </VRow>
  </VContainer>
</template>
