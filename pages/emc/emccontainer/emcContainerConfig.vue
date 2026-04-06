<script setup lang="ts">
import { ref } from 'vue';

interface ContainerAction {
  action: string;
  label: string;
  enabled: boolean;
  icon: string;
  color: string;
  description: string;
  requiredStatus?: string[];
  allowedRoles: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[]; // For select type
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface ContainerTypeConfig {
  id: string;
  organizationId: string;
  type: string; // Warehouse, Location, ULD, Aircraft, Items
  label: string;
  movementType: 'Fixed' | 'Variable';
  icon: string;
  color: string;
  description: string;
  allowedChildTypes: string[]; // Can contain these types
  canBeContainedIn: string[]; // Can be placed in these types
  maxChildrenAllowed: number | null; // null = unlimited
  actions: ContainerAction[];
  defaultCapacity: {
    maxWeight: number | null;
    maxVolume: number | null;
    maxItems: number | null;
  };
  customFields: CustomField[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Available roles in the system
const availableRoles = ref<Role[]>([
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    color: 'error',
  },
  {
    id: 'warehouse_manager',
    name: 'Warehouse Manager',
    description: 'Manage warehouse operations',
    color: 'primary',
  },
  {
    id: 'operations_staff',
    name: 'Operations Staff',
    description: 'Day-to-day operations',
    color: 'info',
  },
  {
    id: 'cargo_handler',
    name: 'Cargo Handler',
    description: 'Handle cargo loading/unloading',
    color: 'success',
  },
  {
    id: 'flight_dispatcher',
    name: 'Flight Dispatcher',
    description: 'Manage flight operations',
    color: 'warning',
  },
  {
    id: 'inventory_clerk',
    name: 'Inventory Clerk',
    description: 'Manage inventory tracking',
    color: 'secondary',
  },
]);

// Organization context
const currentOrganization = ref({
  id: 'org-001',
  name: 'Global Cargo Solutions',
  code: 'GCS'
});

// Mock data for container configurations
const containerConfigs = ref<ContainerTypeConfig[]>([
  {
    id: 'ct-warehouse-001',
    organizationId: 'org-001',
    type: 'Warehouse',
    label: 'Warehouse',
    movementType: 'Fixed',
    icon: 'mdi:warehouse',
    color: 'primary',
    description: 'Fixed location storage facility',
    allowedChildTypes: ['Location', 'ULD', 'Items'],
    canBeContainedIn: [],
    maxChildrenAllowed: null, // Unlimited locations
    isActive: true,
    actions: [
      {
        action: 'create',
        label: 'Create Warehouse',
        enabled: true,
        icon: 'mdi:plus',
        color: 'success',
        description: 'Create new warehouse',
        allowedRoles: ['admin', 'warehouse_manager'],
      },
      {
        action: 'open',
        label: 'Open Warehouse',
        enabled: true,
        icon: 'mdi:lock-open',
        color: 'info',
        description: 'Open warehouse for operations',
        requiredStatus: ['Created', 'Closed'],
        allowedRoles: ['admin', 'warehouse_manager', 'operations_staff'],
      },
      {
        action: 'fill',
        label: 'Stock Warehouse',
        enabled: true,
        icon: 'mdi:package-down',
        color: 'warning',
        description: 'Add items to warehouse',
        requiredStatus: ['Open'],
        allowedRoles: ['admin', 'warehouse_manager', 'operations_staff', 'cargo_handler'],
      },
      {
        action: 'close',
        label: 'Lock Warehouse',
        enabled: true,
        icon: 'mdi:lock',
        color: 'error',
        description: 'Close warehouse',
        requiredStatus: ['Open', 'Filled'],
        allowedRoles: ['admin', 'warehouse_manager'],
      },
      {
        action: 'transfer',
        label: 'Transfer Warehouse',
        enabled: false,
        icon: 'mdi:truck',
        color: 'secondary',
        description: 'Transfer (not applicable for fixed locations)',
        requiredStatus: ['Closed'],
        allowedRoles: [],
      },
    ],
    defaultCapacity: {
      maxWeight: 50000,
      maxVolume: 10000,
      maxItems: null,
    },
    customFields: [
      {
        name: 'address',
        label: 'Warehouse Address',
        type: 'textarea',
        required: true,
        defaultValue: ''
      },
      {
        name: 'managerId',
        label: 'Warehouse Manager ID',
        type: 'text',
        required: false,
        defaultValue: ''
      },
      {
        name: 'temperatureControlled',
        label: 'Temperature Controlled',
        type: 'checkbox',
        required: false,
        defaultValue: false
      },
      {
        name: 'securityLevel',
        label: 'Security Level',
        type: 'select',
        required: true,
        options: ['Standard', 'High', 'Maximum'],
        defaultValue: 'Standard'
      },
    ],
  },
  {
    id: 'ct-location-001',
    organizationId: 'org-001',
    type: 'Location',
    label: 'Location',
    movementType: 'Fixed',
    icon: 'mdi:map-marker',
    color: 'secondary',
    description: 'Specific area within a warehouse',
    allowedChildTypes: ['ULD', 'Items'],
    canBeContainedIn: ['Warehouse'],
    maxChildrenAllowed: null,
    isActive: true,
    actions: [
      {
        action: 'create',
        label: 'Add Location',
        enabled: true,
        icon: 'mdi:plus',
        color: 'success',
        description: 'Create new location',
        allowedRoles: ['admin', 'warehouse_manager', 'operations_staff'],
      },
      {
        action: 'open',
        label: 'Activate Location',
        enabled: true,
        icon: 'mdi:lock-open',
        color: 'info',
        description: 'Open location',
        requiredStatus: ['Created', 'Closed'],
        allowedRoles: ['admin', 'warehouse_manager', 'operations_staff'],
      },
      {
        action: 'fill',
        label: 'Store in Location',
        enabled: true,
        icon: 'mdi:package-down',
        color: 'warning',
        description: 'Add items to location',
        requiredStatus: ['Open'],
        allowedRoles: ['admin', 'warehouse_manager', 'operations_staff', 'cargo_handler'],
      },
      {
        action: 'close',
        label: 'Secure Location',
        enabled: true,
        icon: 'mdi:lock',
        color: 'error',
        description: 'Close location',
        requiredStatus: ['Open', 'Filled'],
        allowedRoles: ['admin', 'warehouse_manager', 'operations_staff'],
      },
      {
        action: 'transfer',
        label: 'Move Location',
        enabled: false,
        icon: 'mdi:truck',
        color: 'secondary',
        description: 'Transfer (not applicable for fixed locations)',
        requiredStatus: ['Closed'],
        allowedRoles: [],
      },
    ],
    defaultCapacity: {
      maxWeight: 5000,
      maxVolume: 500,
      maxItems: 100,
    },
    customFields: [
      {
        name: 'zone',
        label: 'Zone Code',
        type: 'text',
        required: true,
        defaultValue: ''
      },
      {
        name: 'aisle',
        label: 'Aisle Number',
        type: 'text',
        required: false,
        defaultValue: ''
      },
      {
        name: 'level',
        label: 'Storage Level',
        type: 'number',
        required: false,
        defaultValue: 1,
        validation: { min: 1, max: 20 }
      },
      {
        name: 'locationType',
        label: 'Location Type',
        type: 'select',
        required: true,
        options: ['Rack', 'Bin', 'Pallet', 'Floor Space'],
        defaultValue: 'Rack'
      },
    ],
  },
  {
    id: 'ct-uld-001',
    organizationId: 'org-001',
    type: 'ULD',
    label: 'ULD (Unit Load Device)',
    movementType: 'Variable',
    icon: 'mdi:package-variant',
    color: 'info',
    description: 'Transportable container for cargo',
    allowedChildTypes: ['Items'],
    canBeContainedIn: ['Warehouse', 'Location', 'Aircraft'],
    maxChildrenAllowed: null,
    isActive: true,
    actions: [
      {
        action: 'create',
        label: 'Register ULD',
        enabled: true,
        icon: 'mdi:plus',
        color: 'success',
        description: 'Create new ULD',
        allowedRoles: ['admin', 'operations_staff', 'cargo_handler'],
      },
      {
        action: 'open',
        label: 'Open ULD',
        enabled: true,
        icon: 'mdi:lock-open',
        color: 'info',
        description: 'Open ULD for loading',
        requiredStatus: ['Created', 'Closed'],
        allowedRoles: ['admin', 'operations_staff', 'cargo_handler'],
      },
      {
        action: 'fill',
        label: 'Load ULD',
        enabled: true,
        icon: 'mdi:package-down',
        color: 'warning',
        description: 'Load items into ULD',
        requiredStatus: ['Open'],
        allowedRoles: ['admin', 'operations_staff', 'cargo_handler'],
      },
      {
        action: 'close',
        label: 'Seal ULD',
        enabled: true,
        icon: 'mdi:lock',
        color: 'error',
        description: 'Seal ULD',
        requiredStatus: ['Open', 'Filled'],
        allowedRoles: ['admin', 'operations_staff', 'cargo_handler'],
      },
      {
        action: 'transfer',
        label: 'Move ULD',
        enabled: true,
        icon: 'mdi:truck',
        color: 'secondary',
        description: 'Transfer ULD to another location',
        requiredStatus: ['Closed', 'Filled'],
        allowedRoles: ['admin', 'operations_staff', 'cargo_handler', 'flight_dispatcher'],
      },
    ],
    defaultCapacity: {
      maxWeight: 1500,
      maxVolume: 150,
      maxItems: 50,
    },
    customFields: [
      {
        name: 'uldType',
        label: 'ULD Type',
        type: 'select',
        required: true,
        options: ['AKE', 'AKN', 'AKH', 'LD3', 'LD7', 'LD9', 'PMC'],
        defaultValue: 'AKE'
      },
      {
        name: 'serialNumber',
        label: 'Serial Number',
        type: 'text',
        required: true,
        defaultValue: ''
      },
      {
        name: 'owner',
        label: 'ULD Owner',
        type: 'text',
        required: false,
        defaultValue: ''
      },
      {
        name: 'condition',
        label: 'Physical Condition',
        type: 'select',
        required: true,
        options: ['Excellent', 'Good', 'Fair', 'Needs Repair'],
        defaultValue: 'Good'
      },
    ],
  },
  {
    id: 'ct-aircraft-001',
    organizationId: 'org-001',
    type: 'Aircraft',
    label: 'Aircraft',
    movementType: 'Variable',
    icon: 'mdi:airplane',
    color: 'warning',
    description: 'Aircraft for cargo transportation',
    allowedChildTypes: ['ULD', 'Items'],
    canBeContainedIn: [],
    maxChildrenAllowed: 30, // Max ULDs per aircraft
    isActive: true,
    actions: [
      {
        action: 'create',
        label: 'Register Aircraft',
        enabled: true,
        icon: 'mdi:plus',
        color: 'success',
        description: 'Register aircraft',
        allowedRoles: ['admin', 'flight_dispatcher'],
      },
      {
        action: 'open',
        label: 'Open Cargo Hold',
        enabled: true,
        icon: 'mdi:lock-open',
        color: 'info',
        description: 'Open cargo hold',
        requiredStatus: ['Created', 'Closed'],
        allowedRoles: ['admin', 'flight_dispatcher', 'operations_staff'],
      },
      {
        action: 'fill',
        label: 'Load Cargo',
        enabled: true,
        icon: 'mdi:package-down',
        color: 'warning',
        description: 'Load cargo',
        requiredStatus: ['Open'],
        allowedRoles: ['admin', 'flight_dispatcher', 'operations_staff', 'cargo_handler'],
      },
      {
        action: 'close',
        label: 'Close Cargo Hold',
        enabled: true,
        icon: 'mdi:lock',
        color: 'error',
        description: 'Close cargo hold',
        requiredStatus: ['Open', 'Filled'],
        allowedRoles: ['admin', 'flight_dispatcher'],
      },
      {
        action: 'transfer',
        label: 'Dispatch Flight',
        enabled: true,
        icon: 'mdi:airplane-takeoff',
        color: 'secondary',
        description: 'Depart to destination',
        requiredStatus: ['Closed', 'Filled'],
        allowedRoles: ['admin', 'flight_dispatcher'],
      },
    ],
    defaultCapacity: {
      maxWeight: 20000,
      maxVolume: 5000,
      maxItems: null,
    },
    customFields: [
      {
        name: 'aircraftType',
        label: 'Aircraft Type',
        type: 'select',
        required: true,
        options: ['Boeing 747-8F', 'Boeing 777F', 'Airbus A330-200F', 'Boeing 767-300F'],
        defaultValue: 'Boeing 777F'
      },
      {
        name: 'registration',
        label: 'Aircraft Registration',
        type: 'text',
        required: true,
        defaultValue: ''
      },
      {
        name: 'flightNumber',
        label: 'Flight Number',
        type: 'text',
        required: false,
        defaultValue: ''
      },
      {
        name: 'cargoHoldConfiguration',
        label: 'Cargo Hold Configuration',
        type: 'select',
        required: true,
        options: ['Main Deck Only', 'Lower Deck Only', 'Main + Lower Deck'],
        defaultValue: 'Main + Lower Deck'
      },
    ],
  },
  {
    id: 'ct-items-001',
    organizationId: 'org-001',
    type: 'Items',
    label: 'Items',
    movementType: 'Variable',
    icon: 'mdi:cube',
    color: 'success',
    description: 'Individual cargo items',
    allowedChildTypes: [],
    canBeContainedIn: ['Warehouse', 'Location', 'ULD', 'Aircraft'],
    maxChildrenAllowed: 0, // Leaf node - no children
    isActive: true,
    actions: [
      {
        action: 'create',
        label: 'Add Item',
        enabled: true,
        icon: 'mdi:plus',
        color: 'success',
        description: 'Add new item',
        allowedRoles: ['admin', 'warehouse_manager', 'operations_staff', 'inventory_clerk'],
      },
      {
        action: 'open',
        label: 'Open Item',
        enabled: false,
        icon: 'mdi:lock-open',
        color: 'info',
        description: 'Not applicable for items',
        requiredStatus: [],
        allowedRoles: [],
      },
      {
        action: 'fill',
        label: 'Fill Item',
        enabled: false,
        icon: 'mdi:package-down',
        color: 'warning',
        description: 'Not applicable for items',
        requiredStatus: [],
        allowedRoles: [],
      },
      {
        action: 'close',
        label: 'Seal Item',
        enabled: true,
        icon: 'mdi:lock',
        color: 'error',
        description: 'Mark item as sealed',
        requiredStatus: ['Created'],
        allowedRoles: ['admin', 'warehouse_manager', 'operations_staff', 'cargo_handler'],
      },
      {
        action: 'transfer',
        label: 'Move Item',
        enabled: true,
        icon: 'mdi:truck',
        color: 'secondary',
        description: 'Move item to another container',
        requiredStatus: ['Created', 'Closed'],
        allowedRoles: ['admin', 'warehouse_manager', 'operations_staff', 'cargo_handler'],
      },
    ],
    defaultCapacity: {
      maxWeight: null,
      maxVolume: null,
      maxItems: null,
    },
    customFields: [
      {
        name: 'sku',
        label: 'SKU/Item Code',
        type: 'text',
        required: true,
        defaultValue: ''
      },
      {
        name: 'description',
        label: 'Item Description',
        type: 'textarea',
        required: false,
        defaultValue: ''
      },
      {
        name: 'weight',
        label: 'Weight (kg)',
        type: 'number',
        required: true,
        defaultValue: 0,
        validation: { min: 0 }
      },
      {
        name: 'volume',
        label: 'Volume (m³)',
        type: 'number',
        required: false,
        defaultValue: 0,
        validation: { min: 0 }
      },
      {
        name: 'hazmat',
        label: 'Hazardous Material',
        type: 'checkbox',
        required: false,
        defaultValue: false
      },
      {
        name: 'fragile',
        label: 'Fragile',
        type: 'checkbox',
        required: false,
        defaultValue: false
      },
    ],
  },
]);

const selectedConfig = ref<ContainerTypeConfig | null>(null);
const editDialog = ref(false);
const searchQuery = ref('');
const selectedAction = ref<ContainerAction | null>(null);
const roleSelectionDialog = ref(false);

const selectConfig = (config: ContainerTypeConfig) => {
  selectedConfig.value = { ...config };
  editDialog.value = true;
};

const openRoleSelection = (action: ContainerAction) => {
  selectedAction.value = action;
  roleSelectionDialog.value = true;
};

const toggleRole = (roleId: string) => {
  if (!selectedAction.value) return;

  const index = selectedAction.value.allowedRoles.indexOf(roleId);
  if (index > -1) {
    selectedAction.value.allowedRoles.splice(index, 1);
  } else {
    selectedAction.value.allowedRoles.push(roleId);
  }
};

const getRoleById = (roleId: string) => {
  return availableRoles.value.find((r) => r.id === roleId);
};

const addCustomField = () => {
  if (!selectedConfig.value) return;

  selectedConfig.value.customFields.push({
    name: '',
    label: '',
    type: 'text',
    required: false,
    defaultValue: ''
  });
};

const removeCustomField = (index: number) => {
  if (!selectedConfig.value) return;
  selectedConfig.value.customFields.splice(index, 1);
};

const saveConfig = () => {
  if (selectedConfig.value) {
    const index = containerConfigs.value.findIndex(
      (c) => c.type === selectedConfig.value!.type
    );
    if (index !== -1) {
      containerConfigs.value[index] = { ...selectedConfig.value };
    }
  }
  editDialog.value = false;
};

const toggleAction = (action: ContainerAction) => {
  action.enabled = !action.enabled;
};

const filteredConfigs = computed(() => {
  if (!searchQuery.value) return containerConfigs.value;
  return containerConfigs.value.filter(
    (c) =>
      c.label.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});
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
                Container Type Configuration
              </h2>
              <VChip color="primary" variant="tonal" size="small">
                {{ currentOrganization.name }}
              </VChip>
            </div>
            <p class="text-body-1 text-medium-emphasis">
              Configure container types, actions, and validation rules for {{ currentOrganization.name }}
            </p>
          </div>
          <VBtn color="primary" prepend-icon="mdi:refresh">
            Reload Configs
          </VBtn>
        </div>

        <!-- Organization Info Alert -->
        <VAlert type="info" variant="tonal" density="compact" class="mt-4">
          <div class="d-flex align-center gap-2">
            <VIcon>mdi:information</VIcon>
            <span>
              <strong>Organization Scope:</strong> These configurations apply to all container instances created within
              <strong>{{ currentOrganization.name }}</strong> ({{ currentOrganization.code }}).
              Container instances will inherit these type definitions and capture the specified attributes.
            </span>
          </div>
        </VAlert>
      </VCol>
    </VRow>

    <!-- Search and Filters -->
    <VRow>
      <VCol cols="12" md="6">
        <VTextField v-model="searchQuery" prepend-inner-icon="mdi:magnify" label="Search container types"
          variant="outlined" density="compact" clearable />
      </VCol>
      <VCol cols="12" md="6" class="d-flex justify-end align-center gap-2">
        <VChip label color="primary" variant="outlined">
          <VIcon start>mdi:cube-outline</VIcon>
          {{ containerConfigs.length }} Types
        </VChip>
        <VChip label color="info" variant="outlined">
          <VIcon start>mdi:lock-open</VIcon>
          Fixed: 2
        </VChip>
        <VChip label color="success" variant="outlined">
          <VIcon start>mdi:truck</VIcon>
          Variable: 3
        </VChip>
      </VCol>
    </VRow>

    <!-- Container Configuration Cards -->
    <VRow>
      <VCol v-for="config in filteredConfigs" :key="config.type" cols="12" md="6" lg="4">
        <VCard class="config-card h-100" hover @click="selectConfig(config)">
          <VCardText>
            <!-- Header -->
            <div class="d-flex align-center mb-4">
              <VAvatar :color="config.color" size="48" class="me-3">
                <VIcon :icon="config.icon" size="28" />
              </VAvatar>
              <div class="flex-grow-1">
                <h3 class="text-h6 font-weight-bold">{{ config.label }}</h3>
                <VChip size="x-small" :color="config.movementType === 'Fixed' ? 'info' : 'success'" label>
                  {{ config.movementType }}
                </VChip>
              </div>
              <VBtn icon size="small" variant="text" @click.stop="selectConfig(config)">
                <VIcon>mdi:cog</VIcon>
              </VBtn>
            </div>

            <!-- Description -->
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ config.description }}
            </p>

