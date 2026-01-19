<script setup>
import { userDataInternalstore, userDataStore } from '@/store/userDataStore'
import { VDateInput } from 'vuetify/labs/VDateInput'
// const props = defineProps(['vbind1','FormParameters'])
let lTouched = ref(false) 
const props = defineProps({
  vbind1: {
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
let ldataType1 = groupObject.value.controlProperties.filter(e=>e.propertyTitle === 'DataType')
let RTData = useUpdateObject(muserDataStore.data.FormData.UserEntryObjects, groupObject)

function handleInput(event) {
  debugger
  // clientErrors[groupObject.value.dataPath.replace('FormName.', '')] = []
  // if (RTData === {})
    // RTData = useUpdateObject(muserDataStore.data.FormData.UserEntryObjects, groupObject.value.dataPath)

  const input = event.target.value

  let lCase = groupObject.value.controlProperties.filter(e => e.propertyTitle === 'TextCase')
  if (lCase.length === 0 || lCase === undefined){
    lCase = ''
  } 
  else{
    lCase = lCase[0].data.value}
      if(lCase){
       if(lCase.toUpperCase()==='UPPER')
        RTData.dataValue.value = input.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase();
      if(lCase.toUpperCase()==='LOWER')
        RTData.dataValue.value = input.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase();
      }

      
      if(ldataType1.length > 0){
        let ldataType =  ldataType1[0]
       if(ldataType.toUpperCase()==='TEXTONLY')
        RTData.dataValue.value = input.replace(/[^a-zA-Z ]/g, '').toUpperCase();
      if(ldataType.toUpperCase()==='NUMBERONLY')
        RTData.dataValue.value = input.replace(/[^a-zA-Z ]/g, '').toLowerCase();
      }
    }

const ruleOptions = ref([]) // Parsed rules

onMounted(async() => {
  debugger  
  try {

    if (groupObject.value.rulz !== undefined)
     ruleOptions.value = JSON.parse(groupObject.value.rulz)
  } catch (error) {
    alert(error)
    console.error("Error parsing rules:", error)
  }
  if (inputdata) {
    // muserDataStore = props.inputdata
    // alert(groupObject.value.dataPath)
    // RTData.dataValue.value = getValueByPath(inputdata?.value.data?.FormData?.UserEntryObjects, groupObject.value.dataPath)
  }

  if ((RTData.dataValue.value === undefined || RTData.dataValue.value === '')) lTouched.value = false
  else lTouched.value = true

})

// const dynamicRules = computed(() => {
//   // return props.vbind1.rules?.map(option => {
//   //   try {
//   //     return new Function("value", `return (${option.fn})(value)`)
//   //   } catch (error) {
//   //     console.error("Error evaluating rule function:", error)
//   //     return () => true;
//   //   }
//   // })
//   // alert(groupObject.value.dataPath.replace('FormName.', ''))
//   clientValidate(groupObject.value.dataPath.replace('FormName.', ''))
// })
function localclientValidate() {
  // alert(RTData.dataValue.value)
  if (lTouched.value === false && (RTData.dataValue.value === undefined || RTData.dataValue.value === null))
    return 

  return clientValidate(groupObject.value.dataPath.replace('FormName.', ''))
}

function onFocus() {
  lTouched.value = true
}
let date = ref<Date | null>(null)
</script>

<template>
  <!-- {{ props.groupObject }} -->
  <!-- {{ props.vbind1 }} -->
  <!-- {{ clientErrors }} -->
  <!-- {{ groupObject.dataPath }} -->
  <!-- {{ groupObject }} -->
  <!-- {{ groupObject.componentName }} -->
  <!-- {{ groupObject.dataPath }} -->
  <!-- {{ muserDataStore.data.FormData.UserEntryObjects }} -->
  <VTextField
    v-model="RTData.dataValue.value"
    v-bind="props?.vbind1"
    :style="`background-color: ${props.vbind1?.style['background-color'] && props.vbind1?.style['background-color'] !== '' ? props.vbind1.style['background-color'] : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? props.FormParameters.ColorForMandatory : ''}`"
    :label="props.vbind1?.label ? `${props.vbind1?.label} ${props.FormParameters.Mandatory.value === 'Astrix' ? groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? '*' : '' : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'false' ? '(Opt.)' : ''}`: ''" 
    :class="groupObject.controlProperties.filter(e => e.propertyTitle === 'Align')[0]?.data.value"
    :rules="localclientValidate()"
    :error-messages="clientErrors[groupObject.dataPath.replace('FormName.', '')]"
    @focus="onFocus"
    @input="handleInput"
  />

<!-- <VTextField
  
  label="Date"
  v-maska="'##/##'"
/> -->
  <!-- <VDateInput
                label="Date of birth"
            prepend-icon=""
    v-model="RTData.dataValue.value"
    v-bind="props?.vbind1"
    :style="`background-color: ${props.vbind1?.style['background-color'] && props.vbind1?.style['background-color'] !== '' ? props.vbind1.style['background-color'] : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? props.FormParameters.ColorForMandatory : ''}`"
    :label="props.vbind1?.label ? `${props.vbind1?.label} ${props.FormParameters.Mandatory.value === 'Astrix' ? groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'true' ? '*' : '' : groupObject.controlProperties.filter(e=>e.propertyTitle === 'Mandatory')[0]?.data.value === 'false' ? '(Opt.)' : ''}`: ''" 
    :class="groupObject.controlProperties.filter(e => e.propertyTitle === 'Align')[0]?.data.value"
    :rules="localclientValidate()"
    :error-messages="clientErrors[groupObject.dataPath.replace('FormName.', '')]"
    @focus="onFocus"
    @input="handleInput"

  /> -->


</template>

<style>
.center .v-input__control .v-field__input {
  text-align: center !important;
}

.right .v-input__control .v-field__input {
  text-align: end !important;
}
</style>
