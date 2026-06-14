<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  form: any
  domainObj: any
  selectedProductObjs: any[]
  selectedStakeholdersByProduct: Record<string, any[]>
  planObj: any
  serviceObjs: any[]
  totalMonthly?: number
}>()

const emit = defineEmits<{
  (e: 'gotoStep', step: number): void
}>()

const stakeholderCount = computed(() =>
  Object.values(props.selectedStakeholdersByProduct).reduce((n: number, ids: any[]) => n + ids.length, 0),
)

const checks = computed(() => ({
  domain:        !!props.form.domain,
  products:      (props.form.products?.length ?? 0) > 0,
  stakeholders:  stakeholderCount.value > 0,
  organisation:  !!(props.form.org?.organizationName && props.form.org?.country),
  administrator: !!(props.form.admin?.firstName && props.form.admin?.email),
  plan:          !!props.form.plan,
}))

const completedCount = computed(() => Object.values(checks.value).filter(Boolean).length)
const totalSections  = computed(() => Object.keys(checks.value).length)
const completePct    = computed(() => Math.round((completedCount.value / totalSections.value) * 100))

const adminInitials = computed(() => {
  const f = props.form.admin?.firstName?.[0] ?? ''
  const l = props.form.admin?.lastName?.[0]  ?? ''
  return (f + l).toUpperCase() || '?'
})

const checkLabels: Record<string, string> = {
  domain:        'Business Domain',
  products:      'Products',
  stakeholders:  'Stakeholders',
  organisation:  'Organisation',
  administrator: 'Administrator',
  plan:          'Subscription Plan',
}

const checkSteps: Record<string, number> = {
  domain:        0,
  products:      1,
  stakeholders:  2,
  organisation:  3,
  administrator: 3,
  plan:          4,
}
</script>