            <VDivider class="mb-4" />

            <!-- Hierarchy Info -->
            <div class="mb-4">
              <div class="text-caption font-weight-bold mb-2">
                Can Contain:
              </div>
              <div class="d-flex gap-1 flex-wrap">
                <VChip v-for="child in config.allowedChildTypes" :key="child" size="x-small" color="primary"
                  variant="tonal">
                  {{ child }}
                </VChip>
                <VChip v-if="config.allowedChildTypes.length === 0" size="x-small" variant="outlined">
                  None (Leaf Node)
                </VChip>
              </div>
            </div>

            <div class="mb-4">
              <div class="text-caption font-weight-bold mb-2">
                Can Be In:
              </div>
              <div class="d-flex gap-1 flex-wrap">
                <VChip v-for="parent in config.canBeContainedIn" :key="parent" size="x-small" color="secondary"
                  variant="tonal">
                  {{ parent }}
                </VChip>
                <VChip v-if="config.canBeContainedIn.length === 0" size="x-small" variant="outlined">
                  Root Level
                </VChip>
              </div>
            </div>

            <VDivider class="mb-4" />

            <!-- Actions Summary -->
            <div class="mb-4">
              <div class="text-caption font-weight-bold mb-2">
                Enabled Actions:
              </div>
              <div class="d-flex gap-1 flex-wrap">
                <VTooltip v-for="action in config.actions.filter((a) => a.enabled)" :key="action.action" location="top">
                  <template #activator="{ props }">
                    <VChip v-bind="props" size="small" :color="action.color" :prepend-icon="action.icon">
                      {{ action.label }}
                    </VChip>
                  </template>
                  <span>{{ action.description }}</span>
                </VTooltip>
              </div>
            </div>

