<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Warehouse, WarehouseStatus } from '~/types/containerManagement';

/* ================= PROPS & EMITS ================= */
interface Props {
    modelValue: boolean
    warehouse?: Warehouse | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
    'update:modelValue': [value: boolean]
    'saved': []
}>()

/* ================= STATE ================= */
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)

const formData = ref<Warehouse>({
    name: '',
    identifier: '',
    address: '',
    primaryContact: {
        name: '',
        phone: '',
        email: '',
    },
    operatingHours: '',
    status: 'Active',
    capacity: {
        totalCapacity: 0,
        totalVolume: 0,
        capacityUnit: 'pallets',
        volumeUnit: 'm³',
    },
    specialHandlingNotes: '',
    equipmentSummary: '',
    category: 'Fixed',
})

const statusOptions: WarehouseStatus[] = ['Active', 'Inactive', 'Under Maintenance']
const capacityUnitOptions = ['pallets', 'ULDs', 'metric tons', 'cubic meters']
const volumeUnitOptions = ['m³', 'cubic feet', 'liters']

/* ================= COMPUTED ================= */
const dialogTitle = computed(() => {
    return props.warehouse?._id ? 'Edit Warehouse' : 'Add Warehouse'
})

const isFormValid = computed(() => {
    return !!(
        formData.value.name.trim() &&
        formData.value.identifier.trim() &&
        formData.value.address.trim() &&
        formData.value.primaryContact.name.trim()
    )
})

const internalValue = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
})

/* ================= WATCHERS ================= */
watch(() => props.warehouse, (newWarehouse) => {
    if (newWarehouse) {
        formData.value = {
            ...newWarehouse,
            capacity: newWarehouse.capacity || {
                totalCapacity: 0,
                totalVolume: 0,
                capacityUnit: 'pallets',
                volumeUnit: 'm³',
            },
        }
    } else {
        resetForm()
    }
}, { immediate: true })

/* ================= METHODS ================= */
function resetForm() {
    formData.value = {
        name: '',
        identifier: '',
        address: '',
        primaryContact: {
            name: '',
            phone: '',
            email: '',
        },
        operatingHours: '',
        status: 'Active',
        capacity: {
            totalCapacity: 0,
            totalVolume: 0,
            capacityUnit: 'pallets',
            volumeUnit: 'm³',
        },
        specialHandlingNotes: '',
        equipmentSummary: '',
        category: 'Fixed',
    }
    errorMessage.value = null
}

async function saveWarehouse() {
    if (!isFormValid.value) return

    isSaving.value = true
    errorMessage.value = null

    try {
        // In production: 
        // if (props.warehouse?._id) {
        //   await $fetch(`/api/warehouses/${props.warehouse._id}`, {
        //     method: 'PUT',
        //     body: formData.value
        //   })
        // } else {
        //   await $fetch('/api/warehouses', {
        //     method: 'POST',
        //     body: formData.value
        //   })
        // }

        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        emit('saved')
        closeDialog()
    } catch (error: any) {
        console.error('Error saving warehouse:', error)
        errorMessage.value = error.data?.message || 'Failed to save warehouse'
    } finally {
        isSaving.value = false
    }
}

function closeDialog() {
    internalValue.value = false
    setTimeout(() => {
        resetForm()
    }, 300)
}

function generateIdentifier() {
    // Auto-generate identifier based on name
    const prefix = 'WH'
    const timestamp = Date.now().toString().slice(-6)
    const namePart = formData.value.name
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 3)

    formData.value.identifier = `${prefix}-${namePart}-${timestamp}`
}
</script>

