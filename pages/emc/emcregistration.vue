<script setup lang="ts">
definePageMeta({
  layout: 'blank',
  public: true,
})

// ============================================================
// TypeScript Interfaces
// ============================================================

interface BusinessDomain {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

interface Product {
  id: string
  domainId: string
  name: string
  description: string
  startingPrice: string
  icon: string
}

interface StakeholderType {
  id: string
  domainId: string
  productIds: string[]   // stakeholder shown when any of these products is selected
  name: string
  icon: string
  description: string
}

interface OrgInfo {
  organizationName: string
  legalName: string
  businessRegNumber: string
  taxRegNumber: string
  website: string
  industry: string
  country: string
  timeZone: string
  organizationSize: string
  logoFile: File | File[] | null
}

interface AdminInfo {
  firstName: string
  lastName: string
  designation: string
  email: string
  mobile: string
  password: string
  confirmPassword: string
}

interface AirlineSpecificInfo {
  iataCode: string
  icaoCode: string
  cargoPrefix: string
  primaryHubAirport: string
  operationalRegion: string
}

interface GhaSpecificInfo {
  airport: string
  handlingLicenseNumber: string
  servicesOffered: string[]
}

interface Address {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  postalCode: string
}

interface AddressInfo {
  billing: Address
  communication: Address
  operational: Address
}

interface SubscriptionPlan {
  id: string
  name: string
  price: string
  priceValue: number
  priceSubtext: string
  description: string
  features: string[]
  badge?: string
}

interface AdditionalService {
  id: string
  name: string
  description: string
  price: string
  priceValue: number
  icon: string
  category: string
}

interface RegistrationData {
  selectedDomain: string
  selectedProducts: string[]        // ← multi-select array
  selectedStakeholder: string
  orgInfo: OrgInfo
  adminInfo: AdminInfo
  airlineInfo: AirlineSpecificInfo
  ghaInfo: GhaSpecificInfo
  addressInfo: AddressInfo
  selectedPlan: string
  selectedServices: string[]
}

// ============================================================
// Mock Data – Business Domains
// ============================================================

const businessDomains: BusinessDomain[] = [
  { id: 'air-cargo',  name: 'Air Cargo',                     icon: 'ri-plane-line',           description: 'Cargo management for airlines, ground handlers, and freight forwarders.', color: 'primary' },
  { id: 'shipping',   name: 'Shipping & Maritime',           icon: 'ri-ship-line',            description: 'Port, vessel, and maritime logistics operations management.',              color: 'info'    },
  { id: 'logistics',  name: 'Logistics & Warehousing',       icon: 'ri-truck-line',           description: 'Warehouse and ground transport operations platform.',                      color: 'warning' },
  { id: 'pharma',     name: 'Pharmaceutical Supply Chain',   icon: 'ri-medicine-bottle-line', description: 'Temperature-controlled logistics and pharma distribution.',              color: 'error'   },
  { id: 'enterprise', name: 'General Enterprise',            icon: 'ri-building-2-line',      description: 'Flexible business process management for any enterprise.',                color: 'success' },
]

// ============================================================
// Mock Data – Products
// ============================================================

const allProducts: Product[] = [
  { id: 'cms',         domainId: 'air-cargo',  name: 'Cargo Management System',       description: 'End-to-end cargo operations for airlines and handlers.',          startingPrice: '$299/mo', icon: 'ri-box-3-line'              },
  { id: 'ghs',         domainId: 'air-cargo',  name: 'Ground Handling System',        description: 'Terminal and cargo handling operations management.',               startingPrice: '$199/mo', icon: 'ri-tools-line'              },
  { id: 'wms-cargo',   domainId: 'air-cargo',  name: 'Warehouse Management',          description: 'Inventory and warehouse management for cargo terminals.',          startingPrice: '$149/mo', icon: 'ri-store-3-line'            },
  { id: 'rev-acc',     domainId: 'air-cargo',  name: 'Revenue Accounting',            description: 'Automated revenue accounting, proration, and settlement.',         startingPrice: '$399/mo', icon: 'ri-money-dollar-circle-line'},
  { id: 'cargo-portal',domainId: 'air-cargo',  name: 'Cargo Portal',                  description: 'Self-service booking and tracking for shippers and forwarders.',   startingPrice: '$99/mo',  icon: 'ri-global-line'             },
  { id: 'ccs',         domainId: 'air-cargo',  name: 'Cargo Community System',        description: 'Multi-party cargo community collaboration and messaging.',         startingPrice: '$499/mo', icon: 'ri-team-line'               },
  { id: 'pms',         domainId: 'shipping',   name: 'Port Management System',        description: 'Complete port operations and vessel management.',                   startingPrice: '$599/mo', icon: 'ri-anchor-line'             },
  { id: 'vts',         domainId: 'shipping',   name: 'Vessel Tracking System',        description: 'Real-time vessel tracking with AIS data integration.',             startingPrice: '$249/mo', icon: 'ri-radar-line'              },
  { id: 'wms-log',     domainId: 'logistics',  name: 'Warehouse Management',          description: 'Advanced WMS with barcode scanning and RFID support.',             startingPrice: '$199/mo', icon: 'ri-store-3-line'            },
  { id: 'tms',         domainId: 'logistics',  name: 'Transport Management',          description: 'Route optimisation and fleet management solution.',                 startingPrice: '$299/mo', icon: 'ri-truck-line'              },
  { id: 'cold-chain',  domainId: 'pharma',     name: 'Cold Chain Management',         description: 'Temperature-controlled logistics with IoT integration.',           startingPrice: '$449/mo', icon: 'ri-temp-cold-line'          },
  { id: 'pharma-track',domainId: 'pharma',     name: 'Track & Trace',                 description: 'End-to-end pharmaceutical traceability and compliance.',           startingPrice: '$349/mo', icon: 'ri-qr-code-line'            },
  { id: 'erp',         domainId: 'enterprise', name: 'Enterprise Resource Planning',  description: 'Comprehensive ERP for general business operations.',               startingPrice: '$199/mo', icon: 'ri-layout-grid-line'        },
  { id: 'crm',         domainId: 'enterprise', name: 'Customer Relationship Mgmt',    description: 'CRM for managing customer interactions and sales.',                 startingPrice: '$99/mo',  icon: 'ri-user-heart-line'         },
]

// ============================================================
// Mock Data – Stakeholders (filtered by selected products)
// ============================================================

const allStakeholders: StakeholderType[] = [
  { id: 'airline',          domainId: 'air-cargo',  productIds: ['cms','ghs','rev-acc','ccs','cargo-portal'],     name: 'Airline',                    icon: 'ri-plane-line',      description: 'Operate cargo flights, manage capacity and terminal operations.'     },
  { id: 'gha',              domainId: 'air-cargo',  productIds: ['ghs','cms','ccs'],                              name: 'Ground Handling Agent',      icon: 'ri-building-line',   description: 'Provide cargo acceptance, delivery and ramp handling services.'      },
  { id: 'freight-forwarder',domainId: 'air-cargo',  productIds: ['cargo-portal','ccs','wms-cargo'],               name: 'Freight Forwarder',          icon: 'ri-exchange-box-line',description: 'Book and consolidate cargo shipments on behalf of shippers.'        },
  { id: 'shipper',          domainId: 'air-cargo',  productIds: ['cargo-portal','ccs'],                           name: 'Shipper',                    icon: 'ri-box-3-line',      description: 'Ship goods via air freight and track shipment status.'              },
  { id: 'consignee',        domainId: 'air-cargo',  productIds: ['cargo-portal','ccs'],                           name: 'Consignee',                  icon: 'ri-archive-line',    description: 'Receive cargo shipments and manage last-mile delivery.'             },
  { id: 'trucking',         domainId: 'air-cargo',  productIds: ['cms','cargo-portal'],                           name: 'Trucking Company',           icon: 'ri-truck-line',      description: 'Provide ground transportation for cargo pickup and delivery.'        },
  { id: 'customs-broker',   domainId: 'air-cargo',  productIds: ['cargo-portal','ccs'],                           name: 'Customs Broker',             icon: 'ri-file-text-line',  description: 'Handle customs clearance and compliance for import/export cargo.'    },
  { id: 'port-operator',    domainId: 'shipping',   productIds: ['pms','vts'],                                    name: 'Port Operator',              icon: 'ri-anchor-line',     description: 'Manage port operations, berth allocation, and vessel handling.'      },
  { id: 'shipping-line',    domainId: 'shipping',   productIds: ['pms','vts'],                                    name: 'Shipping Line',              icon: 'ri-ship-line',       description: 'Operate vessel fleets and manage maritime cargo operations.'         },
  { id: 'warehouse-op',     domainId: 'logistics',  productIds: ['wms-log'],                                      name: 'Warehouse Operator',         icon: 'ri-store-3-line',    description: 'Manage warehouse facilities, inventory, and fulfilment.'            },
  { id: 'lsp',              domainId: 'logistics',  productIds: ['tms','wms-log'],                                name: 'Logistics Service Provider', icon: 'ri-truck-line',      description: 'Offer end-to-end logistics and supply chain services.'              },
  { id: 'pharma-mfg',       domainId: 'pharma',     productIds: ['cold-chain','pharma-track'],                    name: 'Pharmaceutical Manufacturer',icon: 'ri-flask-line',      description: 'Manufacture and distribute pharmaceutical products with compliance.' },
  { id: 'enterprise-user',  domainId: 'enterprise', productIds: ['erp','crm'],                                    name: 'Enterprise Organisation',    icon: 'ri-building-2-line', description: 'General enterprise business operations and process management.'       },
]

// ============================================================
// Mock Data – Subscription Plans
// ============================================================

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    priceValue: 0,
    priceSubtext: 'Forever free',
    description: 'Perfect for small teams getting started.',
    features: ['Up to 5 Users', 'Basic Features', 'Email Support', '5 GB Storage', 'Standard Reports'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$499',
    priceValue: 499,
    priceSubtext: 'per month',
    description: 'For growing businesses with full operational needs.',
    features: ['Unlimited Users', 'Full Operations Suite', 'Advanced Reporting', 'REST APIs', 'Priority Support', '100 GB Storage', 'Custom Workflows'],
    badge: 'Most Popular',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Contact Sales',
    priceValue: 0,
    priceSubtext: 'Custom pricing',
    description: 'Unlimited scale with dedicated support and SLAs.',
    features: ['Everything in Professional', 'Multi-Organisation', 'Dedicated SLA', 'Account Manager', 'On-premise Option', 'Custom Integrations'],
  },
]