            <!-- Custom Fields Summary -->
            <div>
              <div class="text-caption font-weight-bold mb-2">
                Type Attributes:
              </div>
              <div class="d-flex gap-2 align-center">
                <VChip size="small" color="info" variant="tonal">
                  <VIcon start size="16">mdi:form-textbox</VIcon>
                  {{ config.customFields.length }} Fields
                </VChip>
                <VChip v-if="config.customFields.filter(f => f.required).length > 0" size="small" color="warning"
                  variant="tonal">
                  {{config.customFields.filter(f => f.required).length}} Required
                </VChip>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Edit Dialog -->
    <VDialog v-model="editDialog" max-width="900" scrollable>
      <VCard v-if="selectedConfig">
        <VCardTitle class="d-flex align-center pa-4 bg-surface-variant">
          <VIcon :icon="selectedConfig.icon" size="28" class="me-2" />
          <span class="text-h6">Configure {{ selectedConfig.label }}</span>
          <VSpacer />
          <VBtn icon variant="text" @click="editDialog = false">
            <VIcon>mdi:close</VIcon>
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <!-- Basic Settings -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4">Basic Settings</h3>
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="selectedConfig.label" label="Display Label" variant="outlined" density="compact" />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField v-model="selectedConfig.movementType" label="Movement Type" variant="outlined"
                density="compact" readonly />
            </VCol>
            <VCol cols="12">
              <VTextarea v-model="selectedConfig.description" label="Description" variant="outlined" rows="2"
                density="compact" />
            </VCol>

