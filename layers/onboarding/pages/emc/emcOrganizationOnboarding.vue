<script setup lang="ts">
import { useOnboardingDraft } from '@/layers/layers/onboarding/composables/useOnboardingDraft';


definePageMeta({ layout: 'blank', public: true })

// ── Types ────────────────────────────────────────────────────────────────────
interface BusinessDomain { id: string; name: string; icon: string; description: string; color: string }
interface Product { id: string; domainId: string; name: string; description: string; startingPrice: string; icon: string }
interface StakeholderType { id: string; domainId: string; productIds: string[]; name: string; icon: string; description: string }
interface SubscriptionPlan { id: string; name: string; price: string; priceValue: number; priceSubtext: string; description: string; features: string[]; badge?: string }
interface AdditionalService { id: string; name: string; description: string; price: string; priceValue: number; icon: string; category: string }
interface Address { addressLine1: string; addressLine2: string; city: string; state: string; country: string; postalCode: string }
interface FormOptions { countries: string[]; timezones: string[]; organizationSizes: string[]; industries: string[]; operationalRegions: string[]; ghaServicesList: string[] }


const apiBase = '/api/emc/onOrganizationOnboarding'
// ── Static UI config (no API needed) ─────────────────────────────────────────
const STEPS = [
  { title: 'Domain', desc: 'Choose your industry domain', icon: 'ri-global-line' },
  { title: 'Products', desc: 'Select the products you need', icon: 'ri-apps-line' },
  { title: 'Stakeholder', desc: 'Define your role in the supply chain', icon: 'ri-user-star-line' },
  { title: 'Organisation', desc: 'Your organisation and administrator details', icon: 'ri-building-2-line' },
  { title: 'Plan & Address', desc: 'Subscription plan and billing address', icon: 'ri-price-tag-3-line' },
  { title: 'Review', desc: 'Add services and confirm your setup', icon: 'ri-checkbox-circle-line' },
]

// ── Lazy API State ────────────────────────────────────────────────────────────
// Step 1 — domains: fetched on page load (await so the page renders with data)
const { data: domainsRaw } = await useFetch<BusinessDomain[]>(`${apiBase}/domains`)
const businessDomains = computed<BusinessDomain[]>(() => domainsRaw.value ?? [])

// Step 2 — products: fetched when a domain is selected (domainId FK filter)
const products = ref<Product[]>([])
const isFetchingProducts = ref(false)

// Step 3 — stakeholders: fetched per-product when a product is toggled
const stakeholdersByProduct = ref<Record<string, StakeholderType[]>>({})
const isFetchingStakeholdersFor = ref<Record<string, boolean>>({})

// Step 4 — form-options: fetched once when navigating to step 4
const formOptions = ref<FormOptions | null>(null)
const isFetchingFormOptions = ref(false)
const countries = computed<string[]>(() => formOptions.value?.countries ?? [])
const timezones = computed<string[]>(() => formOptions.value?.timezones ?? [])
const organizationSizes = computed<string[]>(() => formOptions.value?.organizationSizes ?? [])
const industries = computed<string[]>(() => formOptions.value?.industries ?? [])
const operationalRegions = computed<string[]>(() => formOptions.value?.operationalRegions ?? [])
const ghaServicesList = computed<string[]>(() => formOptions.value?.ghaServicesList ?? [])

// Step 5 — plans: fetched once when navigating to step 5
const subscriptionPlans = ref<SubscriptionPlan[]>([])
const isFetchingPlans = ref(false)

// Step 6 — services: fetched once when navigating to step 6
const serviceAddons = ref<AdditionalService[]>([])
const isFetchingServices = ref(false)

// ── State ─────────────────────────────────────────────────────────────────────
const currentStep = ref(0)
const isSubmitting = ref(false)
const addressTab = ref('billing')
const snackbar = reactive({ show: false, message: '', color: 'success' })
const orgSection = ref<'org' | 'admin'>('org')

const isPwVisible = ref(false)
const isCpwVisible = ref(false)

const emptyAddr = (): Address => ({ addressLine1: '', addressLine2: '', city: '', state: '', country: '', postalCode: '' })



const form = reactive({
  onboardingReference: '',

  domain: '',
  products: [] as string[],
  stakeholders: {} as Record<string, string[]>,

  org: {
    organizationName: '',
    legalName: '',
    businessRegNumber: '',
    taxRegNumber: '',
    website: '',
    industry: '',
    country: '',
    timeZone: '',
    organizationSize: '',
    logoFile: null as File | null,
  },

  admin: {
    firstName: '',
    lastName: '',
    designation: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  },

  address: {
    billing: emptyAddr(),
    communication: emptyAddr(),
    operational: emptyAddr(),
  },

  plan: '',
  services: [] as string[],

  termsAccepted: false,
  privacyAccepted: false,
})

// ── Computed ──────────────────────────────────────────────────────────────────
const domainObj = computed(() => businessDomains.value.find(d => d.id === form.domain))
const selectedProductObjs = computed(() => products.value.filter(p => form.products.includes(p.id)))
const planObj = computed(() => subscriptionPlans.value.find(p => p.id === form.plan))


const selectedDomain = computed(() =>
  businessDomains.value.find(
    d => d.id === form.domain,
  ),
)

const selectedProducts = computed(() =>
  products.value.filter(
    p => form.products.includes(p.id),
  ),
)

const selectedPlan = computed(() =>
  subscriptionPlans.value.find(
    p => p.id === form.plan,
  ),
)

