<script setup>
import { userDataStore } from '@/store/userDataStore'
import { computed, inject, nextTick, onMounted, onUnmounted, ref } from 'vue'

/* =========================
   Props / injections
   ========================= */
const props = defineProps({
  vbind1: { type: Object },
  FormParameters: { type: Object },
})

const clientValidate = inject('clientValidate', () => true)
const clientErrors = inject('clientErrors', ref({}))

const groupObject = defineModel('groupObject')
const inputdata = defineModel('inputdata')

/* =========================
   Store selection
   ========================= */
const muserDataStore = props.vbind1?.isthisfordialog
  ? inputdata.value
  : userDataStore()

/* =========================
   Runtime binding
   ========================= */
const RTData = useUpdateObject(
  muserDataStore?.data?.FormData?.UserEntryObjects,
  groupObject,
)

/* =========================
   State
   ========================= */
const items = ref([])
const search = ref('')
const isFetching = ref(false)
const lTouched = ref(false)

const mObjectType = ref('AutoComplete')
const mObjectMultiselect = ref(false)

const lastFetchedQuery = ref('')

let timeout = null
const stop = null

/* =========================
   Helpers
   ========================= */
const getProp = title =>
  groupObject.value?.controlProperties?.find(
    e => e.propertyTitle === title,
  )

const isMandatory = computed(
  () => getProp('Mandatory')?.data?.value === 'true',
)

const alignClass = computed(
  () => getProp('Align')?.data?.value || '',
)

const isClearable = computed(() => !isMandatory.value)

const bgColor = computed(() => {
  const userBg = props.vbind1?.style?.['background-color']
  if (userBg)
    return userBg
  if (isMandatory.value)
    return props.FormParameters?.ColorForMandatory || ''

  return ''
})

const controlLabel = computed(() => {
  if (!props.vbind1?.label)
    return ''
  const label = props.vbind1.label
  const mode = props.FormParameters?.Mandatory?.value

  return mode === 'Astrix'
    ? isMandatory.value ? `${label} *` : label
    : isMandatory.value ? label : `${label} (Opt.)`
})

/* =========================
   Validation
   ========================= */
function localclientValidate() {
  if (!lTouched.value && (RTData.dataValue.value === undefined || RTData.dataValue.value === null))
    return
  const path = groupObject.value?.dataPath?.replace('FormName.', '')

  return clientValidate(path)
}

/* =========================
   Focus
   ========================= */
function onFocus() {
  lTouched.value = true
}

/* =========================
   Search (SAFE)
   ========================= */
function onSearch(query) {
  if (!query || (!query.trim()) && items.value.length !== 0)
    return
  if (query === lastFetchedQuery.value && items.value.length !== 0)
    return

  search.value = query

  clearTimeout(timeout)
  timeout = setTimeout(() => {
    lastFetchedQuery.value = query
    fetchItems(query)
  }, 300)
}

/* =========================
   Fetch
   ========================= */
async function fetchItems(query) {
  try {
    isFetching.value = true

    const ldata = {
      id: groupObject.value.id,
      path: groupObject.value.dataPath,
    }

    if (query)
      ldata.UserInputData = query

    const res = await useEmcReferenceDataList('RefData', ldata)
    let responseData = res.value || []

    // Handle case where response is a stringified JSON
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData)
      }
      catch (e) {
        console.warn('Could not parse response as JSON string:', e)
        responseData = []
      }
    }

    // Ensure responseData is an array
    if (!Array.isArray(responseData))
      responseData = []

    items.value = responseData

    // Auto-select first ONLY for single-select
    if (!mObjectMultiselect.value && items.value.length === 1)
      RTData.dataValue.value = items.value[0]
  }
  catch (err) {
    console.error('Dropdown fetch error:', err)
    items.value = []
  }
  finally {
    isFetching.value = false
  }
}

/* =========================
   Lifecycle
   ========================= */
onMounted(async () => {
  const typeProp = getProp('Type')
  const multiProp = getProp('Multiselect')

  if (typeProp)
    mObjectType.value = typeProp.data?.value || 'AutoComplete'

  // ✅ Correct multiselect parsing
  if (multiProp) {
    mObjectMultiselect.value
      = String(multiProp.data).toLowerCase() === 'true'
  }
  await nextTick()

  // Preload for non-autocomplete
  if (mObjectType.value !== 'AutoComplete')
    await fetchItems('')
})

onUnmounted(() => {
  if (stop)
    stop()
})
</script>

<template>
  <!-- {{ items }} -->
  <!-- {{ !lTouched }} {{ RTData.dataValue === null }} -->
  <!-- ================= AUTOCOMPLETE ================= -->
  <VAutocomplete v-if="mObjectType === 'AutoComplete'" v-model="RTData.dataValue.value" v-bind="props?.vbind1"
    :items="items" :search="search" item-title="title" item-value="_id" return-object :multiple="mObjectMultiselect"
    :auto-select-first="!mObjectMultiselect" :clearable="isClearable" :label="controlLabel" :class="alignClass"
    :style="`background-color: ${bgColor}`"
    :error-messages="clientErrors[groupObject.dataPath.replace('FormName.', '')]" :rules="localclientValidate()"
    :loading="isFetching" hide-no-data @update:search="onSearch" @focus="onFocus" />

  <!-- ================= COMBOBOX ================= -->
  <VCombobox v-if="mObjectType === 'Combo'" v-model="RTData.dataValue.value" v-bind="props?.vbind1" :items="items"
    :search="search" item-title="title" item-value="_id" return-object :multiple="mObjectMultiselect"
    :auto-select-first="!mObjectMultiselect" :clearable="isClearable" :label="controlLabel" :class="alignClass"
    :style="`background-color: ${bgColor}`"
    :error-messages="clientErrors[groupObject.dataPath.replace('FormName.', '')]" :rules="localclientValidate()"
    :loading="isFetching" hide-no-data @update:search="onSearch" @focus="onFocus" />

  <!-- ================= SELECT ================= -->
  <VSelect v-if="mObjectType === 'Select'" v-model="RTData.dataValue.value" v-bind="props?.vbind1" :items="items"
    item-title="title" item-value="_id" return-object :multiple="mObjectMultiselect" :clearable="isClearable"
    :label="controlLabel" :class="alignClass" :style="`background-color: ${bgColor}`"
    :error-messages="clientErrors[groupObject.dataPath.replace('FormName.', '')]" :rules="localclientValidate()"
    :loading="isFetching" hide-no-data @focus="onFocus" />
</template>

<style>
.custom-border .v-input__control .v-field {
  border: 2px solid #9d735d;
  border-radius: 62px;
}
</style>