            <VCol cols="12">
              <VDivider class="my-4" />
              <h3 class="text-h6 mb-4">Default Capacity Limits</h3>
            </VCol>
            <VCol cols="12" md="4">
              <VTextField v-model.number="selectedConfig.defaultCapacity.maxWeight" label="Max Weight (kg)"
                type="number" variant="outlined" density="compact" />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField v-model.number="selectedConfig.defaultCapacity.maxVolume" label="Max Volume (m³)"
                type="number" variant="outlined" density="compact" />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField v-model.number="selectedConfig.defaultCapacity.maxItems" label="Max Items" type="number"
                variant="outlined" density="compact" />
            </VCol>

            <VCol cols="12">
              <VDivider class="my-4" />
              <h3 class="text-h6 mb-4">Available Actions</h3>
            </VCol>
            <VCol cols="12">
              <VTable density="compact">
                <thead>
                  <tr>
                    <th>Enabled</th>
                    <th>Action (System)</th>
                    <th>Label (User Display)</th>
                    <th>Description</th>
                    <th>Required Status</th>
                    <th>Allowed Roles</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="action in selectedConfig.actions" :key="action.action">
                    <td>
                      <VSwitch v-model="action.enabled" color="success" density="compact" hide-details inset />
                    </td>
                    <td>
                      <VChip size="small" :color="action.color" :prepend-icon="action.icon" variant="outlined">
                        {{ action.action }}
                      </VChip>
                    </td>
                    <td style="min-inline-size: 200px;">
                      <VTextField v-model="action.label" density="compact" variant="outlined" hide-details
                        placeholder="Enter label" />
                    </td>
                    <td class="text-body-2">{{ action.description }}</td>
                    <td>
                      <div class="d-flex gap-1">
                        <VChip v-for="status in action.requiredStatus" :key="status" size="x-small" variant="outlined">
                          {{ status }}
                        </VChip>
                        <span v-if="!action.requiredStatus?.length" class="text-caption text-medium-emphasis">
                          Any
                        </span>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex gap-1 align-center flex-wrap">
                        <VChip v-for="roleId in action.allowedRoles" :key="roleId" size="x-small"
                          :color="getRoleById(roleId)?.color" variant="tonal">
                          {{ getRoleById(roleId)?.name }}
                        </VChip>
                        <VBtn icon size="x-small" variant="text" @click="openRoleSelection(action)">
                          <VIcon size="16">mdi:pencil</VIcon>
                        </VBtn>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCol>

