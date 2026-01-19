<script setup lang="ts">
import { computed, ref } from 'vue'

/* ================= TYPES ================= */
type PlanningMode = 'FLIGHT' | 'TROLLEY'
type Step = 'SELECT_MODE' | 'SELECT_FLIGHT' | 'SELECT_TROLLEY' | 'ITEM_LOADING'
type FlightView = 'card' | 'grid'
type TrolleyView = 'card' | 'grid'

interface Flight {
  id: string
  flightNo: string
  route: string
  departure: string
  aircraft: string
  flightDate: string
}

interface Trolley {
  id: string
  code: string
  type: string
  capacity: number
  status: 'READY' | 'IN_USE'
}

/* ================= STATE ================= */
const step = ref<Step>('SELECT_MODE')
const selectedMode = ref<PlanningMode | null>(null)

const selectedFlight = ref<Flight | null>(null)
const selectedTrolley = ref<Trolley | null>(null)

/* Flight UI */
const flightFilter = ref('')
const flightDateFilter = ref(new Date().toISOString().split('T')[0])
const flightView = ref<FlightView>('card')

/* Trolley UI */
const trolleyFilter = ref('')
const trolleyView = ref<TrolleyView>('card')

/* ================= DATA ================= */
const flights: Flight[] = [
  { id: '1', flightNo: 'TK198', route: 'IST → CDG', departure: '10:40', aircraft: 'A320', flightDate: '2026-01-13' },
  { id: '2', flightNo: 'TK205', route: 'IST → AMS', departure: '12:15', aircraft: 'B737', flightDate: '2026-01-13' },
  { id: '3', flightNo: 'TK172', route: 'IST → FRA', departure: '15:00', aircraft: 'A321', flightDate: '2026-01-14' },
]

const trolleys: Trolley[] = [
  { id: 'T1', code: 'TR-ECO-01', type: 'Economy', capacity: 120, status: 'READY' },
  { id: 'T2', code: 'TR-ECO-02', type: 'Economy', capacity: 120, status: 'READY' },
  { id: 'T3', code: 'TR-BUS-01', type: 'Business', capacity: 80, status: 'IN_USE' },
]

/* ================= COMPUTED ================= */
const showLeftPanel = computed(() => step.value !== 'SELECT_MODE')

const activeSection = computed(() =>
  step.value === 'SELECT_FLIGHT'
    ? 'FLIGHT'
    : step.value === 'SELECT_TROLLEY'
    ? 'TROLLEY'
    : null
)

const filteredFlights = computed(() => {
  const q = flightFilter.value.toLowerCase()
  return flights.filter(f => {
    const matchesText =
      !q ||
      f.flightNo.toLowerCase().includes(q) ||
      f.route.toLowerCase().includes(q)

    const matchesDate =
      !flightDateFilter.value || f.flightDate === flightDateFilter.value

    return matchesText && matchesDate
  })
})

const filteredTrolleys = computed(() => {
  const q = trolleyFilter.value.toLowerCase()
  if (!q) return trolleys

  return trolleys.filter(t =>
    t.code.toLowerCase().includes(q) ||
    t.type.toLowerCase().includes(q) ||
    t.status.toLowerCase().includes(q)
  )
})

/* ================= ACTIONS ================= */
const selectMode = (mode: PlanningMode) => {
  selectedMode.value = mode
  step.value = mode === 'FLIGHT' ? 'SELECT_FLIGHT' : 'SELECT_TROLLEY'
}

const selectFlight = (flight: Flight) => {
  selectedFlight.value = flight
  step.value = 'SELECT_TROLLEY'
}

const selectTrolley = (t: Trolley) => {
  if (t.status !== 'READY') return
  selectedTrolley.value = t
  step.value = 'ITEM_LOADING'
}

const resetFlow = () => {
  step.value = 'SELECT_MODE'
  selectedMode.value = null
  selectedFlight.value = null
  selectedTrolley.value = null
  flightFilter.value = ''
  trolleyFilter.value = ''
  flightView.value = 'card'
  trolleyView.value = 'card'
}
</script>