const selectedServices = computed(() =>
  serviceAddons.value.filter(
    s => form.services.includes(s.id),
  ),
)

const selectedStakeholdersByProduct = computed(() => {
  const result: Record<string, any[]> = {}

  selectedProducts.value.forEach(product => {
    const selectedIds =
      form.stakeholders[product.id] || []

    result[product.id] =
      (stakeholdersByProduct.value[
        product.id
      ] || []).filter(st =>
        selectedIds.includes(st.id),
      )
  })

  return result
})

const totalMonthly = computed(() => {
  const planPrice =
    Number(selectedPlan.value?.priceValue || 0)

  const servicesPrice =
    selectedServices.value.reduce(
      (sum, s) =>
        sum + Number(s.priceValue || 0),
      0,
    )

  return planPrice + servicesPrice
})



const selectedStakeholderCount = computed(() =>
  Object.values(form.stakeholders).reduce((n, ids) => n + ids.length, 0)
)
const hasStakeholderType = (typeId: string) =>
  Object.values(form.stakeholders).some(ids => ids.includes(typeId))

const serviceObjs = computed(() => serviceAddons.value.filter(s => form.services.includes(s.id)))
const servicesTotal = computed(() => serviceObjs.value.reduce((a, s) => a + s.priceValue, 0))

const isLastStep = computed(() => currentStep.value === STEPS.length - 1)
const progress = computed(() => Math.round((currentStep.value / (STEPS.length - 1)) * 100))

function stepStatus(idx: number): 'done' | 'active' | 'pending' {
  if (idx < currentStep.value) return 'done'
  if (idx === currentStep.value) return 'active'
  return 'pending'
}

const contextMessage = computed(() => {
  if (currentStep.value === 1 && domainObj.value)
    return `Great! You selected ${domainObj.value.name}. Now choose the products you need.`
  if (currentStep.value === 2 && selectedStakeholderCount.value)
    return `${selectedStakeholderCount.value} stakeholder${selectedStakeholderCount.value > 1 ? 's' : ''} selected. Fill in your organisation details next.`
  if (currentStep.value === 2 && form.products.length)
    return `You selected ${form.products.length} product${form.products.length > 1 ? 's' : ''}. Now assign stakeholders for each product.`
  if (currentStep.value === 3 && selectedStakeholderCount.value)
    return `${selectedStakeholderCount.value} stakeholder${selectedStakeholderCount.value > 1 ? 's' : ''} defined. Let's set up your organisation.`
  if (currentStep.value === 4)
    return `${form.org.organizationName || 'Your organisation'} is almost ready. Choose a plan and add your address.`
  if (currentStep.value === 5)
    return 'Almost done! Add any extra services and review before creating your organisation.'
  return null
})

// ── Fetch Helpers (each owns its loading flag) ────────────────────────────────
async function fetchProducts(domainId: string) {
  isFetchingProducts.value = true
  try {
    products.value = await $fetch<Product[]>(`${apiBase}/products`, { query: { domainId } })
  }
  catch {
    snackbar.message = 'Failed to load products. Please try again.'
    snackbar.color = 'error'
    snackbar.show = true
  }
  finally {
    isFetchingProducts.value = false
  }
}

async function fetchStakeholdersForProduct(productId: string) {
  if (stakeholdersByProduct.value[productId] !== undefined) return
  isFetchingStakeholdersFor.value[productId] = true
  try {
    stakeholdersByProduct.value[productId] = await $fetch<StakeholderType[]>(`${apiBase}/stakeholders`, {
      query: { domainId: form.domain, productIds: [productId] },
    })
  }
  catch {
    snackbar.message = 'Failed to load stakeholders. Please try again.'
    snackbar.color = 'error'
    snackbar.show = true
  }
  finally {
    isFetchingStakeholdersFor.value[productId] = false
  }
}

async function fetchFormOptions() {
  if (formOptions.value) return
  isFetchingFormOptions.value = true
  try {
    formOptions.value = await $fetch<FormOptions>(`${apiBase}/form-options`)
  }
  catch {
    snackbar.message = 'Failed to load form options. Please try again.'
    snackbar.color = 'error'
    snackbar.show = true
  }
  finally {
    isFetchingFormOptions.value = false
  }
}

async function fetchPlans() {
  if (subscriptionPlans.value.length) return
  isFetchingPlans.value = true
  try {
    subscriptionPlans.value = await $fetch<SubscriptionPlan[]>(`${apiBase}/plans`)
  }
  catch {
    snackbar.message = 'Failed to load subscription plans. Please try again.'
    snackbar.color = 'error'
    snackbar.show = true
  }
  finally {
    isFetchingPlans.value = false
  }
}

async function fetchServices() {
  if (serviceAddons.value.length) return
  isFetchingServices.value = true
  try {
    serviceAddons.value = await $fetch<AdditionalService[]>(`${apiBase}/services`)
  }
  catch {
    snackbar.message = 'Failed to load add-on services. Please try again.'
    snackbar.color = 'error'
    snackbar.show = true
  }
  finally {
    isFetchingServices.value = false
  }
}

// ── Methods ───────────────────────────────────────────────────────────────────
async function onDomainSelect(id: string) {
  form.domain = id
  form.products = []
  form.stakeholders = {}
  products.value = []
  stakeholdersByProduct.value = {}
  isFetchingStakeholdersFor.value = {}
  await fetchProducts(id)
}

function toggleProduct(id: string) {
  const i = form.products.indexOf(id)
  if (i === -1) {
    form.products.push(id)
    form.stakeholders[id] = []
    fetchStakeholdersForProduct(id)
  }
  else {
    form.products.splice(i, 1)
    delete form.stakeholders[id]
  }
}

