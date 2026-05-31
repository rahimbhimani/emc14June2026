<script setup>
import {
  computed,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  watch,
} from 'vue'

import {
  useUserDataInternalStore,
  userDataStore,
} from '@/store/userDataStore'

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------
const props = defineProps({
  vbind1: Object,
})

// -----------------------------------------------------------------------------
// Validator
// -----------------------------------------------------------------------------
const {
  buildZodSchema,
  validateField,
  validateForm,
  errors,
  clearErrors,
} = useValidator()

// -----------------------------------------------------------------------------
// Models
// -----------------------------------------------------------------------------
// eslint-disable-next-line vue/require-prop-types
const groupObject = defineModel('groupObject')

// -----------------------------------------------------------------------------
// Runtime state
// -----------------------------------------------------------------------------
const FormRTObjects = ref(null)

const loadedComponents = new Set()

const isLoading = ref(false)

const lastLoadedComponent = ref({ type: null, name: null })

const schema = ref({})

const expandedRows = ref([])

const rowMode = reactive({})

const pendingNewItem = ref(null)

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------
const muserDataStore = computed(() => userDataStore())

// Internal runtime objects
// KEEP runtime wrappers here
const mUserDataStoreInternal = ref([])

const internalStore
  = useUserDataInternalStore()

const runtimeObjectKey = computed(
  () => groupObject.value.dataPath,
)

const mUserDataStoreObject = ref(null)

// -----------------------------------------------------------------------------
// Base data
// -----------------------------------------------------------------------------
const basePath = computed(() => {
  return (
    muserDataStore.value?.data?.FormData?.UserEntryObjects || {}
  )
})

// -----------------------------------------------------------------------------
// Runtime settings
// -----------------------------------------------------------------------------
const idPath
  = groupObject.value.controlProperties.find(
    e => e.propertyTitle === 'ListenToAttributeAndPath',
  )?.data

const controlNameSuffix
  = groupObject.value.controlProperties.find(
    e => e.propertyTitle === 'SuffixOfControlName',
  )?.data || ''

const IsThisArrayList
  = groupObject.value.controlProperties.find(
    e => e.propertyTitle === 'IsThisArrayList',
  )?.data === 'true'

watch(
  runtimeObjectKey,
  path => {
    if (!path)
      return

    mUserDataStoreObject.value
      = internalStore.getOrCreateRuntimeObject(path)

    if (
      getNestedValue(
        mUserDataStoreObject.value.data.FormData.UserEntryObjects,
        path,
      ) == null
    ) {
      const initialValue = !IsThisArrayList
        ? (getNestedValue(
          muserDataStore.value?.data?.FormData?.UserEntryObjects,
          path,
        ) || {})
        : {}

      setNestedValue(
        mUserDataStoreObject.value.data.FormData.UserEntryObjects,
        path,
        initialValue,
      )
    }
  },
  {
    immediate: true,
  },
)

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function getNestedValue(obj, path) {
  if (!obj || !path)
    return undefined

  return path
    .split('.')
    .reduce((o, key) => o?.[key], obj)
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.')

  let current = obj

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value
    }
    else {
      if (
        !current[key]
        || typeof current[key] !== 'object'
      )
        current[key] = {}

      current = current[key]
    }
  })
}

const META_KEYS = ['required', 'type', 'min', 'max', 'message', 'ignore']

function buildDefaultFromSchema(schemaDef) {
  if (!schemaDef || typeof schemaDef !== 'object') return null
  const childKeys = Object.keys(schemaDef).filter(k => !META_KEYS.includes(k))
  if (schemaDef.type || childKeys.length === 0) return null
  const result = {}
  for (const key of childKeys) {
    result[key] = buildDefaultFromSchema(schemaDef[key])
  }
  return result
}

onUnmounted(() => {
  if (!IsThisArrayList) {
    unregisterChildValidator?.(groupObject.value.dataPath)
  }
})

