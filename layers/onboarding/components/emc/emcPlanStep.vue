<script setup lang="ts">
const props = defineProps<{
  plans: any[]
  services: any[]
  selectedPlan: string
  selectedServices: string[]
  billingAddress: any
  communicationAddress: any
  operationalAddress: any
  communicationSameAsBilling: boolean
  operationalSameAsBilling: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedPlan', value: string): void
  (e: 'toggleService', value: string): void
  (e: 'update:communicationSameAsBilling', value: boolean): void
  (e: 'update:operationalSameAsBilling', value: boolean): void
}>()

const addressSection = ref<'billing' | 'communication' | 'operational'>('billing')

const addressTabs = [
  { key: 'billing' as const,       label: 'Billing',       icon: 'ri-bank-card-line' },
  { key: 'communication' as const, label: 'Communication', icon: 'ri-mail-line' },
  { key: 'operational' as const,   label: 'Operational',   icon: 'ri-map-pin-line' },
]
</script>

<template>
  <div>

    <!-- ── Subscription Plans ──────────────────────────────────────────── -->
    <div class="section-label mb-3">Subscription Plan</div>
    <VRow class="mb-6">
      <VCol v-for="plan in plans" :key="plan.id" cols="12" md="4">
        <div
          class="plan-card"
          :class="{
            'plan-card--selected': selectedPlan === plan.id,
            'plan-card--popular': !!plan.badge,
          }"
          @click="emit('update:selectedPlan', plan.id)"
        >
          <div v-if="plan.badge" class="plan-card__badge">{{ plan.badge }}</div>

          <div class="d-flex justify-space-between align-start mb-3">
            <div class="plan-card__name">{{ plan.name }}</div>
            <div
              class="plan-card__check"
              :class="{ 'plan-card__check--visible': selectedPlan === plan.id }"
            >
              <VIcon icon="mdi:check" size="12" />
            </div>
          </div>

          <div class="plan-card__price">{{ plan.price }}</div>
          <div class="plan-card__subtext mb-3">{{ plan.priceSubtext }}</div>
          <div class="plan-card__desc mb-4">{{ plan.description }}</div>

          <VDivider class="mb-3" />

          <div v-for="feature in plan.features" :key="feature" class="plan-card__feature">
            <VIcon icon="mdi:check" color="success" size="14" class="flex-shrink-0" />
            <span>{{ feature }}</span>
          </div>
        </div>
      </VCol>
    </VRow>

    <!-- ── Add-on Services ────────────────────────────────────────────── -->
    <template v-if="services?.length">
      <div class="section-label mb-3">
        Add-on Services
        <span class="section-label__opt">(optional)</span>
      </div>
      <VRow class="mb-6">
        <VCol v-for="service in services" :key="service.id" cols="12" sm="6" md="4">
          <div
            class="service-card"
            :class="{ 'service-card--selected': selectedServices.includes(service.id) }"
            @click="emit('toggleService', service.id)"
          >
            <div class="d-flex align-start ga-3">
              <VAvatar color="primary" variant="tonal" size="38">
                <VIcon :icon="service.icon" size="18" />
              </VAvatar>
              <div class="flex-grow-1 min-width-0">
                <div class="service-card__name">{{ service.name }}</div>
                <div class="service-card__desc">{{ service.description }}</div>
              </div>
              <div class="service-card__price">{{ service.price }}</div>
            </div>
          </div>
        </VCol>
      </VRow>
    </template>

    <!-- ── Addresses ──────────────────────────────────────────────────── -->
    <div class="section-label mb-3">Billing & Addresses</div>
    <div class="addr-tabs mb-4">
      <button
        v-for="tab in addressTabs"
        :key="tab.key"
        class="addr-tab"
        :class="{ 'addr-tab--active': addressSection === tab.key }"
        @click="addressSection = tab.key"
      >
        <VIcon :icon="tab.icon" size="14" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Billing -->
    <VCard v-if="addressSection === 'billing'" variant="outlined" rounded="lg">
      <VCardText>
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="billingAddress.address1"
              label="Address Line 1"
              prepend-inner-icon="ri-map-pin-2-line"
            />
          </VCol>
          <VCol cols="12">
            <VTextField v-model="billingAddress.address2" label="Address Line 2 (optional)" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="billingAddress.city" label="City" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="billingAddress.state" label="State / Province" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="billingAddress.postalCode" label="Postal Code" />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Communication -->
    <VCard v-else-if="addressSection === 'communication'" variant="outlined" rounded="lg">
      <VCardText>
        <VCheckbox
          :model-value="communicationSameAsBilling"
          label="Same as Billing Address"
          color="primary"
          class="mb-2"
          @update:model-value="emit('update:communicationSameAsBilling', $event)"
        />
        <VRow v-if="!communicationSameAsBilling">
          <VCol cols="12">
            <VTextField
              v-model="communicationAddress.address1"
              label="Address Line 1"
              prepend-inner-icon="ri-map-pin-2-line"
            />
          </VCol>
          <VCol cols="12">
            <VTextField v-model="communicationAddress.address2" label="Address Line 2 (optional)" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="communicationAddress.city" label="City" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="communicationAddress.state" label="State / Province" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="communicationAddress.postalCode" label="Postal Code" />
          </VCol>
        </VRow>
        <div v-else class="d-flex align-center ga-2 text-body-2 text-medium-emphasis pa-2">
          <VIcon icon="ri-checkbox-circle-line" size="16" color="success" />
          Using billing address for communication.
        </div>
      </VCardText>
    </VCard>

    <!-- Operational -->
    <VCard v-else variant="outlined" rounded="lg">
      <VCardText>
        <VCheckbox
          :model-value="operationalSameAsBilling"
          label="Same as Billing Address"
          color="primary"
          class="mb-2"
          @update:model-value="emit('update:operationalSameAsBilling', $event)"
        />
        <VRow v-if="!operationalSameAsBilling">
          <VCol cols="12">
            <VTextField
              v-model="operationalAddress.address1"
              label="Address Line 1"
              prepend-inner-icon="ri-map-pin-2-line"
            />
          </VCol>
          <VCol cols="12">
            <VTextField v-model="operationalAddress.address2" label="Address Line 2 (optional)" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="operationalAddress.city" label="City" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="operationalAddress.state" label="State / Province" />
          </VCol>
          <VCol cols="12" md="4">
            <VTextField v-model="operationalAddress.postalCode" label="Postal Code" />
          </VCol>
        </VRow>
        <div v-else class="d-flex align-center ga-2 text-body-2 text-medium-emphasis pa-2">
          <VIcon icon="ri-checkbox-circle-line" size="16" color="success" />
          Using billing address for operational.
        </div>
      </VCardText>
    </VCard>

  </div>
