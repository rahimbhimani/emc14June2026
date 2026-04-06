<script setup lang="ts">
import { userDataStore } from '@/store/userDataStore'
import { computed, onMounted, reactive, watch } from 'vue'

/* ================= PROPS ================= */
const props = defineProps({
  vbind1: { type: Object, required: true },
})

const groupObject = defineModel<any>('groupObject')
const inputdata = defineModel<any>('inputdata')

/* ================= STORE ================= */
const muserDataStore =
  props.vbind1.isthisfordialog ? inputdata.value : userDataStore()

/* ================= STATE ================= */
const rateForm = reactive({
  mode: 'Weight',
  basis: 'Slab',
  rates: [] as any[],
})

let idCounter = 1

/* ================= DATE HELPERS ================= */
const todayISO = () => new Date().toISOString().slice(0, 10)
const plusOneMonthISO = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

/* ================= HELPERS ================= */
function getObjectByPath(obj: any, path: string) {
  return path.split('.').reduce((a, k) => a?.[k], obj)
}
function getParentPath(path: string) {
  return path.split('.').slice(0, -1).join('.')
}
function getLastSegment(path: string) {
  return path.split('.').at(-1)!
}

/* ================= INIT ================= */
onMounted(() => {
  if (!groupObject.value?.dataPath) return

  const existing = getObjectByPath(
    muserDataStore.data.FormData.UserEntryObjects,
    groupObject.value.dataPath
  )

  if (existing?.rates) {
    rateForm.mode = existing.mode
    rateForm.basis = existing.basis
    rateForm.rates = existing.rates.map((r: any) => ({
      ...r,
      errors: {},
    }))
    idCounter =
      Math.max(0, ...rateForm.rates.map((r: any) => r.id || 0)) + 1
  }
})

/* ================= STORE SYNC ================= */
watch(
  () => rateForm,
  () => {
    if (!rateForm.rates.length || !groupObject.value?.dataPath) return

    const parent = getObjectByPath(
      muserDataStore.data.FormData.UserEntryObjects,
      getParentPath(groupObject.value.dataPath)
    )

    if (parent) {
      parent[getLastSegment(groupObject.value.dataPath)] =
        JSON.parse(JSON.stringify(rateForm))
    }
  },
  { deep: true }
)

/* ================= BUSINESS VALIDATION ================= */
function validateBusinessRules() {
  // reset business-rule errors
  rateForm.rates.forEach(r => {
    r.errors ||= {}
    delete r.errors.refNo
    delete r.errors.dateFrom
    delete r.errors.dateUntil
    delete r.errors.from
    delete r.errors.to
  })

  /* === RefNo uniqueness === */
  const refMap: Record<string, any[]> = {}
  rateForm.rates.forEach(r => {
    if (!r.refNo) return
    const key = r.refNo.trim().toLowerCase()
    if (!refMap[key]) refMap[key] = []
    refMap[key].push(r)
  })

  Object.values(refMap).forEach(rows => {
    if (rows.length > 1) {
      rows.forEach(r => {
        r.errors.refNo = 'Ref No must be unique'
      })
    }
  })

  /* === Date From must be <= Date Until === */
  rateForm.rates.forEach(r => {
    if (r.dateFrom && r.dateUntil && new Date(r.dateFrom) > new Date(r.dateUntil)) {
      r.errors.dateFrom = 'Date From must be before Date Until'
      r.errors.dateUntil = 'Date Until must be after Date From'
    }
  })

  /* === Date overlap === */
  for (let i = 0; i < rateForm.rates.length; i++) {
    for (let j = i + 1; j < rateForm.rates.length; j++) {
      const a = rateForm.rates[i]
      const b = rateForm.rates[j]

      if (!a.dateFrom || !a.dateUntil || !b.dateFrom || !b.dateUntil) continue

      const overlap =
        new Date(a.dateFrom) <= new Date(b.dateUntil) &&
        new Date(b.dateFrom) <= new Date(a.dateUntil)

      if (overlap) {
        a.errors.dateFrom = 'Date overlaps'
        a.errors.dateUntil = 'Date overlaps'
        b.errors.dateFrom = 'Date overlaps'
        b.errors.dateUntil = 'Date overlaps'
      }
    }
  }

  /* === Weight / Pcs overlap === */
  if (['Slab', 'Range'].includes(rateForm.basis)) {
    for (let i = 0; i < rateForm.rates.length; i++) {
      for (let j = i + 1; j < rateForm.rates.length; j++) {
        const a = rateForm.rates[i]
        const b = rateForm.rates[j]

        if (
          a.from === '' || a.to === '' ||
          b.from === '' || b.to === ''
        ) continue

        const overlap =
          Number(a.from) <= Number(b.to) &&
          Number(b.from) <= Number(a.to)

        if (overlap) {
          a.errors.from = 'Range overlaps'
          a.errors.to = 'Range overlaps'
          b.errors.from = 'Range overlaps'
          b.errors.to = 'Range overlaps'
        }
      }
    }
  }
}

/* ================= ACTIONS ================= */
function addRow() {
  validateBusinessRules()

  const hasErrors = rateForm.rates.some(
    r => r.errors && Object.keys(r.errors).length
  )
  if (hasErrors) return

  rateForm.rates.push({
    id: idCounter++,
    refNo: '',
    from: '',
    to: '',
    weightOrPcs: '',
    rateType: rateForm.mode === 'Weight' ? 'Rate/Wt' : 'Rate/Pcs',
    rate: '',
    dateFrom: todayISO(),
    dateUntil: plusOneMonthISO(),
    errors: {},
  })
}

