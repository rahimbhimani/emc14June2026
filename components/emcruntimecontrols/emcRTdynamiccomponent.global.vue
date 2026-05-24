<!-- <script>
// Shared across all instances of this component
const loadedComponents = new Set()
</script> -->

<script setup>
import { userDataStore, useUserDataInternalStore } from '@/store/userDataStore';
import { computed, nextTick, reactive, ref, watch } from 'vue';
const { buildZodSchema, validateField, validateForm, errors, clearErrors } = useValidator()

const props = defineProps({
  vbind1: Object,
  FormParameters: Object,
  watchPath: {
    type: String,
    default: 'FormName.grpVariant.ddProductType1'
  }
})
const loadedComponents = new Set()
const groupObject = defineModel('groupObject')
const inputdata = defineModel('inputdata')

const FormRTObjects = ref(null)

// -----------------------------------------------------------------------------
// Store resolver
// -----------------------------------------------------------------------------


const muserDataStore = computed(() => userDataStore())

let mUserDataStoreObject = useUserDataInternalStore()
let mUserDataStoreInternal = ref([])

// -----------------------------------------------------------------------------
// Base data object
// -----------------------------------------------------------------------------
const basePath = computed(() => {
  return muserDataStore.value?.data?.FormData?.UserEntryObjects || {}
})

// -----------------------------------------------------------------------------
// Path to watch
// -----------------------------------------------------------------------------
// const idPath = computed(() => props.watchPath)
// const idPath = computed(() => "FormName.grpMain.ddProdDetType")
const idPath = groupObject.value.controlProperties.find(e => e.propertyTitle === 'ListenToAttributeAndPath')?.data
const controlNameSuffix = groupObject.value.controlProperties.find(e => e.propertyTitle === 'SuffixOfControlName')?.data || ''
// -----------------------------------------------------------------------------
// Helper
// -----------------------------------------------------------------------------
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined
  return path.split('.').reduce((o, key) => o?.[key], obj)
}

// -----------------------------------------------------------------------------
// Selected value
// -----------------------------------------------------------------------------
const selectedValue = computed(() => {
  return getNestedValue(basePath.value, idPath)
})

// -----------------------------------------------------------------------------
// Prevent duplicate loads within this instance
// -----------------------------------------------------------------------------
const isLoading = ref(false)
const schema = ref({})

// expandedRows drives v-model:expanded on the table (array of identifier strings)
// rowMode tracks whether each open row is 'edit' or 'view'
const expandedRows = ref([])
const rowMode = reactive({})
const pendingNewItem = ref(null)

// Same pattern as emcList:
// - validateField handles Zod schema path navigation via getSchemaAtPath
// - errors (from useValidator) is the single reactive store both validateField
//   and validateForm write into; providing it directly means :error-messages
//   in child textboxes is always in sync without any extra localErrors copy
function clientValidate(vControlName) {
  return [validateField(schema.value, vControlName)]
}

provide('clientErrors', errors)
provide('clientValidate', clientValidate)



watch(
  selectedValue,
  async (newVal, oldVal) => {
    if (newVal == null || newVal === '') return

    const componentType = newVal.ComponentType
    const componentName = newVal.ComponentName + (controlNameSuffix || '')
    if (!componentType || !componentName) return

    // Skip only when the same component type+name is already loaded AND value reference unchanged
    const componentKey = `${componentType}|${componentName}`
    const isSameComponent =
      oldVal?.ComponentType === componentType &&
      oldVal?.ComponentName === componentName

    if (isSameComponent && loadedComponents.has(componentKey)) return

    if (isLoading.value) return

    // Reset all state for the incoming product type
    clearErrors()
    expandedRows.value = []
    Object.keys(rowMode).forEach(k => delete rowMode[k])
    pendingNewItem.value = null
    mUserDataStoreInternal.value = []
    loadedComponents.clear()

    try {
      isLoading.value = true
      loadedComponents.add(componentKey)

      FormRTObjects.value = await useEmcGetReferenceControlData(
        'ComponentData',
        {
          ComponentType: componentType,
          ComponentName: componentName,
          IsThisForDesignTime: false
        }
      )
      console.log('FormRTObjects loaded:', FormRTObjects.value)
      schema.value = FormRTObjects.value.FormRTObjects.validationSchema
        ? buildZodSchema(FormRTObjects.value.FormRTObjects.validationSchema)
        : {}

      await nextTick()
    } catch (err) {
      console.error('Error loading component data:', err)
      loadedComponents.delete(componentKey)
    } finally {
      isLoading.value = false
    }
  },
  {
    immediate: true
  }
)