            <VCol cols="12">
              <VDivider class="my-4" />
              <h3 class="text-h6 mb-4">Hierarchy Rules</h3>
            </VCol>
            <VCol cols="12" md="6">
              <div class="mb-2 text-caption font-weight-bold">
                Can Contain (Child Types):
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <VChip v-for="child in selectedConfig.allowedChildTypes" :key="child" size="small" color="primary"
                  closable>
                  {{ child }}
                </VChip>
              </div>
            </VCol>
            <VCol cols="12" md="6">
              <div class="mb-2 text-caption font-weight-bold">
                Can Be Contained In (Parent Types):
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <VChip v-for="parent in selectedConfig.canBeContainedIn" :key="parent" size="small" color="secondary"
                  closable>
                  {{ parent }}
                </VChip>
              </div>
            </VCol>
          </VRow>

          <!-- Custom Fields Section -->
          <VRow>
            <VCol cols="12">
              <VDivider class="my-4" />
              <div class="d-flex justify-space-between align-center mb-4">
                <h3 class="text-h6">Type-Specific Attributes</h3>
                <VBtn size="small" color="primary" variant="tonal" prepend-icon="mdi:plus" @click="addCustomField">
                  Add Field
                </VBtn>
              </div>
              <div class="text-caption text-medium-emphasis mb-4">
                These fields will be captured when creating instances of this container type
              </div>
            </VCol>