function removeRow(id: number) {
  rateForm.rates = rateForm.rates.filter(r => r.id !== id)
  validateBusinessRules()   // ✅ revalidate after delete
}

/* ================= UI ================= */
const showFromTo = computed(() =>
  ['Slab', 'Range'].includes(rateForm.basis)
)
const showThreshold = computed(() => rateForm.basis === 'Threshold')

const fromLabel = computed(() =>
  rateForm.mode === 'Weight' ? 'From Wt' : 'From Pcs'
)
const untilLabel = computed(() =>
  rateForm.mode === 'Weight' ? 'Until Wt' : 'Until Pcs'
)
const thresholdLabel = computed(() =>
  rateForm.mode === 'Weight' ? 'Wt' : 'Pcs'
)
</script>

<template>
  <VCard elevation="0" class="pa-2 rate-grid">
    <VRow dense class="mb-1">
      <VCol cols="3">
        <VSelect v-model="rateForm.mode" :items="['Weight','Pieces']" density="compact" />
      </VCol>
      <VCol cols="3">
        <VSelect v-model="rateForm.basis" :items="['Slab','Threshold','Range']" density="compact" />
      </VCol>
      <VSpacer />
      <VBtn size="small" color="primary" @click="addRow">Add</VBtn>
    </VRow>

    <!-- Header Row -->
    <VRow dense class="header-row mb-2">
      <VCol cols="1">Ref</VCol>
      <VCol v-if="showFromTo" cols="1">{{ fromLabel }}</VCol>
      <VCol v-if="showFromTo" cols="1">{{ untilLabel }}</VCol>
      <VCol v-if="showThreshold" cols="1">{{ thresholdLabel }}</VCol>
      <VCol cols="1">Type</VCol>
      <VCol cols="1">Rate</VCol>
      <VCol cols="2">Date From</VCol>
      <VCol cols="2">Date Until</VCol>
      <VCol cols="1"></VCol>
    </VRow>

    <!-- Data Rows -->
    <VRow
      v-for="row in rateForm.rates"
      :key="row.id"
      dense
      class="data-row mb-1"
      :class="{ 'row-error': Object.keys(row.errors).length }"
    >
      <VCol cols="1">
        <VTextField
          v-model="row.refNo"
          density="compact"
          hide-details="auto"
          :error="!!row.errors.refNo"
          :error-messages="row.errors.refNo"
          @blur="validateBusinessRules()"
        />
      </VCol>

      <VCol v-if="showFromTo" cols="1">
        <VTextField
          v-model="row.from"
          density="compact"
          hide-details="auto"
          :error="!!row.errors.from"
          :error-messages="row.errors.from"
          @blur="validateBusinessRules()"
        />
      </VCol>

      <VCol v-if="showFromTo" cols="1">
        <VTextField
          v-model="row.to"
          density="compact"
          hide-details="auto"
          :error="!!row.errors.to"
          :error-messages="row.errors.to"
          @blur="validateBusinessRules()"
        />
      </VCol>

      <VCol v-if="showThreshold" cols="1">
        <VTextField v-model="row.weightOrPcs" density="compact" hide-details />
      </VCol>

      <VCol cols="1">
        <VSelect
          v-model="row.rateType"
          :items="rateForm.mode === 'Weight'
            ? ['Rate/Wt','Flat']
            : ['Rate/Pcs','Flat']"
          density="compact"
          hide-details
        />
      </VCol>

      <VCol cols="1">
        <VTextField v-model="row.rate" density="compact" hide-details />
      </VCol>

      <VCol cols="2">
        <VTextField
          v-model="row.dateFrom"
          type="date"
          density="compact"
          prepend-inner-icon="mdi:calendar"
          hide-details="auto"
          :error="!!row.errors.dateFrom"
          :error-messages="row.errors.dateFrom"
          @blur="validateBusinessRules()"
        />
      </VCol>

      <VCol cols="2">
        <VTextField
          v-model="row.dateUntil"
          type="date"
          density="compact"
          prepend-inner-icon="mdi:calendar"
          hide-details="auto"
          :error="!!row.errors.dateUntil"
          :error-messages="row.errors.dateUntil"
          @blur="validateBusinessRules()"
        />
      </VCol>

      <VCol cols="1" class="d-flex align-center">
        <VBtn
          icon="mdi:delete"
          variant="plain"
          color="error"
          size="small"
          @click="removeRow(row.id)"
        />
      </VCol>
    </VRow>
  </VCard>
</template>

<style scoped>
.tight-table :deep(tbody tr) {
  block-size: 45px;
}

<style scoped > .rate-grid {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.header-row {
  margin: 0 !important;
  background-color: rgba(var(--v-theme-surface), 0.05);
  border-block-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 0.8125rem;
  font-weight: 600;
  padding-block: 6px;
  padding-inline: 12px;
}

.data-row {
  align-items: center;
  border-block-end: 1px solid rgba(var(--v-border-color), 0.1);
  min-block-size: 20px;
}

.data-row.row-error {
  background-color: #ffeaea;
  padding-block: 4px;
  padding-inline: 0;
}
</style>