<template>
  <div class="rv-root">

    <!-- ── Completion banner ──────────────────────────────────────────────── -->
    <div class="rv-banner" :class="completePct === 100 ? 'rv-banner--ok' : 'rv-banner--warn'">
      <div class="rv-banner__left">
        <VIcon
          :icon="completePct === 100 ? 'ri-checkbox-circle-fill' : 'ri-error-warning-line'"
          size="18"
        />
        <span>
          {{ completePct === 100
            ? "All sections complete — you're ready to create your organisation."
            : `${totalSections - completedCount} section${totalSections - completedCount > 1 ? 's' : ''} need${totalSections - completedCount === 1 ? 's' : ''} attention before you can continue.`
          }}
        </span>
      </div>
      <div class="rv-banner__counter">{{ completedCount }}/{{ totalSections }}</div>
    </div>

    <VRow>

      <!-- ── LEFT: review cards ─────────────────────────────────────────── -->
      <VCol cols="12" lg="8">

        <!-- Platform Configuration ─────────────────────────────────────── -->
        <div
          class="rv-card"
          :class="{ 'rv-card--incomplete': !checks.domain || !checks.products || !checks.stakeholders }"
          @click="emit('gotoStep', 0)"
        >
          <div class="rv-card__head">
            <span
              class="rv-dot"
              :class="checks.domain && checks.products && checks.stakeholders ? 'rv-dot--ok' : 'rv-dot--warn'"
            />
            <VIcon icon="ri-global-line" size="15" color="primary" />
            <span class="rv-card__title">Platform Configuration</span>
            <VSpacer />
            <button class="rv-edit-btn" @click.stop="emit('gotoStep', 0)">
              <VIcon icon="ri-pencil-line" size="13" />
              Edit
            </button>
          </div>

          <VDivider />

          <div class="rv-card__body">

            <!-- Domain -->
            <div class="rv-field">
              <div class="rv-label">Domain</div>
              <div class="rv-value">
                <VIcon v-if="domainObj" :icon="domainObj.icon" size="13" class="me-1 flex-shrink-0" />
                {{ domainObj?.name ?? '—' }}
              </div>
            </div>

            <!-- Products -->
            <div class="rv-field mt-3">
              <div class="rv-label">Products ({{ selectedProductObjs.length }})</div>
              <div class="rv-chips mt-1">
                <VChip
                  v-for="p in selectedProductObjs"
                  :key="p.id"
                  size="small"
                  color="primary"
                  variant="tonal"
                >
                  <template #prepend>
                    <VIcon :icon="p.icon" size="12" class="me-1" />
                  </template>
                  {{ p.name }}
                </VChip>
                <span v-if="!selectedProductObjs.length" class="rv-empty">None selected</span>
              </div>
            </div>

            <!-- Stakeholders per product -->
            <div class="rv-field mt-3">
              <div class="rv-label">Stakeholders ({{ stakeholderCount }})</div>
              <div v-if="!selectedProductObjs.length" class="rv-empty mt-1">
                No products selected
              </div>
              <div v-else class="rv-sh-list mt-2">
                <div
                  v-for="p in selectedProductObjs"
                  :key="p.id"
                  class="rv-sh-row"
                >
                  <div class="rv-sh-product-tag">
                    <VIcon :icon="p.icon" size="11" />
                    {{ p.name }}
                  </div>
                  <div class="rv-chips rv-chips--sm">
                    <VChip
                      v-for="s in (selectedStakeholdersByProduct[p.id] ?? [])"
                      :key="s.id"
                      size="x-small"
                      color="secondary"
                      variant="tonal"
                    >{{ s.name }}</VChip>
                    <span v-if="!(selectedStakeholdersByProduct[p.id] ?? []).length" class="rv-empty rv-empty--sm">Not assigned</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Organisation & Administrator ──────────────────────────────── -->
        <div
          class="rv-card"
          :class="{ 'rv-card--incomplete': !checks.organisation || !checks.administrator }"
          @click="emit('gotoStep', 3)"
        >
          <div class="rv-card__head">
            <span
              class="rv-dot"
              :class="checks.organisation && checks.administrator ? 'rv-dot--ok' : 'rv-dot--warn'"
            />
            <VIcon icon="ri-building-2-line" size="15" color="primary" />
            <span class="rv-card__title">Organisation & Administrator</span>
            <VSpacer />
            <button class="rv-edit-btn" @click.stop="emit('gotoStep', 3)">
              <VIcon icon="ri-pencil-line" size="13" />
              Edit
            </button>
          </div>

          <VDivider />

          <div class="rv-card__body">
            <!-- Org grid -->
            <div class="rv-grid-2">
              <div class="rv-field">
                <div class="rv-label">Organisation</div>
                <div class="rv-value">{{ form.org.organizationName || '—' }}</div>
              </div>
              <div class="rv-field">
                <div class="rv-label">Country</div>
                <div class="rv-value">{{ form.org.country || '—' }}</div>
              </div>
              <div class="rv-field">
                <div class="rv-label">Industry</div>
                <div class="rv-value">{{ form.org.industry || '—' }}</div>
              </div>
              <div class="rv-field">
                <div class="rv-label">Website</div>
                <div class="rv-value rv-value--primary">{{ form.org.website || '—' }}</div>
              </div>
            </div>

            <VDivider class="my-4" />

            <!-- Admin -->
            <div class="rv-admin-row">
              <div class="rv-admin-avatar">{{ adminInitials }}</div>
              <div class="rv-admin-info">
                <div class="rv-admin-name">{{ form.admin.firstName }} {{ form.admin.lastName }}</div>
                <div class="rv-admin-role">{{ form.admin.designation || 'Administrator' }}</div>
              </div>
              <div class="rv-admin-contact">
                <div class="rv-admin-contact__item">
                  <VIcon icon="ri-mail-line" size="12" />
                  {{ form.admin.email || '—' }}
                </div>
                <div class="rv-admin-contact__item">
                  <VIcon icon="ri-smartphone-line" size="12" />
                  {{ form.admin.mobile || '—' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Subscription Plan ──────────────────────────────────────────── -->
        <div
          class="rv-card"
          :class="{ 'rv-card--incomplete': !checks.plan }"
          @click="emit('gotoStep', 4)"
        >
          <div class="rv-card__head">
            <span class="rv-dot" :class="checks.plan ? 'rv-dot--ok' : 'rv-dot--warn'" />
            <VIcon icon="ri-price-tag-3-line" size="15" color="primary" />
            <span class="rv-card__title">Subscription Plan</span>
            <VSpacer />
            <button class="rv-edit-btn" @click.stop="emit('gotoStep', 4)">
              <VIcon icon="ri-pencil-line" size="13" />
              Edit
            </button>
          </div>

          <VDivider />

          <div class="rv-card__body">
            <div v-if="planObj" class="rv-plan-row">
              <div>
                <div class="rv-plan-name">{{ planObj.name }}</div>
                <div class="rv-plan-desc">{{ planObj.description }}</div>
              </div>
              <div class="rv-plan-price">
                <template v-if="planObj.priceValue">
                  ${{ planObj.priceValue }}<span class="rv-plan-price__mo">/mo</span>
                </template>
                <span v-else class="rv-plan-price--free">Free</span>
              </div>
            </div>
            <div v-else class="rv-empty">No plan selected</div>
          </div>
        </div>

        <!-- Add-on Services ─────────────────────────────────────────────── -->
        <div class="rv-card rv-card--muted">
          <div class="rv-card__head">
            <VIcon icon="ri-add-circle-line" size="15" color="primary" />
            <span class="rv-card__title">Add-on Services</span>
            <VSpacer />
            <button class="rv-edit-btn" @click.stop="emit('gotoStep', 5)">
              <VIcon icon="ri-pencil-line" size="13" />
              Edit
            </button>
          </div>

          <VDivider />

          <div class="rv-card__body">
            <div v-if="serviceObjs.length" class="rv-service-grid">
              <div v-for="s in serviceObjs" :key="s.id" class="rv-service-pill">
                <VIcon :icon="s.icon" size="14" color="primary" />
                <span class="rv-service-pill__name">{{ s.name }}</span>
                <span class="rv-service-pill__price">${{ s.priceValue }}/mo</span>
              </div>
            </div>
            <div v-else class="rv-empty">No additional services selected</div>
          </div>
        </div>

      </VCol>

      <!-- ── RIGHT: checklist + pricing ───────────────────────────────── -->
      <VCol cols="12" lg="4">

        <!-- Setup Checklist -->
        <div class="rv-checklist">
          <div class="rv-checklist__head">
            <VIcon icon="ri-task-line" size="15" />
            Setup Checklist
            <VSpacer />
            <span class="rv-checklist__pct">{{ completePct }}%</span>
          </div>

          <VProgressLinear
            :model-value="completePct"
            :color="completePct === 100 ? 'success' : 'primary'"
            rounded
            height="4"
            class="mb-4"
          />

          <div
            v-for="(ok, key) in checks"
            :key="key"
            class="rv-check-row"
            @click="emit('gotoStep', checkSteps[key as string])"
          >
            <div class="rv-check-icon" :class="ok ? 'rv-check-icon--ok' : 'rv-check-icon--warn'">
              <VIcon :icon="ok ? 'ri-check-line' : 'ri-error-warning-line'" size="11" />
            </div>
            <span class="rv-check-label" :class="{ 'rv-check-label--done': ok }">
              {{ checkLabels[key as string] }}
            </span>
            <VSpacer />
            <VIcon
              v-if="!ok"
              icon="ri-arrow-right-s-line"
              size="14"
              color="warning"
            />
          </div>
        </div>

        <!-- Pricing Summary -->
        <div v-if="planObj" class="rv-pricing">
          <div class="rv-pricing__head">
            <VIcon icon="ri-receipt-line" size="15" />
            Pricing Summary
          </div>

          <div class="rv-pricing__row">
            <span>{{ planObj.name }} Plan</span>
            <span v-if="planObj.priceValue">${{ planObj.priceValue }}/mo</span>
            <span v-else class="text-success font-weight-semibold">Free</span>
          </div>
          <div v-for="s in serviceObjs" :key="s.id" class="rv-pricing__row">
            <span>{{ s.name }}</span>
            <span>${{ s.priceValue }}/mo</span>
          </div>

          <div class="rv-pricing__total">
            <span>Total</span>
            <span>{{ (totalMonthly ?? 0) > 0 ? `$${totalMonthly}/mo` : 'Free' }}</span>
          </div>

          <VAlert
            v-if="form.plan !== 'enterprise'"
            type="success"
            variant="tonal"
            density="compact"
            rounded="lg"
            icon="ri-gift-line"
            class="mt-3"
          >
            <template #text>
              <span class="text-caption">30-day free trial · Cancel anytime</span>
            </template>
          </VAlert>

          <div class="rv-trust">
            <span><VIcon icon="ri-shield-check-line" size="12" class="me-1" />SOC 2</span>
            <span><VIcon icon="ri-lock-line" size="12" class="me-1" />256-bit SSL</span>
            <span><VIcon icon="ri-gdpr-line" size="12" class="me-1" />GDPR</span>
          </div>
        </div>

      </VCol>
    </VRow>

  </div>
</template>

<style lang="scss" scoped>
// ── Root ──────────────────────────────────────────────────────────────────────
.rv-root {
  max-inline-size: 1140px;
}

// ── Completion banner ─────────────────────────────────────────────────────────
.rv-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  gap: 10px;
  margin-block-end: 24px;
  padding-block: 12px;
  padding-inline: 16px;

  &--ok   { background: rgba(var(--v-theme-success), 10%); color: rgb(var(--v-theme-success)); }
  &--warn { background: rgba(var(--v-theme-warning), 10%); color: rgb(var(--v-theme-warning)); }
}

.rv-banner__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rv-banner__counter {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 800;
  opacity: 0.75;
}

// ── Review cards ──────────────────────────────────────────────────────────────
.rv-card {
  overflow: hidden;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 10%);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  margin-block-end: 16px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    border-color: rgba(var(--v-theme-primary), 40%);
    box-shadow: 0 4px 20px rgba(var(--v-theme-primary), 8%);
  }

  &--incomplete {
    border-color: rgba(var(--v-theme-warning), 30%);
  }

  &--muted {
    background: rgba(var(--v-theme-on-surface), 1%);
    cursor: default;
  }
}