// -----------------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------------
onMounted(() => {
  // ARRAY MODE
  if (IsThisArrayList) {
    const existingData
      = getNestedValue(
        muserDataStore.value?.data?.FormData?.UserEntryObjects,
        groupObject.value.dataPath,
      ) || []

    // Convert optimized storage
    // back into runtime wrappers
    mUserDataStoreInternal.value
      = existingData.map(row => {
        const cloned = JSON.parse(JSON.stringify(row))

        const identifier
          = cloned.identifier
          || crypto.randomUUID()

        delete cloned.identifier

        return {

          identifier,

          data: {
            FormData: {
              UserEntryObjects: {
                FormName: cloned,
              },
            },
          },
        }
      })
  }
})

// -----------------------------------------------------------------------------
// Selected value
// -----------------------------------------------------------------------------
const selectedValue = computed(() => {
  return getNestedValue(
    basePath.value,
    idPath,
  )
})

// -----------------------------------------------------------------------------
// Validation provider
// -----------------------------------------------------------------------------
function clientValidate(vControlName) {
  return [
    validateField(
      schema.value,
      vControlName,
    ),
  ]
}

provide('clientErrors', errors)

provide('clientValidate', clientValidate)

// -----------------------------------------------------------------------------
// Validator registry (injected from parent, e.g. emclist)
// -----------------------------------------------------------------------------
const registerChildValidator = inject('registerChildValidator', null)
const unregisterChildValidator = inject('unregisterChildValidator', null)

// -----------------------------------------------------------------------------
// Runtime form loader
// -----------------------------------------------------------------------------
watch(
  selectedValue,

  async (newVal, oldVal) => {
    if (newVal == null || newVal === '')
      return

    const componentType = newVal.ComponentType

    const componentName
      = newVal.ComponentName
      + (controlNameSuffix || '')

    if (!componentType || !componentName)
      return

    const componentKey
      = `${componentType}|${componentName}`

    const isSameComponent
      = lastLoadedComponent.value.type === componentType
      && lastLoadedComponent.value.name === componentName

    if (
      isSameComponent
      && loadedComponents.has(componentKey)
    )
      return

    if (isLoading.value)
      return

    clearErrors()

    expandedRows.value = []

    Object.keys(rowMode).forEach(k => {
      delete rowMode[k]
    })

    pendingNewItem.value = null

    loadedComponents.clear()

    try {
      isLoading.value = true

      loadedComponents.add(componentKey)

      FormRTObjects.value
        = await useEmcGetReferenceControlData(
          'ComponentData',
          {
            ComponentType: componentType,
            ComponentName: componentName,
            IsThisForDesignTime: false,
          },
        )

      schema.value
        = FormRTObjects.value.FormRTObjects.validationSchema
          ? buildZodSchema(
            FormRTObjects.value.FormRTObjects.validationSchema,
          )
          : {}

      if (!IsThisArrayList) {
        const rawSchema = FormRTObjects.value.FormRTObjects.validationSchema
        const dataPath = groupObject.value.dataPath

        // Existing DB data takes priority; otherwise build a null-keyed default from schema.
        const globalData = getNestedValue(
          muserDataStore.value?.data?.FormData?.UserEntryObjects,
          dataPath,
        )

        const initialData
          = globalData && typeof globalData === 'object' && !Array.isArray(globalData)
            ? JSON.parse(JSON.stringify(globalData))
            : (rawSchema ? buildDefaultFromSchema(rawSchema) : {}) ?? {}

        // Write to internal store
        setNestedValue(
          mUserDataStoreObject.value.data.FormData.UserEntryObjects,
          dataPath,
          initialData,
        )

        // Write to global store so the parent sees the correct shape immediately
        setNestedValue(
          muserDataStore.value.data.FormData.UserEntryObjects,
          dataPath,
          JSON.parse(JSON.stringify(initialData)),
        )
      }

      if (!IsThisArrayList) {
        const capturedDataPath = groupObject.value.dataPath
        registerChildValidator?.(
          capturedDataPath,
          FormRTObjects.value.FormRTObjects.validationSchema || null,
          () => {
            // Read from the global store (always in sync via localData watcher).
            // Strip the "FormName." prefix so the path is relative to FormName.
            const schemaRelPath = capturedDataPath.startsWith('FormName.')
              ? capturedDataPath.slice('FormName.'.length)
              : capturedDataPath
            const formData
              = getNestedValue(
                muserDataStore.value?.data?.FormData?.UserEntryObjects?.FormName,
                schemaRelPath,
              ) ?? {}
            return validateForm(schema.value, formData)
          },
        )
      }

      // Remember which component is loaded (used by isSameComponent on next trigger)
      lastLoadedComponent.value = { type: componentType, name: componentName }

      await nextTick()
    }
    catch (err) {
      console.error(
        'Error loading component data:',
        err,
      )

      loadedComponents.delete(componentKey)
    }
    finally {
      isLoading.value = false
    }
  },

  {
    immediate: true,
  },
)

