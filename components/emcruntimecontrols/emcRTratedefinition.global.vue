<script setup lang="ts">
import { userDataStore } from '@/store/userDataStore'
import { computed, ref, watch } from 'vue'
import { z } from 'zod'

const props = defineProps({
  vbind1: {
    type: Object,
  },
  groupObject: {
    type: Object,
  },
  FormParameters: {
    type: Object,
  },
  inputdata: {
    type: Object,
  },
})

const clientValidate = inject('clientValidate')
let clientErrors = inject('clientErrors')

// import { getObjectData, setObjectData } from '@/@core/composable/useCommonFunctions'

const groupObject = defineModel('groupObject')
const inputdata = defineModel('inputdata')
let muserDataStore = props.vbind1.isthisfordialog ? inputdata.value : userDataStore()


const rateForm = ref({
  mode: 'Weight',
  basis: 'Slab',
  rates: [] as any[]
})

function getObjectByPath(obj, path) {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}

function getParentPath(path) {
  return path.split('.').slice(0, -1).join('.')
}

function getLastSegment(path) {
  const parts = path.split('.')
  return parts[parts.length - 1]
}

watch(
  () => rateForm.value,
  (newValue, oldValue) => {
    if(rateForm.value.rates.length === 0){
      // Avoid overwriting with empty array
      return
    }
    getObjectByPath(muserDataStore.data.FormData.UserEntryObjects, getParentPath(groupObject.value.dataPath))[getLastSegment(groupObject.value.dataPath)] = newValue
    // muserDataStore.data.FormData.UserEntryObjects.FormName.GrpBxRateDef.RateDefinition = newValue
  },
  { immediate: false, deep: true }
)

onMounted(() => {
  debugger
  try {
    // alert(getParentPath(groupObject.value.dataPath))
    const existingData = getObjectByPath(muserDataStore.data.FormData.UserEntryObjects, groupObject.value.dataPath)
    if (existingData) {
      rateForm.value = JSON.parse(JSON.stringify(existingData))
    } else {
      // Initialize with default structure if no existing data
      rateForm.value = {
        mode: 'Weight',
        basis: 'Threshold',
        rates: []
      }
    }
  } catch (error) {
    console.error('Error initializing rate form:', error)
  }
})


let idCounter = 1



const validationColor = computed(() => {
  switch (hasErrors) {
    case true: return 'error'
    case false : return 'success'
    default: return 'orange'
  }
  return 'error'
})

// Zod schema for mandatory fields
const rowSchema = z.object({
  refNo: z.string().nonempty('Ref No is required'),
  from: z.string().nonempty('From is required'),
  to: z.string().nonempty('To is required'),
  weightOrPcs: z.string().nonempty('Weight/Pcs is required'),
  rateType: z.string().nonempty('Rate Type is required'),
  rate: z.string().nonempty('Rate is required'),
  dateFrom: z.string().nonempty('Date From is required'),
  dateUntil: z.string().nonempty('Date Until is required')
})