function toggleStakeholder(productId: string, stakeholderId: string) {
  if (!form.stakeholders[productId]) form.stakeholders[productId] = []
  const idx = form.stakeholders[productId].indexOf(stakeholderId)
  if (idx === -1) form.stakeholders[productId].push(stakeholderId)
  else form.stakeholders[productId].splice(idx, 1)
}

function toggleService(id: string) {
  const i = form.services.indexOf(id)
  if (i === -1) form.services.push(id)
  else form.services.splice(i, 1)
}

function copyBilling(type: 'communication' | 'operational') {
  Object.assign(form.address[type], { ...form.address.billing })
}

async function next() {
  if (currentStep.value >= STEPS.length - 1) return
  currentStep.value++
  // Fire-and-forget fetch for the newly entered step; each step shows its own loader
  if (currentStep.value === 3) fetchFormOptions()
  if (currentStep.value === 4) {
    fetchPlans()
    fetchServices()
  }
}

function prev() { if (currentStep.value > 0) currentStep.value-- }

async function saveDraft() {
  try {
    const onboardingDraft = useOnboardingDraft()
    const result = await onboardingDraft.saveDraft(toRaw(form), currentStep.value)

    if (result?.onboardingReference) {
      form.onboardingReference =
        result.onboardingReference
    }

    snackbar.message =
      `Draft saved. Reference: ${result.onboardingReference}`

    snackbar.color = 'success'
    snackbar.show = true
  }
  catch (error: any) {
    snackbar.message =
      error?.data?.message ||
      'Failed to save draft'

    snackbar.color = 'error'
    snackbar.show = true
  }
}

async function submit() {
  try {
    isSubmitting.value = true

    const result = await $fetch(
      `${apiBase}/create`,
      {
        method: 'POST',
        body: toRaw(form),
      }
    )

    navigateTo(`/login?tenant=${result.tenantCode}`)
  }
  finally {
    isSubmitting.value = false
  }
}

const rules = {
  required: (v: string) => !!v || 'Required',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Invalid email',
  minLen: (n: number) => (v: string) => (v?.length ?? 0) >= n || `Min ${n} characters`,
  maxLen: (n: number) => (v: string) => (v?.length ?? 0) <= n || `Max ${n} characters`,
  url: (v: string) => !v || /^https?:\/\/.+/.test(v) || 'Must start with https://',
  pwMatch: (v: string) => v === form.admin.password || 'Passwords do not match',
}
</script>