.rv-card__head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding-block: 13px;
  padding-inline: 18px;
}

.rv-card__title {
  font-size: 0.875rem;
  font-weight: 700;
}

.rv-card__body {
  padding-block: 16px;
  padding-inline: 18px;
}

// ── Status dot ────────────────────────────────────────────────────────────────
.rv-dot {
  display: inline-block;
  flex-shrink: 0;
  border-radius: 50%;
  block-size: 8px;
  inline-size: 8px;

  &--ok   { background: rgb(var(--v-theme-success)); }
  &--warn { background: rgb(var(--v-theme-warning)); }
}

// ── Edit button ───────────────────────────────────────────────────────────────
.rv-edit-btn {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(var(--v-theme-primary), 25%);
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 6%);
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  gap: 4px;
  padding-block: 4px;
  padding-inline: 10px;
  transition: background 0.15s ease;

  &:hover { background: rgba(var(--v-theme-primary), 14%); }
}

// ── Field typography ──────────────────────────────────────────────────────────
.rv-label {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.rv-value {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  margin-block-start: 3px;

  &--primary {
    color: rgb(var(--v-theme-primary));
    font-size: 0.8125rem;
  }
}

.rv-field {
  margin-block-end: 4px;
}

.rv-grid-2 {
  display: grid;
  gap: 14px 24px;
  grid-template-columns: repeat(2, 1fr);
}

.rv-empty {
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
  font-size: 0.8125rem;
  font-style: italic;

  &--sm { font-size: 0.75rem; }
}

// ── Chips ─────────────────────────────────────────────────────────────────────
.rv-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  &--sm { gap: 4px; }
}

