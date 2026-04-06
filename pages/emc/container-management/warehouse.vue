<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Warehouse } from '~/types/containerManagement'

definePageMeta({
    title: 'Warehouse Management',
})

/* ================= STATE ================= */
const warehouses = ref<Warehouse[]>([])
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const showFormDialog = ref(false)
const showStockReceiptDialog = ref(false)
const selectedWarehouse = ref<Warehouse | null>(null)

/* ================= LIFECYCLE ================= */
onMounted(() => {
    fetchWarehouses()
})

/* ================= COMPUTED ================= */
const hasWarehouses = computed(() => warehouses.value.length > 0)

const warehouseStats = computed(() => ({
    total: warehouses.value.length,
    active: warehouses.value.filter(w => w.status === 'Active').length,
    inactive: warehouses.value.filter(w => w.status === 'Inactive').length,
    maintenance: warehouses.value.filter(w => w.status === 'Under Maintenance').length,
}))

/* ================= ACTIONS ================= */
async function fetchWarehouses() {
    isLoading.value = true
    errorMessage.value = null

    try {
        // Mock data for now
        // In production: const response = await $fetch('/api/warehouses')
        await new Promise(resolve => setTimeout(resolve, 1000))

        warehouses.value = [
            // Empty initially - will be populated from API
        ]
    } catch (error: any) {
        console.error('Error fetching warehouses:', error)
        errorMessage.value = 'Failed to load warehouses'
    } finally {
        isLoading.value = false
    }
}

/* ================= METHODS ================= */
function openCreateDialog() {
    selectedWarehouse.value = null
    showFormDialog.value = true
}

function openEditDialog(warehouse: Warehouse) {
    selectedWarehouse.value = { ...warehouse }
    showFormDialog.value = true
}

function handleWarehouseSaved() {
    showFormDialog.value = false
    selectedWarehouse.value = null
    fetchWarehouses()
}

function openStockReceiptDialog() {
    showStockReceiptDialog.value = true
}

function handleStockReceiptSuccess(data: any) {
    // Show success notification and refresh if needed
    console.log('Stock receipt completed:', data)
    // You can add a toast notification here
}

function getStatusColor(status: string) {
    const colors: Record<string, string> = {
        'Active': 'success',
        'Inactive': 'error',
        'Under Maintenance': 'warning',
    }
    return colors[status] || 'default'
}

function getStatusIcon(status: string) {
    const icons: Record<string, string> = {
        'Active': 'mdi-check-circle',
        'Inactive': 'mdi-close-circle',
        'Under Maintenance': 'mdi-wrench',
    }
    return icons[status] || 'mdi-help-circle'
}
</script>

