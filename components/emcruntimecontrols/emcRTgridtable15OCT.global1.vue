  <script setup>
import { VDataTable } from 'vuetify/lib/components/index.mjs';
import { userDataStore } from '@/store/userDataStore'
import { v4 as uuid } from 'uuid'

const showdialog = ref(false)

const props = defineProps({
  vbind1: {
    type: Object,
  },
  FormParameters: {
    type: Object,
  }
})

const muserDataStore = ref(userDataStore())
const groupObject = defineModel('groupObject')

const testitems = [
  {
    id: 1,
    name: {
      first: 'John',
      last: 'Doe',
    },
  },
]

const testheaders = [
  { title: 'First Name', value: 'name.first' },
  { title: 'Last Name', key: 'name.last' },
  {
    title: 'Full Name',
    key: 'fullName',
    value: item => `${item.name.first} ${item.name.last}`,
  },
]

const itemsToDisplay = computed(() => {
  try {
    debugger
    const lPath = groupObject.value.dataPath.substring(groupObject.value.dataPath.indexOf('.') + 1)
    // alert(lPath.split('.').reduce((acc, key) => acc?.[key], muserDataStore.value.data.FormData['UserEntryObjects'].FormName)?.filter(e => e.lifecycleCreatestatus !== 'DEL'))
    if (!muserDataStore.value.data.FormData['UserEntryObjects'].FormName )
      return
    return lPath.split('.').reduce((acc, key) => acc?.[key], muserDataStore.value.data.FormData['UserEntryObjects'].FormName)?.filter(e => e.lifecycleCreatestatus !== 'DEL')
    // return muserDataStore?.value.data?.FormData['UserEntryObjects']?.FormName[lPath] ? muserDataStore?.value.data?.FormData['UserEntryObjects']?.FormName[lPath].filter(e => e.lifecycleCreatestatus !== 'DEL') : []
  } catch (error) {
    // alert('error in itemsToDisplay')
    return []
  }
  
})

function createNestedObject(obj, path) {
  const keys = path.split('.')
  const lastKey = keys.pop()
  let current = obj

  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  // If lastKey doesn't exist or is not an array, make it an array
  if (!Array.isArray(current[lastKey])) {
    current[lastKey] = []
  }

  return current[lastKey]
}

function setValueByPath(obj, path, value, isThisarray = true, rowIndex = null) {

  console.log('setValueByPath', obj, path, value, isThisarray, rowIndex)
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    // Create nested object if not existing
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }

    current = current[key];
  }

  if (!Array.isArray(current[keys[keys.length - 1]]))
    current[keys[keys.length - 1]] = []
  // Set the final value
  isThisarray === true ? current[keys[keys.length - 1]].push(value) : rowIndex === null ? current[keys[keys.length - 1]] = value : current[keys[keys.length - 1]][rowIndex] = value

  console.log('Testing9908', current[keys[keys.length - 1]])
}

function getObjectByPath(obj, path) {
  return path.split('.').reduce((acc, key) => acc && acc[key], obj);
}


function dataToAddEditInGrid(vdata) {
  debugger
  
  let lData = JSON.parse(JSON.stringify(getObjectByPath(vdata, groupObject.value.dataPath)))
  
  console.log('dataToAddEditInGrid', vdata)
  const lPath = groupObject.value.dataPath.substring(groupObject.value.dataPath.indexOf('.') + 1)

// alert(groupObject.value.dataPath)

  let objectToAddTo = createNestedObject(muserDataStore.value.data.FormData['UserEntryObjects'].FormName, lPath)
  if (lData.RowID) {
    const lTemp = lPath.split('.').reduce((acc, key) => acc?.[key], muserDataStore.value.data.FormData['UserEntryObjects'].FormName).findIndex(e=>e.RowID === lData.RowID)
    objectToAddTo[lTemp] = lData
    return
  }
  lData.lifecycleCreatestatus = 'New'
  lData.RowID = uuid()
  // muserDataStore.value.data.FormData['UserEntryObjects'].FormName[lPath].push(vdata)
  setValueByPath(muserDataStore.value.data.FormData['UserEntryObjects'], groupObject.value.dataPath, lData)
  
}

let selectedGridRow = {}

function addNewRecord () {
    // isEditing.value = false
    // record.value = DEFAULT_RECORD
    selectedGridRow = {}
    showdialog.value = true
  }

  function useConfirm(message = 'Are you sure?') {
  return new Promise(resolve => {
    const confirmed = window.confirm(message)
    resolve(confirmed)
  })
}

async function deleteGirdRow (vIndex) {
  // isEditing.value = false
  // record.value = DEFAULT_RECORD
  debugger
  const confirmed = await useConfirm('Delete this item?')
if (confirmed) {
  const lPath = groupObject.value.dataPath.substring(groupObject.value.dataPath.indexOf('.') + 1)
  // const lTemp = muserDataStore.value.data.FormData['UserEntryObjects'].FormName[lPath].findIndex(e => e.RowID === vIndex.RowID)
  let lTemp = lPath.split('.').reduce((acc, key) => acc?.[key], muserDataStore.value.data.FormData['UserEntryObjects'].FormName)
  let lTemp1 = lTemp.findIndex(e => e.RowID === vIndex.RowID)
  if (lTemp[lTemp1].lifecycleCreatestatus === 'New'){
    lTemp.splice(lTemp1,1)

  }
  else
  {
    lTemp[lTemp1].lifecycleCreatestatus = 'DEL'
  }
  // setValueByPath(muserDataStore.value.data.FormData['UserEntryObjects'].FormName, lPath,'DEL', false, vIndex)
  // muserDataStore.value.data.FormData['UserEntryObjects'].FormName[lPath][lTemp].lifecycleCreatestatus = 'DEL'
  // alert(muserDataStore.value.data.FormData['UserEntryObjects'].FormName[lPath][lTemp].lifecycleCreatestatus)
}
  }