// ============================================================
// Mock Data – Additional Services
// ============================================================

const serviceAddons: AdditionalService[] = [
  { id: 'cargo-imp', name: 'Cargo-IMP Messaging',    description: 'IATA airline messaging: FWB, FHL, FSU, AWB.',     price: '$99/mo',  priceValue: 99,  icon: 'ri-mail-send-line',      category: 'Messaging'   },
  { id: 'edi',       name: 'EDI Gateway',             description: 'Electronic Data Interchange for partners.',        price: '$129/mo', priceValue: 129, icon: 'ri-exchange-2-line',     category: 'Integration' },
  { id: 'mobile',    name: 'Mobile Application',      description: 'Native iOS and Android apps for field teams.',     price: '$79/mo',  priceValue: 79,  icon: 'ri-smartphone-line',     category: 'Productivity'},
  { id: 'bi',        name: 'Business Intelligence',   description: 'Analytics dashboards and custom report builder.',  price: '$149/mo', priceValue: 149, icon: 'ri-bar-chart-2-line',    category: 'Analytics'   },
  { id: 'ai',        name: 'AI Assistant',            description: 'AI-powered assistant for process automation.',     price: '$199/mo', priceValue: 199, icon: 'ri-robot-line',          category: 'AI'          },
  { id: 'iot',       name: 'IoT Tracking',            description: 'Real-time IoT sensor integration for tracking.',   price: '$149/mo', priceValue: 149, icon: 'ri-radar-line',          category: 'Tracking'    },
  { id: 'api',       name: 'API Access',              description: 'Full REST API for custom integrations.',           price: '$99/mo',  priceValue: 99,  icon: 'ri-code-box-line',       category: 'Developer'   },
  { id: 'training',  name: 'Training & Onboarding',   description: 'Dedicated onboarding sessions for your team.',    price: '$299/mo', priceValue: 299, icon: 'ri-graduation-cap-line', category: 'Support'     },
]

// ============================================================
// Wizard Steps Configuration
// ============================================================

const wizardSteps = [
  { title: 'Domain',       subtitle: 'Select Domain',    icon: 'ri-global-line'         },
  { title: 'Products',     subtitle: 'Choose Products',  icon: 'ri-apps-line'           },
  { title: 'Stakeholder',  subtitle: 'Select Type',      icon: 'ri-user-star-line'      },
  { title: 'Organisation', subtitle: 'Org Details',      icon: 'ri-building-2-line'     },
  { title: 'Administrator',subtitle: 'Admin Account',    icon: 'ri-shield-user-line'    },
  { title: 'Specifics',    subtitle: 'Stakeholder Info', icon: 'ri-information-line'    },
  { title: 'Address',      subtitle: 'Location',         icon: 'ri-map-pin-line'        },
  { title: 'Plan',         subtitle: 'Subscription',     icon: 'ri-price-tag-3-line'    },
  { title: 'Services',     subtitle: 'Add-ons',          icon: 'ri-add-circle-line'     },
  { title: 'Summary',      subtitle: 'Review & Submit',  icon: 'ri-checkbox-circle-line'},
]

// Step action descriptions shown in the header
const stepDescriptions = [
  'Choose the industry domain for your platform.',
  'Pick one or more products for your organisation.',
  'Select your role in the supply chain.',
  'Enter your organisation\'s legal and business details.',
  'Create the primary administrator account.',
  'Provide credentials specific to your stakeholder role.',
  'Add billing, communication and operational addresses.',
  'Choose a subscription plan that suits your scale.',
  'Enhance your platform with optional add-on services.',
  'Review everything before creating your organisation.',
]

// ============================================================
// Reference Data
// ============================================================

const countries        = ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Germany', 'France', 'Japan', 'Australia', 'Canada']
const timezones        = ['Asia/Kolkata (IST +5:30)', 'America/New_York (EST -5:00)', 'Europe/London (GMT +0:00)', 'Asia/Dubai (GST +4:00)', 'Asia/Singapore (SGT +8:00)', 'Europe/Berlin (CET +1:00)']
const organizationSizes = ['1–10', '11–50', '51–200', '201–500', '501–1000', '1000+']
const industries       = ['Air Cargo', 'Shipping & Maritime', 'Logistics & Warehousing', 'Pharmaceutical Supply Chain', 'Retail', 'Manufacturing', 'Finance', 'General Enterprise']
const operationalRegions = ['Asia Pacific', 'Europe', 'North America', 'Middle East & Africa', 'South America', 'Global']
const ghaServicesList  = ['Cargo Acceptance', 'Cargo Delivery', 'Ramp Handling', 'ULD Management', 'Dangerous Goods Handling', 'Live Animals', 'Temperature-Sensitive Cargo']

// ============================================================
// Reactive State
// ============================================================

const currentStep              = ref(0)
const isSubmitting             = ref(false)
const isPasswordVisible        = ref(false)
const isConfirmPasswordVisible = ref(false)
const addressTab               = ref('billing')
const snackbar                 = reactive({ show: false, message: '', color: 'success' })

const emptyAddress = (): Address => ({
  addressLine1: '', addressLine2: '', city: '', state: '', country: '', postalCode: '',
})

const registrationData = reactive<RegistrationData>({
  selectedDomain:     'air-cargo',
  selectedProducts:   ['cms'],
  selectedStakeholder:'airline',
  orgInfo: {
    organizationName: 'SkyCargo Logistics',
    legalName:        'SkyCargo Logistics Pvt Ltd',
    businessRegNumber:'CIN-U63010MH2020PTC123456',
    taxRegNumber:     'GSTIN-27AADCS1234A1Z5',
    website:          'https://www.skycargo-logistics.com',
    industry:         'Air Cargo',
    country:          'India',
    timeZone:         'Asia/Kolkata (IST +5:30)',
    organizationSize: '201–500',
    logoFile:         null,
  },
  adminInfo: {
    firstName:       'Ahmed',
    lastName:        'Rahman',
    designation:     'Operations Director',
    email:           'ahmed.rahman@skycargo.com',
    mobile:          '+91 9876543210',
    password:        '',
    confirmPassword: '',
  },
  airlineInfo: {
    iataCode:           'XY',
    icaoCode:           'XYZ',
    cargoPrefix:        '123',
    primaryHubAirport:  'Mumbai (BOM)',
    operationalRegion:  'Asia Pacific',
  },
  ghaInfo: {
    airport:               '',
    handlingLicenseNumber: '',
    servicesOffered:       [],
  },
  addressInfo: {
    billing: {
      addressLine1: 'Cargo Terminal Building, CSIA',
      addressLine2: 'Sahar Road',
      city:         'Mumbai',
      state:        'Maharashtra',
      country:      'India',
      postalCode:   '400099',
    },
    communication: emptyAddress(),
    operational:   emptyAddress(),
  },
  selectedPlan:     'professional',
  selectedServices: ['cargo-imp', 'ai'],
})

// ============================================================
// Computed
// ============================================================

const filteredProducts = computed(() =>
  allProducts.filter(p => p.domainId === registrationData.selectedDomain),
)

// Stakeholders filtered by domain AND by products the user selected
const filteredStakeholders = computed(() => {
  const base = allStakeholders.filter(s => s.domainId === registrationData.selectedDomain)
  if (registrationData.selectedProducts.length === 0) return base

  return base.filter(s =>
    s.productIds.some(pid => registrationData.selectedProducts.includes(pid)),
  )
})