<template>
    <VContainer fluid class="pa-6">
        <!-- Breadcrumbs -->
        <VBreadcrumbs :items="[
            { title: 'Home', to: '/' },
            { title: 'Container Management', to: '/emc/container-management' },
            { title: 'Warehouse Management', to: '' },
        ]" class="px-0 pb-4">
            <template #divider>
                <VIcon>mdi-chevron-right</VIcon>
            </template>
        </VBreadcrumbs>

        <!-- Page Header -->
        <div class="d-flex justify-space-between align-center mb-6">
            <div>
                <div class="d-flex align-center gap-3 mb-2">
                    <VAvatar color="primary" size="48">
                        <VIcon icon="mdi-warehouse" size="28" />
                    </VAvatar>
                    <div>
                        <h1 class="text-h4 font-weight-bold">Warehouse Management</h1>
                        <p class="text-body-1 text-medium-emphasis mb-0">
                            Manage warehouses and storage facilities
                        </p>
                    </div>
                </div>
            </div>
            <div class="d-flex gap-2">
                <VBtn color="success" size="large" prepend-icon="mdi-warehouse-in" @click="openStockReceiptDialog">
                    Stock Receipt
                </VBtn>
                <VBtn color="primary" size="large" prepend-icon="mdi-plus" @click="openCreateDialog">
                    Add Warehouse
                </VBtn>
            </div>
        </div>

        <!-- Stats Cards -->
        <VRow v-if="hasWarehouses" class="mb-6">
            <VCol cols="12" sm="6" md="3">
                <VCard>
                    <VCardText>
                        <div class="d-flex justify-space-between align-center">
                            <div>
                                <div class="text-caption text-medium-emphasis">Total</div>
                                <div class="text-h4 font-weight-bold">{{ warehouseStats.total }}</div>
                            </div>
                            <VAvatar color="primary" variant="tonal" size="48">
                                <VIcon size="28">mdi-warehouse</VIcon>
                            </VAvatar>
                        </div>
                    </VCardText>
                </VCard>
            </VCol>
            <VCol cols="12" sm="6" md="3">
                <VCard>
                    <VCardText>
                        <div class="d-flex justify-space-between align-center">
                            <div>
                                <div class="text-caption text-medium-emphasis">Active</div>
                                <div class="text-h4 font-weight-bold text-success">{{ warehouseStats.active }}</div>
                            </div>
                            <VAvatar color="success" variant="tonal" size="48">
                                <VIcon size="28">mdi-check-circle</VIcon>
                            </VAvatar>
                        </div>
                    </VCardText>
                </VCard>
            </VCol>
            <VCol cols="12" sm="6" md="3">
                <VCard>
                    <VCardText>
                        <div class="d-flex justify-space-between align-center">
                            <div>
                                <div class="text-caption text-medium-emphasis">Inactive</div>
                                <div class="text-h4 font-weight-bold text-error">{{ warehouseStats.inactive }}</div>
                            </div>
                            <VAvatar color="error" variant="tonal" size="48">
                                <VIcon size="28">mdi-close-circle</VIcon>
                            </VAvatar>
                        </div>
                    </VCardText>
                </VCard>
            </VCol>
            <VCol cols="12" sm="6" md="3">
                <VCard>
                    <VCardText>
                        <div class="d-flex justify-space-between align-center">
                            <div>
                                <div class="text-caption text-medium-emphasis">Maintenance</div>
                                <div class="text-h4 font-weight-bold text-warning">{{ warehouseStats.maintenance }}
                                </div>
                            </div>
                            <VAvatar color="warning" variant="tonal" size="48">
                                <VIcon size="28">mdi-wrench</VIcon>
                            </VAvatar>
                        </div>
                    </VCardText>
                </VCard>
            </VCol>
        </VRow>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-12">
            <VProgressCircular indeterminate color="primary" size="64" />
            <div class="text-h6 mt-4">Loading warehouses...</div>
        </div>

        <!-- Error State -->
        <VAlert v-else-if="errorMessage" type="error" variant="tonal" class="mb-6">
            {{ errorMessage }}
        </VAlert>

        <!-- Empty State -->
        <VCard v-else-if="!hasWarehouses" class="text-center pa-12">
            <VAvatar color="grey-lighten-3" size="120" class="mb-6">
                <VIcon icon="mdi-warehouse" size="80" color="grey-lighten-1" />
            </VAvatar>
            <h2 class="text-h4 font-weight-bold mb-3">No Warehouses Configured</h2>
            <p class="text-h6 text-medium-emphasis mb-6">
                No warehouses have been configured yet.
            </p>
            <p class="text-body-1 text-medium-emphasis mb-6"
                style=" margin-block: 0; margin-inline: auto;max-inline-size: 600px;">
                Get started by adding your first warehouse. Warehouses serve as the foundation for your
                container management system and will later support zones, locations, and inventory tracking.
            </p>
            <VBtn color="primary" size="x-large" prepend-icon="mdi-plus" @click="openCreateDialog">
                Add Your First Warehouse
            </VBtn>
        </VCard>

        <!-- Warehouse List -->
        <VCard v-else>
            <VCardTitle class="d-flex align-center justify-space-between pa-4">
                <span>All Warehouses</span>
                <VTextField density="compact" variant="outlined" placeholder="Search warehouses..."
                    prepend-inner-icon="mdi-magnify" hide-details style="max-inline-size: 300px;" />
            </VCardTitle>

            <VTable>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Identifier</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Primary Contact</th>
                        <th>Capacity</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="warehouse in warehouses" :key="warehouse._id">
                        <td>
                            <div class="d-flex align-center gap-2">
                                <VIcon color="primary">mdi-warehouse</VIcon>
                                <span class="font-weight-medium">{{ warehouse.name }}</span>
                            </div>
                        </td>
                        <td>
                            <VChip size="small" variant="outlined">
                                {{ warehouse.identifier }}
                            </VChip>
                        </td>
                        <td>
                            <VChip :color="getStatusColor(warehouse.status)"
                                :prepend-icon="getStatusIcon(warehouse.status)" size="small" variant="tonal">
                                {{ warehouse.status }}
                            </VChip>
                        </td>
                        <td>
                            <div class="text-body-2">{{ warehouse.address }}</div>
                        </td>
                        <td>
                            <div class="text-body-2">{{ warehouse.primaryContact.name }}</div>
                            <div class="text-caption text-medium-emphasis">
                                {{ warehouse.primaryContact.email || warehouse.primaryContact.phone }}
                            </div>
                        </td>
                        <td>
                            <div v-if="warehouse.capacity" class="text-body-2">
                                {{ warehouse.capacity.totalCapacity }} {{ warehouse.capacity.capacityUnit }}
                            </div>
                            <div v-else class="text-caption text-medium-emphasis">N/A</div>
                        </td>
                        <td>
                            <div class="d-flex gap-1">
                                <VBtn icon size="small" variant="text" @click="openEditDialog(warehouse)">
                                    <VIcon size="20">mdi-pencil</VIcon>
                                    <VTooltip activator="parent" location="top">Edit</VTooltip>
                                </VBtn>
                                <VBtn icon size="small" variant="text" color="primary">
                                    <VIcon size="20">mdi-eye</VIcon>
                                    <VTooltip activator="parent" location="top">View Details</VTooltip>
                                </VBtn>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </VTable>
        </VCard>

        <!-- Warehouse Form Dialog -->
        <WarehouseFormDialog v-model="showFormDialog" :warehouse="selectedWarehouse" @saved="handleWarehouseSaved" />

        <!-- Stock Receipt Dialog -->
        <StockReceiptDialog v-model="showStockReceiptDialog" @success="handleStockReceiptSuccess" />
    </VContainer>
</template>

<style scoped>
/* Add any custom styles here */
</style>