// const headers = [
//   { width: 300, title: 'Title', key: 'title', align: 'start', sortable: true },
//   { width: 250, title: 'Director', key: 'director' },
//   { width: 150, title: 'Genre', key: 'genre' },
//   { width: 100, title: 'Year', key: 'year', align: 'end' },
//   { width: 140, title: 'Runtime(min)', key: 'runtime', align: 'end' },
//   { width: 1, key: 'data-table-expand', align: 'end' }, // optional, to keep it as short as possible
// ]

// const movies = [
//   {
//     title: 'The Shawshank Redemption',
//     director: 'Frank Darabont',
//     genre: 'Drama',
//     year: 1994,
//     runtime: 142,
//     details: {
//       synopsis: 'Two imprisoned men bond over years, finding solace and redemption through acts of decency.',
//       cast: ['Tim Robbins', 'Morgan Freeman'],
//       rating: 3.5,
//     },
//   },
//   {
//     title: 'Inception',
//     director: 'Christopher Nolan',
//     genre: 'Sci-Fi',
//     year: 2010,
//     runtime: 148,
//     details: {
//       synopsis: 'A thief with the ability to enter dreams is tasked with stealing a secret from the subconscious.',
//       cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt'],
//       rating: 5,
//     },
//   },
//   {
//     title: 'The Godfather',
//     director: 'Francis Ford Coppola',
//     genre: 'Crime',
//     year: 1972,
//     runtime: 175,
//     details: {
//       synopsis: 'The aging patriarch of a crime dynasty transfers control to his reluctant son.',
//       cast: ['Marlon Brando', 'Al Pacino'],
//       rating: 4.5,
//     },
//   },
//   {
//     title: 'Pulp Fiction',
//     director: 'Quentin Tarantino',
//     genre: 'Crime',
//     year: 1994,
//     runtime: 154,
//     details: {
//       synopsis: 'Interwoven stories of criminals, violence, and redemption in Los Angeles.',
//       cast: ['John Travolta', 'Samuel L. Jackson'],
//       rating: 4.5,
//     },
//   },
//   {
//     title: 'The Dark Knight',
//     director: 'Christopher Nolan',
//     genre: 'Action',
//     year: 2008,
//     runtime: 152,
//     details: {
//       synopsis: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
//       cast: ['Christian Bale', 'Heath Ledger'],
//       rating: 4,
//     },
//   },
// ]

// Creates VDataTable headers from your runtime control definition.
// Header text is taken from vbind.label (preferred) or the "Label"
// property in controlProperties. The value is derived from dataPath.
//
// Example usage:
// const headers = buildHeadersFromForm(FormRTObjects)
//
// Result for your uploaded object: SKU, Color, Size, Fit, Price
// :contentReference[oaicite:0]{index=0}

// Build VDataTable headers from the actual runtime form object.
// Priority:
// 1. Use FormParameters.ListHeaders if available.
// 2. Otherwise, scan FormRTObjects.Controls and include only controls
//    where "show in List" = true.
// :contentReference[oaicite:0]{index=0}

function CreateRow() {
  if (pendingNewItem.value) return
  clearErrors()
  pendingNewItem.value = mUserDataStoreObject.getOrCreateItem()
}

async function saveNewItem() {
  clearErrors()

  if (schema.value?.safeParse) {
    const formData = pendingNewItem.value?.data?.FormData?.UserEntryObjects?.FormName ?? {}
    const success = validateForm(schema.value, formData)
    if (!success) {
      console.warn('Validation failed. Cannot save.')
      return
    }
  }

  clearErrors()
  mUserDataStoreInternal.value.push(pendingNewItem.value)
  pendingNewItem.value = null
}

function cancelNewItem() {
  pendingNewItem.value = null
  clearErrors()
}

function editRow(item) {
  clearErrors()
  rowMode[item.identifier] = 'edit'
  if (!expandedRows.value.includes(item.identifier))
    expandedRows.value = [...expandedRows.value, item.identifier]
}

