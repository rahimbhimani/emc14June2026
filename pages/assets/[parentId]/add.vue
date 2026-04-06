<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { AttributeSchema, ContainerType } from '~/server/config/containerTypes'

/* ================= TYPES ================= */
interface Container {
    _id: string
    name: string
    typeKey: string
    parentContainerId?: string | null
    fixed: boolean
    status: string
    attributes: Record<string, any>
    createdAt: string
    createdBy: string
    organizationId: string
}

interface LocationZone {
    id: string
    name: string
    zone: string
    available: boolean
    capacity?: string
}

/* ================= STATE ================= */
const route = useRoute()
const router = useRouter()

// Route params
const parentId = computed(() => route.params.parentId as string)
const assetTypeKey = computed(() => route.query.type as string)

// Data
const containerTypes = ref<ContainerType[]>([])
const parentContainer = ref<Container | null>(null)
const availableLocations = ref<LocationZone[]>([])

// Form state
const formData = ref({
    name: '',
    selectedLocationId: null as string | null,
    attributes: {} as Record<string, any>,
})

// UI state
const optionalDetailsExpanded = ref(false)
const isLoadingTypes = ref(false)
const isLoadingParent = ref(false)
const isLoadingLocations = ref(false)
const isSaving = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

/* ================= LIFECYCLE ================= */
onMounted(async () => {
    await Promise.all([
        fetchContainerTypes(),
        fetchParentContainer(),
        fetchAvailableLocations(),
    ])

    // Initialize attributes with default values
    if (selectedAssetType.value) {
        initializeAttributes()
    }
})

/* ================= COMPUTED ================= */
const selectedAssetType = computed(() => {
    return containerTypes.value.find(t => t.typeKey === assetTypeKey.value)
})

const primaryAttributes = computed(() => {
    return selectedAssetType.value?.attributesSchema.filter(attr => attr.section === 'primary') || []
})

const optionalAttributes = computed(() => {
    return selectedAssetType.value?.attributesSchema.filter(attr => attr.section === 'optional') || []
})

const pageTitle = computed(() => {
    return selectedAssetType.value ? `Add ${selectedAssetType.value.label}` : 'Add Asset'
})

const isFormValid = computed(() => {
    if (!formData.value.name.trim()) return false
    if (!formData.value.selectedLocationId) return false

    // Check required primary attributes
    const requiredAttrs = primaryAttributes.value.filter(attr => attr.required)
    return requiredAttrs.every(attr => {
        const value = formData.value.attributes[attr.key]
        return value !== undefined && value !== null && value !== ''
    })
})

const breadcrumbs = computed(() => {
    const items = [
        { title: 'Home', to: '/' },
        { title: 'Assets', to: '/assets' },
    ]

    if (parentContainer.value) {
        items.push({
            title: parentContainer.value.name,
            to: `/assets/${parentContainer.value._id}`,
        })
    }

    items.push({ title: pageTitle.value, to: '' })

    return items
})

/* ================= ACTIONS ================= */
async function fetchContainerTypes() {
    isLoadingTypes.value = true
    errorMessage.value = null

    try {
        const response = await $fetch('/api/container-types')
        containerTypes.value = response.data || []
    } catch (error: any) {
        console.error('Error fetching container types:', error)
        errorMessage.value = 'Failed to load asset types'
    } finally {
        isLoadingTypes.value = false
    }
}

async function fetchParentContainer() {
    if (!parentId.value) return

    isLoadingParent.value = true

    try {
        const response = await $fetch(`/api/containers/${parentId.value}`)
        parentContainer.value = response.data
    } catch (error: any) {
        console.error('Error fetching parent container:', error)
        errorMessage.value = 'Failed to load parent information'
    } finally {
        isLoadingParent.value = false
    }
}

