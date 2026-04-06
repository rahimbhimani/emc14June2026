<script setup lang="ts">
import { computed, ref } from 'vue';

interface ContainerInstance {
  id: string;
  organizationId: string;
  typeId: string;
  type: string; // Warehouse, Location, ULD, Aircraft, Items
  parentId?: string | null;
  name: string;
  code?: string;
  status: string; // Available, In Progress, Loaded, DeCommissioned, Out For Maintenance
  attributes: Record<string, any>;
  currentCapacity: {
    weight: number;
    volume: number;
    items: number;
  };
  maxCapacity: {
    weight: number | null;
    volume: number | null;
    items: number | null;
  };
  childCount?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ContainerTypeConfig {
  id: string;
  type: string;
  label: string;
  icon: string;
  color: string;
  movementType: 'Fixed' | 'Variable';
  allowedChildTypes: string[];
  canBeContainedIn: string[];
  customFields: CustomField[];
}

interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Organization context
const currentOrganization = ref({
  id: 'org-001',
  name: 'Global Cargo Solutions',
  code: 'GCS'
});

// Mock type configurations (in real app, fetch from API)
const containerTypes = ref<ContainerTypeConfig[]>([
  {
    id: 'ct-warehouse-001',
    type: 'Warehouse',
    label: 'Warehouse',
    icon: 'mdi:building-warehouse',
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
    icon: 'mdi:map-pin',
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
    icon: 'mdi:plane',
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
    icon: 'mdi:box',
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
]);

// Mock container instances
const containerInstances = ref<ContainerInstance[]>([
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
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-28'),
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
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-30'),
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
    createdAt: new Date('2026-01-16'),
    updatedAt: new Date('2026-01-25'),
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
    createdAt: new Date('2026-01-16'),
    updatedAt: new Date('2026-01-29'),
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
    createdAt: new Date('2026-01-18'),
    updatedAt: new Date('2026-01-27'),
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
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-26'),
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
    createdAt: new Date('2026-01-22'),
    updatedAt: new Date('2026-01-28'),
  },
]);

// UI State
const viewMode = ref<'hierarchy' | 'list' | 'cards'>('hierarchy');
const searchQuery = ref('');
const selectedTypes = ref<string[]>([]);
const selectedStatus = ref<string[]>([]);
const createDialog = ref(false);
const detailDialog = ref(false);
const selectedInstance = ref<ContainerInstance | null>(null);
const selectedParent = ref<ContainerInstance | null>(null);
const expandedItems = ref<string[]>(['inst-wh-001', 'inst-wh-002']);
const isLoading = ref(false);

// Status icon mapping
const statusIcons: Record<string, string> = {
  'Available': 'mdi:check-circle',
  'In Progress': 'mdi:progress-clock',
  'Loaded': 'mdi:package-variant',
  'DeCommissioned': 'mdi:archive',
  'Out For Maintenance': 'mdi:tools',
};

// Form state for creating instance
const newInstance = ref({
  type: '',
  parentId: null as string | null,
  name: '',
  code: '',
  attributes: {} as Record<string, any>,
});

// Computed
const selectedTypeConfig = computed(() => {
  if (!newInstance.value.type) return null;
  return containerTypes.value.find(t => t.type === newInstance.value.type) || null;
});

const availableParents = computed(() => {
  if (!selectedTypeConfig.value) return [];

  const canBeContainedIn = selectedTypeConfig.value.canBeContainedIn;
  if (canBeContainedIn.length === 0) return []; // Root level only

  return containerInstances.value.filter(inst =>
    canBeContainedIn.includes(inst.type) && (inst.status === 'Available' || inst.status === 'In Progress')
  );
});

const stats = computed(() => {
  const total = containerInstances.value.length;
  const byType = containerTypes.value.map(type => ({
    type: type.type,
    label: type.label,
    icon: type.icon,
    color: type.color,
    count: containerInstances.value.filter(i => i.type === type.type).length
  }));
  const byStatus = {
    available: containerInstances.value.filter(i => i.status === 'Available').length,
    inProgress: containerInstances.value.filter(i => i.status === 'In Progress').length,
    loaded: containerInstances.value.filter(i => i.status === 'Loaded').length,
    decommissioned: containerInstances.value.filter(i => i.status === 'DeCommissioned').length,
    maintenance: containerInstances.value.filter(i => i.status === 'Out For Maintenance').length,
  };

  // Mock trends (in real app, compare with previous period)
  const trends = {
    total: { value: 12, isPositive: true },
    available: { value: 8, isPositive: true },
    inProgress: { value: 3, isPositive: false },
    loaded: { value: 15, isPositive: true },
  };

  // Critical alerts
  const alerts = {
    highCapacity: containerInstances.value.filter(i =>
      i.maxCapacity.weight && (i.currentCapacity.weight / i.maxCapacity.weight) > 0.9
    ).length,
    maintenance: byStatus.maintenance,
    lowCapacity: containerInstances.value.filter(i =>
      i.maxCapacity.weight && (i.currentCapacity.weight / i.maxCapacity.weight) < 0.2
    ).length,
  };

  return { total, byType, byStatus, trends, alerts };
});

const hierarchicalData = computed(() => {
  // Build tree structure
  const rootItems = containerInstances.value.filter(i => !i.parentId);

  const buildTree = (parentId: string | null): any[] => {
    const children = containerInstances.value.filter(i => i.parentId === parentId);
    return children.map(child => ({
      ...child,
      children: buildTree(child.id)
    }));
  };

  return rootItems.map(root => ({
    ...root,
    children: buildTree(root.id)
  }));
});

const filteredInstances = computed(() => {
  let filtered = containerInstances.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(inst =>
      inst.name.toLowerCase().includes(query) ||
      inst.code?.toLowerCase().includes(query) ||
      inst.type.toLowerCase().includes(query)
    );
  }

  // Type filter
  if (selectedTypes.value.length > 0) {
    filtered = filtered.filter(inst => selectedTypes.value.includes(inst.type));
  }

  // Status filter
  if (selectedStatus.value.length > 0) {
    filtered = filtered.filter(inst => selectedStatus.value.includes(inst.status));
  }

  return filtered;
});

