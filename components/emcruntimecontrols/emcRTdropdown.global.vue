<script setup>
import { userDataStore } from '@/store/userDataStore'

// const props = defineProps(['vbind1','FormParameters'])
let lTouched = ref(false) 
const props = defineProps({
  vbind1: {
    type: Object,
  },
  FormParameters: {
    type: Object,
  },
})


// import { getObjectData, setObjectData } from '@/@core/composable/useCommonFunctions'
const clientValidate = inject('clientValidate')
let clientErrors = inject('clientErrors')
const groupObject = defineModel('groupObject')
const inputdata = defineModel('inputdata')
let muserDataStore = props.vbind1.isthisfordialog ? inputdata.value : userDataStore()

let items = ref([])

let RTData = useUpdateObject(muserDataStore.data.FormData.UserEntryObjects, groupObject)

function handleInput(event) {
  debugger

  const input = event.target.value

  let lCase = groupObject.value.controlProperties.filter(e=>e.propertyTitle === 'TextCase')
  if (lCase.length === 0 || lCase === undefined){
    lCase = ''
  } 
  else{
    lCase = lCase[0].data.value}
      if(lCase){
       if(lCase.toUpperCase()==='UPPER')
        RTData.dataValue.value = input.replace(/[^a-zA-Z]/g, '').toUpperCase();
      if(lCase.toUpperCase()==='LOWER')
        RTData.dataValue.value = input.replace(/[^a-zA-Z]/g, '').toLowerCase();
      }

      let ldataType1 = groupObject.value.controlProperties.filter(e=>e.propertyTitle === 'DataType')
      if(ldataType1.length > 0){
        let ldataType =  ldataType1[0]
       if(ldataType.toUpperCase()==='TEXTONLY')
        RTData.dataValue.value = input.replace(/[^a-zA-Z]/g, '').toUpperCase();
      if(ldataType.toUpperCase()==='NUMBERONLY')
        RTData.dataValue.value = input.replace(/[^a-zA-Z]/g, '').toLowerCase();
      }
      localclientValidate()
      // provide('GroupType', 'THIS IS A DUMMY VALUE')
    }

const ruleOptions = ref([]) // Parsed rules
const mObjectType = ref('AutoComplete')
const mObjectMultiselect = ref(true)

onMounted(async () => {
  debugger  
  try {
    if (groupObject.value.controlProperties.filter(e => e.propertyTitle === 'Type')) {
      mObjectType.value = groupObject.value.controlProperties.filter(e => e.propertyTitle === 'Type')[0].data['value']
      mObjectMultiselect.value = groupObject.value.controlProperties.filter(e => e.propertyTitle === 'Multiselect')[0].data ===  "true" ? true : false
    }

    if (groupObject.value.rulz)
      ruleOptions.value = JSON.parse(groupObject.value.rulz)

    if (mObjectType !== 'AutoComplete')
      await fetchItems('')

      debugger
      nextTick()
    // if (groupObject.value.controlProperties.filter(e => e.propertyTitle === 'Mandatory')[0].data.value === "true" & (!muserDataStore.data.FormData.UserEntryObjects.FormName._id || muserDataStore.data.FormData.UserEntryObjects.FormName._id === undefined) && items.value.length > 0){
    //     if(groupObject.value.controlProperties.filter(e => e.propertyTitle === 'Multiselect')[0].data === "true"){
    //       RTData.dataValue.value = [items.value[0]]
    //     }
    //     else{
    //       RTData.dataValue.value = items.value[0]
    //     }
    // }
    const lDefaultValue = groupObject.value.controlProperties.filter(e => e.propertyTitle === 'DefaultValue')[0]?.data
    debugger
    if ((lDefaultValue !== undefined) && (!muserDataStore.data.FormData.UserEntryObjects.FormName._id || muserDataStore.data.FormData.UserEntryObjects.FormName._id === undefined) && items.value?.length > 0) {
        if(groupObject.value.controlProperties.filter(e => e.propertyTitle === 'Multiselect')[0].data === "true"){
          // RTData.dataValue.value = items.value.filter(e=>e.title === lDefaultValue) ? [items.value.filter(e=>e.title === lDefaultValue)[0]] : undefined
          RTData.dataValue.value = items.value.filter(e => e.title.toLowerCase().includes(lDefaultValue.toLowerCase())) ? [items.value.filter(e => e.title.toLowerCase().includes(lDefaultValue.toLowerCase()))[0]] : undefined
        }
        else{
          RTData.dataValue.value = items.value.filter(e => e.title.toLowerCase().includes(lDefaultValue.toLowerCase())) ? items.value.filter(e => e.title.toLowerCase().includes(lDefaultValue.toLowerCase()))[0] : undefined
        }
    }    
      
  } catch (error) {
    alert(error)
    console.error("Error parsing rules:", error)
  }
})