const localData = computed(() =>
  getNestedValue(
    mUserDataStoreObject.value?.data.FormData.UserEntryObjects,
    groupObject.value.dataPath,
  ),
)

watch(
  localData,

  newVal => {
    if (newVal == null || newVal === '')
      return
    if (!IsThisArrayList) {
      setNestedValue(
        muserDataStore.value.data.FormData.UserEntryObjects,
        groupObject.value.dataPath,
        JSON.parse(JSON.stringify(newVal)),
      )
    }
  },
)

// -----------------------------------------------------------------------------
// Sync optimized storage
// -----------------------------------------------------------------------------
function syncToStore() {
  if (IsThisArrayList === false)
    return

  const optimizedArray
    = mUserDataStoreInternal.value.map(item => {
      const formData
        = item?.data?.FormData?.UserEntryObjects?.FormName || {}

      return {

        identifier: item.identifier,

        ...JSON.parse(JSON.stringify(formData)),
      }
    })

  setNestedValue(
    muserDataStore.value.data.FormData.UserEntryObjects,
    groupObject.value.dataPath,
    optimizedArray,
  )
}

// -----------------------------------------------------------------------------
// Create row
// -----------------------------------------------------------------------------
function CreateRow() {
  if (pendingNewItem.value)
    return

  clearErrors()

  pendingNewItem.value = {

    identifier: crypto.randomUUID(),

    data: {
      FormData: {
        UserEntryObjects: {
          FormName: {},
        },
      },
    },
  }
}

// -----------------------------------------------------------------------------
// Save new row
// -----------------------------------------------------------------------------
async function saveNewItem() {
  clearErrors()

  if (schema.value?.safeParse) {
    const formData
      = pendingNewItem.value?.data?.FormData?.UserEntryObjects?.FormName ?? {}

    const success
      = validateForm(
        schema.value,
        formData,
      )

    if (!success) {
      console.warn(
        'Validation failed.',
      )

      return
    }
  }

  mUserDataStoreInternal.value.push(
    JSON.parse(JSON.stringify(pendingNewItem.value)),
  )

  syncToStore()

  pendingNewItem.value = null
}

// -----------------------------------------------------------------------------
// Cancel new row
// -----------------------------------------------------------------------------
function cancelNewItem() {
  pendingNewItem.value = null

  clearErrors()
}

// -----------------------------------------------------------------------------
// Edit row
// -----------------------------------------------------------------------------
function editRow(tableItem) {
  clearErrors()

  const runtimeItem
    = tableItem.runtimeItem

  rowMode[runtimeItem.identifier] = 'edit'

  if (
    !expandedRows.value.includes(
      runtimeItem.identifier,
    )
  ) {
    expandedRows.value = [
      ...expandedRows.value,
      runtimeItem.identifier,
    ]
  }
}