// Methods
const getTypeConfig = (type: string) => {
  return containerTypes.value.find(t => t.type === type);
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Available': 'success',
    'In Progress': 'info',
    'Loaded': 'warning',
    'DeCommissioned': 'error',
    'Out For Maintenance': 'secondary',
  };
  return colors[status] || 'default';
};

const getCapacityPercentage = (current: number, max: number | null) => {
  if (!max) return 0;
  return Math.round((current / max) * 100);
};

const openCreateDialog = (parent?: ContainerInstance) => {
  selectedParent.value = parent || null;
  newInstance.value = {
    type: '',
    parentId: parent?.id || null,
    name: '',
    code: '',
    attributes: {},
  };
  createDialog.value = true;
};

const onTypeSelected = () => {
  // Initialize attributes with default values
  if (selectedTypeConfig.value) {
    const attrs: Record<string, any> = {};
    selectedTypeConfig.value.customFields.forEach(field => {
      attrs[field.name] = field.defaultValue;
    });
    newInstance.value.attributes = attrs;
  }
};

const createInstance = () => {
  if (!selectedTypeConfig.value) return;

  const instance: ContainerInstance = {
    id: `inst-${Date.now()}`,
    organizationId: currentOrganization.value.id,
    typeId: selectedTypeConfig.value.id,
    type: newInstance.value.type,
    parentId: newInstance.value.parentId,
    name: newInstance.value.name,
    code: newInstance.value.code,
    status: 'Available',
    attributes: { ...newInstance.value.attributes },
    currentCapacity: { weight: 0, volume: 0, items: 0 },
    maxCapacity: { weight: null, volume: null, items: null },
    childCount: 0,
    createdBy: 'current_user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  containerInstances.value.push(instance);
  createDialog.value = false;

  // Expand parent if exists
  if (instance.parentId && !expandedItems.value.includes(instance.parentId)) {
    expandedItems.value.push(instance.parentId);
  }
};

const viewDetails = (instance: ContainerInstance) => {
  selectedInstance.value = instance;
  detailDialog.value = true;
};

const getParent = (parentId: string | null) => {
  if (!parentId) return null;
  return containerInstances.value.find(i => i.id === parentId);
};

const getBreadcrumb = (instance: ContainerInstance): ContainerInstance[] => {
  const path: ContainerInstance[] = [instance];
  let current = instance;

  while (current.parentId) {
    const parent = getParent(current.parentId);
    if (parent) {
      path.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  return path;
};

const performAction = (instance: ContainerInstance, action: string) => {
  // Mock action - in real app, call API
  const inst = containerInstances.value.find(i => i.id === instance.id);
  if (!inst) return;

  // Set status based on action
  switch (action) {
    case 'open':
    case 'activate':
      inst.status = 'Available';
      break;
    case 'load':
    case 'fill':
      inst.status = 'Loaded';
      break;
    case 'start':
    case 'process':
      inst.status = 'In Progress';
      break;
    case 'decommission':
      inst.status = 'DeCommissioned';
      break;
    case 'maintenance':
      inst.status = 'Out For Maintenance';
      break;
  }

  inst.updatedAt = new Date();
};

const deleteInstance = (instance: ContainerInstance) => {
  const index = containerInstances.value.findIndex(i => i.id === instance.id);
  if (index > -1) {
    containerInstances.value.splice(index, 1);
  }
  detailDialog.value = false;
};
</script>

<template>
  <VContainer fluid class="pa-6">
    <!-- Header -->
    <VRow>
      <VCol cols="12">
        <div class="d-flex justify-space-between align-center mb-2">
          <div>
            <div class="d-flex align-center gap-3 mb-2">
              <h2 class="text-h4 font-weight-bold">
                Container Instances
              </h2>
              <VChip color="primary" variant="tonal" size="small">
                {{ currentOrganization.name }}
              </VChip>
            </div>
            <p class="text-body-1 text-medium-emphasis">
              Manage warehouses, locations, ULDs, aircraft, and items
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
                    {{ stats.trends.total.isPositive ? 'mdi:trending-up' : 'mdi:trending-down' }}
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
                <div class="text-h4 font-weight-bold text-success mb-1">{{ stats.byStatus.available }}</div>
                <div class="d-flex align-center gap-1">
                  <VIcon :color="stats.trends.available.isPositive ? 'success' : 'error'" size="16">
                    {{ stats.trends.available.isPositive ? 'mdi:trending-up' : 'mdi:trending-down' }}
                  </VIcon>
                  <span class="text-caption" :class="stats.trends.available.isPositive ? 'text-success' : 'text-error'">
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
                <div class="text-h4 font-weight-bold text-info mb-1">{{ stats.byStatus.inProgress }}</div>
                <div class="d-flex align-center gap-1">
                  <VIcon :color="stats.trends.inProgress.isPositive ? 'success' : 'error'" size="16">
                    {{ stats.trends.inProgress.isPositive ? 'mdi:trending-up' : 'mdi:trending-down' }}
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
                <div class="text-h4 font-weight-bold text-warning mb-1">{{ stats.byStatus.loaded }}</div>
                <div class="d-flex align-center gap-1">
                  <VIcon :color="stats.trends.loaded.isPositive ? 'success' : 'error'" size="16">
                    {{ stats.trends.loaded.isPositive ? 'mdi:trending-up' : 'mdi:trending-down' }}
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
    <VRow v-if="stats.alerts.highCapacity > 0 || stats.alerts.maintenance > 0">
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
                <VChip v-if="stats.alerts.highCapacity > 0" color="error" variant="flat" prepend-icon="mdi:gauge-full">
                  {{ stats.alerts.highCapacity }} High Capacity (>90%)
                </VChip>
                <VChip v-if="stats.alerts.maintenance > 0" color="warning" variant="flat" prepend-icon="mdi:tools">
                  {{ stats.alerts.maintenance }} Under Maintenance
                </VChip>
                <VChip v-if="stats.alerts.lowCapacity > 0" color="info" variant="flat" prepend-icon="mdi:gauge-empty">
                  {{ stats.alerts.lowCapacity }} Low Utilization (<20%) </VChip>
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

    <!-- Filters and View Controls -->
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
                <VSelect v-model="selectedStatus"
                  :items="['Available', 'In Progress', 'Loaded', 'DeCommissioned', 'Out For Maintenance']"
                  label="Filter by Status" variant="outlined" density="compact" multiple chips clearable hide-details />
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

            <!-- Active Filters Display -->
            <VRow v-if="searchQuery || selectedTypes.length > 0 || selectedStatus.length > 0" class="mt-2">
              <VCol cols="12">
                <div class="d-flex align-center gap-2 flex-wrap">
                  <span class="text-caption text-medium-emphasis">Active filters:</span>
                  <VChip v-if="searchQuery" closable @click:close="searchQuery = ''" size="small" color="primary">
                    Search: "{{ searchQuery }}"
                  </VChip>
                  <VChip v-for="type in selectedTypes" :key="type" closable
                    @click:close="selectedTypes = selectedTypes.filter(t => t !== type)" size="small"
                    :color="getTypeConfig(type)?.color">
                    {{ getTypeConfig(type)?.label }}
                  </VChip>
                  <VChip v-for="status in selectedStatus" :key="status" closable
                    @click:close="selectedStatus = selectedStatus.filter(s => s !== status)" size="small"
                    color="secondary">
                    {{ status }}
                  </VChip>
                  <VBtn variant="text" size="small" color="error"
                    @click="searchQuery = ''; selectedTypes = []; selectedStatus = []">
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
          <p v-if="containerInstances.length === 0" class="text-body-1 text-medium-emphasis mb-6"
            style="margin-block: 0; margin-inline: auto; max-inline-size: 500px;">
            Get started by creating your first container. Containers help you organize and track your inventory across
            warehouses, locations, and ULDs.
          </p>
          <p v-else class="text-body-1 text-medium-emphasis mb-6"
            style="margin-block: 0; margin-inline: auto; max-inline-size: 500px;">
            Try adjusting your search criteria or filters to find what you are looking for.
          </p>
          <div class="d-flex gap-3 justify-center">
            <VBtn v-if="containerInstances.length === 0" color="primary" size="large" prepend-icon="mdi:plus"
              @click="openCreateDialog()">
              Create Your First Container
            </VBtn>
            <VBtn v-else color="primary" variant="outlined"
              @click="searchQuery = ''; selectedTypes = []; selectedStatus = []">
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
            <VTreeview :items="hierarchicalData" item-value="id" item-title="name" v-model:opened="expandedItems"
              open-all>
              <template #prepend="{ item }">
                <VIcon :color="getTypeConfig(item.type)?.color" size="20">
                  {{ getTypeConfig(item.type)?.icon }}
                </VIcon>
              </template>

              <template #title="{ item }">
                <div class="d-flex align-center gap-2 flex-grow-1 py-2">
                  <div class="flex-grow-1">
                    <div class="d-flex align-center gap-2">
                      <span class="font-weight-medium">{{ item.name }}</span>
                      <VChip v-if="item.code" size="x-small" variant="outlined">{{ item.code }}
                      </VChip>
                      <VChip :color="getStatusColor(item.status)" size="x-small" variant="tonal"
                        :prepend-icon="statusIcons[item.status]">
                        {{ item.status }}
                      </VChip>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ getTypeConfig(item.type)?.label }}
                      <span v-if="item.childCount"> • {{ item.childCount }} children</span>
                    </div>
                  </div>

                  <!-- Capacity indicator -->
                  <div v-if="item.maxCapacity.weight" class="d-flex align-center gap-2">
                    <VTooltip location="top">
                      <template #activator="{ props }">
                        <div v-bind="props" style="inline-size: 80px;">
                          <VProgressLinear
                            :model-value="getCapacityPercentage(item.currentCapacity.weight, item.maxCapacity.weight)"
                            :color="getCapacityPercentage(item.currentCapacity.weight, item.maxCapacity.weight) > 80 ? 'error' : 'success'"
                            height="6" rounded />
                        </div>
                      </template>
                      <span>Weight: {{ item.currentCapacity.weight }} / {{ item.maxCapacity.weight
                      }} kg</span>
                    </VTooltip>
                  </div>

                  <!-- Actions -->
                  <div class="d-flex gap-1">
                    <VBtn icon size="x-small" variant="text" @click.stop="openCreateDialog(item)">
                      <VIcon size="18">mdi:plus</VIcon>
                      <VTooltip activator="parent" location="top">Add Child Container</VTooltip>
                    </VBtn>
                    <VBtn icon size="x-small" variant="text" @click.stop="viewDetails(item)">
                      <VIcon size="18">mdi:eye</VIcon>
                      <VTooltip activator="parent" location="top">View Details</VTooltip>
                    </VBtn>
                    <VMenu>
                      <template #activator="{ props }">
                        <VBtn icon size="x-small" variant="text" v-bind="props">
                          <VIcon size="18">mdi:dots-vertical</VIcon>
                        </VBtn>
                      </template>
                      <VList density="compact">
                        <VListItem @click="performAction(item, 'activate')" v-if="item.status !== 'Available'">
                          <template #prepend>
                            <VIcon size="18">mdi:check-circle</VIcon>
                          </template>
                          <VListItemTitle>Make Available</VListItemTitle>
                        </VListItem>
                        <VListItem @click="performAction(item, 'load')"
                          v-if="item.status === 'Available' || item.status === 'In Progress'">
                          <template #prepend>
                            <VIcon size="18">mdi:package-variant</VIcon>
                          </template>
                          <VListItemTitle>Load</VListItemTitle>
                        </VListItem>
                        <VListItem @click="performAction(item, 'maintenance')">
                          <template #prepend>
                            <VIcon size="18">mdi:tools</VIcon>
                          </template>
                          <VListItemTitle>Maintenance</VListItemTitle>
                        </VListItem>
                        <VListItem @click="viewDetails(item)">
                          <template #prepend>
                            <VIcon size="18">mdi:pencil</VIcon>
                          </template>
                          <VListItemTitle>Edit</VListItemTitle>
                        </VListItem>
                        <VDivider />
                        <VListItem @click="deleteInstance(item)" class="text-error">
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
                  <VChip :color="getTypeConfig(instance.type)?.color" :prepend-icon="getTypeConfig(instance.type)?.icon"
                    size="small" variant="tonal">
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
                    :prepend-icon="statusIcons[instance.status]">
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
                      <template #activator="{ props }">
                        <VBtn icon size="x-small" variant="text" v-bind="props">
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
                :prepend-icon="statusIcons[instance.status]">
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

    <!-- Create Instance Dialog -->
    <VDialog v-model="createDialog" max-width="700" persistent>
      <VCard>
        <VCardTitle class="d-flex align-center pa-4">
          <VIcon class="me-2">mdi:square-plus</VIcon>
          <span class="text-h6">Create New Container</span>
          <VSpacer />
          <VBtn icon variant="text" @click="createDialog = false">
            <VIcon>mdi:x</VIcon>
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <!-- Parent Selection (if applicable) -->
            <VCol v-if="selectedParent" cols="12">
              <VAlert type="info" variant="tonal" density="compact">
                <div class="d-flex align-center gap-2">
                  <VIcon>mdi:info-circle</VIcon>
                  <span>
                    Creating child container in: <strong>{{ selectedParent.name }}</strong>
                  </span>
                </div>
              </VAlert>
            </VCol>

            <!-- Type Selection -->
            <VCol cols="12">
              <VSelect v-model="newInstance.type" :items="containerTypes.filter(t =>
                !selectedParent || t.canBeContainedIn.includes(selectedParent.type)
              )" item-title="label" item-value="type" label="Container Type *" variant="outlined" density="comfortable"
                @update:model-value="onTypeSelected">
                <template #prepend-inner>
                  <VIcon v-if="selectedTypeConfig" :color="selectedTypeConfig.color">
                    {{ selectedTypeConfig.icon }}
                  </VIcon>
                </template>
                <template #item="{ props, item }">
                  <VListItem v-bind="props">
                    <template #prepend>
                      <VIcon :color="item.raw.color">{{ item.raw.icon }}</VIcon>
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>

            <!-- Parent Selection (manual) -->
            <VCol v-if="!selectedParent && selectedTypeConfig && selectedTypeConfig.canBeContainedIn.length > 0"
              cols="12">
              <VSelect v-model="newInstance.parentId" :items="availableParents" item-title="name" item-value="id"
                label="Parent Container" variant="outlined" density="comfortable" clearable>
                <template #item="{ props, item }">
                  <VListItem v-bind="props">
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

            <!-- Dynamic Custom Fields -->
            <VCol v-if="selectedTypeConfig" cols="12">
              <VDivider class="my-2" />
              <div class="text-subtitle-2 font-weight-bold mb-4">{{ selectedTypeConfig.label }} Attributes
              </div>
            </VCol>

            <template v-if="selectedTypeConfig">
              <VCol v-for="field in selectedTypeConfig.customFields" :key="field.name" cols="12"
                :md="field.type === 'textarea' ? 12 : 6">
                <!-- Text Field -->
                <VTextField v-if="field.type === 'text'" v-model="newInstance.attributes[field.name]"
                  :label="field.label + (field.required ? ' *' : '')" variant="outlined" density="comfortable" />

                <!-- Number Field -->
                <VTextField v-else-if="field.type === 'number'" v-model.number="newInstance.attributes[field.name]"
                  :label="field.label + (field.required ? ' *' : '')" type="number" variant="outlined"
                  density="comfortable" />

                <!-- Textarea Field -->
                <VTextarea v-else-if="field.type === 'textarea'" v-model="newInstance.attributes[field.name]"
                  :label="field.label + (field.required ? ' *' : '')" variant="outlined" rows="3"
                  density="comfortable" />

                <!-- Select Field -->
                <VSelect v-else-if="field.type === 'select'" v-model="newInstance.attributes[field.name]"
                  :label="field.label + (field.required ? ' *' : '')" :items="field.options || []" variant="outlined"
                  density="comfortable" />

                <!-- Checkbox Field -->
                <VCheckbox v-else-if="field.type === 'checkbox'" v-model="newInstance.attributes[field.name]"
                  :label="field.label" density="comfortable" />
              </VCol>
            </template>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="outlined" @click="createDialog = false">
            Cancel
          </VBtn>
          <VBtn color="primary" @click="createInstance" :disabled="!newInstance.type || !newInstance.name">
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
          <VBtn icon variant="text" class="ms-2" @click="detailDialog = false">
            <VIcon>mdi:x</VIcon>
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

            <!-- Capacity Info -->
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

            <!-- Custom Attributes -->
            <VCol cols="12">
              <VDivider class="mb-4" />
              <div class="text-subtitle-2 font-weight-bold mb-3">Attributes</div>
            </VCol>

            <VCol v-for="(value, key) in selectedInstance.attributes" :key="key" cols="12" md="6">
              <div class="mb-3">
                <div class="text-caption text-medium-emphasis mb-1">{{ key }}</div>
                <div v-if="typeof value === 'boolean'" class="text-body-2">
                  <VIcon :color="value ? 'success' : 'default'" size="18">
                    {{ value ? 'mdi:circle-check' : 'mdi:circle-x' }}
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
          <VBtn v-if="selectedInstance.status !== 'Opened' && selectedInstance.status !== 'Open'" color="info"
            variant="outlined" prepend-icon="mdi:lock-open" @click="performAction(selectedInstance, 'open')">
            Open
          </VBtn>
          <VBtn v-if="selectedInstance.status === 'Opened' || selectedInstance.status === 'Open'" color="success"
            variant="outlined" prepend-icon="mdi:lock" @click="performAction(selectedInstance, 'close')">
            Close
          </VBtn>
          <VSpacer />
          <VBtn color="error" variant="outlined" prepend-icon="mdi:trash" @click="deleteInstance(selectedInstance)">
            Delete
          </VBtn>
          <VBtn variant="outlined" @click="detailDialog = false">
            Close
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>

<style scoped>
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
