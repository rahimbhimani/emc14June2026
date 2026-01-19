<script setup>
import { v4 as uuid } from 'uuid'
import { userDataInternalstore } from '@/store/userDataStore'
const { resolveComponent } = useComponentRegistry()
const props = defineProps({
  modelValue: {
    type: Boolean,
  },
  groupObject: {
    type: Object,
  },
  FormParameters: {
    type: Object,
  },
  InputData:{
    type: Object,
  },
})

const emit = defineEmits(['update:modelValue', 'insertmultipledata'])
// let lshowdialog = ref(false)
let lshowdialog = defineModel('showdialog')
const muserDataStore = userDataInternalstore()

//------

// const lUpdateLocally = ref(false)
// let clientErrors = inject('clientErrors')
// const groupObject = defineModel('groupObject')
// const muserDataStore = lUpdateLocally === false ? userDataInternalstore() : { FormName: { TabRateManagent: { TbRateMgmt: { Reference: null, ContractType: null } } } }
// let items = ref([])

// let RTData = useUpdateObject(lUpdateLocally === false ? muserDataStore.data.FormData.UserEntryObjects : userDataInternalstore , groupObject)


//----


watch(() => props.showdialog, visible => {
  // lshowdialog.value = props.showdialog
  if (visible === true) {
    try {
      // alert('mounted dialog')
      muserDataStore.data.FormData.UserEntryObjects.FormName = JSON.parse(JSON.stringify(props.InputData))
    }
    catch (error) {
      // alert(error)
      console.error('Error parsing rules:', error)
    }
  }})

function getControlObject(vControl) {
  
  
//   if (props.groupObject?.FormRTObjects?.Controls){
//     if (props.groupObject?.FormRTObjects.Controls[0].controlType === 'Component'){
//       const dotIndex = vControl.dataPath.indexOf(".")
// // alert(vControl.dataPath.slice(0, dotIndex + 1) + props.groupObject?.FormRTObjects.Controls[0].ControlName + "." + vControl.dataPath.slice(dotIndex + 1))

//       vControl.dataPath =
//       (dotIndex !== -1
//         ? vControl.dataPath.slice(0, dotIndex + 1) + props.groupObject?.FormRTObjects.Controls[0].ControlName + "." + vControl.dataPath.slice(dotIndex + 1)
//         : vControl.dataPath)}
//       return vControl
//   }
// alert(vControl.dataPath)
    return vControl

  if (vControl.controlType === 'Component') {
    debugger
    vControl.ComponentInfo = vControl.dataPath.replace('FormName.', '') //props.groupObject?.FormRTObjects?.ComponentInfo
  }

  if (props.groupObject?.FormRTObjects?.ComponentInfo)
      vControl.ComponentInfo = props.groupObject?.FormRTObjects?.ComponentInfo

  return vControl
}

function getvbind(ivbind) {
  // props.vbind1.isthisfordialog 
  if (ivbind === undefined)
    return { isthisfordialog: 'globeID' }
  if (ivbind.isthisfordialog)
    return ivbind
  debugger
  console.log('isthisfordialog', ivbind)
  let lvbind = Object.assign(ivbind)
  lvbind.isthisfordialog = 'globeID'
  return lvbind
}

// const { $resolveAndRenderComponent } = useNuxtApp()

// function getControl(vAttribute) {
//   return $resolveAndRenderComponent(vAttribute)
// }

function getCols(vObject) {
  debugger
  let lObj

  lObj = vObject.controlProperties?.filter(e => e.propertyTitle === 'Cols')
  if (lObj === null || lObj === undefined || lObj.length === 0)
    return 12

  // alert(lObj[0].data)

  return lObj[0].data
}

function getDeepestObjectPath(obj, basePath = '') {
  if (typeof obj !== 'object' || obj === null) return ''

  const keys = Object.keys(obj)

  // If this object has no child objects (only primitives), it's a leaf object
  const isLeafObject = keys.every(k => typeof obj[k] !== 'object' || obj[k] === null)

  if (isLeafObject) return basePath

  let deepestPath = basePath

  for (const key of keys) {
    const newPath = basePath ? `${basePath}.${key}` : key
    const result = getDeepestObjectPath(obj[key], newPath)

    if (result.split('.').length > deepestPath.split('.').length) {
      deepestPath = result
    }
  }

  return deepestPath
}