const dynamicRules = computed(() => {
  return props.vbind1?.rules?.map(option => {
    try {
      return new Function("value", `return (${option.fn})(value)`)
    } catch (error) {
      console.error("Error evaluating rule function:", error)
      return () => true;
    }
  })
})


const search = ref('')

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
      items.value = []
    }
  }, 300)
}

async function fetchItems(query) {
  try {
    // return
    // Replace this with your actual API URL
    // alert(query)
    // alert('https://dummyjson.com/products/search?q=' + query)
    // const res = await useEmcReferenceDataList('FormContractType', query)
    // const res = await useEmcReferenceDataList('RefData', { id: groupObject.value.id })
    const res = await useEmcReferenceDataList('RefData', { id: groupObject.value.id, path: groupObject.value.dataPath })
    items.value = res.value //[{ "id": 29, "title": "Juice"}] // data.products

    // const res = await fetch('https://dummyjson.com/products/search?q=' + query)
    // const data = await res.json()

    // items.value = data.products

  } catch (error) {
    console.error('Error fetching items:', error)
    items.value = []
  }
}

function localclientValidate() {
  if (lTouched.value === false && RTData.dataValue.value === null) //(Object.keys(RTData.dataValue.value).length === 0 && RTData.dataValue.value.constructor === Object))
    return

  // alert(groupObject.dataPath?.replace('FormName.', ''))
  return clientValidate(groupObject.value.dataPath?.replace('FormName.', ''))
}

function onFocus() {
  lTouched.value = true
}


// function displayData() {
//   if (RTData.dataValue.value === {})
//     RTData.dataValue.value = null
// }

</script>

<template>
  <!-- {{ groupObject }} -->
  <!-- {{ typeof groupObject.controlProperties.filter(e => e.propertyTitle === 'DefaultValue')[0]?.data }} -->
  <!-- {{ RTData.dataValue.value }}
  {{ items }}
  {{ mObjectType }}
  {{ mObjectMultiselect }}
  {{ ruleOptions }}
  {{ dynamicRules }}
  {{ clientErrors }}
  {{ localclientValidate() }} -->
  <!-- {{ groupObject.controlProperties }} -->
  <!-- {{ mObjectType }} -->
  <!-- {{groupObject}} -->
  <!-- {{groupObject.controlProperties.filter(e => e.propertyTitle === 'Mandatory')[0].data}} -->
  <!-- {{ items }} -->
  <!-- {{ props.vbind1 }} -->
  <!-- {{ RTData.dataValue.value }} -->
  <!-- {{ clientErrors }} -->
  <!-- {{ props.FormParameters }} -->
  <!-- {{ groupObject.id }}
  {{ items }} -->
  <!-- {{mObjectType}} -->
  <!-- RAHIM  
  {{ mObjectType }} -->
  <!-- {{ mObjectMultiselect }}-->
  <!-- {{ mObjectType }}  -->
  <!-- {{ groupObject }} -->

    <!-- {{ groupObject.dataPath }} -->
  <VAutocomplete
    v-if="mObjectType === 'AutoComplete'"
    v-model="RTData.dataValue.value"
    v-bind="props?.vbind1"
    :style="`background-color: ${props.vbind1?.style['background-color'] && props.vbind1?.style['background-color'] !== '' ? props.vbind1.style['background-color'] : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? props.FormParameters.ColorForMandatory : ''}`"
    :label="props.vbind1?.label ? `${props.vbind1?.label} ${props.FormParameters.Mandatory.value === 'Astrix' ? groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? '*' : '' : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'false' ? '(Opt.)' : ''}`: ''" 
    :class="groupObject.controlProperties.filter(e => e.propertyTitle === 'Align')[0]?.data.value"
    :error-messages="clientErrors[groupObject.dataPath.replace('FormName.', '')]"
    @input="handleInput"
    :multiple = "mObjectMultiselect"
    :rules="localclientValidate()"
    :items="items"
    :search="search"
    item-title="title"
    item-value="id"
    return-object
    :clearable ="groupObject.controlProperties.filter(e => e.propertyTitle === 'Mandatory')[0].data.value === 'true' ? false : true"
    hide-no-data
    @update:search="onSearch"
    auto-select-first
    @focus="onFocus"
  />
  