// Validate rows and custom rules
const validateRows = () => {
  let hasAnyError = false
  rateForm.value.rates.forEach(r => r.errors = {})

  // Step 1️⃣: Per-row validation (Zod + basic checks)
  rateForm.value.rates.forEach(row => {
    const rowToValidate = {
      refNo: String(row.refNo || ''),
      from: String(row.from || ''),
      to: String(row.to || ''),
      weightOrPcs: String(row.weightOrPcs || ''),
      rateType: String(row.rateType || ''),
      rate: String(row.rate || ''),
      dateFrom: String(row.dateFrom || ''),
      dateUntil: String(row.dateUntil || '')
    }

    try { rowSchema.parse(rowToValidate) } 
    catch (e: any) {
      if (e.errors) e.errors.forEach((err: any) => row.errors[err.path[0]] = err.message)
    }

    // From <= To (for Slab / Range)
    if (['Slab','Range'].includes(rateForm.value.basis) && row.from && row.to && Number(row.from) > Number(row.to)) {
      row.errors.from = 'From should be <= To'
      row.errors.to = 'To should be >= From'
    }

    // Date From <= Date Until
    if (row.dateFrom && row.dateUntil && new Date(row.dateFrom) > new Date(row.dateUntil)) {
      row.errors.dateFrom = 'Date From should be <= Date Until'
      row.errors.dateUntil = 'Date Until should be >= Date From'
    }

    if (Object.keys(row.errors).length > 0) hasAnyError = true
  })

  // Step 2️⃣: Numeric overlaps (for Slab/Range)
  if (['Slab','Range'].includes(rateForm.value.basis)) {
    const sorted = [...rateForm.value.rates].sort((a,b)=>Number(a.from||0)-Number(b.from||0))
    for (let i=0;i<sorted.length-1;i++){
      const c=sorted[i], n=sorted[i+1]
      if (c.to && n.from && Number(c.to) >= Number(n.from)) {
        n.errors.from = 'Overlaps previous row'
        hasAnyError = true
      }
    }
  }

  // Step 3️⃣: Date overlaps (for same weightOrPcs + same basis)
  // Group rows by weightOrPcs and basis
  const grouped: Record<string, any[]> = {}
  for (const row of rateForm.value.rates) {
    const key = `${rateForm.value.basis}_${row.weightOrPcs || 'none'}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(row)
  }

  // For each group, sort and check date overlaps
  Object.values(grouped).forEach(group => {
    const sorted = [...group].sort((a,b)=>new Date(a.dateFrom).getTime()-new Date(b.dateFrom).getTime())
    for (let i=0; i<sorted.length-1; i++) {
      const c = sorted[i], n = sorted[i+1]
      if (c.dateUntil && n.dateFrom && new Date(c.dateUntil) >= new Date(n.dateFrom)) {
        n.errors.dateFrom = 'Date overlaps previous period for same threshold/basis'
        hasAnyError = true
      }
    }
  })

  return hasAnyError
}


const hasErrors = computed(() => rateForm.value.rates.some(r=>r.errors && Object.keys(r.errors).length>0))

const addRow = () => {
  if (hasErrors.value) return
  const defaultRateType = rateForm.value.mode==='Weight'?'Rate/Wt':'Rate/Pcs'
  rateForm.value.rates.push({id:idCounter++, refNo:'', from:'', to:'', weightOrPcs:'', rateType:defaultRateType, rate:'', dateFrom:'', dateUntil:'', errors:{}})
}

const removeRow = (id:number) => { rateForm.value.rates = rateForm.value.rates.filter(r=>r.id!==id) }
const getRowClass = (item:any) => item.errors && Object.keys(item.errors).length>0 ? 'row-error' : ''

watch(()=>rateForm.value.rates.map(r=>({...r})), ()=>validateRows(), {deep:true})

const showFromToColumns = computed(()=>['Slab','Range'].includes(rateForm.value.basis))
const showThresholdColumn = computed(()=>rateForm.value.basis==='Threshold')

const fromLabel = computed(()=>rateForm.value.mode==='Weight'?'From Wt.':'From Pcs.')
const toLabel = computed(()=>rateForm.value.mode==='Weight'?'To Wt.':'To Pcs.')
const getRateTypeOptions = (item:any)=>rateForm.value.mode==='Weight'?['Rate/Wt','Flat']:['Rate/Pcs','Flat']

const headers = computed(()=>{
  const h=[{title:'Ref No', key:'refNo', sticky:true, width:'150px'}]
  if(showFromToColumns.value){ h.push({title:fromLabel.value,key:'from', width:'100px'}); h.push({title:toLabel.value,key:'to', width:'120px'}) }
  if(showThresholdColumn.value) h.push({title:rateForm.value.mode==='Weight'?'Wt.':'Pcs.',key:'weightOrPcs'})
  h.push({title:'Rate Type', key:'rateType', width:'150px'})
  h.push({title:'Rate', key:'rate', width:'120px'})
  h.push({title:'From', key:'dateFrom', sticky:true, width:'170px'})
  h.push({title:'Until', key:'dateUntil', sticky:true, width:'170px'})
  h.push({title:'Actions', key:'actions', sortable:false})
  return h
})

watch(()=>rateForm.value.mode, (newMode)=>{ 
  rateForm.value.rates.forEach(r=>r.rateType=newMode==='Weight'?'Rate/Wt':'Rate/Pcs') 
  })
</script>

<template>
<!-- {{ rateForm }} -->
<!-- {{ rateForm }} -->
<!-- {{ muserDataStore.data.FormData.UserEntryObjects }}  -->
<!-- {{ groupObject.dataPath }} -->
<!-- {{ muserDataStore.data?.FormData.UserEntryObjects.FormName.GrpBxRateDef.RateDefinition }} -->
<VCard elevation="0" class="mt-n5">
<VCardTitle class="d-flex align-center justify-space-between text-h6" >
  <!-- Left Section -->
  <div class="d-flex align-center">
    <VIcon class="mr-2" size="24">mdi-account</VIcon>
    <h5 class="mb-0">Cargo Rate Definition</h5>
  </div>
  <!-- Right Section -->
  <div class="d-flex align-center">
    <VBtn
      color="primary"
      variant="flat"
      size="small"
      class="mr-3"
      small 
      @click="addRow"
    >
      <VIcon start>mdi-plus</VIcon>
      Add Rate Criteria
    </VBtn>

    <VBtn
      variant="tonal"
      size="small"
      @click="validateRows"
      class="d-flex align-center"
    >
      <VIcon
        :color="validationColor"
        class="mr-2"
        size="18"
      >
        mdi-circle
      </VIcon>
      Validate
    </VBtn>
  </div>
</VCardTitle>

<VRow
  class="align-center ml-0 mr-0"
  dense
  style="inline-size: 100%;"
>
  <!-- Icon + Title -->
  <VCol cols="3">
    <VSelect
      v-model="rateForm.mode"
      :items="['Weight', 'Pieces']"
      label="Mode"
      density="compact"
      hide-details
    />
  </VCol>
  <!-- Basis Select -->
  <VCol cols="3">
    <VSelect
      v-model="rateForm.basis"
      :items="['Slab', 'Threshold', 'Range']"
      label="Rate Basis"
      density="compact"
      hide-details
    />
  </VCol>
<VSpacer />
  <!-- Add Row Button -->
<!-- <VCol cols="4" class="d-flex align-center justify-end"> <VBtn color="primary" density="comfortable" small @click="addRow" :disabled="hasErrors">Add Row</VBtn> </VCol> -->
</VRow>
      <div class="table-container ml-1 mr-1">
        <VDataTable
          :headers="headers"
          :items="rateForm.rates"
          item-value="id"
          row-gap="10px"
          column-gap="0"
          density="compact"
          class="ultra-dense-table polished-table"
          :item-class="getRowClass"
        >
          <!-- Ref No -->
          <template #item.refNo="{ item }">
            <VTextField
              v-model="item.refNo"
              label="Ref No"
              density="compact"
              class="ref-input sticky-col"
              :error="!!item.errors?.refNo"
              :error-messages="item.errors?.refNo"
            />
          </template>

          <!-- From / To -->
          <template #item.from="{ item }">
            <VTextField
              v-if="showFromToColumns"
              v-model="item.from"
              :label="fromLabel"
              type="number"
              density="compact"
              class="ultra-small-input"
              :error="!!item.errors?.from"
              :error-messages="item.errors?.from"
            />
          </template>
          <template #item.to="{ item }">
            <VTextField
              v-if="showFromToColumns"
              v-model="item.to"
              :label="toLabel"
              type="number"
              density="compact"
              class="ultra-small-input"
              :error="!!item.errors?.to"
              :error-messages="item.errors?.to"
            />
          </template>

          <!-- Threshold -->
          <template #item.weightOrPcs="{ item }">
            <VTextField
              v-if="showThresholdColumn"
              v-model="item.weightOrPcs"
              :label="rateForm.mode === 'Weight' ? 'Wt.' : 'Pcs.'"
              type="number"
              density="compact"
              class="ultra-small-input"
              :error="!!item.errors?.weightOrPcs"
              :error-messages="item.errors?.weightOrPcs"
            />
          </template>

          <!-- Rate Type -->
          <template #item.rateType="{ item }">
            <VSelect
              v-model="item.rateType"
              :items="getRateTypeOptions(item)"
              label="Rate Type"
              density="compact"
              class="ultra-small-input"
              :error="!!item.errors?.rateType"
              :error-messages="item.errors?.rateType"
            />
          </template>

          <!-- Rate -->
          <template #item.rate="{ item }">
            <VTextField
              v-model="item.rate"
              label="Rate"
              type="number"
              density="compact"
              class="ultra-small-input"
              :error="!!item.errors?.rate"
              :error-messages="item.errors?.rate"
            />
          </template>

          <!-- Dates -->
          <template #item.dateFrom="{ item }">
            <VTextField
              v-model="item.dateFrom"
              type="date"
              label="From"
              density="compact"
              hide-details
              class="date-input sticky-col"
              :error="!!item.errors?.dateFrom"
              :error-messages="item.errors?.dateFrom"
            />
          </template>
          <template #item.dateUntil="{ item }">
            <VTextField
              v-model="item.dateUntil"
              type="date"
              label="Until"
              density="compact"
              hide-details
              class="date-input sticky-col"
              :error="!!item.errors?.dateUntil"
              :error-messages="item.errors?.dateUntil"
            />
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <!-- <VBtn icon="mdi-delete" @click="removeRow(item.id)" /> -->
            <v-btn variant="plain" density="compact" icon="mdi-delete" @click="removeRow(item.id)" color="error"></v-btn>
          </template>
        </VDataTable>
      </div>
    </VCard>

</template>

<style scoped>
/* General Table Container */
.table-container {
  overflow: auto;
  max-block-size: 500px;
}

/* Base spacing inside data table cells */
:deep(.v-data-table__td),
:deep(.v-data-table__th) {
  padding-block: 6px !important;
  padding-inline: 8px !important;        /* Increased padding for breathing space */
  vertical-align: middle !important;
}

/* Add slightly more space between rows */
:deep(.v-data-table__tbody tr) {
  block-size: 38px !important;            /* was 24px */
  transition: background-color 0.2s ease;
}

/* Soft hover highlight */
:deep(.v-data-table__tbody tr:hover) {
  background-color: #f5f9ff !important;
}

/* Subtle separation between rows */
:deep(.v-data-table__tbody tr:not(:last-child)) {
  border-block-end: 1px solid #f0f0f0;
}

/* Sticky columns (Ref No, Date From, Date Until) */
.ref-input.sticky-col,
.date-input.sticky-col {
  position: sticky;
  z-index: 2;
  background-color: #fff;
  box-shadow: 2px 0 3px -2px rgba(0, 0, 0, 20%);
}

/* Adjust sticky column positions */
.ref-input.sticky-col { inset-inline-start: 0; }
.date-input.sticky-col { inset-inline-start: 140px; }

/* Input field sizing inside cells */
.v-data-table .v-input,
.v-data-table .v-select,
.v-data-table .v-text-field,
.v-data-table .v-input__control,
.v-data-table .v-field__input-wrapper,
.v-data-table .v-field__slot {
  padding: 0 !important;
  margin: 0 !important;
  inline-size: 100%;
  min-inline-size: 0 !important;
}

/* Smaller field inputs for a denser look */
.ultra-small-input input {
  block-size: 26px;
  font-size: 0.8rem;
  line-height: 26px;
  padding-block: 2px !important;
  padding-inline: 4px !important;
}

/* Row appearance */
.polished-table {
  border-radius: 8px;
  background-color: #fff;
}

/* Buttons inside table cells */
.v-data-table .v-btn {
  padding: 0;
  block-size: 22px;
  min-inline-size: 22px;
}

/* Highlight rows with validation errors */
.row-error {
  background-color: #ffeaea !important;
}

/* Optional: scrollbars look cleaner */
.table-container::-webkit-scrollbar {
  block-size: 6px;
  inline-size: 6px;
}

.table-container::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: #ccc;
}
</style>
