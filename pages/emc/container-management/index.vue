<script setup lang="ts">
import { ref } from 'vue'
import type { ContainerType } from '~/types/containerManagement'

definePageMeta({
    title: 'Container Management',
})

const containerTypes = ref<ContainerType[]>([
    {
        key: 'warehouse',
        label: 'Warehouse',
        icon: 'mdi-warehouse',
        color: 'primary',
        description: 'Manage fixed warehouses and storage facilities',
        category: 'Fixed',
        enabled: true,
    },
    {
        key: 'uld',
        label: 'ULD',
        icon: 'mdi-package-variant',
        color: 'info',
        description: 'Unit Load Devices for air cargo (Coming Soon)',
        category: 'Variable',
        enabled: false,
    },
    {
        key: 'pallet',
        label: 'Pallet',
        icon: 'mdi-pallet',
        color: 'success',
        description: 'Pallet management and tracking (Coming Soon)',
        category: 'Variable',
        enabled: false,
    },
    {
        key: 'shipment',
        label: 'Shipment Box',
        icon: 'mdi-package',
        color: 'warning',
        description: 'Individual shipment packages (Coming Soon)',
        category: 'Variable',
        enabled: false,
    },
])

function navigateToContainerType(type: ContainerType) {
    if (!type.enabled) return

    navigateTo(`/emc/container-management/${type.key}`)
}
</script>

<template>
    <VContainer fluid class="pa-6">
        <!-- Page Header -->
        <div class="mb-8">
            <h1 class="text-h3 font-weight-bold mb-2">Container Management</h1>
            <p class="text-h6 text-medium-emphasis">
                Select a container type to manage
            </p>
        </div>

        <!-- Container Type Cards -->
        <VRow>
            <VCol v-for="type in containerTypes" :key="type.key" cols="12" sm="6" md="4" lg="3">
                <VCard :disabled="!type.enabled"
                    :class="{ 'container-type-card': true, 'cursor-pointer': type.enabled }" hover
                    @click="navigateToContainerType(type)">
                    <VCardText class="pa-6">
                        <div class="d-flex flex-column align-center text-center">
                            <!-- Icon -->
                            <VAvatar :color="type.enabled ? type.color : 'grey-lighten-2'" size="80" class="mb-4">
                                <VIcon :icon="type.icon" size="48" :color="type.enabled ? 'white' : 'grey'" />
                            </VAvatar>

                            <!-- Label -->
                            <h3 class="text-h5 font-weight-bold mb-2">
                                {{ type.label }}
                            </h3>

                            <!-- Category Badge -->
                            <VChip :color="type.category === 'Fixed' ? 'primary' : 'secondary'" size="small"
                                variant="tonal" class="mb-3">
                                {{ type.category }}
                            </VChip>

                            <!-- Description -->
                            <p class="text-body-2 text-medium-emphasis mb-0">
                                {{ type.description }}
                            </p>

                            <!-- Coming Soon Badge -->
                            <VChip v-if="!type.enabled" color="warning" size="small" class="mt-3">
                                Coming Soon
                            </VChip>
                        </div>
                    </VCardText>

                    <!-- Hover Effect -->
                    <VOverlay v-if="type.enabled" :model-value="false" contained class="align-center justify-center"
                        scrim="primary" opacity="0.1">
                        <VBtn :color="type.color" variant="flat" size="large">
                            <VIcon start>mdi-arrow-right</VIcon>
                            Manage {{ type.label }}
                        </VBtn>
                    </VOverlay>
                </VCard>
            </VCol>
        </VRow>

        <!-- Info Section -->
        <VRow class="mt-8">
            <VCol cols="12">
                <VAlert type="info" variant="tonal" border="start" prominent>
                    <VRow align="center">
                        <VCol cols="12" md="auto">
                            <VIcon size="32">mdi-information</VIcon>
                        </VCol>
                        <VCol>
                            <div class="text-subtitle-1 font-weight-bold mb-1">
                                About Container Management
                            </div>
                            <div class="text-body-2">
                                Container Management allows you to configure and manage different types of storage and
                                transport units.
                                Start with Warehouses as your foundation layer. Additional container types like ULDs and
                                Pallets will be available soon.
                            </div>
                        </VCol>
                    </VRow>
                </VAlert>
            </VCol>
        </VRow>
    </VContainer>
</template>

<style scoped>
.container-type-card {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.container-type-card.cursor-pointer {
    cursor: pointer;
}

.container-type-card.cursor-pointer:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 12%);
    transform: translateY(-8px);
}

.container-type-card:not(.cursor-pointer) {
    opacity: 0.7;
}
</style>