<template>
  <div class="ob-page">

    <!-- ── TOP NAV ──────────────────────────────────────────────────────────── -->
    <header class="ob-nav">
      <div class="d-flex align-center gap-3">
        <div class="ob-logo">
          <VIcon icon="ri-plane-line" size="18" color="white" />
        </div>
        <span class="ob-nav__brand">EMC Platform</span>
      </div>

      <div class="d-flex align-center gap-4">
        <NuxtLink to="/login" class="ob-nav__signin">
          Already have an account? Sign In
        </NuxtLink>
        <a href="#" class="ob-nav__help">
          <VIcon icon="ri-question-line" size="16" />
          Help
        </a>
      </div>
    </header>

    <!-- ── MOBILE STEP STRIP (hidden on lg+) ────────────────────────────────── -->
    <div class="ob-mobile-strip d-flex d-lg-none">
      <div v-for="(step, idx) in STEPS" :key="idx" class="ob-mobile-strip__dot" :class="{
        'ob-mobile-strip__dot--done': idx < currentStep,
        'ob-mobile-strip__dot--active': idx === currentStep,
      }">
        <div class="ob-mobile-strip__circle">
          <VIcon v-if="idx < currentStep" icon="ri-check-line" size="10" color="white" />
        </div>
        <div v-if="idx < STEPS.length - 1" class="ob-mobile-strip__line"
          :class="{ 'ob-mobile-strip__line--done': idx < currentStep }" />
      </div>
      <div class="ob-mobile-strip__label">
        <span class="ob-mobile-strip__step">Step {{ currentStep + 1 }} / {{ STEPS.length }}</span>
        <span class="ob-mobile-strip__name">{{ STEPS[currentStep].title }}</span>
      </div>
    </div>

    <!-- ── BODY ─────────────────────────────────────────────────────────────── -->
    <div class="ob-body">

      <!-- ── LEFT PANEL ─────────────────────────────────────────────────────── -->
      <aside class="ob-panel d-none d-lg-flex flex-column">

        <div class="ob-panel__title">Organisation Registration</div>

        <!-- Domain badge (always visible once selected) -->
        <Transition name="fade">
          <div v-if="domainObj" class="ob-domain-badge">
            <div :class="`ob-domain-icon ob-domain-${domainObj.color}`">
              <VIcon :icon="domainObj.icon" size="14" />
            </div>
            <div>
              <div class="ob-domain-badge__label">Selected Domain</div>
              <div class="ob-domain-badge__name">{{ domainObj.name }}</div>
            </div>
          </div>
        </Transition>

        <!-- Step journey list -->
        <nav class="ob-journey">
          <div v-for="(step, idx) in STEPS" :key="step.title" class="ob-step" :class="`ob-step--${stepStatus(idx)}`"
            @click="currentStep = idx">
            <!-- connector line -->
            <div v-if="idx < STEPS.length - 1" class="ob-step__line"
              :class="{ 'ob-step__line--done': idx < currentStep }" />

            <div class="ob-step__dot">
              <VIcon v-if="stepStatus(idx) === 'done'" icon="ri-check-line" size="11" color="white" />
              <span v-else class="ob-step__num">{{ idx + 1 }}</span>
            </div>

            <div class="ob-step__info">
              <div class="ob-step__name">{{ step.title }}</div>

              <div class="ob-step__value">
                <template v-if="idx === 0 && domainObj">{{ domainObj.name }}</template>
                <template v-else-if="idx === 1 && selectedProductObjs.length">
                  {{ selectedProductObjs.length }} product{{ selectedProductObjs.length > 1 ? 's' : '' }}
                </template>
                <template v-else-if="idx === 2 && selectedStakeholderCount">{{ selectedStakeholderCount }} stakeholder{{
                  selectedStakeholderCount > 1 ? 's' : '' }}</template>
                <template v-else-if="idx === 3 && form.org.organizationName">{{ form.org.organizationName }}</template>
                <template v-else-if="idx === 4 && planObj">{{ planObj.name }}</template>
                <template v-else-if="idx === 5 && form.services.length">{{ form.services.length }} add-on{{
                  form.services.length > 1 ? 's' : '' }}</template>
              </div>
            </div>
          </div>
        </nav>

        <VSpacer />

        <!-- Pricing estimate -->
        <Transition name="slide-up">
          <div v-if="planObj" class="ob-pricing">
            <div class="ob-pricing__heading">Estimated Cost</div>
            <div v-if="planObj.priceValue" class="ob-pricing__row">
              <span>{{ planObj.name }}</span><span>${{ planObj.priceValue }}/mo</span>
            </div>
            <div v-else class="ob-pricing__row">
              <span>{{ planObj.name }}</span><span class="text-success">Free</span>
            </div>
            <div v-for="s in serviceObjs" :key="s.id" class="ob-pricing__row">
              <span>{{ s.name }}</span><span>${{ s.priceValue }}/mo</span>
            </div>
            <div class="ob-pricing__total">
              <span>Total</span><span>{{ totalMonthly > 0 ? `$${totalMonthly}/mo` : 'Free' }}</span>
            </div>
          </div>
        </Transition>

      </aside>

      <!-- ── MAIN ───────────────────────────────────────────────────────────── -->
      <div class="ob-main">

        <!-- Step hero header -->
        <div class="ob-hero">
          <!-- Top row: domain pill left, step counter right -->
          <div class="ob-hero__top-row">
            <Transition name="fade">
              <div v-if="domainObj && currentStep > 0" key="pill-active" class="ob-hero__domain-pill">
                <VIcon :icon="domainObj.icon" size="13" />
                {{ domainObj.name }}
              </div>
              <div v-else key="pill-ghost" class="ob-hero__domain-pill ob-hero__domain-pill--ghost" />
            </Transition>
            <div class="ob-hero__step-right">
              <div class="ob-hero__step-label">Step {{ currentStep + 1 }} of {{ STEPS.length }}</div>
              <div class="ob-hero__step-progress">
                <VProgressLinear :model-value="progress" color="primary" rounded height="4"
                  class="ob-hero__progress-bar" />
                <span class="ob-hero__pct">{{ progress }}%</span>
              </div>
            </div>
          </div>

          <h1 class="ob-hero__title">{{ STEPS[currentStep].title }}</h1>
          <p class="ob-hero__desc">{{ STEPS[currentStep].desc }}</p>

          <!-- Contextual guided message -->
          <Transition name="fade">
            <div v-if="contextMessage" class="ob-hero__context">
              <VIcon icon="ri-sparkle-line" size="14" class="me-1" />
              {{ contextMessage }}
            </div>
          </Transition>
        </div>

        <!-- Scrollable content -->
        <div class="ob-content">
          <VWindow v-model="currentStep" class="ob-window">
            <!-- ── STEP 1: DOMAIN ─────────────────────────────────────────── -->
            <VWindowItem :value="0">
              <div class="ob-pane">
                <emc-domain-step :domains="businessDomains" :selected-domain-id="form.domain"
                  @update:selected-domain-id="onDomainSelect" />
              </div>
            </VWindowItem>

            <!-- ── STEP 2: PRODUCTS ───────────────────────────────────────── -->
            <VWindowItem :value="1">
              <div class="ob-pane">
                <emc-product-step :products="products" :selected-products="form.products" @toggle="toggleProduct" />
              </div>
            </VWindowItem>

            <!-- ── STEP 3: STAKEHOLDER ────────────────────────────────────── -->
            <VWindowItem :value="2">
              <div class="ob-pane">
                <emc-stakeholder-step :products="products.filter(p =>
                  form.products.includes(p.id)
                )
                  " :stakeholders-by-product="stakeholdersByProduct
                    " :selected-stakeholders="form.stakeholders
                      " @toggle="
                        ({ productId, stakeholderId }) =>
                          toggleStakeholder(
                            productId,
                            stakeholderId
                          )
                      " />
              </div>
            </VWindowItem>

            <!-- ── STEP 4: ORGANISATION + ADMIN ──────────────────────────── -->
            <VWindowItem :value="3">
              <div class="ob-pane">
                <emc-organization-step :form="form" :countries="countries" :timezones="timezones"
                  :industries="industries" :organization-sizes="organizationSizes" />
              </div>
            </VWindowItem>

            <!-- ── STEP 5: PLAN + ADDRESS ─────────────────────────────────── -->
            <VWindowItem :value="4">
              <div class="ob-pane">

                <emc-plan-step :plans="subscriptionPlans" :services="serviceAddons" :selected-plan="form.plan"
                  :selected-services="form.services" :billing-address="form.address.billing"
                  :communication-address="form.address.communication" :operational-address="form.address.operational"
                  :communication-same-as-billing="false" :operational-same-as-billing="false"
                  @update:selected-plan="form.plan = $event" @toggle-service="toggleService" />

              </div>
            </VWindowItem>

            <!-- ── STEP 6: SERVICES + REVIEW ─────────────────────────────── -->
            <VWindowItem :value="5">
              <div class="ob-pane">
                <emc-review-step :form="form" :domain-obj="selectedDomain" :selected-product-objs="selectedProducts"
                  :selected-stakeholders-by-product="selectedStakeholdersByProduct" :plan-obj="selectedPlan"
                  :service-objs="selectedServices" :total-monthly="totalMonthly" @goto-step="currentStep = $event" />

                <!-- Terms & Privacy — both required before Create Organisation is enabled -->
                <VCard variant="outlined" rounded="lg" class="mt-4 ob-terms-card">
                  <VCardText class="pb-2">
                    <div class="ob-terms-label mb-3">
                      <VIcon icon="ri-shield-check-line" size="15" color="primary" />
                      Agreements
                    </div>

                    <VCheckbox v-model="form.termsAccepted" color="primary" hide-details class="mb-1">
                      <template #label>
                        <span class="text-body-2">
                          I agree to the
                          <a href="#" class="ob-terms-link" @click.prevent>Terms of Service</a>
                          and understand the platform usage policies.
                        </span>
                      </template>
                    </VCheckbox>

                    <VCheckbox v-model="form.privacyAccepted" color="primary" hide-details>
                      <template #label>
                        <span class="text-body-2">
                          I have read and accept the
                          <a href="#" class="ob-terms-link" @click.prevent>Privacy Policy</a>
                          and consent to data processing.
                        </span>
                      </template>
                    </VCheckbox>
                  </VCardText>
                </VCard>
              </div>
            </VWindowItem>

          </VWindow>
        </div>

        <!-- ── STICKY FOOTER ──────────────────────────────────────────────── -->
        <div class="ob-footer">
          <VBtn v-if="currentStep > 0" variant="tonal" rounded="lg" prepend-icon="ri-arrow-left-line" @click="prev">
            Back
          </VBtn>

          <VSpacer />

          <VBtn variant="outlined" rounded="lg" prepend-icon="ri-save-3-line" class="me-3" @click="saveDraft">
            Save Draft
          </VBtn>

          <VBtn v-if="!isLastStep" color="primary" rounded="lg" append-icon="ri-arrow-right-line" elevation="0"
            @click="next">
            Continue
          </VBtn>
          <VBtn v-else color="success" rounded="lg" prepend-icon="ri-building-2-line" :loading="isSubmitting"
            :disabled="!form.termsAccepted || !form.privacyAccepted" @click="submit">
            Create Organisation
          </VBtn>
        </div>

      </div>
    </div>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" location="top right" :timeout="4000" rounded="lg">
      {{ snackbar.message }}
      <template #actions>
        <VBtn variant="text" size="small" @click="snackbar.show = false">Dismiss</VBtn>
      </template>
    </VSnackbar>

  </div>