async function fetchAvailableLocations() {
    if (!parentId.value) return

    isLoadingLocations.value = true

    try {
        // In real app: const response = await $fetch(`/api/containers/${parentId.value}/locations`)
        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 500))

        availableLocations.value = [
            { id: 'zone-a-1', name: 'Zone A - Section 1', zone: 'A', available: true, capacity: '80%' },
            { id: 'zone-a-2', name: 'Zone A - Section 2', zone: 'A', available: true, capacity: '45%' },
            { id: 'zone-b-1', name: 'Zone B - Section 1', zone: 'B', available: true, capacity: '60%' },
            { id: 'zone-b-2', name: 'Zone B - Section 2', zone: 'B', available: false, capacity: '100%' },
            { id: 'zone-c-1', name: 'Zone C - Section 1', zone: 'C', available: true, capacity: '25%' },
        ]
    } catch (error: any) {
        console.error('Error fetching locations:', error)
    } finally {
        isLoadingLocations.value = false
    }
}

async function createAsset() {
    if (!isFormValid.value || !selectedAssetType.value) return

    isSaving.value = true
    errorMessage.value = null
    successMessage.value = null

    try {
        const payload = {
            typeKey: assetTypeKey.value,
            name: formData.value.name.trim(),
            parentContainerId: parentId.value,
            attributes: formData.value.attributes,
        }

        const response = await $fetch('/api/containers', {
            method: 'POST',
            body: payload,
        })

        successMessage.value = `${selectedAssetType.value.label} created successfully!`

        // Navigate back after short delay
        setTimeout(() => {
            router.push(`/assets/${parentId.value}`)
        }, 1500)

    } catch (error: any) {
        console.error('Error creating asset:', error)
        errorMessage.value = error.data?.message || 'Failed to create asset. Please try again.'
    } finally {
        isSaving.value = false
    }
}

/* ================= METHODS ================= */
function initializeAttributes() {
    const attrs: Record<string, any> = {}

    selectedAssetType.value?.attributesSchema.forEach(field => {
        if (field.control === 'checkbox') {
            attrs[field.key] = false
        } else if (field.control === 'number') {
            attrs[field.key] = field.min || 0
        } else {
            attrs[field.key] = field.defaultValue || ''
        }
    })

    formData.value.attributes = attrs
}

function selectLocation(locationId: string) {
    formData.value.selectedLocationId = locationId
}

function cancel() {
    router.push(`/assets/${parentId.value}`)
}

function getFieldValue(key: string) {
    return formData.value.attributes[key]
}

function setFieldValue(key: string, value: any) {
    formData.value.attributes[key] = value
}

function renderFormField(field: AttributeSchema) {
    // This will be used in template to determine which component to render
    return field.control
}
</script>