<template>
  <VContainer fluid>
    <VRow>

      <!-- LEFT PANEL -->
      <VCol v-if="showLeftPanel" cols="12" md="3">
        <VCard class="pa-4">
          <div class="text-h6 mb-4">Context</div>

          <VCard class="pa-2 mb-2">
            <strong>Mode</strong><br />{{ selectedMode }}
          </VCard>

          <VCard
            class="pa-2 mb-2"
            :color="activeSection === 'FLIGHT' ? 'primary-lighten-5' : undefined"
          >
            <strong>Flight</strong><br />
            <span v-if="selectedFlight">{{ selectedFlight.flightNo }}</span>
            <em v-else>Selecting…</em>
          </VCard>

          <VCard
            class="pa-2 mb-2"
            :color="activeSection === 'TROLLEY' ? 'primary-lighten-5' : undefined"
          >
            <strong>Trolley</strong><br />
            <span v-if="selectedTrolley">{{ selectedTrolley.code }}</span>
            <em v-else>Selecting…</em>
          </VCard>

          <VBtn block variant="outlined" color="error" @click="resetFlow">
            Change Selection
          </VBtn>
        </VCard>
      </VCol>

      <!-- RIGHT PANEL -->
      <VCol :md="showLeftPanel ? 9 : 12" cols="12">

        <!-- MODE -->
        <VRow v-if="step === 'SELECT_MODE'" justify="center">
          <VCol md="5">
            <VCard class="pa-6" @click="selectMode('FLIGHT')">
              <VIcon size="48" icon="mdi-airplane-takeoff" />
              <div class="text-h6 mt-3">Plan for Flight</div>
            </VCard>
          </VCol>
          <VCol md="5">
            <VCard class="pa-6" @click="selectMode('TROLLEY')">
              <VIcon size="48" icon="mdi-cart-outline" />
              <div class="text-h6 mt-3">Plan for Trolley</div>
            </VCard>
          </VCol>
        </VRow>

        <!-- FLIGHT SELECTION -->
        <template v-if="step === 'SELECT_FLIGHT'">
          <VCard class="mb-4">
            <VCardText>
              <VRow align="center">
                <VCol cols="12" md="4">
                  <VTextField v-model="flightFilter" label="Flight / Route" density="compact" clearable />
                </VCol>
                <VCol cols="12" md="4">
                  <VTextField v-model="flightDateFilter" type="date" label="Flight Date" density="compact" />
                </VCol>
                <VCol cols="12" md="4" class="text-right">
                  <VBtnToggle v-model="flightView" divided density="compact">
                    <VBtn value="card" icon="mdi-view-grid" />
                    <VBtn value="grid" icon="mdi-view-list" />
                  </VBtnToggle>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <VRow v-if="flightView === 'card'">
            <VCol v-for="f in filteredFlights" :key="f.id" md="6" cols="12">
              <VCard class="mb-4" hover @click="selectFlight(f)">
                <VCardText>
                  <div class="text-h6">{{ f.flightNo }}</div>
                  <div>{{ f.route }}</div>
                  <div class="text-caption">{{ f.flightDate }} • {{ f.departure }} • {{ f.aircraft }}</div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <VRow v-else>
            <VCol cols="12">
              <VCard v-for="f in filteredFlights" :key="f.id" class="mb-2" hover @click="selectFlight(f)">
                <VCardText class="d-flex justify-space-between">
                  <strong>{{ f.flightNo }}</strong>
                  <span class="text-caption">{{ f.flightDate }} • {{ f.departure }}</span>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </template>

        <!-- TROLLEY SELECTION -->
        <template v-if="step === 'SELECT_TROLLEY'">
          <VCard class="mb-4">
            <VCardText>
              <VRow align="center">
                <VCol cols="12" md="6">
                  <VTextField v-model="trolleyFilter" label="Filter trolleys" density="compact" clearable />
                </VCol>
                <VCol cols="12" md="6" class="text-right">
                  <VBtnToggle v-model="trolleyView" divided density="compact">
                    <VBtn value="card" icon="mdi-view-grid" />
                    <VBtn value="grid" icon="mdi-view-list" />
                  </VBtnToggle>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <VRow v-if="trolleyView === 'card'">
            <VCol v-for="t in filteredTrolleys" :key="t.id" md="4" cols="12">
              <VCard class="mb-4" :color="t.status === 'READY' ? undefined : 'grey-lighten-3'" @click="selectTrolley(t)">
                <VCardText>
                  <div class="text-h6">{{ t.code }}</div>
                  <div>{{ t.type }}</div>
                  <div class="text-caption">{{ t.capacity }} • {{ t.status }}</div>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <VRow v-else>
            <VCol cols="12">
              <VCard
                v-for="t in filteredTrolleys"
                :key="t.id"
                class="mb-2"
                hover
                @click="selectTrolley(t)"
              >
                <VCardText class="d-flex justify-space-between">
                  <strong>{{ t.code }}</strong>
                  <span class="text-caption">{{ t.type }} • {{ t.status }}</span>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </template>

        <!-- ITEM LOADING -->
        <VAlert v-if="step === 'ITEM_LOADING'" type="info" variant="tonal">
          Item loading for <strong>{{ selectedTrolley?.code }}</strong>
        </VAlert>

      </VCol>
    </VRow>
  </VContainer>
</template>