</template>

<style lang="scss" scoped>
// ── Loading / Error overlay ───────────────────────────────────────────────────
.ob-loading {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  block-size: 100vh;
  gap: 16px;
}

.ob-loading__label {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.9375rem;
}

// ── Shell ─────────────────────────────────────────────────────────────────────
.ob-page {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  background: rgb(var(--v-theme-background));
  block-size: 100vh;
}

// ── Top Nav ───────────────────────────────────────────────────────────────────
.ob-nav {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  background: rgb(var(--v-theme-surface));
  block-size: 56px;
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 8%);
  gap: 16px;
  padding-inline: 24px;
}

.ob-logo {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
  block-size: 34px;
  inline-size: 34px;
}

.ob-nav__brand {
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.ob-nav__signin {
  color: rgb(var(--v-theme-primary));
  font-size: 0.8125rem;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.ob-nav__help {
  display: flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.8125rem;
  gap: 4px;
  text-decoration: none;

  &:hover {
    color: rgb(var(--v-theme-primary));
  }
}

// ── Body ──────────────────────────────────────────────────────────────────────
.ob-body {
  display: flex;
  overflow: hidden;
  flex: 1;
  min-block-size: 0;
}

// ── Left Panel ────────────────────────────────────────────────────────────────
.ob-panel {
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  border-inline-end: 1px solid rgba(var(--v-theme-on-surface), 8%);
  inline-size: 272px;
  overflow-y: auto;
  padding-block: 24px 16px;
  padding-inline: 20px;
}

.ob-panel__title {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-block-end: 16px;
  text-transform: uppercase;
}

// Domain badge in panel
.ob-domain-badge {
  display: flex;
  align-items: center;
  border: 1px solid rgba(var(--v-theme-primary), 20%);
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 6%);
  gap: 10px;
  margin-block-end: 20px;
  padding-block: 10px;
  padding-inline: 12px;
}

.ob-domain-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  block-size: 28px;
  inline-size: 28px;
}

.ob-domain-icon--primary {
  background: rgba(var(--v-theme-primary), 15%);
  color: rgb(var(--v-theme-primary));
}

.ob-domain-icon--info {
  background: rgba(var(--v-theme-info), 15%);
  color: rgb(var(--v-theme-info));
}