const selectedDomainObj      = computed(() => businessDomains.find(d => d.id === registrationData.selectedDomain))
const selectedProductObjects = computed(() => allProducts.filter(p => registrationData.selectedProducts.includes(p.id)))
const selectedStakeholderObj = computed(() => allStakeholders.find(s => s.id === registrationData.selectedStakeholder))
const selectedPlanObj        = computed(() => subscriptionPlans.find(p => p.id === registrationData.selectedPlan))
const selectedServiceObjects = computed(() => serviceAddons.filter(s => registrationData.selectedServices.includes(s.id)))

const progressPercentage = computed(() =>
  Math.round((currentStep.value / (wizardSteps.length - 1)) * 100),
)

const isLastStep = computed(() => currentStep.value === wizardSteps.length - 1)

const selectedServicesTotal = computed(() =>
  selectedServiceObjects.value.reduce((a, s) => a + s.priceValue, 0),
)

const totalMonthly = computed(() =>
  (selectedPlanObj.value?.priceValue ?? 0) + selectedServicesTotal.value,
)

// Sidebar step status helper
function stepStatus(idx: number): 'done' | 'active' | 'pending' {
  if (idx < currentStep.value) return 'done'
  if (idx === currentStep.value) return 'active'

  return 'pending'
}

// ============================================================
// Validation Rules
// ============================================================

const rules = {
  required:      (v: string) => !!v || 'This field is required',
  email:         (v: string) => /.+@.+\..+/.test(v) || 'Enter a valid email address',
  minLength:     (n: number) => (v: string) => (v?.length ?? 0) >= n || `Minimum ${n} characters`,
  maxLength:     (n: number) => (v: string) => (v?.length ?? 0) <= n || `Maximum ${n} characters`,
  url:           (v: string) => !v || /^https?:\/\/.+/.test(v) || 'Must start with http:// or https://',
  passwordMatch: (v: string) => v === registrationData.adminInfo.password || 'Passwords do not match',
}

// ============================================================
// Methods
// ============================================================

function onDomainSelect(domainId: string) {
  registrationData.selectedDomain     = domainId
  registrationData.selectedProducts   = []
  registrationData.selectedStakeholder = ''
}

function toggleProduct(productId: string) {
  const idx = registrationData.selectedProducts.indexOf(productId)
  if (idx === -1)
    registrationData.selectedProducts.push(productId)
  else
    registrationData.selectedProducts.splice(idx, 1)
}

function toggleService(serviceId: string) {
  const idx = registrationData.selectedServices.indexOf(serviceId)
  if (idx === -1)
    registrationData.selectedServices.push(serviceId)
  else
    registrationData.selectedServices.splice(idx, 1)
}

function copySameAsBilling(type: 'communication' | 'operational') {
  Object.assign(registrationData.addressInfo[type], { ...registrationData.addressInfo.billing })
}

function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function nextStep() {
  if (currentStep.value < wizardSteps.length - 1) currentStep.value++
}

function saveDraft() {
  snackbar.message = 'Draft saved. Your progress is preserved.'
  snackbar.color   = 'success'
  snackbar.show    = true
}