function viewRow(item) {
  clearErrors()
  rowMode[item.identifier] = 'view'
  if (!expandedRows.value.includes(item.identifier))
    expandedRows.value = [...expandedRows.value, item.identifier]
}

async function saveVariant(item) {
  clearErrors()

  if (schema.value?.safeParse) {
    const formData = item.data?.FormData?.UserEntryObjects?.FormName ?? {}
    const success = validateForm(schema.value, formData)
    if (!success) {
      console.warn('Validation failed. Cannot save.')
      return
    }
  }

  clearErrors()
  expandedRows.value = expandedRows.value.filter(id => id !== item.identifier)
  delete rowMode[item.identifier]
  console.log('Row saved successfully', item)
}

function cancelRow(item) {
  expandedRows.value = expandedRows.value.filter(id => id !== item.identifier)
  delete rowMode[item.identifier]
  clearErrors()
}

async function deleteVariant(item) {
  const index = mUserDataStoreInternal.value.findIndex(r => r.identifier === item.identifier)
  if (index > -1) {
    mUserDataStoreInternal.value.splice(index, 1)
    expandedRows.value = expandedRows.value.filter(id => id !== item.identifier)
    delete rowMode[item.identifier]
    clearErrors()
  }
}

function buildListHeaders(formDefinition) {
  // ------------------------------------------------------------
  // 1. If explicit ListHeaders are defined, use them directly
  // ------------------------------------------------------------
  if (
    Array.isArray(formDefinition?.ListHeaders) &&
    formDefinition.ListHeaders.length > 0
  ) {
    return formDefinition.ListHeaders.map((header) => ({
      title: header.title,
      key: header.key,
      value: header.key, // compatibility
      width: header.width ? `${header.width}%` : undefined,
      sortable: false,
      align: 'start'
    }))
  }

  // ------------------------------------------------------------
  // 2. Otherwise build from FormRTObjects.Controls
  // ------------------------------------------------------------
  const controls = formDefinition?.FormRTObjects?.Controls || []

  const getProp = (control, propertyTitle) => {
    return control.controlProperties?.find(
      (p) => p.propertyTitle === propertyTitle
    )?.data
  }

  return controls
    .filter((control) => {
      const showInList = getProp(control, 'show in List')
      return String(showInList).toLowerCase() === 'true'
    })
    .sort((a, b) => {
      const seqA = Number(getProp(a, 'Column Sequence') || 9999)
      const seqB = Number(getProp(b, 'Column Sequence') || 9999)
      return seqA - seqB
    })
    .map((control) => {
      const title =
        getProp(control, 'Title') ||
        control.vbind?.label ||
        control.ControlName

      const key =
        getProp(control, 'Key') ||
        control.dataPath?.split('.').pop() ||
        control.ControlName

      const width = getProp(control, 'Column Size')

      return {
        title,
        key,
        value: key, // compatibility
        width: width ? `${width}%` : undefined,
        sortable: false,
        align: 'start'
      }
    })
}

function getvbind() {
  return {
    isthisfordialog: 'globeID'
  }
}

const tableHeaders = computed(() => {
  if (!FormRTObjects.value?.ListHeaders) return []
  return [
    ...FormRTObjects.value.ListHeaders.map((h) => ({
      ...h,
      key: `data.FormData.UserEntryObjects.FormName.${h.key}`
    })),
    { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: '130px' }
  ]
})

const tableItems = computed(() => {
  return mUserDataStoreInternal.value
    .map(item => {
      const userEntryObjects =
        item?.data?.FormData?.UserEntryObjects || {}
      // Get the first object inside UserEntryObjects
      // const firstKey = Object.keys(userEntryObjects)[0]
      // const rowData = firstKey
      //   ? userEntryObjects[firstKey]
      //   : null

      // // If there is no data, do not return this row
      // if (!rowData || Object.keys(rowData).length === 0) {
      //   return null
      // }

      return {
        identifier: item.identifier,
        ...item,
        _original: structuredClone(toRaw(item))
      }
    })
    .filter(Boolean) // Remove null rows
})


</script>