            <VCol cols="12">
              <VTable density="compact" class="custom-fields-table">
                <thead>
                  <tr>
                    <th style="inline-size: 25%;">Field Name</th>
                    <th style="inline-size: 25%;">Label</th>
                    <th style="inline-size: 15%;">Type</th>
                    <th style="inline-size: 10%;">Required</th>
                    <th style="inline-size: 15%;">Default Value</th>
                    <th style="inline-size: 10%;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(field, index) in selectedConfig.customFields" :key="index">
                    <td>
                      <VTextField v-model="field.name" density="compact" variant="outlined" hide-details
                        placeholder="fieldName" />
                    </td>
                    <td>
                      <VTextField v-model="field.label" density="compact" variant="outlined" hide-details
                        placeholder="Display Label" />
                    </td>
                    <td>
                      <VSelect v-model="field.type" density="compact" variant="outlined" hide-details
                        :items="['text', 'number', 'select', 'date', 'textarea', 'checkbox']" />
                    </td>
                    <td class="text-center">
                      <VCheckbox v-model="field.required" density="compact" hide-details />
                    </td>
                    <td>
                      <VTextField v-if="field.type !== 'checkbox'" v-model="field.defaultValue" density="compact"
                        variant="outlined" hide-details placeholder="Default" />
                      <VCheckbox v-else v-model="field.defaultValue" density="compact" hide-details />
                    </td>
                    <td class="text-center">
                      <VBtn icon size="x-small" variant="text" color="error" @click="removeCustomField(index)">
                        <VIcon size="16">mdi:delete</VIcon>
                      </VBtn>
                    </td>
                  </tr>
                  <tr v-if="selectedConfig.customFields.length === 0">
                    <td colspan="6" class="text-center text-medium-emphasis py-4">
                      No custom fields defined. Click "Add Field" to create one.
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="outlined" @click="editDialog = false">
            Cancel
          </VBtn>
          <VBtn color="primary" @click="saveConfig">
            Save Configuration
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Role Selection Dialog -->
    <VDialog v-model="roleSelectionDialog" max-width="600">
      <VCard v-if="selectedAction">
        <VCardTitle class="d-flex align-center pa-4 bg-surface-variant">
          <VIcon icon="mdi:account-multiple" size="24" class="me-2" />
          <span class="text-h6">Configure Roles for "{{ selectedAction.label }}"</span>
          <VSpacer />
          <VBtn icon variant="text" @click="roleSelectionDialog = false">
            <VIcon>mdi:close</VIcon>
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Select which roles can perform this action. Only users with assigned roles will be able to execute this
            operation.
          </p>

          <VList>
            <VListItem v-for="role in availableRoles" :key="role.id" @click="toggleRole(role.id)">
              <template #prepend>
                <VCheckbox :model-value="selectedAction.allowedRoles.includes(role.id)"
                  @click.stop="toggleRole(role.id)" color="primary" hide-details />
              </template>

              <VListItemTitle>
                <VChip size="small" :color="role.color" variant="tonal" class="me-2">
                  {{ role.name }}
                </VChip>
              </VListItemTitle>

              <VListItemSubtitle>
                {{ role.description }}
              </VListItemSubtitle>
            </VListItem>
          </VList>

          <VAlert v-if="selectedAction.allowedRoles.length === 0" type="warning" variant="tonal" class="mt-4">
            No roles selected. This action will not be available to any users.
          </VAlert>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <div class="text-caption text-medium-emphasis">
            {{ selectedAction.allowedRoles.length }} role(s) selected
          </div>
          <VSpacer />
          <VBtn color="primary" @click="roleSelectionDialog = false">
            Done
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>

<style scoped lang="scss">
.config-card {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 10%);
    transform: translateY(-4px);
  }
}
</style>
