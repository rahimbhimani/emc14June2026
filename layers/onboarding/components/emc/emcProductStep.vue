<script setup lang="ts">
interface Product {
  id: string
  domainId: string
  name: string
  description: string
  startingPrice: string
  icon: string
}

const props = defineProps<{
  products: Product[]
  selectedProducts: string[]
}>()

const emit = defineEmits<{
  (e: 'toggle', productId: string): void
}>()
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-5">
      <p class="text-body-2 text-medium-emphasis mb-0">
        Select one or more products for your organisation.
      </p>
      <VChip v-if="selectedProducts.length" color="primary" size="small" variant="tonal">
        {{ selectedProducts.length }} selected
      </VChip>
    </div>

    <VRow>
      <VCol v-for="product in products" :key="product.id" cols="12" sm="6" md="4">
        <div
          class="product-card"
          :class="{ 'product-card--selected': selectedProducts.includes(product.id) }"
          role="checkbox"
          :aria-checked="selectedProducts.includes(product.id)"
          tabindex="0"
          @click="emit('toggle', product.id)"
          @keydown.enter.space.prevent="emit('toggle', product.id)"
        >
          <div class="d-flex justify-space-between align-start mb-3">
            <VAvatar color="primary" variant="tonal" size="44">
              <VIcon :icon="product.icon" size="22" />
            </VAvatar>

            <div
              class="product-card__check"
              :class="{ 'product-card__check--visible': selectedProducts.includes(product.id) }"
            >
              <VIcon icon="mdi:check" size="12" />
            </div>
          </div>

          <div class="product-card__name mb-1">{{ product.name }}</div>
          <div class="product-card__desc mb-3">{{ product.description }}</div>

          <div class="product-card__price">
            <VIcon icon="ri-price-tag-3-line" size="13" class="me-1" />
            {{ product.startingPrice }}
          </div>
        </div>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
/* padding (configured) must precede border/border-radius (configured) */
.product-card {
  position: relative;
  padding: 18px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 14px;
  /* unspecified → bottom-alphabetical */
  background: rgb(var(--v-theme-surface));
  block-size: 100%;
  cursor: pointer;
  min-block-size: 160px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease;
}

.product-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.08);
  transform: translateY(-2px);
}

.product-card--selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.04);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.08);
}

/* flex-shrink (configured) must precede border-radius (configured) */
.product-card__check {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  /* unspecified → bottom-alphabetical */
  background: rgb(var(--v-theme-primary));
  block-size: 22px;
  color: rgb(var(--v-theme-on-primary));
  inline-size: 22px;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.product-card__check--visible {
  opacity: 1;
  transform: scale(1);
}

.product-card__name {
  font-size: 0.9rem;
  font-weight: 700;
}

.product-card__desc {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.8rem;
  line-height: 1.5;
}

/* border-radius (configured) before padding-block/padding-inline (unspecified → bottom-alpha) */
.product-card__price {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
  font-size: 0.75rem;
  font-weight: 700;
  padding-block: 3px;
  padding-inline: 8px;
}
</style>
