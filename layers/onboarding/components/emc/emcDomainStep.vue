<script setup lang="ts">
interface BusinessDomain {
  id: string
  name: string
  icon: string
  description: string
  color?: string
}

defineProps<{
  domains: BusinessDomain[]
  selectedDomainId?: string
}>()

const emit = defineEmits<{
  (e: 'update:selectedDomainId', value: string): void
}>()

function selectDomain(id: string) {
  emit('update:selectedDomainId', id)
}
</script>

<template>
  <VRow>
    <VCol v-for="domain in domains" :key="domain.id" cols="12" sm="6" lg="4">
      <div
        class="domain-card"
        :class="{ 'domain-card--selected': selectedDomainId === domain.id }"
        role="radio"
        :aria-checked="selectedDomainId === domain.id"
        tabindex="0"
        @click="selectDomain(domain.id)"
        @keydown.enter.space.prevent="selectDomain(domain.id)"
      >
        <div class="domain-card__header">
          <VAvatar size="48" :color="domain.color || 'primary'" variant="tonal">
            <VIcon :icon="domain.icon" size="24" />
          </VAvatar>

          <div
            class="domain-card__check"
            :class="{ 'domain-card__check--visible': selectedDomainId === domain.id }"
          >
            <VIcon icon="mdi:check" size="13" />
          </div>
        </div>

        <div class="domain-card__name mt-3">{{ domain.name }}</div>
        <div class="domain-card__desc mt-1">{{ domain.description }}</div>
      </div>
    </VCol>
  </VRow>
</template>

<style scoped>
/* padding (configured) must precede border/border-radius (configured) */
.domain-card {
  position: relative;
  padding: 20px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  block-size: 100%;
  cursor: pointer;
  min-block-size: 148px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease;
}

.domain-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.08);
  transform: translateY(-2px);
}

.domain-card--selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.04);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
}

.domain-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

/* flex-shrink (configured) must precede border-radius (configured) */
.domain-card__check {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  block-size: 22px;
  color: rgb(var(--v-theme-on-primary));
  inline-size: 22px;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.domain-card__check--visible {
  opacity: 1;
  transform: scale(1);
}

.domain-card__name {
  font-size: 0.9375rem;
  font-weight: 700;
}

.domain-card__desc {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.8125rem;
  line-height: 1.5;
}
</style>