<template>
    <VDialog v-model="internalValue" max-width="900" persistent scrollable>
        <VCard>
            <VCardTitle class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center gap-2">
                    <VIcon color="primary">mdi-warehouse</VIcon>
                    <span class="text-h5">{{ dialogTitle }}</span>
                </div>
                <VBtn icon variant="text" size="small" @click="closeDialog" :disabled="isSaving">
                    <VIcon>mdi-close</VIcon>
                </VBtn>
            </VCardTitle>

            <VDivider />

            <VCardText class="pa-6" style="max-block-size: 70vh;">
                <!-- Error Alert -->
                <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4" closable
                    @click:close="errorMessage = null">
                    {{ errorMessage }}
                </VAlert>

                <VForm>
                    <!-- Mandatory Attributes Section -->
                    <div class="mb-6">
                        <div class="text-h6 font-weight-bold mb-4 d-flex align-center">
                            <VIcon class="me-2" color="error">mdi-asterisk</VIcon>
                            Mandatory Information
                        </div>

                        <VRow>
                            <VCol cols="12" md="8">
                                <VTextField v-model="formData.name" label="Warehouse Name *" variant="outlined"
                                    density="comfortable" placeholder="e.g., Mumbai Central Warehouse"
                                    :rules="[v => !!v || 'Name is required']" />
                            </VCol>
                            <VCol cols="12" md="4">
                                <VTextField v-model="formData.identifier" label="Identifier *" variant="outlined"
                                    density="comfortable" placeholder="e.g., WH-BOM-001"
                                    :rules="[v => !!v || 'Identifier is required']" :readonly="!!warehouse?._id">
                                    <template #append-inner>
                                        <VBtn v-if="!warehouse?._id" icon size="x-small" variant="text"
                                            @click="generateIdentifier">
                                            <VIcon size="20">mdi-refresh</VIcon>
                                            <VTooltip activator="parent" location="top">
                                                Auto-generate
                                            </VTooltip>
                                        </VBtn>
                                    </template>
                                </VTextField>
                            </VCol>

                            <VCol cols="12">
                                <VTextarea v-model="formData.address" label="Address *" variant="outlined" rows="3"
                                    placeholder="Full postal address" :rules="[v => !!v || 'Address is required']" />
                            </VCol>

                            <VCol cols="12" md="4">
                                <VTextField v-model="formData.primaryContact.name" label="Primary Contact Name *"
                                    variant="outlined" density="comfortable" placeholder="Warehouse Manager"
                                    :rules="[v => !!v || 'Contact name is required']" />
                            </VCol>
                            <VCol cols="12" md="4">
                                <VTextField v-model="formData.primaryContact.phone" label="Contact Phone"
                                    variant="outlined" density="comfortable" placeholder="+91 1234567890" />
                            </VCol>
                            <VCol cols="12" md="4">
                                <VTextField v-model="formData.primaryContact.email" label="Contact Email"
                                    variant="outlined" density="comfortable" type="email"
                                    placeholder="manager@example.com" />
                            </VCol>
                        </VRow>
                    </div>

                    <VDivider class="my-6" />

                    <!-- Operational Attributes Section -->
                    <div class="mb-6">
                        <div class="text-h6 font-weight-bold mb-4 d-flex align-center">
                            <VIcon class="me-2" color="primary">mdi-cog</VIcon>
                            Operational Details
                        </div>

                        <VRow>
                            <VCol cols="12" md="6">
                                <VTextField v-model="formData.operatingHours" label="Operating Hours" variant="outlined"
                                    density="comfortable" placeholder="e.g., 24/7 or 06:00-22:00" />
                            </VCol>
                            <VCol cols="12" md="6">
                                <VSelect v-model="formData.status" label="Status" :items="statusOptions"
                                    variant="outlined" density="comfortable" />
                            </VCol>
                        </VRow>
                    </div>

                    <VDivider class="my-6" />

                    <!-- Capacity Attributes Section -->
                    <div class="mb-6">
                        <div class="text-h6 font-weight-bold mb-4 d-flex align-center">
                            <VIcon class="me-2" color="success">mdi-gauge</VIcon>
                            Capacity Information
                        </div>

                        <VRow>
                            <VCol cols="12" md="6">
                                <VTextField v-model.number="formData.capacity!.totalCapacity" label="Total Capacity"
                                    variant="outlined" density="comfortable" type="number" min="0" placeholder="0" />
                            </VCol>
                            <VCol cols="12" md="6">
                                <VSelect v-model="formData.capacity!.capacityUnit" label="Capacity Unit"
                                    :items="capacityUnitOptions" variant="outlined" density="comfortable" />
                            </VCol>
                            <VCol cols="12" md="6">
                                <VTextField v-model.number="formData.capacity!.totalVolume" label="Total Volume"
                                    variant="outlined" density="comfortable" type="number" min="0" placeholder="0" />
                            </VCol>
                            <VCol cols="12" md="6">
                                <VSelect v-model="formData.capacity!.volumeUnit" label="Volume Unit"
                                    :items="volumeUnitOptions" variant="outlined" density="comfortable" />
                            </VCol>
                        </VRow>
                    </div>

                    <VDivider class="my-6" />

                    <!-- Optional Attributes Section -->
                    <div class="mb-6">
                        <div class="text-h6 font-weight-bold mb-4 d-flex align-center">
                            <VIcon class="me-2" color="info">mdi-information</VIcon>
                            Additional Information (Optional)
                        </div>

                        <VRow>
                            <VCol cols="12">
                                <VTextarea v-model="formData.specialHandlingNotes" label="Special Handling Notes"
                                    variant="outlined" rows="3"
                                    placeholder="e.g., Cold storage, Hazardous material support, etc." />
                            </VCol>
                            <VCol cols="12">
                                <VTextarea v-model="formData.equipmentSummary" label="Equipment Summary"
                                    variant="outlined" rows="3"
                                    placeholder="e.g., 5 forklifts, High racks, Temperature control systems" />
                            </VCol>
                        </VRow>
                    </div>
                </VForm>
            </VCardText>

            <VDivider />

            <VCardActions class="pa-4">
                <div class="text-caption text-medium-emphasis">
                    <VIcon size="16" class="me-1">mdi-asterisk</VIcon>
                    Required fields
                </div>
                <VSpacer />
                <VBtn variant="outlined" @click="closeDialog" :disabled="isSaving">
                    Cancel
                </VBtn>
                <VBtn color="primary" :disabled="!isFormValid" :loading="isSaving" @click="saveWarehouse">
                    <VIcon start>mdi-content-save</VIcon>
                    {{ warehouse?._id ? 'Update' : 'Create' }} Warehouse
                </VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>

<style scoped>
/* Add any custom styles here */
</style>