.ob-domain-icon--warning {
  background: rgba(var(--v-theme-warning), 15%);
  color: rgb(var(--v-theme-warning));
}

.ob-domain-icon--error {
  background: rgba(var(--v-theme-error), 15%);
  color: rgb(var(--v-theme-error));
}

.ob-domain-icon--success {
  background: rgba(var(--v-theme-success), 15%);
  color: rgb(var(--v-theme-success));
}

.ob-domain-badge__label {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.ob-domain-badge__name {
  font-size: 0.8125rem;
  font-weight: 700;
}

// Journey steps
.ob-journey {
  position: relative;
}

.ob-step {
  position: relative;
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  gap: 12px;
  padding-block: 6px;
  padding-inline: 0 8px;
}

.ob-step__line {
  position: absolute;
  block-size: 22px;
  border-inline-start: 2px solid rgba(var(--v-theme-on-surface), 12%);
  inline-size: 0;
  inset-block-start: 26px;
  inset-inline-start: 10px;

  &--done {
    border-inline-start-color: rgb(var(--v-theme-success));
  }
}

.ob-step__dot {
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(var(--v-theme-on-surface), 18%);
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
  block-size: 22px;
  inline-size: 22px;
  margin-block-start: 2px;

  .ob-step--active & {
    border-color: rgb(var(--v-theme-primary));
    background: rgb(var(--v-theme-primary));
  }

  .ob-step--done & {
    border-color: rgb(var(--v-theme-success));
    background: rgb(var(--v-theme-success));
  }
}

.ob-step__num {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 10px;
  font-weight: 700;

  .ob-step--active & {
    color: rgb(var(--v-theme-on-primary));
  }
}

.ob-step__info {
  flex: 1;
  padding-block: 2px;
}

.ob-step__name {
  font-size: 0.8125rem;
  font-weight: 600;

  .ob-step--pending & {
    color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
    font-weight: 400;
  }

  .ob-step--active & {
    color: rgb(var(--v-theme-primary));
    font-weight: 700;
  }

  .ob-step--done & {
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  }
}

.ob-step__value {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.72rem;
  line-height: 1.4;
  min-block-size: 16px;
}

// Pricing
.ob-pricing {
  border: 1px solid rgba(var(--v-theme-primary), 18%);
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 6%);
  padding-block: 14px;
  padding-inline: 14px;
}

.ob-pricing__heading {
  color: rgb(var(--v-theme-primary));
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-block-end: 10px;
  text-transform: uppercase;
}

.ob-pricing__row {
  display: flex;
  justify-content: space-between;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
  margin-block-end: 4px;
}

.ob-pricing__total {
  display: flex;
  justify-content: space-between;
  border-block-start: 1px solid rgba(var(--v-theme-primary), 20%);
  color: rgb(var(--v-theme-primary));
  font-size: 0.875rem;
  font-weight: 700;
  margin-block-start: 8px;
  padding-block-start: 8px;
}

// ── Main ──────────────────────────────────────────────────────────────────────
.ob-main {
  display: flex;
  overflow: hidden;
  flex: 1;
  flex-direction: column;
  min-inline-size: 0;
}

// Hero / step header
.ob-hero {
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 8%);
  padding-block: 14px 12px;
  padding-inline: 32px;
}

// Domain pill left, step counter right — same row
.ob-hero__top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 6px;
}

.ob-hero__domain-pill {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(var(--v-theme-primary), 25%);
  border-radius: 20px;
  background: rgba(var(--v-theme-primary), 8%);
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  font-weight: 600;
  gap: 5px;
  padding-block: 3px;
  padding-inline: 10px 12px;

  // placeholder keeps row height consistent on step 0
  &--ghost {
    border-color: transparent;
    background: transparent;
    block-size: 24px;
    inline-size: 1px;
  }
}

// Step counter + progress bar (right side of top row)
.ob-hero__step-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.ob-hero__step-label {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.ob-hero__step-progress {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-block-start: 2px;
}

.ob-hero__progress-bar {
  min-inline-size: 80px;
}

.ob-hero__pct {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.6875rem;
  font-weight: 600;
}

.ob-hero__title {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin-block: 0 2px;
}

.ob-hero__desc {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.875rem;
  margin-block: 0;
}

.ob-hero__context {
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  background: rgba(var(--v-theme-success), 10%);
  color: rgb(var(--v-theme-success));
  font-size: 0.8125rem;
  font-weight: 500;
  gap: 4px;
  margin-block-start: 10px;
  padding-block: 5px;
  padding-inline: 10px;
}

// Scrollable content
.ob-content {
  flex: 1;
  background: rgba(var(--v-theme-on-surface), 1.5%);
  min-block-size: 0;
  overflow-y: auto;
}

// Pierce Vuetify VWindow: its container defaults to overflow:hidden which clips tall steps.
// Removing that lets .ob-content (the real scroll host) handle overflow naturally.
.ob-window :deep(.v-window__container) {
  overflow: visible;
}

.ob-window :deep(.v-window-item) {
  block-size: auto;
}

.ob-pane {
  animation: pane-in 0.2s ease;
  padding-block: 24px 16px;
  padding-inline: 32px;
}

@keyframes pane-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ── Shared card ───────────────────────────────────────────────────────────────
.ob-card {
  position: relative;
  overflow: hidden;
  padding: 16px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 12%);
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;

  &:hover {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 4px 18px rgba(var(--v-theme-primary), 10%);
  }

  &--active {
    border-color: rgb(var(--v-theme-primary)) !important;
    background: rgba(var(--v-theme-primary), 4%) !important;
    box-shadow: 0 4px 20px rgba(var(--v-theme-primary), 14%);
  }

  &--domain {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  &--product,
  &--stakeholder,
  &--service {
    display: flex;
    flex-direction: column;
  }
}

.ob-card__top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-block-end: 10px;
}