// ── Per-product stakeholder list ──────────────────────────────────────────────
.rv-sh-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rv-sh-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.rv-sh-product-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  background: rgba(var(--v-theme-primary), 8%);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  gap: 4px;
  min-inline-size: 110px;
  padding-block: 3px;
  padding-inline: 8px;
}

// ── Admin row ─────────────────────────────────────────────────────────────────
.rv-admin-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rv-admin-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 14%);
  block-size: 44px;
  color: rgb(var(--v-theme-primary));
  font-size: 0.9375rem;
  font-weight: 800;
  inline-size: 44px;
}

.rv-admin-info { flex: 1; }

.rv-admin-name {
  font-size: 0.9375rem;
  font-weight: 700;
}

.rv-admin-role {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
  margin-block-start: 1px;
}

.rv-admin-contact {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.rv-admin-contact__item {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
  gap: 4px;
}

// ── Plan ──────────────────────────────────────────────────────────────────────
.rv-plan-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.rv-plan-name {
  font-size: 1.0625rem;
  font-weight: 800;
}

.rv-plan-desc {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.8125rem;
  margin-block-start: 3px;
}

.rv-plan-price {
  flex-shrink: 0;
  color: rgb(var(--v-theme-primary));
  font-size: 1.5rem;
  font-weight: 800;
  text-align: end;
}

.rv-plan-price__mo {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.65;
}

.rv-plan-price--free {
  color: rgb(var(--v-theme-success));
  font-size: 1.125rem;
}

// ── Services ──────────────────────────────────────────────────────────────────
.rv-service-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rv-service-pill {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(var(--v-theme-primary), 18%);
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 5%);
  gap: 7px;
  padding-block: 7px;
  padding-inline: 12px;
}