async function submitRegistration() {
  isSubmitting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    snackbar.message = 'Organisation created! Redirecting to your dashboard...'
    snackbar.color   = 'success'
    snackbar.show    = true
  }
  catch {
    snackbar.message = 'Something went wrong. Please try again.'
    snackbar.color   = 'error'
    snackbar.show    = true
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="emc-page">

    <!-- ============================================================ -->
    <!-- HEADER – current step name highlighted                        -->
    <!-- ============================================================ -->
    <header class="emc-header">
      <!-- Brand -->
      <div class="d-flex align-center gap-3">
        <div class="emc-logo-pill">
          <VIcon icon="ri-plane-line" size="18" color="white" />
        </div>
        <span class="text-subtitle-1 font-weight-bold">EMC Platform</span>
      </div>

      <!-- Active step banner (center) – improvement #1 -->
      <div class="emc-header__step-banner">
        <div class="step-banner-pill">
          <span class="step-banner-number">{{ currentStep + 1 }}/{{ wizardSteps.length }}</span>
          <span class="step-banner-title">{{ wizardSteps[currentStep].title }}</span>
        </div>
        <p class="step-banner-desc d-none d-md-block">
          {{ stepDescriptions[currentStep] }}
        </p>
      </div>

      <!-- Progress -->
      <div class="d-flex align-center gap-2">
        <VProgressLinear
          :model-value="progressPercentage"
          color="primary"
          rounded
          height="6"
          class="emc-progress-bar"
        />
        <span class="text-caption font-weight-semibold">{{ progressPercentage }}%</span>
      </div>
    </header>

    <!-- ============================================================ -->
    <!-- BODY = sidebar + main                                         -->
    <!-- ============================================================ -->
    <div class="emc-body">

      <!-- ========================================================== -->
      <!-- SIDEBAR – live selection summary (improvement #4)           -->
      <!-- ========================================================== -->
      <aside class="emc-sidebar d-none d-lg-flex flex-column">

        <div class="sidebar-heading">Your Selections</div>

        <!-- Steps quick-nav list -->
        <div class="sidebar-steps">
          <div
            v-for="(step, idx) in wizardSteps"
            :key="step.title"
            class="sidebar-step"
            :class="`sidebar-step--${stepStatus(idx)}`"
            @click="currentStep = idx"
          >
            <div class="sidebar-step__dot">
              <VIcon
                v-if="stepStatus(idx) === 'done'"
                icon="ri-check-line"
                size="12"
                color="white"
              />
              <span v-else class="sidebar-step__num">{{ idx + 1 }}</span>
            </div>
            <div class="sidebar-step__text">
              <div class="sidebar-step__label">{{ step.title }}</div>

              <!-- Show selection value below done steps -->
              <div
                v-if="stepStatus(idx) === 'done' || stepStatus(idx) === 'active'"
                class="sidebar-step__value"
              >
                <!-- Domain -->
                <template v-if="idx === 0 && selectedDomainObj">
                  <VIcon :icon="selectedDomainObj.icon" size="11" />
                  {{ selectedDomainObj.name }}
                </template>
                <!-- Products -->
                <template v-if="idx === 1 && selectedProductObjects.length">
                  {{ selectedProductObjects.length }} product{{ selectedProductObjects.length > 1 ? 's' : '' }} selected
                </template>
                <!-- Stakeholder -->
                <template v-if="idx === 2 && selectedStakeholderObj">
                  {{ selectedStakeholderObj.name }}
                </template>
                <!-- Org -->
                <template v-if="idx === 3 && registrationData.orgInfo.organizationName">
                  {{ registrationData.orgInfo.organizationName }}
                </template>
                <!-- Admin -->
                <template v-if="idx === 4 && registrationData.adminInfo.firstName">
                  {{ registrationData.adminInfo.firstName }} {{ registrationData.adminInfo.lastName }}
                </template>
                <!-- Plan -->
                <template v-if="idx === 7 && selectedPlanObj">
                  {{ selectedPlanObj.name }}
                  <span v-if="selectedPlanObj.priceValue"> · ${{ selectedPlanObj.priceValue }}/mo</span>
                </template>
                <!-- Services -->
                <template v-if="idx === 8 && registrationData.selectedServices.length">
                  {{ registrationData.selectedServices.length }} add-on{{ registrationData.selectedServices.length > 1 ? 's' : '' }}
                </template>
              </div>
            </div>
          </div>
        </div>

        <VSpacer />

        <!-- Pricing estimate at the bottom -->
        <div
          v-if="totalMonthly > 0 || registrationData.selectedPlan === 'starter'"
          class="sidebar-pricing"
        >
          <div class="sidebar-pricing__title">Estimated Cost</div>

          <div
            v-if="selectedPlanObj?.priceValue"
            class="sidebar-pricing__row"
          >
            <span>{{ selectedPlanObj?.name }}</span>
            <span>${{ selectedPlanObj?.priceValue }}/mo</span>
          </div>
          <div
            v-else-if="registrationData.selectedPlan === 'starter'"
            class="sidebar-pricing__row"
          >
            <span>Starter</span>
            <span class="text-success">Free</span>
          </div>

          <div
            v-for="svc in selectedServiceObjects"
            :key="svc.id"
            class="sidebar-pricing__row"
          >
            <span>{{ svc.name }}</span>
            <span>${{ svc.priceValue }}/mo</span>
          </div>

          <div class="sidebar-pricing__total">
            <span>Total</span>
            <span>{{ totalMonthly > 0 ? `$${totalMonthly}/mo` : 'Free' }}</span>
          </div>
        </div>
      </aside>

      <!-- ========================================================== -->
      <!-- MAIN = stepper + scrollable content + sticky footer         -->
      <!-- ========================================================== -->
      <div class="emc-main">

        <!-- Stepper (improvement #1 – active step clearly highlighted) -->
        <div class="emc-stepper-wrap">
          <AppStepper
            :items="wizardSteps"
            :current-step="currentStep"
            class="stepper-icon-step-bg"
            @update:current-step="val => (currentStep = val)"
          />
        </div>

        <VDivider />

        <!-- Scrollable step content -->
        <div class="emc-content">
          <VWindow v-model="currentStep">

            <!-- ================================================== -->
            <!-- STEP 1 – Domain                                      -->
            <!-- ================================================== -->
            <VWindowItem :value="0">
              <div class="step-pane">
                <div class="step-header">
                  <h2 class="step-title">Select Business Domain</h2>
                  <p class="step-subtitle">Choose the industry domain that best describes your operations.</p>
                </div>

                <VRow>
                  <VCol
                    v-for="domain in businessDomains"
                    :key="domain.id"
                    cols="12"
                    sm="6"
                    lg="4"
                  >
                    <!-- improvement #2: selected domain name large & highlighted -->
                    <VCard
                      class="sel-card"
                      :class="{ 'sel-card--active': registrationData.selectedDomain === domain.id }"
                      variant="outlined"
                      height="100%"
                      @click="onDomainSelect(domain.id)"
                    >
                      <VCardText class="pa-5">
                        <div class="d-flex align-center gap-3 mb-3">
                          <div :class="`domain-icon-badge domain-${domain.color}`">
                            <VIcon :icon="domain.icon" size="22" />
                          </div>
                          <div class="flex-grow-1">
                            <!-- Domain name gets a prominent highlight when selected -->
                            <div
                              class="domain-card-name"
                              :class="{ 'domain-card-name--selected': registrationData.selectedDomain === domain.id }"
                            >
                              {{ domain.name }}
                            </div>
                          </div>
                          <Transition name="fade">
                            <VIcon
                              v-if="registrationData.selectedDomain === domain.id"
                              icon="ri-checkbox-circle-fill"
                              color="primary"
                              size="22"
                            />
                          </Transition>
                        </div>
                        <p class="text-body-2 text-medium-emphasis mb-0">{{ domain.description }}</p>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </div>
            </VWindowItem>

            <!-- ================================================== -->
            <!-- STEP 2 – Products (multi-select, improvement #5)    -->
            <!-- ================================================== -->
            <VWindowItem :value="1">
              <div class="step-pane">
                <div class="step-header">
                  <h2 class="step-title">Select Products</h2>
                  <p class="step-subtitle">You can choose multiple products. Stakeholder options will be based on your selections.</p>
                </div>

                <VAlert
                  v-if="!registrationData.selectedDomain"
                  type="info"
                  variant="tonal"
                  class="mb-5"
                >
                  Please go back and select a domain first.
                </VAlert>

                <template v-else>
                  <!-- Selection count chip -->
                  <div class="d-flex align-center gap-2 mb-5">
                    <VChip
                      v-if="registrationData.selectedProducts.length > 0"
                      color="primary"
                      variant="flat"
                      size="small"
                    >
                      {{ registrationData.selectedProducts.length }} selected
                    </VChip>
                    <span
                      v-else
                      class="text-caption text-medium-emphasis"
                    >
                      Select one or more products
                    </span>
                  </div>

                  <VRow>
                    <VCol
                      v-for="product in filteredProducts"
                      :key="product.id"
                      cols="12"
                      sm="6"
                      md="4"
                    >
                      <VCard
                        class="sel-card"
                        :class="{ 'sel-card--active': registrationData.selectedProducts.includes(product.id) }"
                        variant="outlined"
                        height="100%"
                        @click="toggleProduct(product.id)"
                      >
                        <VCardText class="pa-4">
                          <div class="d-flex align-center justify-space-between mb-3">
                            <div class="icon-badge-neutral">
                              <VIcon :icon="product.icon" size="18" color="primary" />
                            </div>
                            <!-- Multi-select checkbox visual -->
                            <div
                              class="multi-select-box"
                              :class="{ 'multi-select-box--checked': registrationData.selectedProducts.includes(product.id) }"
                            >
                              <VIcon
                                v-if="registrationData.selectedProducts.includes(product.id)"
                                icon="ri-check-line"
                                size="14"
                                color="white"
                              />
                            </div>
                          </div>
                          <div class="text-subtitle-2 font-weight-semibold mb-1">{{ product.name }}</div>
                          <p class="text-caption text-medium-emphasis mb-3">{{ product.description }}</p>
                          <VChip size="x-small" color="success" variant="tonal">
                            <VIcon start icon="ri-price-tag-3-line" size="10" />
                            {{ product.startingPrice }}
                          </VChip>
                        </VCardText>
                      </VCard>
                    </VCol>
                  </VRow>
                </template>
              </div>
            </VWindowItem>

            <!-- ================================================== -->
            <!-- STEP 3 – Stakeholder (filtered by products, #6)     -->
            <!-- ================================================== -->
            <VWindowItem :value="2">
              <div class="step-pane">
                <div class="step-header">
                  <h2 class="step-title">Select Stakeholder Type</h2>
                  <p class="step-subtitle">
                    Showing stakeholder types relevant to your selected
                    <strong>{{ selectedProductObjects.map(p => p.name).join(', ') || 'products' }}</strong>.
                  </p>
                </div>

                <VAlert
                  v-if="registrationData.selectedProducts.length === 0"
                  type="warning"
                  variant="tonal"
                  class="mb-5"
                >
                  Please go back and select at least one product.
                </VAlert>

                <VRow v-else>
                  <VCol
                    v-for="stakeholder in filteredStakeholders"
                    :key="stakeholder.id"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <VCard
                      class="sel-card"
                      :class="{ 'sel-card--active': registrationData.selectedStakeholder === stakeholder.id }"
                      variant="outlined"
                      height="100%"
                      @click="registrationData.selectedStakeholder = stakeholder.id"
                    >
                      <VCardText class="pa-4">
                        <div class="d-flex align-center justify-space-between mb-3">
                          <div class="icon-badge-neutral">
                            <VIcon :icon="stakeholder.icon" size="18" color="primary" />
                          </div>
                          <Transition name="fade">
                            <VIcon
                              v-if="registrationData.selectedStakeholder === stakeholder.id"
                              icon="ri-checkbox-circle-fill"
                              color="primary"
                              size="20"
                            />
                          </Transition>
                        </div>
                        <div class="text-subtitle-2 font-weight-semibold mb-1">{{ stakeholder.name }}</div>
                        <p class="text-caption text-medium-emphasis mb-0">{{ stakeholder.description }}</p>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </div>
            </VWindowItem>

            <!-- ================================================== -->
            <!-- STEP 4 – Organisation Information                   -->
            <!-- ================================================== -->
            <VWindowItem :value="3">
              <div class="step-pane">
                <div class="step-header">
                  <h2 class="step-title">Organisation Information</h2>
                  <p class="step-subtitle">Your organisation's legal and business details for compliance and invoicing.</p>
                </div>

                <VForm @submit.prevent>
                  <VRow>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.orgInfo.organizationName" label="Organisation Name *" placeholder="SkyCargo Logistics" :rules="[rules.required]" prepend-inner-icon="ri-building-2-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.orgInfo.legalName" label="Legal Name *" placeholder="SkyCargo Logistics Pvt Ltd" :rules="[rules.required]" prepend-inner-icon="ri-bank-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.orgInfo.businessRegNumber" label="Business Registration Number" placeholder="CIN-U63010MH2020PTC123456" prepend-inner-icon="ri-file-list-3-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.orgInfo.taxRegNumber" label="Tax Registration Number (GST/VAT)" placeholder="GSTIN-27AADCS1234A1Z5" prepend-inner-icon="ri-bill-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.orgInfo.website" label="Website" placeholder="https://www.yourcompany.com" :rules="[rules.url]" prepend-inner-icon="ri-global-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VSelect v-model="registrationData.orgInfo.industry" label="Industry *" :items="industries" :rules="[rules.required]" prepend-inner-icon="ri-briefcase-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="4">
                      <VSelect v-model="registrationData.orgInfo.country" label="Country *" :items="countries" :rules="[rules.required]" prepend-inner-icon="ri-map-pin-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="4">
                      <VSelect v-model="registrationData.orgInfo.timeZone" label="Time Zone *" :items="timezones" :rules="[rules.required]" prepend-inner-icon="ri-time-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="4">
                      <VSelect v-model="registrationData.orgInfo.organizationSize" label="Organisation Size" :items="organizationSizes" prepend-inner-icon="ri-group-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12">
                      <VFileInput v-model="registrationData.orgInfo.logoFile" label="Organisation Logo (PNG or SVG)" accept="image/*" prepend-icon="" prepend-inner-icon="ri-image-line" variant="outlined" density="comfortable" show-size chips />
                    </VCol>
                  </VRow>
                </VForm>
              </div>
            </VWindowItem>

            <!-- ================================================== -->
            <!-- STEP 5 – Administrator Account                      -->
            <!-- ================================================== -->
            <VWindowItem :value="4">
              <div class="step-pane">
                <div class="step-header">
                  <h2 class="step-title">Administrator Account</h2>
                  <p class="step-subtitle">Create the primary administrator who will have full system access.</p>
                </div>

                <VForm @submit.prevent>
                  <VRow>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.adminInfo.firstName" label="First Name *" placeholder="Ahmed" :rules="[rules.required, rules.minLength(2)]" prepend-inner-icon="ri-user-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.adminInfo.lastName" label="Last Name *" placeholder="Rahman" :rules="[rules.required, rules.minLength(2)]" prepend-inner-icon="ri-user-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.adminInfo.designation" label="Designation *" placeholder="Operations Director" :rules="[rules.required]" prepend-inner-icon="ri-briefcase-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.adminInfo.email" label="Email Address *" placeholder="ahmed.rahman@skycargo.com" type="email" :rules="[rules.required, rules.email]" prepend-inner-icon="ri-mail-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.adminInfo.mobile" label="Mobile Number *" placeholder="+91 9876543210" :rules="[rules.required]" prepend-inner-icon="ri-smartphone-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12">
                      <VDivider class="my-1"><span class="text-caption text-medium-emphasis px-3">Set Password</span></VDivider>
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.adminInfo.password" label="Password *" :type="isPasswordVisible ? 'text' : 'password'" :rules="[rules.required, rules.minLength(8)]" prepend-inner-icon="ri-lock-line" :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'" variant="outlined" density="comfortable" @click:append-inner="isPasswordVisible = !isPasswordVisible" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.adminInfo.confirmPassword" label="Confirm Password *" :type="isConfirmPasswordVisible ? 'text' : 'password'" :rules="[rules.required, rules.passwordMatch]" prepend-inner-icon="ri-lock-2-line" :append-inner-icon="isConfirmPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'" variant="outlined" density="comfortable" @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible" />
                    </VCol>
                  </VRow>
                </VForm>
              </div>
            </VWindowItem>

            <!-- ================================================== -->
            <!-- STEP 6 – Stakeholder Specifics                      -->
            <!-- ================================================== -->
            <VWindowItem :value="5">
              <div class="step-pane">
                <div class="step-header">
                  <h2 class="step-title">Stakeholder-Specific Information</h2>
                  <p class="step-subtitle">
                    Operational credentials for your role as
                    <strong>{{ selectedStakeholderObj?.name ?? 'your stakeholder type' }}</strong>.
                  </p>
                </div>

                <!-- Airline -->
                <VForm v-if="registrationData.selectedStakeholder === 'airline'" @submit.prevent>
                  <VAlert type="primary" variant="tonal" class="mb-5" density="compact" icon="ri-plane-line">
                    <template #text>IATA/ICAO credentials for messaging, cargo prefix and network operations.</template>
                  </VAlert>
                  <VRow>
                    <VCol cols="12" md="4">
                      <VTextField v-model="registrationData.airlineInfo.iataCode" label="IATA Code *" placeholder="XY" :rules="[rules.required, rules.maxLength(2)]" prepend-inner-icon="ri-barcode-line" variant="outlined" density="comfortable" counter="2" hint="2-letter IATA designator" persistent-hint />
                    </VCol>
                    <VCol cols="12" md="4">
                      <VTextField v-model="registrationData.airlineInfo.icaoCode" label="ICAO Code *" placeholder="XYZ" :rules="[rules.required, rules.maxLength(3)]" prepend-inner-icon="ri-barcode-line" variant="outlined" density="comfortable" counter="3" hint="3-letter ICAO designator" persistent-hint />
                    </VCol>
                    <VCol cols="12" md="4">
                      <VTextField v-model="registrationData.airlineInfo.cargoPrefix" label="Cargo Prefix *" placeholder="123" :rules="[rules.required]" prepend-inner-icon="ri-hashtag" variant="outlined" density="comfortable" hint="3-digit IATA cargo prefix" persistent-hint />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.airlineInfo.primaryHubAirport" label="Primary Hub Airport *" placeholder="Mumbai (BOM)" :rules="[rules.required]" prepend-inner-icon="ri-map-pin-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VSelect v-model="registrationData.airlineInfo.operationalRegion" label="Operational Region *" :items="operationalRegions" :rules="[rules.required]" prepend-inner-icon="ri-global-line" variant="outlined" density="comfortable" />
                    </VCol>
                  </VRow>
                </VForm>

                <!-- GHA -->
                <VForm v-else-if="registrationData.selectedStakeholder === 'gha'" @submit.prevent>
                  <VAlert type="primary" variant="tonal" class="mb-5" density="compact" icon="ri-building-line">
                    <template #text>Ground handling license, airport assignment and service scope.</template>
                  </VAlert>
                  <VRow>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.ghaInfo.airport" label="Primary Airport *" placeholder="Indira Gandhi International (DEL)" :rules="[rules.required]" prepend-inner-icon="ri-map-pin-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField v-model="registrationData.ghaInfo.handlingLicenseNumber" label="Handling Licence Number *" placeholder="GHA-DEL-2024-001" :rules="[rules.required]" prepend-inner-icon="ri-file-list-3-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12">
                      <VSelect v-model="registrationData.ghaInfo.servicesOffered" label="Services Offered" :items="ghaServicesList" multiple chips closable-chips prepend-inner-icon="ri-service-line" variant="outlined" density="comfortable" />
                    </VCol>
                  </VRow>
                </VForm>

                <!-- Other -->
                <VForm v-else @submit.prevent>
                  <VAlert type="info" variant="tonal" class="mb-5" density="compact">
                    <template #text>Additional configuration for <strong>{{ selectedStakeholderObj?.name }}</strong> is available in your account settings after setup.</template>
                  </VAlert>
                  <VRow>
                    <VCol cols="12" md="6">
                      <VTextField label="Primary Operating Location" placeholder="e.g., Delhi International Airport" prepend-inner-icon="ri-map-pin-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12" md="6">
                      <VTextField label="Licence / Registration Number" placeholder="Licence number if applicable" prepend-inner-icon="ri-file-list-3-line" variant="outlined" density="comfortable" />
                    </VCol>
                    <VCol cols="12">
                      <VTextarea label="Additional Notes" placeholder="Any additional operational information..." prepend-inner-icon="ri-file-text-line" variant="outlined" rows="3" auto-grow />
                    </VCol>
                  </VRow>
                </VForm>
              </div>
            </VWindowItem>

            <!-- ================================================== -->
            <!-- STEP 7 – Address                                     -->
            <!-- ================================================== -->
            <VWindowItem :value="6">
              <div class="step-pane">
                <div class="step-header">
                  <h2 class="step-title">Address Information</h2>
                  <p class="step-subtitle">Billing, communication and operational addresses for your organisation.</p>
                </div>

                <VTabs v-model="addressTab" color="primary" class="mb-5">
                  <VTab value="billing">   <VIcon start icon="ri-bill-line" size="16" />Billing</VTab>
                  <VTab value="communication"><VIcon start icon="ri-mail-line" size="16" />Communication</VTab>
                  <VTab value="operational"> <VIcon start icon="ri-building-2-line" size="16" />Operational</VTab>
                </VTabs>

                <VWindow v-model="addressTab">
                  <!-- Billing -->
                  <VWindowItem value="billing">
                    <VForm @submit.prevent>
                      <VRow>
                        <VCol cols="12" md="8"><VTextField v-model="registrationData.addressInfo.billing.addressLine1" label="Address Line 1 *" :rules="[rules.required]" prepend-inner-icon="ri-home-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" md="4"><VTextField v-model="registrationData.addressInfo.billing.addressLine2" label="Address Line 2" prepend-inner-icon="ri-map-2-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" sm="4"><VTextField v-model="registrationData.addressInfo.billing.city" label="City *" :rules="[rules.required]" prepend-inner-icon="ri-building-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" sm="4"><VTextField v-model="registrationData.addressInfo.billing.state" label="State / Province" prepend-inner-icon="ri-map-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" sm="4"><VTextField v-model="registrationData.addressInfo.billing.postalCode" label="Postal Code *" :rules="[rules.required]" prepend-inner-icon="ri-map-pin-2-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12"><VSelect v-model="registrationData.addressInfo.billing.country" label="Country *" :items="countries" :rules="[rules.required]" prepend-inner-icon="ri-map-pin-line" variant="outlined" density="comfortable" /></VCol>
                      </VRow>
                    </VForm>
                  </VWindowItem>

                  <!-- Communication -->
                  <VWindowItem value="communication">
                    <VBtn variant="tonal" color="primary" size="small" prepend-icon="ri-file-copy-line" class="mb-5" @click="copySameAsBilling('communication')">Same as Billing</VBtn>
                    <VForm @submit.prevent>
                      <VRow>
                        <VCol cols="12" md="8"><VTextField v-model="registrationData.addressInfo.communication.addressLine1" label="Address Line 1" prepend-inner-icon="ri-home-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" md="4"><VTextField v-model="registrationData.addressInfo.communication.addressLine2" label="Address Line 2" prepend-inner-icon="ri-map-2-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" sm="4"><VTextField v-model="registrationData.addressInfo.communication.city" label="City" prepend-inner-icon="ri-building-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" sm="4"><VTextField v-model="registrationData.addressInfo.communication.state" label="State / Province" prepend-inner-icon="ri-map-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" sm="4"><VTextField v-model="registrationData.addressInfo.communication.postalCode" label="Postal Code" prepend-inner-icon="ri-map-pin-2-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12"><VSelect v-model="registrationData.addressInfo.communication.country" label="Country" :items="countries" prepend-inner-icon="ri-map-pin-line" variant="outlined" density="comfortable" /></VCol>
                      </VRow>
                    </VForm>
                  </VWindowItem>

                  <!-- Operational -->
                  <VWindowItem value="operational">
                    <VBtn variant="tonal" color="primary" size="small" prepend-icon="ri-file-copy-line" class="mb-5" @click="copySameAsBilling('operational')">Same as Billing</VBtn>
                    <VForm @submit.prevent>
                      <VRow>
                        <VCol cols="12" md="8"><VTextField v-model="registrationData.addressInfo.operational.addressLine1" label="Address Line 1" prepend-inner-icon="ri-home-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" md="4"><VTextField v-model="registrationData.addressInfo.operational.addressLine2" label="Address Line 2" prepend-inner-icon="ri-map-2-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" sm="4"><VTextField v-model="registrationData.addressInfo.operational.city" label="City" prepend-inner-icon="ri-building-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" sm="4"><VTextField v-model="registrationData.addressInfo.operational.state" label="State / Province" prepend-inner-icon="ri-map-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12" sm="4"><VTextField v-model="registrationData.addressInfo.operational.postalCode" label="Postal Code" prepend-inner-icon="ri-map-pin-2-line" variant="outlined" density="comfortable" /></VCol>
                        <VCol cols="12"><VSelect v-model="registrationData.addressInfo.operational.country" label="Country" :items="countries" prepend-inner-icon="ri-map-pin-line" variant="outlined" density="comfortable" /></VCol>
                      </VRow>
                    </VForm>
                  </VWindowItem>
                </VWindow>
              </div>
            </VWindowItem>

            <!-- ================================================== -->
            <!-- STEP 8 – Subscription Plan                          -->
            <!-- ================================================== -->
            <VWindowItem :value="7">
              <div class="step-pane">
                <div class="step-header">
                  <h2 class="step-title">Choose Subscription Plan</h2>
                  <p class="step-subtitle">All paid plans include a 30-day free trial. No credit card required to start.</p>
                </div>

                <VRow justify="center">
                  <VCol
                    v-for="plan in subscriptionPlans"
                    :key="plan.id"
                    cols="12"
                    sm="10"
                    md="4"
                  >
                    <VCard
                      class="plan-card"
                      :class="{ 'plan-card--selected': registrationData.selectedPlan === plan.id, 'plan-card--popular': !!plan.badge }"
                      variant="outlined"
                      height="100%"
                      @click="registrationData.selectedPlan = plan.id"
                    >
                      <div v-if="plan.badge" class="plan-badge">
                        <VChip size="small" color="primary" variant="flat">{{ plan.badge }}</VChip>
                      </div>
                      <VCardText class="pa-6 d-flex flex-column text-center">
                        <h3 class="text-h5 font-weight-bold mb-1">{{ plan.name }}</h3>
                        <p class="text-body-2 text-medium-emphasis mb-4">{{ plan.description }}</p>
                        <div class="plan-price mb-5">
                          <div class="text-h4 font-weight-bold">{{ plan.price }}</div>
                          <div class="text-caption text-medium-emphasis mt-1">{{ plan.priceSubtext }}</div>
                        </div>
                        <VDivider class="mb-4" />
                        <VList class="text-start pa-0 flex-grow-1" density="compact">
                          <VListItem v-for="f in plan.features" :key="f" class="px-0" min-height="32">
                            <template #prepend><VIcon icon="ri-check-line" color="success" size="14" class="me-2" /></template>
                            <VListItemTitle class="text-body-2">{{ f }}</VListItemTitle>
                          </VListItem>
                        </VList>
                        <VBtn
                          class="mt-5"
                          :color="registrationData.selectedPlan === plan.id ? 'primary' : 'default'"
                          :variant="registrationData.selectedPlan === plan.id ? 'flat' : 'tonal'"
                          block
                          rounded="lg"
                        >
                          <VIcon v-if="registrationData.selectedPlan === plan.id" start icon="ri-checkbox-circle-line" />
                          {{ registrationData.selectedPlan === plan.id ? 'Selected' : 'Choose Plan' }}
                        </VBtn>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </div>
            </VWindowItem>

            <!-- ================================================== -->
            <!-- STEP 9 – Additional Services                        -->
            <!-- ================================================== -->
            <VWindowItem :value="8">
              <div class="step-pane">
                <div class="step-header">
                  <h2 class="step-title">Additional Services</h2>
                  <p class="step-subtitle">Optional add-ons to enhance your platform. All can be added or removed anytime.</p>
                </div>

                <VRow>
                  <VCol
                    v-for="service in serviceAddons"
                    :key="service.id"
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                  >
                    <VCard
                      class="sel-card service-card"
                      :class="{ 'sel-card--active': registrationData.selectedServices.includes(service.id) }"
                      variant="outlined"
                      height="100%"
                      @click="toggleService(service.id)"
                    >
                      <VCardText class="pa-4">
                        <div class="d-flex align-center justify-space-between mb-3">
                          <div class="service-icon-badge">
                            <VIcon :icon="service.icon" size="18" color="primary" />
                          </div>
                          <div
                            class="multi-select-box"
                            :class="{ 'multi-select-box--checked': registrationData.selectedServices.includes(service.id) }"
                          >
                            <VIcon v-if="registrationData.selectedServices.includes(service.id)" icon="ri-check-line" size="14" color="white" />
                          </div>
                        </div>
                        <div class="text-subtitle-2 font-weight-semibold mb-1">{{ service.name }}</div>
                        <p class="text-caption text-medium-emphasis mb-3">{{ service.description }}</p>
                        <div class="d-flex align-center gap-1">
                          <VChip size="x-small" color="primary" variant="tonal">{{ service.price }}</VChip>
                          <VChip size="x-small" variant="tonal">{{ service.category }}</VChip>
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>

                <Transition name="slide-up">
                  <VCard
                    v-if="registrationData.selectedServices.length > 0"
                    class="mt-5 services-summary"
                    variant="tonal"
                    color="primary"
                    rounded="lg"
                  >
                    <VCardText class="pa-4">
                      <div class="d-flex align-center justify-space-between flex-wrap gap-3">
                        <div>
                          <div class="text-subtitle-2 font-weight-semibold mb-2">
                            {{ registrationData.selectedServices.length }} add-on{{ registrationData.selectedServices.length > 1 ? 's' : '' }} selected
                          </div>
                          <div class="d-flex flex-wrap gap-1">
                            <VChip
                              v-for="svcId in registrationData.selectedServices"
                              :key="svcId"
                              size="small"
                              color="primary"
                              variant="flat"
                              closable
                              @click:close="toggleService(svcId)"
                            >
                              {{ serviceAddons.find(s => s.id === svcId)?.name }}
                            </VChip>
                          </div>
                        </div>
                        <div class="text-end">
                          <div class="text-caption text-medium-emphasis">Add-ons subtotal</div>
                          <div class="text-h6 font-weight-bold">${{ selectedServicesTotal }}/mo</div>
                        </div>
                      </div>
                    </VCardText>
                  </VCard>
                </Transition>
              </div>
            </VWindowItem>

            <!-- ================================================== -->
            <!-- STEP 10 – Summary                                   -->
            <!-- ================================================== -->
            <VWindowItem :value="9">
              <div class="step-pane">
                <div class="step-header">
                  <h2 class="step-title">Review & Confirm</h2>
                  <p class="step-subtitle">Check everything before creating your organisation. Click <strong>Edit</strong> on any section to go back.</p>
                </div>

                <VRow>
                  <VCol cols="12" md="8">

                    <!-- Platform Config -->
                    <VCard variant="outlined" class="mb-4" rounded="lg">
                      <VCardTitle class="summary-card-title">
                        <VIcon icon="ri-global-line" size="16" color="primary" />
                        Platform Configuration
                        <VSpacer />
                        <VBtn size="x-small" variant="text" color="primary" @click="currentStep = 0">Edit</VBtn>
                      </VCardTitle>
                      <VDivider />
                      <VCardText class="pa-4">
                        <VRow no-gutters>
                          <VCol cols="12" sm="4" class="mb-3">
                            <div class="sl">Domain</div>
                            <div class="sv d-flex align-center gap-1"><VIcon :icon="selectedDomainObj?.icon" size="13" color="primary" />{{ selectedDomainObj?.name }}</div>
                          </VCol>
                          <VCol cols="12" sm="4" class="mb-3">
                            <div class="sl">Products</div>
                            <div class="sv">{{ selectedProductObjects.map(p => p.name).join(', ') || '—' }}</div>
                          </VCol>
                          <VCol cols="12" sm="4" class="mb-3">
                            <div class="sl">Stakeholder</div>
                            <div class="sv">{{ selectedStakeholderObj?.name || '—' }}</div>
                          </VCol>
                        </VRow>
                      </VCardText>
                    </VCard>

                    <!-- Organisation -->
                    <VCard variant="outlined" class="mb-4" rounded="lg">
                      <VCardTitle class="summary-card-title">
                        <VIcon icon="ri-building-2-line" size="16" color="primary" />Organisation Details<VSpacer />
                        <VBtn size="x-small" variant="text" color="primary" @click="currentStep = 3">Edit</VBtn>
                      </VCardTitle>
                      <VDivider />
                      <VCardText class="pa-4">
                        <VRow no-gutters>
                          <VCol cols="12" sm="6" class="mb-3"><div class="sl">Organisation Name</div><div class="sv">{{ registrationData.orgInfo.organizationName }}</div></VCol>
                          <VCol cols="12" sm="6" class="mb-3"><div class="sl">Legal Name</div><div class="sv">{{ registrationData.orgInfo.legalName }}</div></VCol>
                          <VCol cols="12" sm="4" class="mb-3"><div class="sl">Country</div><div class="sv">{{ registrationData.orgInfo.country }}</div></VCol>
                          <VCol cols="12" sm="4" class="mb-3"><div class="sl">Industry</div><div class="sv">{{ registrationData.orgInfo.industry }}</div></VCol>
                          <VCol cols="12" sm="4"><div class="sl">Size</div><div class="sv">{{ registrationData.orgInfo.organizationSize }} employees</div></VCol>
                        </VRow>
                      </VCardText>
                    </VCard>

                    <!-- Administrator -->
                    <VCard variant="outlined" class="mb-4" rounded="lg">
                      <VCardTitle class="summary-card-title">
                        <VIcon icon="ri-shield-user-line" size="16" color="primary" />Administrator<VSpacer />
                        <VBtn size="x-small" variant="text" color="primary" @click="currentStep = 4">Edit</VBtn>
                      </VCardTitle>
                      <VDivider />
                      <VCardText class="pa-4">
                        <VRow no-gutters>
                          <VCol cols="12" sm="6" class="mb-3"><div class="sl">Full Name</div><div class="sv">{{ registrationData.adminInfo.firstName }} {{ registrationData.adminInfo.lastName }}</div></VCol>
                          <VCol cols="12" sm="6" class="mb-3"><div class="sl">Designation</div><div class="sv">{{ registrationData.adminInfo.designation }}</div></VCol>
                          <VCol cols="12" sm="6"><div class="sl">Email</div><div class="sv text-primary">{{ registrationData.adminInfo.email }}</div></VCol>
                          <VCol cols="12" sm="6"><div class="sl">Mobile</div><div class="sv">{{ registrationData.adminInfo.mobile }}</div></VCol>
                        </VRow>
                      </VCardText>
                    </VCard>

                    <!-- Terms -->
                    <VCard variant="outlined" rounded="lg">
                      <VCardText class="pa-4">
                        <VCheckbox density="compact" hide-details color="primary" class="mb-2">
                          <template #label><span class="text-body-2">I agree to the <a href="#" class="text-primary text-decoration-none">Terms of Service</a></span></template>
                        </VCheckbox>
                        <VCheckbox density="compact" hide-details color="primary">
                          <template #label><span class="text-body-2">I agree to the <a href="#" class="text-primary text-decoration-none">Privacy Policy</a></span></template>
                        </VCheckbox>
                      </VCardText>
                    </VCard>
                  </VCol>

                  <!-- Pricing Summary -->
                  <VCol cols="12" md="4">
                    <VCard color="primary" rounded="xl" elevation="3" class="summary-pricing-card">
                      <VCardText class="pa-6">
                        <div class="d-flex align-center gap-2 mb-1">
                          <VIcon icon="ri-receipt-line" size="16" color="white" />
                          <span class="text-subtitle-1 font-weight-bold text-white">Pricing Summary</span>
                        </div>
                        <p class="text-caption mb-6 pr-muted">Estimated monthly cost</p>

                        <div class="d-flex justify-space-between align-center mb-3">
                          <span class="pr-label">{{ selectedPlanObj?.name }} Plan</span>
                          <span class="pr-value">{{ selectedPlanObj?.priceValue ? `$${selectedPlanObj.priceValue}` : 'Free' }}<span v-if="selectedPlanObj?.priceValue" class="pr-unit">/mo</span></span>
                        </div>
                        <div v-for="svc in selectedServiceObjects" :key="svc.id" class="d-flex justify-space-between align-center mb-2">
                          <span class="pr-label">{{ svc.name }}</span>
                          <span class="pr-value">${{ svc.priceValue }}<span class="pr-unit">/mo</span></span>
                        </div>

                        <VDivider class="my-4" color="white" opacity="0.25" />

                        <div class="d-flex justify-space-between align-center">
                          <span class="text-body-1 font-weight-bold text-white">Total</span>
                          <div class="text-end">
                            <div class="text-h5 font-weight-bold text-white">{{ totalMonthly > 0 ? `$${totalMonthly}` : 'Free' }}</div>
                            <div v-if="totalMonthly > 0" class="text-caption pr-muted-alt">per month</div>
                          </div>
                        </div>

                        <VAlert v-if="registrationData.selectedPlan !== 'enterprise'" class="mt-4" type="success" variant="tonal" density="compact" rounded="lg" icon="ri-gift-line">
                          <template #text><span class="text-caption font-weight-medium">30-day free trial · Cancel anytime</span></template>
                        </VAlert>

                        <div class="pricing-trust-row d-flex align-center justify-center gap-3">
                          <div class="d-flex align-center gap-1">
                            <VIcon icon="ri-shield-check-line" size="13" color="white" class="pr-icon-muted" />
                            <span class="text-caption pr-muted">SOC 2</span>
                          </div>
                          <div class="d-flex align-center gap-1">
                            <VIcon icon="ri-lock-line" size="13" color="white" class="pr-icon-muted" />
                            <span class="text-caption pr-muted">256-bit SSL</span>
                          </div>
                          <div class="d-flex align-center gap-1">
                            <VIcon icon="ri-gdpr-line" size="13" color="white" class="pr-icon-muted" />
                            <span class="text-caption pr-muted">GDPR</span>
                          </div>
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </div>
            </VWindowItem>
          </VWindow>
        </div>

        <!-- ======================================================== -->
        <!-- FOOTER – always visible, no scrolling needed (fix #3)     -->
        <!-- ======================================================== -->
        <div class="emc-footer">
          <VBtn
            v-if="currentStep > 0"
            variant="tonal"
            rounded="lg"
            prepend-icon="ri-arrow-left-line"
            @click="prevStep"
          >
            Back
          </VBtn>

          <VSpacer />

          <VBtn
            variant="outlined"
            rounded="lg"
            prepend-icon="ri-save-3-line"
            @click="saveDraft"
          >
            Save Draft
          </VBtn>

          <VBtn
            v-if="!isLastStep"
            color="primary"
            rounded="lg"
            class="ms-3"
            append-icon="ri-arrow-right-line"
            @click="nextStep"
          >
            Continue
          </VBtn>
          <VBtn
            v-else
            color="success"
            rounded="lg"
            class="ms-3"
            prepend-icon="ri-building-2-line"
            :loading="isSubmitting"
            @click="submitRegistration"
          >
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
// ── Page shell ───────────────────────────────────────────────
.emc-page {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  block-size: 100vh;
  background: rgb(var(--v-theme-background));
}

// ── Header ───────────────────────────────────────────────────
.emc-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  block-size: 60px;
  padding-block: 0;
  padding-inline: 24px;
  background: rgb(var(--v-theme-surface));
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 10%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 5%);
}

.emc-logo-pill {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: rgb(var(--v-theme-primary));
  block-size: 36px;
  inline-size: 36px;
}

// Progress bar in header (inline-size replaces width)
.emc-progress-bar {
  inline-size: 120px;
}

// Active-step banner (center of header)
.emc-header__step-banner {
  flex: 1;
  text-align: center;
}

.step-banner-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(var(--v-theme-primary), 25%);
  border-radius: 20px;
  background: rgba(var(--v-theme-primary), 10%);
  padding-block: 3px;
  padding-inline: 6px 14px;
}

.step-banner-number {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  block-size: 24px;
  inline-size: 24px;
  font-size: 11px;
  font-weight: 700;
}

.step-banner-title {
  color: rgb(var(--v-theme-primary));
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.step-banner-desc {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-block: 3px 0;
  margin-inline: 0;
  font-size: 0.75rem;
}

// ── Body ─────────────────────────────────────────────────────
.emc-body {
  display: flex;
  overflow: hidden;
  flex: 1;
  min-block-size: 0;
}

// ── Sidebar ──────────────────────────────────────────────────
.emc-sidebar {
  display: flex;
  overflow-y: auto;
  flex-shrink: 0;
  flex-direction: column;
  border-inline-end: 1px solid rgba(var(--v-theme-on-surface), 10%);
  background: rgba(var(--v-theme-surface-variant), 55%);
  inline-size: 260px;
  padding-block: 16px 0;
  padding-inline: 0;
}

.sidebar-heading {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  padding-block: 0 10px;
  padding-inline: 16px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-steps {
  flex: 1;
}

.sidebar-step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 0;
  cursor: pointer;
  padding-block: 8px;
  padding-inline: 16px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(var(--v-theme-on-surface), 4%);
  }

  &--active {
    border-inline-start: 3px solid rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 8%);
    padding-inline-start: 13px;
  }

  &--done .sidebar-step__dot {
    border-color: rgb(var(--v-theme-success));
    background: rgb(var(--v-theme-success));
  }
}

// dot must appear before the nested modifier overrides
.sidebar-step__dot {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(var(--v-theme-on-surface), 20%);
  border-radius: 50%;
  block-size: 22px;
  inline-size: 22px;
  margin-block-start: 1px;

  .sidebar-step--active & {
    border-color: rgb(var(--v-theme-primary));
    background: rgb(var(--v-theme-primary));
  }
}

.sidebar-step__num {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 10px;
  font-weight: 700;

  .sidebar-step--active & {
    color: rgb(var(--v-theme-on-primary));
  }
}

.sidebar-step__label {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-size: 0.8125rem;
  font-weight: 600;

  .sidebar-step--pending & {
    color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
    font-weight: 400;
  }
}

.sidebar-step__value {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-block-start: 1px;
  font-size: 0.72rem;
  line-height: 1.4;
}

// Pricing block at sidebar bottom
.sidebar-pricing {
  border: 1px solid rgba(var(--v-theme-primary), 20%);
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 8%);
  margin-block: 12px;
  margin-inline: 12px;
  padding-block: 12px;
  padding-inline: 12px;
  font-size: 0.78rem;
}

.sidebar-pricing__title {
  color: rgb(var(--v-theme-primary));
  margin-block-end: 8px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.sidebar-pricing__row {
  display: flex;
  justify-content: space-between;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-block-end: 3px;
}

.sidebar-pricing__total {
  display: flex;
  justify-content: space-between;
  color: rgb(var(--v-theme-primary));
  border-block-start: 1px solid rgba(var(--v-theme-primary), 20%);
  margin-block-start: 8px;
  padding-block-start: 8px;
  font-size: 0.875rem;
  font-weight: 700;
}

// ── Main ─────────────────────────────────────────────────────
.emc-main {
  display: flex;
  overflow: hidden;
  flex: 1;
  flex-direction: column;
  min-inline-size: 0;
}

// Stepper strip
.emc-stepper-wrap {
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
  padding-block: 14px;
  padding-inline: 20px;

  /* stylelint-disable selector-pseudo-class-no-unknown */
  :deep(.stepper-steps-active) {
    .stepper-icon {
      background: rgb(var(--v-theme-primary)) !important;
      color: rgb(var(--v-theme-on-primary)) !important;
      box-shadow: 0 4px 14px rgba(var(--v-theme-primary), 45%) !important;
      transform: scale(1.08);
    }

    .stepper-title {
      color: rgb(var(--v-theme-primary)) !important;
      font-weight: 700 !important;
    }

    .stepper-subtitle {
      color: rgb(var(--v-theme-primary)) !important;
      opacity: 0.8;
    }
  }

  :deep(.stepper-steps-completed) {
    .stepper-icon {
      background: rgba(var(--v-theme-success), 15%) !important;
      color: rgb(var(--v-theme-success)) !important;
    }

    .stepper-title {
      color: rgb(var(--v-theme-success)) !important;
    }
  }

  /* stylelint-enable selector-pseudo-class-no-unknown */
}

// Scrollable step content
.emc-content {
  overflow-y: auto;
  flex: 1;
  min-block-size: 0;
}

// ── Step pane ─────────────────────────────────────────────────
.step-pane {
  padding-block: 28px 16px;
  padding-inline: 28px;
  animation: step-in 0.22s ease;
}

@keyframes step-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-header {
  max-inline-size: 640px;
  margin-block-end: 24px;
}

.step-title {
  margin-block-end: 4px;
  font-size: 1.25rem;
  font-weight: 700;
}

.step-subtitle {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-block: 0;
  margin-inline: 0;
  font-size: 0.9rem;
}

// ── Footer (always visible) ───────────────────────────────────
.emc-footer {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  border-block-start: 1px solid rgba(var(--v-theme-on-surface), 10%);
  background: rgba(var(--v-theme-surface-variant), 55%);
  padding-block: 14px;
  padding-inline: 24px;
}

// ── Selection cards ───────────────────────────────────────────
.sel-card {
  cursor: pointer;
  border-radius: 12px !important;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;

  &:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
    box-shadow: 0 3px 14px rgba(var(--v-theme-primary), 12%);
  }

  &--active {
    border-color: rgb(var(--v-theme-primary)) !important;
    background: rgba(var(--v-theme-primary), 4%) !important;
    box-shadow: 0 4px 16px rgba(var(--v-theme-primary), 18%);
  }
}

// Domain card name (improvement #2)
.domain-card-name {
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
  font-size: 0.9375rem;
  font-weight: 600;
  transition: color 0.18s ease;

  &--selected {
    color: rgb(var(--v-theme-primary));
    font-size: 1.05rem;
    font-weight: 800;
  }
}

.domain-icon-badge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  block-size: 46px;
  inline-size: 46px;
}