// -----------------------------------------------------------------------------
// View row
// -----------------------------------------------------------------------------
function viewRow(tableItem) {
  clearErrors()

  const runtimeItem
    = tableItem.runtimeItem

  rowMode[runtimeItem.identifier] = 'view'

  if (
    !expandedRows.value.includes(
      runtimeItem.identifier,
    )
  ) {
    expandedRows.value = [
      ...expandedRows.value,
      runtimeItem.identifier,
    ]
  }
}

// -----------------------------------------------------------------------------
// Save edited row
// -----------------------------------------------------------------------------
async function saveVariant(tableItem) {
  clearErrors()

  const item
    = tableItem.runtimeItem

  if (schema.value?.safeParse) {
    const formData
      = item.data?.FormData?.UserEntryObjects?.FormName ?? {}

    const success
      = validateForm(
        schema.value,
        formData,
      )

    if (!success) {
      console.warn(
        'Validation failed.',
      )

      return
    }
  }

  syncToStore()

  expandedRows.value
    = expandedRows.value.filter(
      id => id !== item.identifier,
    )

  delete rowMode[item.identifier]
}

// -----------------------------------------------------------------------------
// Cancel row
// -----------------------------------------------------------------------------
function cancelRow(tableItem) {
  const item
    = tableItem.runtimeItem

  expandedRows.value
    = expandedRows.value.filter(
      id => id !== item.identifier,
    )

  delete rowMode[item.identifier]

  clearErrors()
}

// -----------------------------------------------------------------------------
// Delete row
// -----------------------------------------------------------------------------
async function deleteVariant(tableItem) {
  const item
    = tableItem.runtimeItem

  const index
    = mUserDataStoreInternal.value.findIndex(
      r => r.identifier === item.identifier,
    )

  if (index > -1) {
    mUserDataStoreInternal.value.splice(
      index,
      1,
    )

    syncToStore()

    expandedRows.value
      = expandedRows.value.filter(
        id => id !== item.identifier,
      )

    delete rowMode[item.identifier]

    clearErrors()
  }
}

// -----------------------------------------------------------------------------
// Headers
// -----------------------------------------------------------------------------
const tableHeaders = computed(() => {
  if (!FormRTObjects.value?.ListHeaders)
    return []

  return [

    ...FormRTObjects.value.ListHeaders.map(h => ({

      ...h,

      key: h.key,
    })),

    {
      title: 'Actions',
      key: 'actions',
      sortable: false,
      align: 'end',
      width: '130px',
    },
  ]
})

// -----------------------------------------------------------------------------
// Table items
// -----------------------------------------------------------------------------
const tableItems = computed(() => {
  return mUserDataStoreInternal.value.map(item => {
    const formData
      = item?.data?.FormData?.UserEntryObjects?.FormName || {}

    return {

      ...formData,

      identifier: item.identifier,

      runtimeItem: item,
    }
  })
})

// -----------------------------------------------------------------------------
// Misc
// -----------------------------------------------------------------------------
function getvbind() {
  return {
    ...(props.vbind1 || {}),
    isthisfordialog: props.vbind1?.isthisfordialog ?? 'globeID',
    overwriteDataPath: IsThisArrayList === false ? groupObject.value?.dataPath : null,
  }
}
</script>