.rv-service-pill__name {
  font-size: 0.8125rem;
  font-weight: 600;
}

.rv-service-pill__price {
  border-radius: 5px;
  background: rgba(var(--v-theme-success), 12%);
  color: rgb(var(--v-theme-success));
  font-size: 0.6875rem;
  font-weight: 700;
  padding-block: 2px;
  padding-inline: 6px;
}

// ── Checklist ─────────────────────────────────────────────────────────────────
.rv-checklist {
  overflow: hidden;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 10%);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  margin-block-end: 16px;
  padding-block: 16px;
  padding-inline: 18px;
}

.rv-checklist__head {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 700;
  gap: 7px;
  margin-block-end: 12px;
}

.rv-checklist__pct {
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  font-weight: 800;
}

.rv-check-row {
  display: flex;
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8125rem;
  gap: 8px;
  margin-block-end: 4px;
  padding-block: 5px;
  padding-inline: 4px;
  transition: background 0.12s ease;

  &:hover { background: rgba(var(--v-theme-on-surface), 4%); }
}

.rv-check-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  block-size: 20px;
  inline-size: 20px;

  &--ok   { background: rgba(var(--v-theme-success), 14%); color: rgb(var(--v-theme-success)); }
  &--warn { background: rgba(var(--v-theme-warning), 14%); color: rgb(var(--v-theme-warning)); }
}

.rv-check-label {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));

  &--done { color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity)); font-weight: 500; }
}

// ── Pricing summary ───────────────────────────────────────────────────────────
.rv-pricing {
  overflow: hidden;
  border: 1.5px solid rgba(var(--v-theme-primary), 22%);
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 4%);
  padding-block: 16px;
  padding-inline: 18px;
}

.rv-pricing__head {
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-primary));
  font-size: 0.875rem;
  font-weight: 700;
  gap: 7px;
  margin-block-end: 14px;
}

.rv-pricing__row {
  display: flex;
  justify-content: space-between;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.8125rem;
  margin-block-end: 6px;
}

.rv-pricing__total {
  display: flex;
  justify-content: space-between;
  border-block-start: 1.5px solid rgba(var(--v-theme-primary), 20%);
  color: rgb(var(--v-theme-primary));
  font-size: 1rem;
  font-weight: 800;
  margin-block-start: 10px;
  padding-block-start: 10px;
}

.rv-trust {
  display: flex;
  justify-content: space-between;
  border-block-start: 1px solid rgba(var(--v-theme-on-surface), 10%);
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.72rem;
  margin-block-start: 14px;
  padding-block-start: 12px;
}

// ── Responsive ────────────────────────────────────────────────────────────────
@media (max-width: 959px) {
  .rv-admin-contact { display: none; }
}

@media (max-width: 599px) {
  .rv-grid-2 { grid-template-columns: 1fr; }

  .rv-admin-row { flex-wrap: wrap; }

  .rv-plan-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .rv-plan-price { font-size: 1.125rem; }
}
</style>