.domain-primary {
  background: rgba(var(--v-theme-primary), 12%);
  color: rgb(var(--v-theme-primary));
}

.domain-info {
  background: rgba(var(--v-theme-info), 12%);
  color: rgb(var(--v-theme-info));
}

.domain-warning {
  background: rgba(var(--v-theme-warning), 12%);
  color: rgb(var(--v-theme-warning));
}

.domain-error {
  background: rgba(var(--v-theme-error), 12%);
  color: rgb(var(--v-theme-error));
}

.domain-success {
  background: rgba(var(--v-theme-success), 12%);
  color: rgb(var(--v-theme-success));
}

.icon-badge-neutral {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 10%);
  block-size: 38px;
  inline-size: 38px;
}

// Multi-select checkbox indicator
.multi-select-box {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(var(--v-theme-on-surface), 25%);
  border-radius: 6px;
  block-size: 22px;
  inline-size: 22px;
  transition: all 0.15s ease;

  &--checked {
    border-color: rgb(var(--v-theme-primary));
    background: rgb(var(--v-theme-primary));
  }
}

// ── Plan cards ────────────────────────────────────────────────
.plan-card {
  position: relative;
  cursor: pointer;
  border-radius: 16px !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: rgb(var(--v-theme-primary)) !important;
    box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 14%);
    transform: translateY(-3px);
  }

  &--selected {
    border-color: rgb(var(--v-theme-primary)) !important;
    background: rgba(var(--v-theme-primary), 4%) !important;
    box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 18%);
  }

  &--popular {
    border-color: rgba(var(--v-theme-primary), 40%) !important;
  }
}

