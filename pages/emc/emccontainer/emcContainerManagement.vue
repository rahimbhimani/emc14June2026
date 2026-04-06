<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

/* ================= TYPES ================= */
type ViewMode = 'hierarchy' | 'list' | 'cards'
type FilterMode = 'all' | 'type' | 'status' | 'parent'

interface ContainerInstance {
  id: string
  organizationId: string
  typeId: string
  type: string
  parentId?: string | null
  name: string
  code?: string
  status: 'Available' | 'In Progress' | 'Loaded' | 'DeCommissioned' | 'Out For Maintenance'
  attributes: Record<string, any>
  currentCapacity: {
    weight: number
    volume: number
    items: number
  }
  maxCapacity: {
    weight: number | null
    volume: number | null
    items: number | null
  }
  childCount?: number
  children?: ContainerInstance[]
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string
}

interface ContainerTypeConfig {
  id: string
  type: string
  label: string
  icon: string
  color: string
  movementType: 'Fixed' | 'Variable'
  allowedChildTypes: string[]
  canBeContainedIn: string[]
  customFields: CustomField[]
}

interface CustomField {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox'
  required: boolean
  options?: string[]
  defaultValue?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface TreeNode {
  id: string
  title: string
  value: string
  children?: TreeNode[]
  props?: any
}

/* ================= STATE ================= */
// Organization context
const currentOrganization = ref({
  id: 'org-001',
  name: 'Global Cargo Solutions',
  code: 'GCS'
})

// View state
const viewMode = ref<ViewMode>('hierarchy')
const searchQuery = ref('')
const selectedTypes = ref<string[]>([])
const selectedStatus = ref<string[]>([])
const expandedItems = ref<string[]>([])

// Dialog state
const createDialog = ref(false)
const detailDialog = ref(false)
const selectedInstance = ref<ContainerInstance | null>(null)
const selectedParent = ref<ContainerInstance | null>(null)

// Loading states
const isLoadingContainers = ref(false)
const isLoadingTypes = ref(false)
const isSaving = ref(false)

// Error states
const containersError = ref<string | null>(null)
const typesError = ref<string | null>(null)
const saveError = ref<string | null>(null)

// Data
const containerTypes = ref<ContainerTypeConfig[]>([])
const containerInstances = ref<ContainerInstance[]>([])

// Form state
const newInstance = ref({
  type: '',
  parentId: null as string | null,
  name: '',
  code: '',
  attributes: {} as Record<string, any>,
})

// Status configuration
const statusConfig: Record<string, { icon: string; color: string }> = {
  'Available': { icon: 'mdi:check-circle', color: 'success' },
  'In Progress': { icon: 'mdi:progress-clock', color: 'info' },
  'Loaded': { icon: 'mdi:package-variant', color: 'warning' },
  'DeCommissioned': { icon: 'mdi:archive', color: 'error' },
  'Out For Maintenance': { icon: 'mdi:tools', color: 'secondary' },
}

/* ================= LIFECYCLE ================= */
onMounted(async () => {
  await Promise.all([
    fetchContainerTypes(),
    fetchContainerInstances()
  ])
})

/* ================= COMPUTED ================= */
const selectedTypeConfig = computed(() => {
  if (!newInstance.value.type) return null
  return containerTypes.value.find(t => t.type === newInstance.value.type) || null
})

const availableParents = computed(() => {
  if (!selectedTypeConfig.value) return []

  const canBeContainedIn = selectedTypeConfig.value.canBeContainedIn
  if (canBeContainedIn.length === 0) return []

  return containerInstances.value.filter(inst =>
    canBeContainedIn.includes(inst.type) &&
    (inst.status === 'Available' || inst.status === 'In Progress')
  )
})

const stats = computed(() => {
  const total = containerInstances.value.length

  const byType = containerTypes.value.map(type => ({
    type: type.type,
    label: type.label,
    icon: type.icon,
    color: type.color,
    count: containerInstances.value.filter(i => i.type === type.type).length
  }))

  const byStatus = {
    available: containerInstances.value.filter(i => i.status === 'Available').length,
    inProgress: containerInstances.value.filter(i => i.status === 'In Progress').length,
    loaded: containerInstances.value.filter(i => i.status === 'Loaded').length,
    decommissioned: containerInstances.value.filter(i => i.status === 'DeCommissioned').length,
    maintenance: containerInstances.value.filter(i => i.status === 'Out For Maintenance').length,
  }

  // Calculate trends (mock - in real app, compare with previous period)
  const trends = {
    total: { value: 12, isPositive: true },
    available: { value: 8, isPositive: true },
    inProgress: { value: 3, isPositive: false },
    loaded: { value: 15, isPositive: true },
  }

  // Critical alerts
  const alerts = {
    highCapacity: containerInstances.value.filter(i =>
      i.maxCapacity.weight && (i.currentCapacity.weight / i.maxCapacity.weight) > 0.9
    ).length,
    maintenance: byStatus.maintenance,
    lowUtilization: containerInstances.value.filter(i =>
      i.maxCapacity.weight && (i.currentCapacity.weight / i.maxCapacity.weight) < 0.2
    ).length,
  }

  return { total, byType, byStatus, trends, alerts }
})

const hierarchicalData = computed(() => {
  const buildTree = (parentId: string | null): ContainerInstance[] => {
    const children = containerInstances.value.filter(i => i.parentId === parentId)
    return children.map(child => ({
      ...child,
      children: buildTree(child.id)
    }))
  }

  return buildTree(null)
})

const treeViewData = computed((): TreeNode[] => {
  const buildTreeNodes = (instances: ContainerInstance[]): TreeNode[] => {
    return instances.map(inst => ({
      id: inst.id,
      title: inst.name,
      value: inst.id,
      props: inst,
      children: inst.children && inst.children.length > 0 ? buildTreeNodes(inst.children) : undefined
    }))
  }

  return buildTreeNodes(hierarchicalData.value)
})

const filteredInstances = computed(() => {
  let filtered = containerInstances.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(inst =>
      inst.name.toLowerCase().includes(query) ||
      inst.code?.toLowerCase().includes(query) ||
      inst.type.toLowerCase().includes(query)
    )
  }

  // Type filter
  if (selectedTypes.value.length > 0) {
    filtered = filtered.filter(inst => selectedTypes.value.includes(inst.type))
  }

  // Status filter
  if (selectedStatus.value.length > 0) {
    filtered = filtered.filter(inst => selectedStatus.value.includes(inst.status))
  }

  return filtered
})

const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' || selectedTypes.value.length > 0 || selectedStatus.value.length > 0
})

