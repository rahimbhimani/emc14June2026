<script setup lang="ts">
import { userDataStore } from '@/store/userDataStore'
import { inject, ref, watch } from 'vue'

/* -------------------------------------------------
   Props / Injects
------------------------------------------------- */
let lTouched = ref(false)

const props = defineProps({
  vbind1: { type: Object },
  FormParameters: { type: Object },
})

const clientValidate = inject('clientValidate')
const clientErrors = inject('clientErrors')

const groupObject = defineModel('groupObject')
const inputdata = defineModel('inputdata')

// const muserDataStore = props.vbind1?.isthisfordialog
//   ? inputdata.value
//   : userDataStore()

let muserDataStore = props.vbind1?.isthisfordialog ? inputdata.value : userDataStore()

let RTData = useUpdateObject(muserDataStore.data.FormData.UserEntryObjects, groupObject)

// const RTData = useUpdateObject(
//   muserDataStore.data.FormData.UserEntryObjects,
//   groupObject
// )

/* -------------------------------------------------
   State
------------------------------------------------- */
const groupTypes = ['Location', 'SHC', 'Agents']
const groupType = ref('Location')

const apiOptions = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const rows = ref<
  Array<{
    rowId: string
    selectedItem: { id: number | string; code: string } | null
  }>
>([])



/* -------------------------------------------------
   Fetch API data
------------------------------------------------- */
async function fetchOptions(type: string) {
  loading.value = true
  error.value = null

  try {
    const res = await useEmcReferenceDataList('RefGroupData', {
      id: groupObject.value.id,
      path: groupObject.value.dataPath,
      userdata: RTData.dataValue,
      grouptype: type,
    })

    apiOptions.value = res?.value ?? []

  } catch (err) {
    console.error(err)
    error.value = 'Failed to load data'
    apiOptions.value = []
  } finally {
    loading.value = false
  }
}

/* -------------------------------------------------
   Watch group type
------------------------------------------------- */
watch(
  groupType,
  async (newType) => {
    // rows.value = []       // reset rows
    await fetchOptions(newType)
  },
  { immediate: true }
)

onMounted(async () => {
  await fetchOptions("Location")
  // rows.value = RTData.dataValue.value?.rows //|| []
  // rows.value = [ { rowId: "1f90ef72-7827-47e2-8e65-17e380a90212", selectedItem: { id: "68c84689826395702c504086", code: "BOM", name: "BOMBAY", Type: "City" } } ]
  rows.value = RTData.dataValue.value?.rows || []
})

function addRow() {
  rows.value.push({
    rowId: crypto.randomUUID(),
    selectedItem: null,
  })

}

function removeRow(index: number) {
  rows.value.splice(index, 1)
}
</script>

<template>
  <!-- RAHIM
{{rows}} -->
  <!-- {{ apiOptions }} -->
  <!-- {{rows}}
  <hr/>-->
  <!-- {{ RTData }}  -->
  {{ rows }}
  <VCard variant="outlined">
    <VCardTitle class="text-subtitle-3 font-weight-bold">
      {{groupObject.controlProperties.find(e => e.propertyTitle === 'Label').data}}
    </VCardTitle>

    <VCardText>
      <!-- Controls -->
      <VRow>
        <VCol cols="12" md="4">
          <VSelect v-model="groupType" :items="groupTypes" label="Select Type" density="compact" />
        </VCol>

        <VCol cols="12" md="3">
          <VBtn color="primary" type="button" block @click="addRow" :disabled="loading">
            Add Item
          </VBtn>
        </VCol>
      </VRow>

      <!-- Error -->
      <VAlert v-if="error" type="error" variant="tonal" class="mt-3">
        {{ error }}
      </VAlert>

      <!-- Table -->
      <VDataTable class="mt-2 ma-0 pa-0" density="compact" :headers="[
        { title: 'Item', key: 'item' },
        { title: 'Actions', key: 'actions' },
      ]" :items="rows" item-value="rowId" :loading="loading">
        <!-- ✅ CORRECT SLOT USAGE -->
        <!-- {{apiOptions}} -->
        <template #item.item="{ item }">
          <VSelect v-model="item.selectedItem" :items="apiOptions" item-title="code" item-value="id" return-object
            class="mt-1 mb-1 ml-n5" />
        </template>

        <template #item.actions="{ index }">
          <VIcon icon="mdi:delete" color="red" class="cursor-pointer" @click="removeRow(index)" />
        </template>

        <template #no-data>
          <div class="pa-4 text-center text-medium-emphasis">
            Click "Add Item" to add a row
          </div>
        </template>
      </VDataTable>
    </VCardText>
  </VCard>
</template>