.plan-badge {
  position: absolute;
  z-index: 1;
  inset-block-start: -13px;
  inset-inline-start: 50%;
  transform: translateX(-50%);
}

.plan-price {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-block-size: 58px;
}

// ── Service cards ─────────────────────────────────────────────
.service-icon-badge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: rgba(var(--v-theme-primary), 10%);
  block-size: 36px;
  inline-size: 36px;
}

.services-summary {
  border-radius: 12px !important;
}

// ── Summary section ───────────────────────────────────────────
.summary-pricing-card {
  border-radius: 18px !important;
}

.summary-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-block: 12px !important;
  padding-inline: 16px !important;
  font-size: 0.875rem !important;
  font-weight: 600 !important;
}

// Summary label/value
.sl {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sv {
  margin-block-start: 2px;
  font-size: 0.875rem;
  font-weight: 500;
}

// Pricing card text helpers
.pr-label {
  color: rgba(255, 255, 255, 85%);
  font-size: 0.875rem;
}

.pr-value {
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
}

.pr-unit {
  font-size: 0.72rem;
  font-weight: 400;
  opacity: 0.7;
}

.pr-muted {
  color: rgba(255, 255, 255, 70%);
}

.pr-muted-alt {
  color: rgba(255, 255, 255, 65%);
}

.pr-icon-muted {
  opacity: 0.7;
}

.pricing-trust-row {
  border-block-start: 1px solid rgba(255, 255, 255, 18%);
  margin-block-start: 16px;
  padding-block-start: 12px;
}

// ── Transitions ───────────────────────────────────────────────
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
</style>