<template>
  <!-- {{ FormRTObjects?.FormRTObjects?.validationSchema }} -->
  <!-- {{ props.groupObject.dataPath }} -->
  <!-- {{ errors }} -->
  <!-- {{ mUserDataStoreObject }} -->
  <div v-show="IsThisArrayList === true">
    <!-- Toolbar -->
    <div class="d-flex align-center justify-space-between px-3 py-2">
      <span class="text-body-2 text-medium-emphasis">
        {{ tableItems.length }}
        {{ tableItems.length === 1 ? 'record' : 'records' }}
      </span>

      <VBtn color="primary" size="small" variant="tonal" prepend-icon="mdi:plus" :disabled="!!pendingNewItem"
        @click="CreateRow">
        Add Row
      </VBtn>
    </div>

    <!-- New row -->
    <VCard v-if="pendingNewItem" variant="outlined" class="new-row-card mb-4" rounded="lg">
      <div class="new-row-header px-4 py-3 d-flex align-center gap-2">
        <VIcon size="16" color="primary">
          mdi:plus-circle-outline
        </VIcon>

        <span class="text-body-2 font-weight-semibold text-primary">
          New Row
        </span>
      </div>

      <VDivider />

      <div class="pa-4">
        <EmcRTcontrolwithingroups v-if="FormRTObjects" :group-object="FormRTObjects" :vbind1="getvbind()"
          :inputdata="pendingNewItem" />
      </div>

      <VDivider />

      <div class="d-flex justify-end gap-2 px-4 py-3">
        <VBtn variant="text" size="small" @click="cancelNewItem">
          Cancel
        </VBtn>

        <VBtn color="primary" size="small" variant="flat" @click="saveNewItem">
          Save
        </VBtn>
      </div>
    </VCard>

    <!-- Table -->
    <VDataTable v-if="FormRTObjects?.ListHeaders" v-model:expanded="expandedRows" :headers="tableHeaders"
      :items="tableItems" item-value="identifier" hide-default-footer density="comfortable">
      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="d-flex justify-end">
          <VTooltip text="Edit" location="top">
            <template #activator="{ props: tip }">
              <VBtn v-bind="tip" icon size="x-small" variant="text" color="primary" @click="editRow(item)">
                <VIcon size="16">
                  mdi:pencil
                </VIcon>
              </VBtn>
            </template>
          </VTooltip>

          <VTooltip text="View" location="top">
            <template #activator="{ props: tip }">
              <VBtn v-bind="tip" icon size="x-small" variant="text" color="secondary" @click="viewRow(item)">
                <VIcon size="16">
                  mdi:eye
                </VIcon>
              </VBtn>
            </template>
          </VTooltip>

          <VTooltip text="Delete" location="top">
            <template #activator="{ props: tip }">
              <VBtn v-bind="tip" icon size="x-small" variant="text" color="error" @click="deleteVariant(item)">
                <VIcon size="16">
                  mdi:delete
                </VIcon>
              </VBtn>
            </template>
          </VTooltip>
        </div>
      </template>

      <!-- Expanded row -->
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="pa-0">
            <div class="expanded-row-panel" :class="[
              rowMode[item.identifier] === 'view'
                ? 'mode-view'
                : 'mode-edit',
            ]">
              <div :class="{
                'view-mode':
                  rowMode[item.identifier] === 'view',
              }">
                <EmcRTcontrolwithingroups v-if="FormRTObjects" :group-object="FormRTObjects" :vbind1="getvbind()"
                  :inputdata="item.runtimeItem" />
              </div>

              <div class="d-flex justify-end align-center gap-2 pt-3">
                <VChip v-if="rowMode[item.identifier] === 'view'" size="x-small" color="secondary" variant="tonal">
                  View only
                </VChip>

                <VBtn variant="text" size="small" @click="cancelRow(item)">
                  Cancel
                </VBtn>

                <VBtn v-if="rowMode[item.identifier] === 'edit'" color="primary" size="small" variant="flat"
                  @click="saveVariant(item)">
                  Save
                </VBtn>
              </div>
            </div>
          </td>
        </tr>
      </template>
    </VDataTable>
  </div>

  <!-- NON ARRAY MODE -->
  <div v-show="IsThisArrayList === false">
    <div class="pa-0 ma-0">
      {{ muserDataStore }}
      <EmcRTcontrolwithingroups v-if="FormRTObjects" :group-object="FormRTObjects" :vbind1="getvbind()"
        :inputdata="muserDataStore" />
    </div>
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