.ob-card__title {
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.3;
  margin-block-end: 4px;

  &--active {
    color: rgb(var(--v-theme-primary));
  }

  &--sm {
    font-size: 0.875rem;
  }
}

.ob-card__sub {
  flex: 1;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
  line-height: 1.5;
  margin-block-end: 8px;
}

.ob-card__price {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  background: rgba(var(--v-theme-success), 10%);
  color: rgb(var(--v-theme-success));
  font-size: 0.72rem;
  font-weight: 600;
  gap: 4px;
  padding-block: 2px;
  padding-inline: 8px;
}

.ob-card__check {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 20%);
  border-radius: 50%;
  block-size: 22px;
  inline-size: 22px;
  transition: all 0.15s ease;

  &--on {
    border-color: rgb(var(--v-theme-primary));
    background: rgb(var(--v-theme-primary));
  }
}

// Domain icon inside domain card
.ob-dicon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  block-size: 48px;
  inline-size: 48px;
}

.ob-dicon--primary {
  background: rgba(var(--v-theme-primary), 12%);
  color: rgb(var(--v-theme-primary));
}

.ob-dicon--info {
  background: rgba(var(--v-theme-info), 12%);
  color: rgb(var(--v-theme-info));
}

.ob-dicon--warning {
  background: rgba(var(--v-theme-warning), 12%);
  color: rgb(var(--v-theme-warning));
}

.ob-dicon--error {
  background: rgba(var(--v-theme-error), 12%);
  color: rgb(var(--v-theme-error));
}

.ob-dicon--success {
  background: rgba(var(--v-theme-success), 12%);
  color: rgb(var(--v-theme-success));
}

// Product/service icon badge
.ob-picon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 10%);
  block-size: 36px;
  inline-size: 36px;
}

// Multi-select check (square)
.ob-mcheck {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 20%);
  border-radius: 6px;
  block-size: 22px;
  inline-size: 22px;
  transition: all 0.15s ease;

  &--on {
    border-color: rgb(var(--v-theme-primary));
    background: rgb(var(--v-theme-primary));
  }
}

// Count bar above product grid
.ob-count-bar {
  margin-block-end: 16px;
}

.ob-count-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  background: rgba(var(--v-theme-primary), 12%);
  color: rgb(var(--v-theme-primary));
  font-size: 0.8125rem;
  font-weight: 700;
  gap: 5px;
  padding-block: 4px;
  padding-inline: 12px;
}

.ob-count-hint {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.8125rem;
}

// Per-product stakeholder sections
.ob-product-sh-header {
  display: flex;
  align-items: center;
  border: 1px solid rgba(var(--v-theme-on-surface), 8%);
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  gap: 12px;
  margin-block-end: 16px;
  padding-block: 12px;
  padding-inline: 14px;
}

.ob-sh-product-name {
  font-size: 0.9375rem;
  font-weight: 700;
}

.ob-sh-product-hint {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.78rem;
}

// Sub-section tabs (step 4)
.ob-subsec-tabs {
  display: flex;
  border-block-end: 2px solid rgba(var(--v-theme-on-surface), 10%);
  gap: 4px;
}

.ob-subsec-tab {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  border: none;
  border-radius: 0;
  background: none;
  border-block-end: 2px solid transparent;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  gap: 6px;
  margin-block-end: -2px;
  padding-block: 10px;
  padding-inline: 16px;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: rgb(var(--v-theme-primary));
  }

  &--active {
    border-block-end-color: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-primary));
    font-weight: 700;
  }
}

.ob-nextsec {
  margin-block-start: 24px;
  text-align: end;
}

// Section label
.ob-section-label {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 700;
  gap: 7px;
}

.ob-section-label__count {
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 12%);
  color: rgb(var(--v-theme-primary));
  font-size: 0.72rem;
  font-weight: 700;
  margin-inline-start: 4px;
  padding-block: 1px;
  padding-inline: 8px;
}

// Plan cards (step 5)
.ob-plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 12%);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  block-size: 100%;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    border-color: rgb(var(--v-theme-primary));
    box-shadow: 0 6px 22px rgba(var(--v-theme-primary), 12%);
  }

  &--active {
    border-color: rgb(var(--v-theme-primary)) !important;
    background: rgba(var(--v-theme-primary), 3%) !important;
    box-shadow: 0 6px 22px rgba(var(--v-theme-primary), 16%);
  }

  &--popular {
    border-color: rgba(var(--v-theme-primary), 35%) !important;
  }
}

.ob-plan-badge {
  position: absolute;
  inset-block-start: -12px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
}

.ob-plan-name {
  font-size: 1.0625rem;
  font-weight: 700;
}

.ob-plan-price {
  font-size: 1.5rem;
  font-weight: 800;
  margin-block: 4px;
}

.ob-plan-sub {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.75rem;
}

.ob-plan-feature {
  display: flex;
  align-items: flex-start;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-size: 0.8125rem;
  margin-block-end: 5px;
}

.ob-plan-footer {
  margin-block-start: auto;
  padding-block-start: 14px;
}

// Review section
.ob-review-head {
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
  font-weight: 600;
  gap: 7px;
  padding-block: 10px;
  padding-inline: 16px;
}