<template>
  <div>
    {{ controlNameSuffix }}
    <!-- {{ muserDataStore }} -->
    <!-- {{ FormRTObjects.ListHeaders }} -->
    <!-- {{ schema }} -->
    <!-- {{ pendingNewItem?.data?.FormData?.UserEntryObjects?.FormName }} -->
    <!-- Toolbar -->
    <div class="d-flex align-center justify-space-between px-3 py-2">
      <span class="text-body-2 text-medium-emphasis">
        {{ tableItems.length }} {{ tableItems.length === 1 ? 'record' : 'records' }}
      </span>
      <v-btn color="primary" size="small" variant="tonal" prepend-icon="mdi:plus" :disabled="!!pendingNewItem"
        @click="CreateRow()">
        Add Row
      </v-btn>
    </div>

    <!-- New row form panel -->
    <v-card v-if="pendingNewItem" variant="outlined" class="new-row-card mb-4" rounded="lg">
      <div class="new-row-header px-4 py-3 d-flex align-center gap-2">
        <v-icon size="16" color="primary">mdi:plus-circle-outline</v-icon>
        <span class="text-body-2 font-weight-semibold text-primary">New Row</span>
      </div>
      <v-divider />
      <div class="pa-4">
        <EmcRTcontrolwithingroups v-if="FormRTObjects" :group-object="FormRTObjects" :vbind1="getvbind()"
          :inputdata="pendingNewItem" />
      </div>
      <v-divider />
      <div class="d-flex justify-end gap-2 px-4 py-3">
        <v-btn variant="text" size="small" @click="cancelNewItem()">Cancel</v-btn>
        <v-btn color="primary" size="small" variant="flat" @click="saveNewItem()">Save</v-btn>
      </div>
    </v-card>
    <!-- {{ tableItems }}
    -----
    {{ tableHeaders }} -->
    <!-- Data table -->
    <v-data-table v-if="FormRTObjects?.ListHeaders" :headers="tableHeaders" :items="tableItems" item-value="identifier"
      v-model:expanded="expandedRows" hide-default-footer density="comfortable">

      <!-- Row action buttons -->
      <template #item.actions="{ item }">
        <div class="d-flex justify-end">
          <v-tooltip text="Edit" location="top">
            <template #activator="{ props: tip }">
              <v-btn v-bind="tip" icon size="x-small" variant="text" color="primary" @click="editRow(item)">
                <v-icon size="16">mdi:pencil</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="View" location="top">
            <template #activator="{ props: tip }">
              <v-btn v-bind="tip" icon size="x-small" variant="text" color="secondary" @click="viewRow(item)">
                <v-icon size="16">mdi:eye</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="Delete" location="top">
            <template #activator="{ props: tip }">
              <v-btn v-bind="tip" icon size="x-small" variant="text" color="error" @click="deleteVariant(item)">
                <v-icon size="16">mdi:delete</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </template>

      <!-- Expanded row -->
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-0">
            <div :class="['expanded-row-panel', rowMode[item.identifier] === 'view' ? 'mode-view' : 'mode-edit']">
              <div :class="{ 'view-mode': rowMode[item.identifier] === 'view' }">
                <EmcRTcontrolwithingroups v-if="FormRTObjects" :group-object="FormRTObjects" :vbind1="getvbind()"
                  :inputdata="item" />
              </div>
              <div class="d-flex justify-end align-center gap-2 pt-3">
                <v-chip v-if="rowMode[item.identifier] === 'view'" size="x-small" color="secondary" variant="tonal">
                  View only
                </v-chip>
                <v-btn variant="text" size="small" @click="cancelRow(item)">Cancel</v-btn>
                <v-btn v-if="rowMode[item.identifier] === 'edit'" color="primary" size="small" variant="flat"
                  @click="saveVariant(item)">Save</v-btn>
              </div>
            </div>
          </td>
        </tr>
      </template>

    </v-data-table>
  </div>
</template>

<style scoped>
.new-row-card {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.new-row-header {
  background: rgba(var(--v-theme-primary), 0.06);
}

.expanded-row-panel {
  padding: 16px;
  border-inline-start: 3px solid transparent;
}

.expanded-row-panel.mode-edit {
  background: rgba(var(--v-theme-primary), 0.03);
  border-inline-start-color: rgb(var(--v-theme-primary));
}

.expanded-row-panel.mode-view {
  background: rgba(var(--v-theme-secondary), 0.03);
  border-inline-start-color: rgb(var(--v-theme-secondary));
}

.view-mode {
  opacity: 0.7;
  pointer-events: none;
  user-select: none;
}
</style>