function OpenDialogForEdit(vIndex) {
  // alert(vIndex)
  debugger
  const lPath = groupObject.value.dataPath.substring(groupObject.value.dataPath.indexOf('.') + 1)
  // selectedGridRow[lPath] = itemsToDisplay.value[vIndex]
  setValueByPath(selectedGridRow, lPath, itemsToDisplay.value[vIndex], false)
  
  // selectedGridRow[lPath] = itemsToDisplay.value[vIndex] //{ $id: "userDataInternalstore", data: { FormData: { Name: "", DataObject: {}, flattenData: [ {} ], UserEntryObjects: { FormName: { GridTable0: { ColnameWithinGrid: "111", secondcolumn: "2222" } } } } }, _isOptionsAPI: false }
  showdialog.value = true
}

function getValue(item, key) {
  return key.split('.').reduce((acc, part) => acc?.[part], item)
}

</script>

<template>

  <!-- {{ groupObject }} -->
  <!-- <br/> -->
  <!-- <br/> -->
  <!-- {{ showFormattedvalueOnlist }} -->
  <!-- {{ muserDataStore }} -->
  <!-- {{ muserDataStore.data.FormData['UserEntryObjects'].FormName }} -->
   <!-- <br/> -->
  <!-- <br/> -->
  <!-- {{ itemsToDisplay }} -->
    <!-- {{ groupObject }} -->
    <!-- {{ itemsToDisplay }} -->
      <!-- {{ selectedGridRow }} -->
  <VDataTable
    :headers="groupObject.headers"
    :items="itemsToDisplay"
    density="compact"
    flat
    class="gmail-hover-table elevate-7"
  >

<template #top>
  <VToolbar
    flat
    density="compact"
    class="ultra-narrow-toolbar"
  >
    <VToolbarTitle class="text-subtitle-2 font-weight-regular">
      {{ groupObject.controlProperties.find(e => e.propertyTitle === 'HeaderCaption')?.data }}
    </VToolbarTitle>

    <VSpacer />

    <VBtn
      prepend-icon="mdi-plus"
      rounded="lg"
      size="x-small"
      variant="tonal"
      @click="addNewRecord"
    />
  </VToolbar>
</template>


<template #item="{ item, index }">
    <VHover v-slot="{ isHovering, props }">
      <tr v-bind="props" :class="isHovering ? 'rowhighlight' : 'rownormal'">
        <!-- Render all data cells dynamically -->
        <template v-for="header in groupObject.headers" :key="header.key">
          <td>{{ getValue(item, header.key) }}</td>
        </template>

        <!-- Actions cell (always present, but content fades in) -->
        <td class="actions-cell">
          <Transition name="fade">
            <div v-show="isHovering" class="row-actions">
              <VBtn icon size="x-small" color="transparent" @click="OpenDialogForEdit(index)">
                <VIcon>mdi-pencil</VIcon>
              </VBtn>
              <VBtn icon size="x-small" color="transparent" @click="deleteGirdRow(item)">
                <VIcon>mdi-delete</VIcon>
              </VBtn>
            </div>
          </Transition>
        </td>
      </tr>
    </VHover>
  </template>

  <template #bottom />
  </VDataTable>

  <EmcRTdialogbox
    v-model:showdialog="showdialog"
    :group-object="groupObject"
    :FormParameters="props.FormParameters"
    @dataToAddEditInGrid="dataToAddEditInGrid"
    :InputData = "selectedGridRow"
  >
  </EmcRTdialogbox>
</template>

<style scoped>
/* Highlight row on hover */
.actions-cell {
  width: 1%;
  white-space: nowrap;
  position: relative;
}

/* Row actions */
.row-actions {
  display: flex;
  gap: 6px;
  position: absolute;
  right: 8px;              /* 👈 stick to right */
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

/* Show only when hovering */
tr:hover .row-actions {
  opacity: 1;
  transform: translateY(-50%) translateX(0); /* smooth pop in */
}

/* Style for hover buttons */
.row-actions .v-btn {
  background-color: #f1f3f4;   /* Gmail-style light gray */
  border-radius: 50%;
  padding: 4px;
  transition: background-color 0.2s;
}

.row-actions .v-btn:hover {
  background-color: #e0e0e0;   /* darker gray on hover */
}

.ultra-narrow-toolbar {
  min-height: 42px !important;
  height: 42px !important;
  padding: 0 4px !important;
  display: flex !important;        /* force flexbox */
  align-items: center !important;  /* 👈 vertical centering */
}

.ultra-narrow-toolbar .v-toolbar__content {
  min-height: 42px !important;
  height: 42px !important;
  padding: 0 2px !important;
  display: flex !important;
  align-items: center !important;  /* 👈 vertical centering inside */
}

.ultra-narrow-toolbar .v-btn {
  height: 24px !important;
  min-width: 24px !important;
  display: flex !important;
  align-items: center !important;  /* 👈 make icon/text sit in middle */
  justify-content: center !important;
}
</style>
