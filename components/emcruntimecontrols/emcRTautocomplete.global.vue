<script setup>
import { userDataStore } from '@/store/userDataStore'

// const props = defineProps(['vbind1','FormParameters'])

const props = defineProps({
  vbind1: {
    type: Object,
  },
  FormParameters: {
    type: Object,
  },
})
const groupObject = defineModel('groupObject')
const muserDataStore = userDataStore()

let RTData = useUpdateObject(muserDataStore.data.FormData.UserEntryObjects, groupObject)

function handleInput(event) {
  debugger

  const input = event.target.value

  let lCase = groupObject.value.controlProperties.filter(e => e.propertyTitle === 'TextCase')
  if (lCase.length === 0 || lCase === undefined) {
    lCase = ''
  }
  else {
    lCase = lCase[0].data.value
  }
  if (lCase) {
    if (lCase.toUpperCase() === 'UPPER')
      RTData.dataValue.value = input.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (lCase.toUpperCase() === 'LOWER')
      RTData.dataValue.value = input.replace(/[^a-zA-Z]/g, '').toLowerCase();
  }

  let ldataType1 = groupObject.value.controlProperties.filter(e => e.propertyTitle === 'DataType')
  if (ldataType1.length > 0) {
    let ldataType = ldataType1[0]
    if (ldataType.toUpperCase() === 'TEXTONLY')
      RTData.dataValue.value = input.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (ldataType.toUpperCase() === 'NUMBERONLY')
      RTData.dataValue.value = input.replace(/[^a-zA-Z]/g, '').toLowerCase();
  }
}

const ruleOptions = ref([]) // Parsed rules

onMounted(() => {
  debugger
  try {
    if (groupObject.value.rulz !== undefined)
      ruleOptions.value = JSON.parse(groupObject.value.rulz)

    fetchItems('')
  } catch (error) {
    alert('error')
    console.error("Error parsing rules:", error)
  }
})

const dynamicRules = computed(() => {
  return props.vbind1.rules?.map(option => {
    try {
      return new Function("value", `return (${option.fn})(value)`)
    } catch (error) {
      console.error("Error evaluating rule function:", error)
      return () => true;
    }
  })
})


const search = ref('')
const items = ref([])
const selectedItem = ref(null)
let timeout = null

function onSearch(query) {
  search.value = query
  // Optional: debounce to reduce API calls
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    if (query && query.length >= 1) {
      fetchItems(query)
    } else {
      // items.value = []
    }
  }, 300)
}

async function fetchItems(query) {
  try {
    // Replace this with your actual API URL
    // alert('https://dummyjson.com/products/search?q=' + query)
    debugger
    const res = await useEmcReferenceDataList('RefData', { id: groupObject.value.id, path: groupObject.value.dataPath })
    let responseData = res.value

    // Handle case where response is a stringified JSON
    if (typeof responseData === 'string') {
      try {
        responseData = JSON.parse(responseData)
      } catch (e) {
        console.warn('Could not parse response as JSON string:', e)
        responseData = []
      }
    }

    // Ensure responseData is an array
    if (!Array.isArray(responseData)) {
      responseData = []
    }

    items.value = responseData

    // const res = await fetch('https://dummyjson.com/products/search?q=' + query)
    // const data = await res.json()

    // items.value = data.products

  } catch (error) {
    console.error('Error fetching items:', error)
    items.value = []
  }
}
</script>

<template>
  AUTO
  <!-- {{ groupObject.id }}
{{ items }} -->
  <VAutocomplete v-model="RTData.dataValue.value" v-bind="props?.vbind1"
    :style="`background-color: ${props.vbind1?.style['background-color'] && props.vbind1?.style['background-color'] !== '' ? props.vbind1.style['background-color'] : groupObject.controlProperties.filter(e => e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? props.FormParameters.ColorForMandatory : ''}`"
    :label="props.vbind1?.label ? `${props.vbind1?.label} ${props.FormParameters.Mandatory.value === 'Astrix' ? groupObject.controlProperties.filter(e => e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? '*' : '' : groupObject.controlProperties.filter(e => e.propertyTitle === 'Mandatory')[0]?.data.value === 'false' ? '(Opt.)' : ''}` : ''"
    :class="groupObject.controlProperties.filter(e => e.propertyTitle === 'Align')[0]?.data.value" :rules="dynamicRules"
    @input="handleInput" :items="items" :search="search" item-title="title" item-value="id" return-object clearable
    hide-no-data @update:search="onSearch" hide-details auto-select-first />

  <!-- <v-combobox
          v-model="RTData.dataValue.value"
          :items="items"
          :label="props.vbind1?.label ? `${props.vbind1?.label} ${props.FormParameters.Mandatory.value === 'Astrix' ? groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? '*' : '' : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'false' ? '(Opt.)' : ''}`: ''" 
          multiple
        ></v-combobox> -->
  <!-- {{ RTData.dataValue.value }} -->
</template>

<style>
/* Custom styles for the Vuetify text field with class 'custom-border' */
.custom-border .v-input__control .v-field {
  border: 2px solid #9d735d;
  /* 2px width solid red border */
  border-radius: 62px;
  /* Optional: Add border-radius for rounded corners */
}
</style>