<!-- {{ props.vbind1?.label ? `${props.vbind1?.label} ${props.FormParameters.Mandatory.value === 'Astrix' ? groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? '*' : '' : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'false' ? '(Opt.)' : ''}`: '' }} -->
    <VCombobox
      v-if="mObjectType === 'Combo'"
      v-model="RTData.dataValue.value"
      v-bind="props?.vbind1"
      :style="`background-color: ${props.vbind1?.style['background-color'] && props.vbind1?.style['background-color'] !== '' ? props.vbind1.style['background-color'] : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? props.FormParameters.ColorForMandatory : ''}`"
      :label="props.vbind1?.label ? `${props.vbind1?.label} ${props.FormParameters.Mandatory.value === 'Astrix' ? groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? '*' : '' : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'false' ? '(Opt.)' : ''}`: ''" 
      :class="groupObject.controlProperties.filter(e => e.propertyTitle === 'Align')[0]?.data.value"
      :error-messages="clientErrors[groupObject.dataPath.replace('FormName.', '')]"
      @input="handleInput"
      :multiple = "mObjectMultiselect"
      :rules="localclientValidate()"
      :items="items"
      :search="search"
      item-title="title"
      item-value="id"
      return-object
      :clearable ="groupObject.controlProperties.filter(e => e.propertyTitle === 'Mandatory')[0].data.value === 'true' ? false : true"
      hide-no-data
      @update:search="onSearch"
      @focus="onFocus"  
  />

  <VSelect
      v-if="mObjectType === 'Select'"
      v-model="RTData.dataValue.value"
      v-bind="props?.vbind1"
      :style="`background-color: ${props.vbind1?.style['background-color'] && props.vbind1?.style['background-color'] !== '' ? props.vbind1.style['background-color'] : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? props.FormParameters.ColorForMandatory : ''}`"
      :label="props.vbind1?.label ? `${props.vbind1?.label} ${props.FormParameters.Mandatory.value === 'Astrix' ? groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? '*' : '' : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'false' ? '(Opt.)' : ''}`: ''" 
      :class="groupObject.controlProperties.filter(e => e.propertyTitle === 'Align')[0]?.data.value"
      :error-messages="clientErrors[groupObject.dataPath.replace('FormName.', '')]"
      @input="handleInput"
      :multiple = "mObjectMultiselect"
      :rules="localclientValidate()"
      :items="items"
      :search="search"
      item-title="title"
      item-value="id"
      return-object
      clearable
      hide-no-data
      @update:search="onSearch"
    @focus="onFocus"    
  ></VSelect>

  <!-- {{ RTData.dataValue.value }} -->
</template>

<style>
/* Custom styles for the Vuetify text field with class 'custom-border' */
.custom-border .v-input__control .v-field{
  border: 2px solid #9d735d; /* 2px width solid red border */
  border-radius: 62px; /* Optional: Add border-radius for rounded corners */
}
</style>