</template>

<style scoped>
.section-label {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.section-label__opt {
  font-size: 0.78rem;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}

/* ── Plan Cards ──────────────────────────────────────────────────────────── */

/* overflow (configured, display group) before padding/border */
.plan-card {
  position: relative;
  overflow: hidden;
  padding: 20px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  block-size: 100%;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease;
}

.plan-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 0.1);
  transform: translateY(-2px);
}

.plan-card--selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.04);
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
}

.plan-card--popular {
  border-color: rgba(var(--v-theme-primary), 0.35);
}

.plan-card__badge {
  position: absolute;
  border-radius: 0 14px 0 10px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 0.6875rem;
  font-weight: 700;
  inset-block-start: 0;
  inset-inline-end: 0;
  letter-spacing: 0.05em;
  padding-block: 4px;
  padding-inline: 10px;
  text-transform: uppercase;
}

.plan-card__name {
  font-size: 1rem;
  font-weight: 700;
}

/* flex-shrink (configured) before border-radius (configured) */
.plan-card__check {
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

.plan-card__check--visible {
  opacity: 1;
  transform: scale(1);
}

.plan-card__price {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.2;
}

.plan-card__subtext {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
}

.plan-card__desc {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.8125rem;
}

.plan-card__feature {
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
  gap: 8px;
  margin-block-end: 6px;
}

/* ── Service Cards ───────────────────────────────────────────────────────── */

/* padding (configured) before border (configured) */
.service-card {
  padding: 14px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: border-color 0.18s ease;
}

.service-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.service-card--selected {
  border-color: rgb(var(--v-theme-primary)) !important;
  background: rgba(var(--v-theme-primary), 0.04);
}

.service-card__name {
  font-size: 0.875rem;
  font-weight: 700;
}

.service-card__desc {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
  margin-block-start: 2px;
}

/* flex-shrink (configured) before unspecified */
.service-card__price {
  flex-shrink: 0;
  color: rgb(var(--v-theme-success));
  font-size: 0.8125rem;
  font-weight: 700;
  white-space: nowrap;
}

/* ── Address Tabs ────────────────────────────────────────────────────────── */
.addr-tabs {
  display: flex;
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  gap: 4px;
}

.addr-tab {
  display: inline-flex;
  align-items: center;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.8125rem;
  gap: 5px;
  padding-block: 10px;
  padding-inline: 14px;
  transition: color 0.15s ease;
}

.addr-tab--active {
  border-block-end: 2px solid rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
  margin-block-end: -1px;
}
</style>