.ob-rl {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.ob-rv {
  font-size: 0.875rem;
  font-weight: 500;
  margin-block-start: 2px;
}

// Summary pricing card
.ob-summary-card {
  padding: 20px;
  border: 1.5px solid rgba(var(--v-theme-primary), 20%);
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 4%);
}

.ob-summary-card__head {
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-primary));
  font-size: 0.875rem;
  font-weight: 700;
  gap: 7px;
  margin-block-end: 14px;
}

.ob-summary-row {
  display: flex;
  justify-content: space-between;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.8125rem;
  margin-block-end: 6px;
}

.ob-summary-total {
  display: flex;
  justify-content: space-between;
  border-block-start: 1.5px solid rgba(var(--v-theme-primary), 20%);
  color: rgb(var(--v-theme-primary));
  font-size: 1rem;
  font-weight: 800;
  margin-block-start: 10px;
  padding-block-start: 10px;
}

.ob-trust-row {
  display: flex;
  justify-content: space-between;
  border-block-start: 1px solid rgba(var(--v-theme-on-surface), 10%);
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.72rem;
  margin-block-start: 14px;
  padding-block-start: 12px;
}

// ── Sticky Footer ─────────────────────────────────────────────────────────────
.ob-footer {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  background: rgb(var(--v-theme-surface));
  border-block-start: 1px solid rgba(var(--v-theme-on-surface), 8%);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 4%);
  gap: 8px;
  padding-block: 12px;
  padding-inline: 32px;
}

// ── Mobile step strip ─────────────────────────────────────────────────────────
.ob-mobile-strip {
  overflow: hidden;
  flex-shrink: 0;
  align-items: center;
  background: rgb(var(--v-theme-surface));
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 8%);
  padding-block: 10px;
  padding-inline: 16px;
}

.ob-mobile-strip__dot {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.ob-mobile-strip__circle {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(var(--v-theme-on-surface), 18%);
  border-radius: 50%;
  block-size: 18px;
  inline-size: 18px;

  .ob-mobile-strip__dot--active & {
    border-color: rgb(var(--v-theme-primary));
    background: rgb(var(--v-theme-primary));
  }

  .ob-mobile-strip__dot--done & {
    border-color: rgb(var(--v-theme-success));
    background: rgb(var(--v-theme-success));
  }
}

.ob-mobile-strip__line {
  background: rgba(var(--v-theme-on-surface), 14%);
  block-size: 2px;
  inline-size: 16px;

  &--done {
    background: rgb(var(--v-theme-success));
  }
}

.ob-mobile-strip__label {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-end;
}

.ob-mobile-strip__step {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ob-mobile-strip__name {
  color: rgb(var(--v-theme-primary));
  font-size: 0.8125rem;
  font-weight: 700;
}

// ── Responsive overrides ──────────────────────────────────────────────────────

// Tablet (< 1280px = lg breakpoint where sidebar disappears)
@media (max-width: 1279px) {
  .ob-hero {
    padding-inline: 20px;
  }

  .ob-pane {
    padding-inline: 20px;
  }

  .ob-footer {
    padding-inline: 20px;
  }
}

// Mobile (< 600px = Vuetify xs)
@media (max-width: 599px) {
  .ob-nav {
    gap: 10px;
    padding-inline: 14px;
  }

  .ob-nav__brand {
    font-size: 0.875rem;
  }

  .ob-nav__help {
    display: none;
  }

  .ob-hero {
    padding-block: 10px 8px;
    padding-inline: 14px;
  }

  .ob-hero__title {
    font-size: 1.1875rem;
  }

  .ob-hero__desc {
    font-size: 0.8125rem;
  }

  .ob-hero__context {
    font-size: 0.75rem;
    margin-block-start: 8px;
    padding-block: 4px;
    padding-inline: 8px;
  }

  .ob-pane {
    padding-block: 16px 12px;
    padding-inline: 14px;
  }

  // Tighter card padding on phones
  .ob-card {
    padding: 12px;
    border-radius: 12px !important;
  }

  .ob-dicon {
    border-radius: 10px;
    block-size: 38px;
    inline-size: 38px;
  }

  // Reduce plan card padding
  .ob-plan-card {
    padding: 14px;
  }

  .ob-plan-price {
    font-size: 1.25rem;
  }

  // Sub-section tabs — allow horizontal scroll if labels overflow
  .ob-subsec-tabs {
    -webkit-overflow-scrolling: touch;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .ob-subsec-tab {
    flex-shrink: 0;
    font-size: 0.8125rem;
    padding-inline: 12px;
  }

  // Summary card full width on mobile
  .ob-summary-card {
    margin-block-start: 0;
  }

  // Footer: tighter, ensure buttons never clip
  .ob-footer {
    gap: 6px;
    padding-block: 10px;
    padding-inline: 14px;
  }
}

// Very small phones (< 400px)
@media (max-width: 399px) {
  .ob-hero__title {
    font-size: 1.0625rem;
  }

  .ob-mobile-strip__line {
    inline-size: 10px;
  }
}

// ── Transitions ───────────────────────────────────────────────────────────────
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.25s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

// ── Terms card (step 6) ───────────────────────────────────────────────────────
.ob-terms-card {
  max-inline-size: 640px;
}

.ob-terms-label {
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-primary));
  font-size: 0.8125rem;
  font-weight: 700;
  gap: 6px;
}

.ob-terms-link {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  text-decoration: underline;

  &:hover {
    opacity: 0.8;
  }
}
</style>
