<script setup lang="ts">
interface Stakeholder {
  id: string
  name: string
  icon: string
  description: string
}

interface Product {
  id: string
  name: string
  description: string
}

const props = defineProps<{
  products: Product[]
  stakeholdersByProduct: Record<string, Stakeholder[]>
  selectedStakeholders: Record<string, string[]>
}>()

const emit = defineEmits<{
  (e: 'toggle', payload: { productId: string; stakeholderId: string }): void
}>()

const expandedPanels = ref<number[]>([])

onMounted(() => {
  expandedPanels.value = props.products.map((_, index) => index)
})

function isSelected(productId: string, stakeholderId: string) {
  return (props.selectedStakeholders[productId] || []).includes(stakeholderId)
}

function selectedCount(productId: string) {
  return (props.selectedStakeholders[productId] || []).length
}

const totalSelected = computed(() =>
  Object.values(props.selectedStakeholders).reduce((n, ids) => n + ids.length, 0),
)

function toggleStakeholder(productId: string, stakeholderId: string) {
  emit('toggle', { productId, stakeholderId })
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-5">
      <p class="text-body-2 text-medium-emphasis mb-0">
        Assign stakeholder roles for each selected product.
      </p>
      <VChip v-if="totalSelected > 0" color="primary" size="small" variant="tonal">
        {{ totalSelected }} assigned
      </VChip>
    </div>

    <VExpansionPanels v-model="expandedPanels" multiple variant="accordion">
      <VExpansionPanel
        v-for="(product, index) in products"
        :key="product.id"
        :value="index"
        elevation="0"
        class="sh-panel"
      >
        <VExpansionPanelTitle>
          <div class="d-flex align-center w-100 pe-3">
            <div class="flex-grow-1">
              <div class="sh-panel__name">{{ product.name }}</div>
              <div class="sh-panel__desc">{{ product.description }}</div>
            </div>
            <VChip
              :color="selectedCount(product.id) > 0 ? 'primary' : 'default'"
              size="x-small"
              variant="tonal"
              class="flex-shrink-0"
            >
              {{ selectedCount(product.id) }} selected
            </VChip>
          </div>
        </VExpansionPanelTitle>

        <VExpansionPanelText>
          <VRow class="mt-0">
            <VCol
              v-for="stakeholder in stakeholdersByProduct[product.id] || []"
              :key="stakeholder.id"
              cols="12"
              sm="6"
              md="4"
            >
              <div
                class="sh-card"
                :class="{ 'sh-card--selected': isSelected(product.id, stakeholder.id) }"
                role="checkbox"
                :aria-checked="isSelected(product.id, stakeholder.id)"
                tabindex="0"
                @click="toggleStakeholder(product.id, stakeholder.id)"
                @keydown.enter.space.prevent="toggleStakeholder(product.id, stakeholder.id)"
              >
                <div class="d-flex justify-space-between align-start mb-2">
                  <VAvatar color="primary" variant="tonal" size="38">
                    <VIcon :icon="stakeholder.icon" size="18" />
                  </VAvatar>
                  <div
                    class="sh-card__check"
                    :class="{ 'sh-card__check--visible': isSelected(product.id, stakeholder.id) }"
                  >
                    <VIcon icon="mdi:check" size="11" />
                  </div>
                </div>

                <div class="sh-card__name mb-1">{{ stakeholder.name }}</div>
                <div class="sh-card__desc">{{ stakeholder.description }}</div>
              </div>
            </VCol>
          </VRow>
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>
  </div>
</template>

<style scoped>
/* overflow (configured) before border in panel */
.sh-panel {
  overflow: hidden;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px !important;
  margin-block-end: 10px;
}

.sh-panel__name {
  font-size: 0.9rem;
  font-weight: 700;
}

.sh-panel__desc {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
  margin-block-start: 2px;
}

/* padding (configured) before border (configured) */
.sh-card {
  position: relative;
  padding: 14px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  block-size: 100%;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.sh-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  box-shadow: 0 2px 12px rgba(var(--v-theme-primary), 0.08);
}

.sh-card--selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.04);
}

/* flex-shrink (configured) before border-radius (configured) */
.sh-card__check {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  block-size: 20px;
  color: rgb(var(--v-theme-on-primary));
  inline-size: 20px;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.sh-card__check--visible {
  opacity: 1;
  transform: scale(1);
}

.sh-card__name {
  font-size: 0.875rem;
  font-weight: 700;
}

.sh-card__desc {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
  line-height: 1.5;
}
</style>