<template>
    <div class="asset-creation-page">
        <!-- Loading State -->
        <div v-if="isLoadingTypes || isLoadingParent" class="d-flex justify-center align-center"
            style="min-block-size: 400px;">
            <div class="text-center">
                <VProgressCircular indeterminate color="primary" size="64" />
                <div class="text-h6 mt-4">Loading...</div>
            </div>
        </div>

        <!-- Error State -->
        <VAlert v-else-if="errorMessage && !selectedAssetType" type="error" variant="tonal" class="ma-6">
            {{ errorMessage }}
        </VAlert>

        <!-- Main Content -->
        <VContainer v-else-if="selectedAssetType" fluid class="pa-6">
            <!-- Breadcrumbs -->
            <VBreadcrumbs :items="breadcrumbs" class="px-0 pb-4">
                <template #divider>
                    <VIcon>mdi-chevron-right</VIcon>
                </template>
            </VBreadcrumbs>

            <!-- Header -->
            <div class="mb-6">
                <div class="d-flex align-center gap-3 mb-2">
                    <VAvatar :color="selectedAssetType.color" size="48" variant="tonal">
                        <VIcon :icon="selectedAssetType.icon" size="28" />
                    </VAvatar>
                    <div>
                        <h1 class="text-h4 font-weight-bold">{{ pageTitle }}</h1>
                        <p class="text-body-1 text-medium-emphasis mb-0">
                            <VIcon size="16" class="me-1">mdi-map-marker</VIcon>
                            {{ parentContainer?.name || 'Loading...' }}
                        </p>
                    </div>
                </div>
                <p v-if="selectedAssetType.description" class="text-body-2 text-medium-emphasis mt-2">
                    {{ selectedAssetType.description }}
                </p>
            </div>

            <!-- Alert Messages -->
            <VAlert v-if="errorMessage" type="error" variant="tonal" class="mb-4" closable
                @click:close="errorMessage = null">
                {{ errorMessage }}
            </VAlert>

            <VAlert v-if="successMessage" type="success" variant="tonal" class="mb-4">
                <div class="d-flex align-center gap-2">
                    <VIcon>mdi-check-circle</VIcon>
                    <span>{{ successMessage }}</span>
                </div>
            </VAlert>

            <!-- Two Column Layout -->
            <VRow>
                <!-- LEFT COLUMN: Primary Asset Details -->
                <VCol cols="12" md="6">
                    <VCard elevation="2">
                        <VCardTitle class="d-flex align-center pa-4 bg-primary">
                            <VIcon class="me-2" color="white">mdi-form-textbox</VIcon>
                            <span class="text-white">Primary Details</span>
                        </VCardTitle>

                        <VCardText class="pa-6">
                            <!-- Asset Name -->
                            <VTextField v-model="formData.name" label="Name *" variant="outlined" density="comfortable"
                                :placeholder="`Enter ${selectedAssetType.label} name`" class="mb-4"
                                :error="!formData.name.trim() && formData.name.length > 0"
                                :hint="`Unique identifier for this ${selectedAssetType.label}`" persistent-hint>
                                <template #prepend-inner>
                                    <VIcon :color="selectedAssetType.color">{{ selectedAssetType.icon }}</VIcon>
                                </template>
                            </VTextField>

                            <VDivider class="my-4" />

                            <!-- Dynamic Primary Attributes -->
                            <div v-for="field in primaryAttributes" :key="field.key" class="mb-4">
                                <!-- Text Input -->
                                <VTextField v-if="field.control === 'text'" :model-value="getFieldValue(field.key)"
                                    @update:model-value="setFieldValue(field.key, $event)"
                                    :label="field.label + (field.required ? ' *' : '')" variant="outlined"
                                    density="comfortable" :placeholder="field.placeholder" :hint="field.helpText"
                                    :persistent-hint="!!field.helpText" />

                                <!-- Number Input -->
                                <VTextField v-else-if="field.control === 'number'"
                                    :model-value="getFieldValue(field.key)"
                                    @update:model-value="setFieldValue(field.key, Number($event))"
                                    :label="field.label + (field.required ? ' *' : '')" type="number" variant="outlined"
                                    density="comfortable" :placeholder="field.placeholder" :hint="field.helpText"
                                    :persistent-hint="!!field.helpText" :min="field.min" :max="field.max" />

                                <!-- Textarea -->
                                <VTextarea v-else-if="field.control === 'textarea'"
                                    :model-value="getFieldValue(field.key)"
                                    @update:model-value="setFieldValue(field.key, $event)"
                                    :label="field.label + (field.required ? ' *' : '')" variant="outlined" rows="3"
                                    :placeholder="field.placeholder" :hint="field.helpText"
                                    :persistent-hint="!!field.helpText" />

                                <!-- Select Dropdown -->
                                <VSelect v-else-if="field.control === 'select'" :model-value="getFieldValue(field.key)"
                                    @update:model-value="setFieldValue(field.key, $event)"
                                    :label="field.label + (field.required ? ' *' : '')" :items="field.options || []"
                                    variant="outlined" density="comfortable" :hint="field.helpText"
                                    :persistent-hint="!!field.helpText" />

                                <!-- Radio Buttons -->
                                <div v-else-if="field.control === 'radio'">
                                    <div class="text-subtitle-2 mb-2">
                                        {{ field.label }}{{ field.required ? ' *' : '' }}
                                    </div>
                                    <VRadioGroup :model-value="getFieldValue(field.key)"
                                        @update:model-value="setFieldValue(field.key, $event)" inline>
                                        <VRadio v-for="option in field.options" :key="option" :label="option"
                                            :value="option" color="primary" />
                                    </VRadioGroup>
                                    <div v-if="field.helpText" class="text-caption text-medium-emphasis mt-1">
                                        {{ field.helpText }}
                                    </div>
                                </div>

                                <!-- Checkbox -->
                                <VCheckbox v-else-if="field.control === 'checkbox'"
                                    :model-value="getFieldValue(field.key)"
                                    @update:model-value="setFieldValue(field.key, $event)" :label="field.label"
                                    :hint="field.helpText" :persistent-hint="!!field.helpText" color="primary" />
                            </div>
                        </VCardText>
                    </VCard>
                </VCol>

                <!-- RIGHT COLUMN: Optional Details + Placement -->
                <VCol cols="12" md="6">
                    <!-- Optional Details Card (Collapsible) -->
                    <VCard v-if="optionalAttributes.length > 0" elevation="2" class="mb-4">
                        <VCardTitle class="d-flex align-center justify-space-between pa-4 cursor-pointer"
                            @click="optionalDetailsExpanded = !optionalDetailsExpanded">
                            <div class="d-flex align-center">
                                <VIcon class="me-2">mdi-cog-outline</VIcon>
                                <span>Operational Details (Optional)</span>
                            </div>
                            <VIcon>{{ optionalDetailsExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</VIcon>
                        </VCardTitle>

                        <VExpandTransition>
                            <VCardText v-show="optionalDetailsExpanded" class="pa-6 pt-0">
                                <div v-for="field in optionalAttributes" :key="field.key" class="mb-4">
                                    <!-- Text Input -->
                                    <VTextField v-if="field.control === 'text'" :model-value="getFieldValue(field.key)"
                                        @update:model-value="setFieldValue(field.key, $event)" :label="field.label"
                                        variant="outlined" density="comfortable" :placeholder="field.placeholder"
                                        :hint="field.helpText" :persistent-hint="!!field.helpText" />

                                    <!-- Number Input -->
                                    <VTextField v-else-if="field.control === 'number'"
                                        :model-value="getFieldValue(field.key)"
                                        @update:model-value="setFieldValue(field.key, Number($event))"
                                        :label="field.label" type="number" variant="outlined" density="comfortable"
                                        :placeholder="field.placeholder" :hint="field.helpText"
                                        :persistent-hint="!!field.helpText" :min="field.min" :max="field.max" />

                                    <!-- Textarea -->
                                    <VTextarea v-else-if="field.control === 'textarea'"
                                        :model-value="getFieldValue(field.key)"
                                        @update:model-value="setFieldValue(field.key, $event)" :label="field.label"
                                        variant="outlined" rows="3" :placeholder="field.placeholder"
                                        :hint="field.helpText" :persistent-hint="!!field.helpText" />

                                    <!-- Select Dropdown -->
                                    <VSelect v-else-if="field.control === 'select'"
                                        :model-value="getFieldValue(field.key)"
                                        @update:model-value="setFieldValue(field.key, $event)" :label="field.label"
                                        :items="field.options || []" variant="outlined" density="comfortable"
                                        :hint="field.helpText" :persistent-hint="!!field.helpText" />

                                    <!-- Checkbox -->
                                    <VCheckbox v-else-if="field.control === 'checkbox'"
                                        :model-value="getFieldValue(field.key)"
                                        @update:model-value="setFieldValue(field.key, $event)" :label="field.label"
                                        :hint="field.helpText" :persistent-hint="!!field.helpText" color="primary" />
                                </div>
                            </VCardText>
                        </VExpandTransition>
                    </VCard>

                    <!-- Placement Card -->
                    <VCard elevation="2">
                        <VCardTitle class="d-flex align-center pa-4 bg-secondary">
                            <VIcon class="me-2" color="white">mdi-map-marker</VIcon>
                            <span class="text-white">Placement Location *</span>
                        </VCardTitle>

                        <VCardText class="pa-6">
                            <p class="text-body-2 text-medium-emphasis mb-4">
                                Select where this {{ selectedAssetType.label }} will be placed
                            </p>

                            <!-- Loading Locations -->
                            <div v-if="isLoadingLocations" class="text-center py-8">
                                <VProgressCircular indeterminate color="primary" size="48" />
                                <div class="text-caption mt-2">Loading locations...</div>
                            </div>

                            <!-- Location Cards -->
                            <VRow v-else>
                                <VCol v-for="location in availableLocations" :key="location.id" cols="12" sm="6">
                                    <VCard
                                        :variant="formData.selectedLocationId === location.id ? 'elevated' : 'outlined'"
                                        :color="formData.selectedLocationId === location.id ? 'primary' : undefined"
                                        :class="{ 'location-card': true, 'selected': formData.selectedLocationId === location.id }"
                                        :disabled="!location.available"
                                        @click="location.available && selectLocation(location.id)" hover>
                                        <VCardText class="pa-4">
                                            <div class="d-flex align-center justify-space-between mb-2">
                                                <VIcon
                                                    :color="formData.selectedLocationId === location.id ? 'white' : 'primary'"
                                                    size="24">
                                                    {{ formData.selectedLocationId === location.id ? 'mdi-check-circle'
                                                    :
                                                    'mdi-map-marker-outline' }}
                                                </VIcon>
                                                <VChip size="x-small" :color="location.available ? 'success' : 'error'"
                                                    variant="flat">
                                                    {{ location.available ? 'Available' : 'Full' }}
                                                </VChip>
                                            </div>
                                            <div class="font-weight-bold mb-1"
                                                :class="formData.selectedLocationId === location.id ? 'text-white' : ''">
                                                {{ location.name }}
                                            </div>
                                            <div class="text-caption"
                                                :class="formData.selectedLocationId === location.id ? 'text-white' : 'text-medium-emphasis'">
                                                Zone {{ location.zone }} • {{ location.capacity }} capacity
                                            </div>
                                        </VCardText>
                                    </VCard>
                                </VCol>
                            </VRow>
                        </VCardText>
                    </VCard>
                </VCol>
            </VRow>
        </VContainer>

        <!-- Sticky Action Bar -->
        <VFooter app class="action-bar elevation-8 pa-4">
            <VContainer fluid>
                <div class="d-flex justify-space-between align-center">
                    <div class="text-caption text-medium-emphasis">
                        <VIcon size="16" class="me-1">mdi-information-outline</VIcon>
                        Fields marked with * are required
                    </div>
                    <div class="d-flex gap-3">
                        <VBtn variant="outlined" size="large" @click="cancel" :disabled="isSaving">
                            Cancel
                        </VBtn>
                        <VBtn color="primary" size="large" :disabled="!isFormValid" :loading="isSaving"
                            @click="createAsset">
                            <VIcon start>mdi-plus</VIcon>
                            Add {{ selectedAssetType?.label }}
                        </VBtn>
                    </div>
                </div>
            </VContainer>
        </VFooter>
    </div>
</template>

<style scoped>
.asset-creation-page {
    min-block-size: 100vh;
    padding-block-end: 100px;
}

.location-card {
    cursor: pointer;
    transition: all 0.3s ease;
}

.location-card:not(.selected):hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
    transform: translateY(-2px);
}

.location-card.selected {
    border: 2px solid rgb(var(--v-theme-primary));
}

.action-bar {
    position: fixed;
    z-index: 100;
    background: rgb(var(--v-theme-surface));
    border-block-start: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
    inset-block-end: 0;
    inset-inline: 0;
}
</style>