/* ================= ACTIONS ================= */
async function fetchContainerTypes() {
  isLoadingTypes.value = true
  typesError.value = null

  try {
    // In real app: const response = await $fetch(`/api/organizations/${currentOrganization.value.id}/container-types`)
    // containerTypes.value = response

    // Mock data
    await new Promise(resolve => setTimeout(resolve, 500))
    containerTypes.value = [
      {
        id: 'ct-warehouse-001',
        type: 'Warehouse',
        label: 'Warehouse',
        icon: 'mdi:warehouse',
        color: 'primary',
        movementType: 'Fixed',
        allowedChildTypes: ['Location', 'ULD', 'Items'],
        canBeContainedIn: [],
        customFields: [
          { name: 'address', label: 'Address', type: 'textarea', required: true, defaultValue: '' },
          { name: 'managerId', label: 'Manager ID', type: 'text', required: false, defaultValue: '' },
          { name: 'securityLevel', label: 'Security Level', type: 'select', required: true, options: ['Standard', 'High', 'Maximum'], defaultValue: 'Standard' },
        ]
      },
      {
        id: 'ct-location-001',
        type: 'Location',
        label: 'Location',
        icon: 'mdi:map-marker',
        color: 'secondary',
        movementType: 'Fixed',
        allowedChildTypes: ['ULD', 'Items'],
        canBeContainedIn: ['Warehouse'],
        customFields: [
          { name: 'zone', label: 'Zone Code', type: 'text', required: true, defaultValue: '' },
          { name: 'aisle', label: 'Aisle Number', type: 'text', required: true, defaultValue: '' },
          { name: 'level', label: 'Storage Level', type: 'number', required: false, defaultValue: 1 },
          { name: 'locationType', label: 'Location Type', type: 'select', required: true, options: ['Rack', 'Bin', 'Pallet', 'Floor Space'], defaultValue: 'Rack' },
        ]
      },
      {
        id: 'ct-uld-001',
        type: 'ULD',
        label: 'ULD',
        icon: 'mdi:package',
        color: 'info',
        movementType: 'Variable',
        allowedChildTypes: ['Items'],
        canBeContainedIn: ['Warehouse', 'Location', 'Aircraft'],
        customFields: [
          { name: 'uldType', label: 'ULD Type', type: 'select', required: true, options: ['AKE', 'AKN', 'AKH', 'LD3', 'LD7', 'LD9', 'PMC'], defaultValue: 'AKE' },
          { name: 'serialNumber', label: 'Serial Number', type: 'text', required: true, defaultValue: '' },
          { name: 'condition', label: 'Physical Condition', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Needs Repair'], defaultValue: 'Good' },
        ]
      },
      {
        id: 'ct-aircraft-001',
        type: 'Aircraft',
        label: 'Aircraft',
        icon: 'mdi:airplane',
        color: 'warning',
        movementType: 'Variable',
        allowedChildTypes: ['ULD', 'Items'],
        canBeContainedIn: [],
        customFields: [
          { name: 'aircraftType', label: 'Aircraft Type', type: 'select', required: true, options: ['Boeing 747-8F', 'Boeing 777F', 'Airbus A330-200F'], defaultValue: 'Boeing 777F' },
          { name: 'registration', label: 'Aircraft Registration', type: 'text', required: true, defaultValue: '' },
          { name: 'flightNumber', label: 'Flight Number', type: 'text', required: false, defaultValue: '' },
        ]
      },
      {
        id: 'ct-items-001',
        type: 'Items',
        label: 'Items',
        icon: 'mdi:cube-outline',
        color: 'success',
        movementType: 'Variable',
        allowedChildTypes: [],
        canBeContainedIn: ['Warehouse', 'Location', 'ULD', 'Aircraft'],
        customFields: [
          { name: 'sku', label: 'SKU/Item Code', type: 'text', required: true, defaultValue: '' },
          { name: 'description', label: 'Item Description', type: 'textarea', required: false, defaultValue: '' },
          { name: 'weight', label: 'Weight (kg)', type: 'number', required: true, defaultValue: 0 },
          { name: 'hazmat', label: 'Hazardous Material', type: 'checkbox', required: false, defaultValue: false },
        ]
      },
    ]
  } catch (error: any) {
    typesError.value = error.message || 'Failed to load container types'
    console.error('Error fetching container types:', error)
  } finally {
    isLoadingTypes.value = false
  }
}

async function fetchContainerInstances() {
  isLoadingContainers.value = true
  containersError.value = null

  try {
    // In real app: const response = await $fetch(`/api/organizations/${currentOrganization.value.id}/containers`)
    // containerInstances.value = response

    // Mock data
    await new Promise(resolve => setTimeout(resolve, 800))
    containerInstances.value = [
      {
        id: 'inst-wh-001',
        organizationId: 'org-001',
        typeId: 'ct-warehouse-001',
        type: 'Warehouse',
        parentId: null,
        name: 'Dallas Central Warehouse',
        code: 'DFW-WH-01',
        status: 'Available',
        attributes: {
          address: '123 Airport Blvd, Dallas, TX 75261',
          managerId: 'MGR-001',
          securityLevel: 'High'
        },
        currentCapacity: { weight: 12500, volume: 2800, items: 150 },
        maxCapacity: { weight: 50000, volume: 10000, items: null },
        childCount: 3,
        createdBy: 'admin',
        createdAt: '2026-01-15T10:00:00Z',
        updatedAt: '2026-01-28T14:30:00Z',
      },
      {
        id: 'inst-wh-002',
        organizationId: 'org-001',
        typeId: 'ct-warehouse-001',
        type: 'Warehouse',
        parentId: null,
        name: 'Los Angeles Hub',
        code: 'LAX-WH-01',
        status: 'Available',
        attributes: {
          address: '456 Cargo Way, Los Angeles, CA 90045',
          managerId: 'MGR-002',
          securityLevel: 'Maximum'
        },
        currentCapacity: { weight: 28000, volume: 6500, items: 320 },
        maxCapacity: { weight: 50000, volume: 10000, items: null },
        childCount: 5,
        createdBy: 'admin',
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-01-30T16:45:00Z',
      },
      {
        id: 'inst-loc-001',
        organizationId: 'org-001',
        typeId: 'ct-location-001',
        type: 'Location',
        parentId: 'inst-wh-001',
        name: 'Zone A - Aisle 01 - Level 01',
        code: 'A-01-01',
        status: 'Available',
        attributes: {
          zone: 'A',
          aisle: '01',
          level: 1,
          locationType: 'Rack'
        },
        currentCapacity: { weight: 800, volume: 150, items: 12 },
        maxCapacity: { weight: 5000, volume: 500, items: 100 },
        childCount: 2,
        createdBy: 'warehouse_manager',
        createdAt: '2026-01-16T09:00:00Z',
        updatedAt: '2026-01-25T11:20:00Z',
      },
      {
        id: 'inst-loc-002',
        organizationId: 'org-001',
        typeId: 'ct-location-001',
        type: 'Location',
        parentId: 'inst-wh-001',
        name: 'Zone A - Aisle 01 - Level 02',
        code: 'A-01-02',
        status: 'Loaded',
        attributes: {
          zone: 'A',
          aisle: '01',
          level: 2,
          locationType: 'Rack'
        },
        currentCapacity: { weight: 4200, volume: 420, items: 45 },
        maxCapacity: { weight: 5000, volume: 500, items: 100 },
        childCount: 0,
        createdBy: 'warehouse_manager',
        createdAt: '2026-01-16T09:00:00Z',
        updatedAt: '2026-01-29T15:10:00Z',
      },
      {
        id: 'inst-loc-003',
        organizationId: 'org-001',
        typeId: 'ct-location-001',
        type: 'Location',
        parentId: 'inst-wh-001',
        name: 'Zone B - Aisle 05 - Level 01',
        code: 'B-05-01',
        status: 'In Progress',
        attributes: {
          zone: 'B',
          aisle: '05',
          level: 1,
          locationType: 'Pallet'
        },
        currentCapacity: { weight: 1500, volume: 300, items: 8 },
        maxCapacity: { weight: 5000, volume: 500, items: 100 },
        childCount: 1,
        createdBy: 'warehouse_manager',
        createdAt: '2026-01-18T10:30:00Z',
        updatedAt: '2026-01-27T13:45:00Z',
      },
      {
        id: 'inst-uld-001',
        organizationId: 'org-001',
        typeId: 'ct-uld-001',
        type: 'ULD',
        parentId: 'inst-loc-001',
        name: 'ULD-AKE-12345',
        code: 'AKE-12345',
        status: 'Loaded',
        attributes: {
          uldType: 'AKE',
          serialNumber: 'AKE12345GCS',
          condition: 'Good'
        },
        currentCapacity: { weight: 680, volume: 120, items: 24 },
        maxCapacity: { weight: 1500, volume: 150, items: 50 },
        childCount: 24,
        createdBy: 'cargo_handler',
        createdAt: '2026-01-20T12:00:00Z',
        updatedAt: '2026-01-26T14:20:00Z',
      },
      {
        id: 'inst-uld-002',
        organizationId: 'org-001',
        typeId: 'ct-uld-001',
        type: 'ULD',
        parentId: 'inst-loc-003',
        name: 'ULD-LD3-67890',
        code: 'LD3-67890',
        status: 'Loaded',
        attributes: {
          uldType: 'LD3',
          serialNumber: 'LD367890GCS',
          condition: 'Excellent'
        },
        currentCapacity: { weight: 1450, volume: 145, items: 18 },
        maxCapacity: { weight: 1500, volume: 150, items: 50 },
        childCount: 18,
        createdBy: 'cargo_handler',
        createdAt: '2026-01-22T11:00:00Z',
        updatedAt: '2026-01-28T16:30:00Z',
      },
    ]

    // Auto-expand root items
    expandedItems.value = containerInstances.value
      .filter(i => !i.parentId)
      .map(i => i.id)

  } catch (error: any) {
    containersError.value = error.message || 'Failed to load containers'
    console.error('Error fetching containers:', error)
  } finally {
    isLoadingContainers.value = false
  }
}

async function createInstance() {
  if (!selectedTypeConfig.value || !newInstance.value.name) return

  isSaving.value = true
  saveError.value = null

  try {
    const payload = {
      organizationId: currentOrganization.value.id,
      typeId: selectedTypeConfig.value.id,
      type: newInstance.value.type,
      parentId: newInstance.value.parentId,
      name: newInstance.value.name,
      code: newInstance.value.code,
      attributes: newInstance.value.attributes,
    }

    // In real app: const response = await $fetch(`/api/organizations/${currentOrganization.value.id}/containers`, {
    //   method: 'POST',
    //   body: payload
    // })

    // Mock
    await new Promise(resolve => setTimeout(resolve, 1000))
    const newInst: ContainerInstance = {
      id: `inst-${Date.now()}`,
      ...payload,
      status: 'Available',
      currentCapacity: { weight: 0, volume: 0, items: 0 },
      maxCapacity: { weight: null, volume: null, items: null },
      childCount: 0,
      createdBy: 'current_user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    containerInstances.value.push(newInst)

    // Expand parent if exists
    if (newInst.parentId && !expandedItems.value.includes(newInst.parentId)) {
      expandedItems.value.push(newInst.parentId)
    }

    createDialog.value = false
    resetForm()

  } catch (error: any) {
    saveError.value = error.message || 'Failed to create container'
    console.error('Error creating container:', error)
  } finally {
    isSaving.value = false
  }
}

async function updateInstanceStatus(instance: ContainerInstance, newStatus: string) {
  isSaving.value = true
  saveError.value = null

  try {
    // In real app: await $fetch(`/api/organizations/${currentOrganization.value.id}/containers/${instance.id}/status`, {
    //   method: 'PATCH',
    //   body: { status: newStatus }
    // })

    // Mock
    await new Promise(resolve => setTimeout(resolve, 500))
    const inst = containerInstances.value.find(i => i.id === instance.id)
    if (inst) {
      inst.status = newStatus as any
      inst.updatedAt = new Date().toISOString()
    }

  } catch (error: any) {
    saveError.value = error.message || 'Failed to update status'
    console.error('Error updating status:', error)
  } finally {
    isSaving.value = false
  }
}

async function deleteInstance(instance: ContainerInstance) {
  if (!confirm(`Are you sure you want to delete "${instance.name}"?`)) return

  isSaving.value = true
  saveError.value = null

  try {
    // In real app: await $fetch(`/api/organizations/${currentOrganization.value.id}/containers/${instance.id}`, {
    //   method: 'DELETE'
    // })

    // Mock
    await new Promise(resolve => setTimeout(resolve, 500))
    const index = containerInstances.value.findIndex(i => i.id === instance.id)
    if (index > -1) {
      containerInstances.value.splice(index, 1)
    }

    detailDialog.value = false
    selectedInstance.value = null

  } catch (error: any) {
    saveError.value = error.message || 'Failed to delete container'
    console.error('Error deleting container:', error)
  } finally {
    isSaving.value = false
  }
}

/* ================= METHODS ================= */
function getTypeConfig(type: string) {
  return containerTypes.value.find(t => t.type === type)
}

function getStatusColor(status: string) {
  return statusConfig[status]?.color || 'default'
}

function getStatusIcon(status: string) {
  return statusConfig[status]?.icon || 'mdi:help-circle'
}

function getCapacityPercentage(current: number, max: number | null) {
  if (!max || max === 0) return 0
  return Math.round((current / max) * 100)
}

function openCreateDialog(parent?: ContainerInstance) {
  selectedParent.value = parent || null
  resetForm()
  if (parent) {
    newInstance.value.parentId = parent.id
  }
  createDialog.value = true
}

function resetForm() {
  newInstance.value = {
    type: '',
    parentId: selectedParent.value?.id || null,
    name: '',
    code: '',
    attributes: {},
  }
  saveError.value = null
}

function onTypeSelected() {
  // Initialize attributes with default values
  if (selectedTypeConfig.value) {
    const attrs: Record<string, any> = {}
    selectedTypeConfig.value.customFields.forEach(field => {
      attrs[field.name] = field.defaultValue
    })
    newInstance.value.attributes = attrs
  }
}

function viewDetails(instance: ContainerInstance) {
  selectedInstance.value = instance
  detailDialog.value = true
}

function getParent(parentId: string | null) {
  if (!parentId) return null
  return containerInstances.value.find(i => i.id === parentId)
}

function getBreadcrumb(instance: ContainerInstance): ContainerInstance[] {
  const path: ContainerInstance[] = [instance]
  let current = instance

  while (current.parentId) {
    const parent = getParent(current.parentId)
    if (parent) {
      path.unshift(parent)
      current = parent
    } else {
      break
    }
  }

  return path
}

function clearFilters() {
  searchQuery.value = ''
  selectedTypes.value = []
  selectedStatus.value = []
}

function removeTypeFilter(type: string) {
  selectedTypes.value = selectedTypes.value.filter(t => t !== type)
}

function removeStatusFilter(status: string) {
  selectedStatus.value = selectedStatus.value.filter(s => s !== status)
}

function retryLoad() {
  if (containersError.value) {
    fetchContainerInstances()
  }
  if (typesError.value) {
    fetchContainerTypes()
  }
}

/* ================= WATCHERS ================= */
let filterTimeout: NodeJS.Timeout | null = null

watch([searchQuery, selectedTypes, selectedStatus], () => {
  if (filterTimeout) clearTimeout(filterTimeout)
  filterTimeout = setTimeout(() => {
    // In real app, refetch with filters
    // fetchContainerInstances()
  }, 500)
})
</script>

<template>
  <div class="container-management">
    <!-- Loading State -->
    <div v-if="isLoadingContainers && containerInstances.length === 0" class="d-flex justify-center align-center"
      style="min-block-size: 400px;">
      <div class="text-center">
        <VProgressCircular indeterminate color="primary" size="64" />
        <div class="text-h6 mt-4">Loading containers...</div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="containersError || typesError" class="pa-6">
      <VAlert type="error" variant="tonal" prominent>
        <VRow align="center">
          <VCol>
            <div class="text-h6 mb-2">Failed to Load Data</div>
            <div>{{ containersError || typesError }}</div>
          </VCol>
          <VCol cols="auto">
            <VBtn color="error" variant="outlined" @click="retryLoad">
              <VIcon start>mdi:refresh</VIcon>
              Retry
            </VBtn>
          </VCol>
        </VRow>
      </VAlert>
    </div>

    <!-- Main Content -->
    <VContainer v-else fluid class="pa-6">
      <!-- Header -->
      <VRow>
        <VCol cols="12">
          <div class="d-flex justify-space-between align-center mb-2">
            <div>
              <div class="d-flex align-center gap-3 mb-2">
                <h2 class="text-h4 font-weight-bold">Container Management</h2>
                <VChip color="primary" variant="tonal" size="small">
                  {{ currentOrganization.name }}
                </VChip>
              </div>
              <p class="text-body-1 text-medium-emphasis">
                Manage warehouses, locations, ULDs, aircraft, and items across your organization
              </p>
            </div>
            <div class="d-flex gap-2">
              <VBtn color="primary" prepend-icon="mdi:plus" @click="openCreateDialog()">
                Create Container
              </VBtn>
              <VBtn variant="outlined" prepend-icon="mdi:download">
                Export
              </VBtn>
            </div>
          </div>
        </VCol>
      </VRow>

      <!-- Stats Cards -->
      <VRow>
        <VCol cols="12" sm="6" md="3">
          <VCard class="stat-card" hover>
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis mb-1">Total Containers</div>
                  <div class="text-h4 font-weight-bold mb-1">{{ stats.total }}</div>
                  <div class="d-flex align-center gap-1">
                    <VIcon :color="stats.trends.total.isPositive ? 'success' : 'error'" size="16">
                      {{ stats.trends.total.isPositive ? 'mdi:trending-up' : 'mdi:trending-down'
                      }}
                    </VIcon>
                    <span class="text-caption" :class="stats.trends.total.isPositive ? 'text-success' : 'text-error'">
                      {{ stats.trends.total.value }}% this month
                    </span>
                  </div>
                </div>
                <VAvatar color="primary" variant="tonal" size="56" class="stat-icon">
                  <VIcon size="32">mdi:cube-outline</VIcon>
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="stat-card" hover>
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis mb-1">Available</div>
                  <div class="text-h4 font-weight-bold text-success mb-1">{{ stats.byStatus.available
                  }}</div>
                  <div class="d-flex align-center gap-1">
                    <VIcon :color="stats.trends.available.isPositive ? 'success' : 'error'" size="16">
                      {{ stats.trends.available.isPositive ? 'mdi:trending-up' :
                        'mdi:trending-down' }}
                    </VIcon>
                    <span class="text-caption"
                      :class="stats.trends.available.isPositive ? 'text-success' : 'text-error'">
                      {{ stats.trends.available.value }}% this month
                    </span>
                  </div>
                </div>
                <VAvatar color="success" variant="tonal" size="56" class="stat-icon">
                  <VIcon size="32">mdi:check-circle</VIcon>
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="stat-card" hover>
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis mb-1">In Progress</div>
                  <div class="text-h4 font-weight-bold text-info mb-1">{{ stats.byStatus.inProgress }}
                  </div>
                  <div class="d-flex align-center gap-1">
                    <VIcon :color="stats.trends.inProgress.isPositive ? 'success' : 'error'" size="16">
                      {{ stats.trends.inProgress.isPositive ? 'mdi:trending-up' :
                        'mdi:trending-down' }}
                    </VIcon>
                    <span class="text-caption"
                      :class="stats.trends.inProgress.isPositive ? 'text-success' : 'text-error'">
                      {{ stats.trends.inProgress.value }}% this month
                    </span>
                  </div>
                </div>
                <VAvatar color="info" variant="tonal" size="56" class="stat-icon">
                  <VIcon size="32">mdi:progress-clock</VIcon>
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <VCard class="stat-card" hover>
            <VCardText>
              <div class="d-flex justify-space-between align-center">
                <div class="flex-grow-1">
                  <div class="text-caption text-medium-emphasis mb-1">Loaded</div>
                  <div class="text-h4 font-weight-bold text-warning mb-1">{{ stats.byStatus.loaded }}
                  </div>
                  <div class="d-flex align-center gap-1">
                    <VIcon :color="stats.trends.loaded.isPositive ? 'success' : 'error'" size="16">
                      {{ stats.trends.loaded.isPositive ? 'mdi:trending-up' : 'mdi:trending-down'
                      }}
                    </VIcon>
                    <span class="text-caption" :class="stats.trends.loaded.isPositive ? 'text-success' : 'text-error'">
                      {{ stats.trends.loaded.value }}% this month
                    </span>
                  </div>
                </div>
                <VAvatar color="warning" variant="tonal" size="56" class="stat-icon">
                  <VIcon size="32">mdi:package-variant</VIcon>
                </VAvatar>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Critical Alerts -->
      <VRow v-if="stats.alerts.highCapacity > 0 || stats.alerts.maintenance > 0 || stats.alerts.lowUtilization > 0">
        <VCol cols="12">
          <VAlert color="warning" variant="tonal" prominent border="start">
            <VRow align="center">
              <VCol cols="12" md="auto">
                <div class="d-flex align-center gap-2">
                  <VIcon size="28">mdi:alert-circle</VIcon>
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">Critical Alerts</div>
                    <div class="text-caption">Containers requiring attention</div>
                  </div>
                </div>
              </VCol>
              <VCol>
                <div class="d-flex gap-4 flex-wrap">
                  <VChip v-if="stats.alerts.highCapacity > 0" color="error" variant="flat"
                    prepend-icon="mdi:gauge-full">
                    {{ stats.alerts.highCapacity }} High Capacity (>90%)
                  </VChip>
                  <VChip v-if="stats.alerts.maintenance > 0" color="warning" variant="flat" prepend-icon="mdi:tools">
                    {{ stats.alerts.maintenance }} Under Maintenance
                  </VChip>
                  <VChip v-if="stats.alerts.lowUtilization > 0" color="info" variant="flat"
                    prepend-icon="mdi:gauge-empty">
                    {{ stats.alerts.lowUtilization }} Low Utilization (<20%) </VChip>
                </div>
              </VCol>
            </VRow>
          </VAlert>
        </VCol>
      </VRow>

      <!-- Type Distribution -->
      <VRow>
        <VCol cols="12">
          <VCard>
            <VCardText>
              <div class="text-subtitle-2 font-weight-bold mb-3">Container Distribution by Type</div>
              <div class="d-flex gap-3 flex-wrap">
                <VChip v-for="typeStat in stats.byType" :key="typeStat.type" :color="typeStat.color"
                  :prepend-icon="typeStat.icon" variant="tonal" size="large">
                  <span class="font-weight-bold">{{ typeStat.count }}</span>
                  <span class="mx-1">{{ typeStat.label }}</span>
                </VChip>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Filters -->
      <VRow class="sticky-toolbar">
        <VCol cols="12">
          <VCard>
            <VCardText class="pa-4">
              <VRow align="center">
                <VCol cols="12" md="4">
                  <VTextField v-model="searchQuery" prepend-inner-icon="mdi:magnify" label="Search containers..."
                    variant="outlined" density="compact" clearable hide-details />
                </VCol>
                <VCol cols="12" md="3">
                  <VSelect v-model="selectedTypes" :items="containerTypes" item-title="label" item-value="type"
                    label="Filter by Type" variant="outlined" density="compact" multiple chips clearable hide-details />
                </VCol>
                <VCol cols="12" md="3">
                  <VSelect v-model="selectedStatus" :items="Object.keys(statusConfig)" label="Filter by Status"
                    variant="outlined" density="compact" multiple chips clearable hide-details />
                </VCol>
                <VCol cols="12" md="2" class="d-flex justify-end">
                  <VBtnToggle v-model="viewMode" variant="outlined" divided mandatory>
                    <VBtn value="hierarchy" size="small">
                      <VIcon>mdi:file-tree</VIcon>
                      <VTooltip activator="parent" location="top">Hierarchy View</VTooltip>
                    </VBtn>
                    <VBtn value="list" size="small">
                      <VIcon>mdi:format-list-bulleted</VIcon>
                      <VTooltip activator="parent" location="top">List View</VTooltip>
                    </VBtn>
                    <VBtn value="cards" size="small">
                      <VIcon>mdi:view-grid</VIcon>
                      <VTooltip activator="parent" location="top">Card View</VTooltip>
                    </VBtn>
                  </VBtnToggle>
                </VCol>
              </VRow>

              <!-- Active Filters -->
              <VRow v-if="hasActiveFilters" class="mt-2">
                <VCol cols="12">
                  <div class="d-flex align-center gap-2 flex-wrap">
                    <span class="text-caption text-medium-emphasis">Active filters:</span>
                    <VChip v-if="searchQuery" closable @click:close="searchQuery = ''" size="small" color="primary">
                      Search: "{{ searchQuery }}"
                    </VChip>
                    <VChip v-for="type in selectedTypes" :key="type" closable @click:close="removeTypeFilter(type)"
                      size="small" :color="getTypeConfig(type)?.color">
                      {{ getTypeConfig(type)?.label }}
                    </VChip>
                    <VChip v-for="status in selectedStatus" :key="status" closable
                      @click:close="removeStatusFilter(status)" size="small" color="secondary">
                      {{ status }}
                    </VChip>
                    <VBtn variant="text" size="small" color="error" @click="clearFilters">
                      Clear all
                    </VBtn>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Empty State -->
      <VRow v-if="filteredInstances.length === 0">
        <VCol cols="12">
          <VCard class="text-center pa-12">
            <VAvatar size="120" color="grey-lighten-3" class="mb-6">
              <VIcon size="80" color="grey-lighten-1">mdi:package-variant-closed</VIcon>
            </VAvatar>
            <h3 class="text-h5 font-weight-bold mb-3">
              {{ containerInstances.length === 0 ? 'No containers yet' : 'No containers found' }}
            </h3>
            <p class="text-body-1 text-medium-emphasis mb-6"
              style=" margin-block: 0; margin-inline: auto;max-inline-size: 500px;">
              <template v-if="containerInstances.length === 0">
                Get started by creating your first container. Containers help you organize and track
                your inventory across warehouses, locations, and ULDs.
              </template>
              <template v-else>
                Try adjusting your search criteria or filters to find what you're looking for.
              </template>
            </p>
            <div class="d-flex gap-3 justify-center">
              <VBtn v-if="containerInstances.length === 0" color="primary" size="large" prepend-icon="mdi:plus"
                @click="openCreateDialog()">
                Create Your First Container
              </VBtn>
              <VBtn v-else color="primary" variant="outlined" @click="clearFilters">
                Clear Filters
              </VBtn>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <!-- Hierarchy View -->
      <VRow v-if="viewMode === 'hierarchy' && filteredInstances.length > 0">
        <VCol cols="12">
          <VCard>
            <VCardText class="pa-0">
              <VTreeview :items="treeViewData" item-value="id" v-model:opened="expandedItems" open-all>
                <template #prepend="{ item }">
                  <VIcon :color="getTypeConfig(item.props.type)?.color" size="20">
                    {{ getTypeConfig(item.props.type)?.icon }}
                  </VIcon>
                </template>

                <template #title="{ item }">
                  <div class="d-flex align-center gap-2 flex-grow-1 py-2">
                    <div class="flex-grow-1">
                      <div class="d-flex align-center gap-2">
                        <span class="font-weight-medium">{{ item.props.name }}</span>
                        <VChip v-if="item.props.code" size="x-small" variant="outlined">
                          {{ item.props.code }}
                        </VChip>
                        <VChip :color="getStatusColor(item.props.status)" size="x-small" variant="tonal"
                          :prepend-icon="getStatusIcon(item.props.status)">
                          {{ item.props.status }}
                        </VChip>
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ getTypeConfig(item.props.type)?.label }}
                        <span v-if="item.props.childCount"> • {{ item.props.childCount }}
                          children</span>
                      </div>
                    </div>

                    <!-- Capacity -->
                    <div v-if="item.props.maxCapacity.weight" class="d-flex align-center gap-2">
                      <VTooltip location="top">
                        <template #activator="{ props: tooltipProps }">
                          <div v-bind="tooltipProps" style="inline-size: 80px;">
                            <VProgressLinear
                              :model-value="getCapacityPercentage(item.props.currentCapacity.weight, item.props.maxCapacity.weight)"
                              :color="getCapacityPercentage(item.props.currentCapacity.weight, item.props.maxCapacity.weight) > 80 ? 'error' : 'success'"
                              height="6" rounded />
                          </div>
                        </template>
                        <span>Weight: {{ item.props.currentCapacity.weight }} / {{
                          item.props.maxCapacity.weight }}
                          kg</span>
                      </VTooltip>
                    </div>

                    <!-- Actions -->
                    <div class="d-flex gap-1">
                      <VBtn icon size="x-small" variant="text" @click.stop="openCreateDialog(item.props)">
                        <VIcon size="18">mdi:plus</VIcon>
                        <VTooltip activator="parent" location="top">Add Child</VTooltip>
                      </VBtn>
                      <VBtn icon size="x-small" variant="text" @click.stop="viewDetails(item.props)">
                        <VIcon size="18">mdi:eye</VIcon>
                        <VTooltip activator="parent" location="top">View Details</VTooltip>
                      </VBtn>
                      <VMenu>
                        <template #activator="{ props: menuProps }">
                          <VBtn icon size="x-small" variant="text" v-bind="menuProps">
                            <VIcon size="18">mdi:dots-vertical</VIcon>
                          </VBtn>
                        </template>
                        <VList density="compact">
                          <VListItem v-if="item.props.status !== 'Available'"
                            @click="updateInstanceStatus(item.props, 'Available')">
                            <template #prepend>
                              <VIcon size="18">mdi:check-circle</VIcon>
                            </template>
                            <VListItemTitle>Make Available</VListItemTitle>
                          </VListItem>
                          <VListItem v-if="item.props.status === 'Available' || item.props.status === 'In Progress'"
                            @click="updateInstanceStatus(item.props, 'Loaded')">
                            <template #prepend>
                              <VIcon size="18">mdi:package-variant</VIcon>
                            </template>
                            <VListItemTitle>Load</VListItemTitle>
                          </VListItem>
                          <VListItem @click="updateInstanceStatus(item.props, 'Out For Maintenance')">
                            <template #prepend>
                              <VIcon size="18">mdi:tools</VIcon>
                            </template>
                            <VListItemTitle>Maintenance</VListItemTitle>
                          </VListItem>
                          <VListItem @click="viewDetails(item.props)">
                            <template #prepend>
                              <VIcon size="18">mdi:pencil</VIcon>
                            </template>
                            <VListItemTitle>Edit</VListItemTitle>
                          </VListItem>
                          <VDivider />
                          <VListItem @click="deleteInstance(item.props)" class="text-error">
                            <template #prepend>
                              <VIcon size="18">mdi:delete</VIcon>
                            </template>
                            <VListItemTitle>Delete</VListItemTitle>
                          </VListItem>
                        </VList>
                      </VMenu>
                    </div>
                  </div>
                </template>
              </VTreeview>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- List View -->
      <VRow v-if="viewMode === 'list' && filteredInstances.length > 0">
        <VCol cols="12">
          <VCard>
            <VTable>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Parent</th>
                  <th>Capacity</th>
                  <th>Children</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="instance in filteredInstances" :key="instance.id">
                  <td>
                    <VChip :color="getTypeConfig(instance.type)?.color"
                      :prepend-icon="getTypeConfig(instance.type)?.icon" size="small" variant="tonal">
                      {{ getTypeConfig(instance.type)?.label }}
                    </VChip>
                  </td>
                  <td class="font-weight-medium">{{ instance.name }}</td>
                  <td>
                    <VChip v-if="instance.code" size="small" variant="outlined">
                      {{ instance.code }}
                    </VChip>
                  </td>
                  <td>
                    <VChip :color="getStatusColor(instance.status)" size="small" variant="tonal"
                      :prepend-icon="getStatusIcon(instance.status)">
                      {{ instance.status }}
                    </VChip>
                  </td>
                  <td class="text-caption">
                    {{ getParent(instance.parentId)?.name || '-' }}
                  </td>
                  <td>
                    <div v-if="instance.maxCapacity.weight" class="d-flex align-center gap-2"
                      style="min-inline-size: 120px;">
                      <VProgressLinear
                        :model-value="getCapacityPercentage(instance.currentCapacity.weight, instance.maxCapacity.weight)"
                        :color="getCapacityPercentage(instance.currentCapacity.weight, instance.maxCapacity.weight) > 80 ? 'error' : 'success'"
                        height="6" rounded />
                      <span class="text-caption">
                        {{ getCapacityPercentage(instance.currentCapacity.weight,
                          instance.maxCapacity.weight) }}%
                      </span>
                    </div>
                    <span v-else class="text-caption text-medium-emphasis">N/A</span>
                  </td>
                  <td>
                    <VChip v-if="instance.childCount" size="small" variant="outlined">
                      {{ instance.childCount }}
                    </VChip>
                    <span v-else class="text-caption text-medium-emphasis">-</span>
                  </td>
                  <td class="text-caption">
                    {{ new Date(instance.updatedAt).toLocaleDateString() }}
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <VBtn icon size="x-small" variant="text" @click="viewDetails(instance)">
                        <VIcon size="18">mdi:eye</VIcon>
                      </VBtn>
                      <VMenu>
                        <template #activator="{ props: menuProps }">
                          <VBtn icon size="x-small" variant="text" v-bind="menuProps">
                            <VIcon size="18">mdi:dots-vertical</VIcon>
                          </VBtn>
                        </template>
                        <VList density="compact">
                          <VListItem @click="openCreateDialog(instance)">
                            <template #prepend>
                              <VIcon size="18">mdi:plus</VIcon>
                            </template>
                            <VListItemTitle>Add Child</VListItemTitle>
                          </VListItem>
                          <VListItem @click="viewDetails(instance)">
                            <template #prepend>
                              <VIcon size="18">mdi:pencil</VIcon>
                            </template>
                            <VListItemTitle>Edit</VListItemTitle>
                          </VListItem>
                        </VList>
                      </VMenu>
                    </div>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCard>
        </VCol>
      </VRow>

      <!-- Card View -->
      <VRow v-if="viewMode === 'cards' && filteredInstances.length > 0">
        <VCol v-for="instance in filteredInstances" :key="instance.id" cols="12" sm="6" lg="4" xl="3">
          <VCard hover @click="viewDetails(instance)" class="h-100">
            <VCardText>
              <div class="d-flex align-center mb-3">
                <VAvatar :color="getTypeConfig(instance.type)?.color" size="40" class="me-3">
                  <VIcon :icon="getTypeConfig(instance.type)?.icon" size="24" />
                </VAvatar>
                <div class="flex-grow-1">
                  <div class="font-weight-bold">{{ instance.name }}</div>
                  <div class="text-caption text-medium-emphasis">{{ instance.code }}</div>
                </div>
                <VChip :color="getStatusColor(instance.status)" size="small" variant="tonal"
                  :prepend-icon="getStatusIcon(instance.status)">
                  {{ instance.status }}
                </VChip>
              </div>

              <VDivider class="mb-3" />

              <div class="mb-2">
                <div class="text-caption text-medium-emphasis mb-1">Type</div>
                <VChip :color="getTypeConfig(instance.type)?.color" :prepend-icon="getTypeConfig(instance.type)?.icon"
                  size="small" variant="tonal">
                  {{ getTypeConfig(instance.type)?.label }}
                </VChip>
              </div>

              <div v-if="instance.parentId" class="mb-2">
                <div class="text-caption text-medium-emphasis mb-1">Parent</div>
                <div class="text-body-2">{{ getParent(instance.parentId)?.name }}</div>
              </div>

              <div v-if="instance.maxCapacity.weight" class="mb-2">
                <div class="text-caption text-medium-emphasis mb-1">Capacity (Weight)</div>
                <VProgressLinear
                  :model-value="getCapacityPercentage(instance.currentCapacity.weight, instance.maxCapacity.weight)"
                  :color="getCapacityPercentage(instance.currentCapacity.weight, instance.maxCapacity.weight) > 80 ? 'error' : 'success'"
                  height="8" rounded>
                  <template #default>
                    <span class="text-caption">
                      {{ getCapacityPercentage(instance.currentCapacity.weight,
                        instance.maxCapacity.weight) }}%
                    </span>
                  </template>
                </VProgressLinear>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ instance.currentCapacity.weight }} / {{ instance.maxCapacity.weight }} kg
                </div>
              </div>

              <div class="d-flex justify-space-between align-center mt-3">
                <VChip v-if="instance.childCount" size="small" variant="outlined">
                  <VIcon start size="16">mdi:file-tree</VIcon>
                  {{ instance.childCount }} children
                </VChip>
                <VSpacer />
                <VBtn icon size="small" variant="text" @click.stop="openCreateDialog(instance)">
                  <VIcon>mdi:plus</VIcon>
                  <VTooltip activator="parent" location="top">Add Child</VTooltip>
                </VBtn>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>

    <!-- Create Dialog -->
    <VDialog v-model="createDialog" max-width="700" persistent>
      <VCard>
        <VCardTitle class="d-flex align-center pa-4">
          <VIcon class="me-2">mdi:plus-box</VIcon>
          <span class="text-h6">Create New Container</span>
          <VSpacer />
          <VBtn icon variant="text" size="small" @click="createDialog = false">
            <VIcon>mdi:close</VIcon>
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <!-- Error Display -->
          <VAlert v-if="saveError" type="error" variant="tonal" class="mb-4" closable @click:close="saveError = null">
            {{ saveError }}
          </VAlert>

          <VRow>
            <!-- Parent Info -->
            <VCol v-if="selectedParent" cols="12">
              <VAlert type="info" variant="tonal" density="compact">
                <div class="d-flex align-center gap-2">
                  <VIcon>mdi:information</VIcon>
                  <span>Creating child container in: <strong>{{ selectedParent.name }}</strong></span>
                </div>
              </VAlert>
            </VCol>

            <!-- Type Selection -->
            <VCol cols="12">
              <VSelect v-model="newInstance.type"
                :items="containerTypes.filter(t => !selectedParent || t.canBeContainedIn.includes(selectedParent.type))"
                item-title="label" item-value="type" label="Container Type *" variant="outlined" density="comfortable"
                @update:model-value="onTypeSelected">
                <template #prepend-inner>
                  <VIcon v-if="selectedTypeConfig" :color="selectedTypeConfig.color">
                    {{ selectedTypeConfig.icon }}
                  </VIcon>
                </template>
                <template #item="{ props: itemProps, item }">
                  <VListItem v-bind="itemProps">
                    <template #prepend>
                      <VIcon :color="item.raw.color">{{ item.raw.icon }}</VIcon>
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>

            <!-- Parent Selection -->
            <VCol v-if="!selectedParent && selectedTypeConfig && selectedTypeConfig.canBeContainedIn.length > 0"
              cols="12">
              <VSelect v-model="newInstance.parentId" :items="availableParents" item-title="name" item-value="id"
                label="Parent Container" variant="outlined" density="comfortable" clearable>
                <template #item="{ props: itemProps, item }">
                  <VListItem v-bind="itemProps">
                    <template #prepend>
                      <VIcon :color="getTypeConfig(item.raw.type)?.color">
                        {{ getTypeConfig(item.raw.type)?.icon }}
                      </VIcon>
                    </template>
                    <template #append>
                      <VChip size="x-small" variant="outlined">{{ item.raw.code }}</VChip>
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>

            <!-- Basic Info -->
            <VCol cols="12" md="8">
              <VTextField v-model="newInstance.name" label="Container Name *" variant="outlined" density="comfortable"
                placeholder="e.g., Dallas Central Warehouse" />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField v-model="newInstance.code" label="Code" variant="outlined" density="comfortable"
                placeholder="e.g., DFW-WH-01" />
            </VCol>

            <!-- Dynamic Fields -->
            <VCol v-if="selectedTypeConfig" cols="12">
              <VDivider class="my-2" />
              <div class="text-subtitle-2 font-weight-bold mb-4">
                {{ selectedTypeConfig.label }} Attributes
              </div>
            </VCol>

            <template v-if="selectedTypeConfig">
              <VCol v-for="field in selectedTypeConfig.customFields" :key="field.name" cols="12"
                :md="field.type === 'textarea' ? 12 : 6">
                <VTextField v-if="field.type === 'text'" v-model="newInstance.attributes[field.name]"
                  :label="field.label + (field.required ? ' *' : '')" variant="outlined" density="comfortable" />

                <VTextField v-else-if="field.type === 'number'" v-model.number="newInstance.attributes[field.name]"
                  :label="field.label + (field.required ? ' *' : '')" type="number" variant="outlined"
                  density="comfortable" />

                <VTextarea v-else-if="field.type === 'textarea'" v-model="newInstance.attributes[field.name]"
                  :label="field.label + (field.required ? ' *' : '')" variant="outlined" rows="3"
                  density="comfortable" />

                <VSelect v-else-if="field.type === 'select'" v-model="newInstance.attributes[field.name]"
                  :label="field.label + (field.required ? ' *' : '')" :items="field.options || []" variant="outlined"
                  density="comfortable" />

                <VCheckbox v-else-if="field.type === 'checkbox'" v-model="newInstance.attributes[field.name]"
                  :label="field.label" density="comfortable" />
              </VCol>
            </template>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="outlined" @click="createDialog = false" :disabled="isSaving">
            Cancel
          </VBtn>
          <VBtn color="primary" @click="createInstance" :disabled="!newInstance.type || !newInstance.name"
            :loading="isSaving">
            Create Container
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Detail Dialog -->
    <VDialog v-model="detailDialog" max-width="900">
      <VCard v-if="selectedInstance">
        <VCardTitle class="d-flex align-center pa-4">
          <VAvatar :color="getTypeConfig(selectedInstance.type)?.color" size="40" class="me-3">
            <VIcon :icon="getTypeConfig(selectedInstance.type)?.icon" size="24" />
          </VAvatar>
          <div class="flex-grow-1">
            <div class="text-h6">{{ selectedInstance.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ selectedInstance.code }}</div>
          </div>
          <VChip :color="getStatusColor(selectedInstance.status)" variant="tonal">
            {{ selectedInstance.status }}
          </VChip>
          <VBtn icon variant="text" size="small" class="ms-2" @click="detailDialog = false">
            <VIcon>mdi:close</VIcon>
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <!-- Breadcrumb -->
          <div v-if="selectedInstance.parentId" class="mb-4">
            <div class="text-caption text-medium-emphasis mb-2">Location Path</div>
            <VBreadcrumbs :items="getBreadcrumb(selectedInstance).map(i => i.name)" density="compact">
              <template #divider>
                <VIcon>mdi:chevron-right</VIcon>
              </template>
            </VBreadcrumbs>
          </div>

          <VRow>
            <!-- Basic Info -->
            <VCol cols="12" md="6">
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">Container Type</div>
                <VChip :color="getTypeConfig(selectedInstance.type)?.color"
                  :prepend-icon="getTypeConfig(selectedInstance.type)?.icon" variant="tonal">
                  {{ getTypeConfig(selectedInstance.type)?.label }}
                </VChip>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">Movement Type</div>
                <VChip :color="getTypeConfig(selectedInstance.type)?.movementType === 'Fixed' ? 'info' : 'success'"
                  variant="outlined">
                  {{ getTypeConfig(selectedInstance.type)?.movementType }}
                </VChip>
              </div>
            </VCol>

            <VCol cols="12" md="6">
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">Created</div>
                <div class="text-body-2">{{ new Date(selectedInstance.createdAt).toLocaleString() }}
                </div>
                <div class="text-caption">by {{ selectedInstance.createdBy }}</div>
              </div>
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-1">Last Updated</div>
                <div class="text-body-2">{{ new Date(selectedInstance.updatedAt).toLocaleString() }}
                </div>
              </div>
            </VCol>

            <!-- Capacity -->
            <VCol v-if="selectedInstance.maxCapacity.weight" cols="12">
              <VDivider class="mb-4" />
              <div class="text-subtitle-2 font-weight-bold mb-3">Capacity Information</div>
            </VCol>

            <VCol v-if="selectedInstance.maxCapacity.weight" cols="12" md="4">
              <div class="text-caption text-medium-emphasis mb-2">Weight Capacity</div>
              <VProgressLinear
                :model-value="getCapacityPercentage(selectedInstance.currentCapacity.weight, selectedInstance.maxCapacity.weight)"
                :color="getCapacityPercentage(selectedInstance.currentCapacity.weight, selectedInstance.maxCapacity.weight) > 80 ? 'error' : 'success'"
                height="12" rounded>
                <template #default>
                  <span class="text-caption font-weight-bold">
                    {{ getCapacityPercentage(selectedInstance.currentCapacity.weight,
                      selectedInstance.maxCapacity.weight) }}%
                  </span>
                </template>
              </VProgressLinear>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ selectedInstance.currentCapacity.weight }} / {{ selectedInstance.maxCapacity.weight
                }} kg
              </div>
            </VCol>

            <VCol v-if="selectedInstance.maxCapacity.volume" cols="12" md="4">
              <div class="text-caption text-medium-emphasis mb-2">Volume Capacity</div>
              <VProgressLinear
                :model-value="getCapacityPercentage(selectedInstance.currentCapacity.volume, selectedInstance.maxCapacity.volume)"
                :color="getCapacityPercentage(selectedInstance.currentCapacity.volume, selectedInstance.maxCapacity.volume) > 80 ? 'error' : 'success'"
                height="12" rounded>
                <template #default>
                  <span class="text-caption font-weight-bold">
                    {{ getCapacityPercentage(selectedInstance.currentCapacity.volume,
                      selectedInstance.maxCapacity.volume) }}%
                  </span>
                </template>
              </VProgressLinear>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ selectedInstance.currentCapacity.volume }} / {{ selectedInstance.maxCapacity.volume
                }} m³
              </div>
            </VCol>

            <VCol v-if="selectedInstance.maxCapacity.items" cols="12" md="4">
              <div class="text-caption text-medium-emphasis mb-2">Item Count</div>
              <VProgressLinear
                :model-value="getCapacityPercentage(selectedInstance.currentCapacity.items, selectedInstance.maxCapacity.items)"
                :color="getCapacityPercentage(selectedInstance.currentCapacity.items, selectedInstance.maxCapacity.items) > 80 ? 'error' : 'success'"
                height="12" rounded>
                <template #default>
                  <span class="text-caption font-weight-bold">
                    {{ getCapacityPercentage(selectedInstance.currentCapacity.items,
                      selectedInstance.maxCapacity.items) }}%
                  </span>
                </template>
              </VProgressLinear>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ selectedInstance.currentCapacity.items }} / {{ selectedInstance.maxCapacity.items }}
                items
              </div>
            </VCol>

            <!-- Attributes -->
            <VCol cols="12">
              <VDivider class="mb-4" />
              <div class="text-subtitle-2 font-weight-bold mb-3">Attributes</div>
            </VCol>

            <VCol v-for="(value, key) in selectedInstance.attributes" :key="key" cols="12" md="6">
              <div class="mb-3">
                <div class="text-caption text-medium-emphasis mb-1">{{ key }}</div>
                <div v-if="typeof value === 'boolean'" class="text-body-2">
                  <VIcon :color="value ? 'success' : 'default'" size="18">
                    {{ value ? 'mdi:check-circle' : 'mdi:close-circle' }}
                  </VIcon>
                  {{ value ? 'Yes' : 'No' }}
                </div>
                <div v-else class="text-body-2">{{ value || '-' }}</div>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <VBtn v-if="selectedInstance.status !== 'Available'" color="info" variant="outlined"
            prepend-icon="mdi:check-circle" @click="updateInstanceStatus(selectedInstance, 'Available')"
            :loading="isSaving">
            Make Available
          </VBtn>
          <VSpacer />
          <VBtn color="error" variant="outlined" prepend-icon="mdi:delete" @click="deleteInstance(selectedInstance)"
            :loading="isSaving">
            Delete
          </VBtn>
          <VBtn variant="outlined" @click="detailDialog = false">
            Close
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.container-management {
  min-block-size: 100vh;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 12%);
  transform: translateY(-4px);
}

.stat-icon {
  transition: transform 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

.sticky-toolbar {
  position: sticky;
  z-index: 10;
  inset-block-start: 64px;
  margin-block: 16px;
}

.v-treeview :deep(.v-treeview-item) {
  margin-block-end: 4px;
}

.v-treeview :deep(.v-treeview-item__content) {
  border-radius: 8px;
  transition: background-color 0.2s;
}

.v-treeview :deep(.v-treeview-item__content:hover) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>