function getValueByPath(obj, path) {
  return path.split('.').reduce((o, key) => o?.[key], obj)
}

function save() {
  debugger
  // alert('rahim')
  // emit('insertmultipledata', { ColnameWithinGrid: 'Fern', light: 'Low', height: '20cm', petFriendly: 'Yes', price: 20, key: 'ColnameWithinGrid' })
  // const path = getDeepestObjectPath(muserDataStore.data.FormData.UserEntryObjects)
 
  emit('dataToAddEditInGrid', muserDataStore.data.FormData.UserEntryObjects)
  lshowdialog.value = false
}

function isEmptyObject(obj) {
  debugger
  return true//Object.keys(obj).length === 0 && obj.constructor === Object
}

function getdataforedit() {
  debugger
  if (muserDataStore.data.FormData.UserEntryObjects.FormName)
    muserDataStore.data.FormData.UserEntryObjects.FormName.GridTable0 = props.InputData

  const ll = { $id: "userDataInternalstore", data: { FormData: { Name: "", DataObject: {}, flattenData: [ {} ], UserEntryObjects: { FormName: { GridTable0: props.InputData } } } }, _isOptionsAPI: false }
  // const ll = { "$id": "userDataInternalstore", "data": { "FormData": { "Name": "", "DataObject": {}, "flattenData": [ {} ], "UserEntryObjects": { "FormName": { "GridTable0": { "ColnameWithinGrid": "qqqqq", "secondcolumn": "rrrrr" } } } } }, "_isOptionsAPI": false }
  return ll
}

</script>

<template>
  <VDialog v-model="lshowdialog" max-width="900px">

    <template #default>
      <VCard>
        <VCardTitle>
          <slot name="title">View Data</slot>
        </VCardTitle>

        <VCardText>
          <slot>
            <VRow>
              <!-- rahim -->
              <!-- {{ muserDataStore.data.FormData.UserEntryObjects }} -->
              <!-- {{ props.InputData }} -->
              <!-- {{ muserDataStore.data.FormData.UserEntryObjects }} -->
                <!-- {{ muserDataStore }} -->
              <VCol
                v-for="(control, index) in props.groupObject.Controls"
                :key="index"
                :cols="getCols(control)"
                style="align-self: flex-start;"
              >
              
                  <!-- <component
                    :is="getControl(control.controlType)"
                    v-model:groupObject="control.Name"
                    v-model:inputdata="muserDataStore"
                    :FormParameters = props.FormParameters
                    :group-object="getControlObject(control)"
                    type="control.Datatype"
                    :vbind1="control.vbind"
                /> -->
                <!-- <component
                    :is="getControl(control.controlType)"
                    v-model:groupObject="control.Name"
                    v-model:inputdata="muserDataStore"
                    :FormParameters = props.FormParameters
                    :group-object="getControlObject(control)"
                    type="control.Datatype"
                    :vbind1="getvbind(control.vbind)"
                /> -->
                <!-- {{ props.groupObject }} -->
                  <!-- {{ muserDataStore }} -->
                <component
                  :is="resolveComponent(control.controlType)"
                  v-model:groupObject="control.Name"
                  v-model:inputdata="muserDataStore"
                  :FormParameters = props.FormParameters
                  :group-object="control"
                  type="control.Datatype"
                  :vbind1="getvbind(control.vbind)"
                />
              </VCol>
            </VRow>
          </slot>
        </VCardText>
        <VDivider />
        <VCardActions class="bg-surface-light">
          <VBtn text="Cancel" variant="plain" @click="lshowdialog = false"/>
          <VSpacer />
          <VBtn text="Save" @click="save"/>
        </VCardActions>
      </VCard>
    </template>
  </VDialog>
</template>
