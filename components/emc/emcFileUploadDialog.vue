<script setup lang="ts">
import * as XLSX from "xlsx"

const props = defineProps({
  uploadId: String,
  modelValue: Boolean
})

const emit = defineEmits([
  "update:modelValue",
  "applied"
])

const dialog = ref(false)
const file = ref<File | null>(null)
const loading = ref(false)

const previewData = ref<any[]>([])
const headers = ref<any[]>([])

const result = ref<any>(null)
const groupedErrors = ref<any[]>([])

const errorRowSet = ref<Set<number>>(new Set())
const selectedRow = ref<number | null>(null)

watch(() => props.modelValue, val => dialog.value = val)
watch(dialog, val => emit("update:modelValue", val))

// ================= TEMPLATE =================
async function downloadTemplate() {
  const res = await $fetch(`/api/fileUpload/emcDownloadTemplate?uploadId=${props.uploadId}`)

  const ws = XLSX.utils.aoa_to_sheet([res])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Template")

  XLSX.writeFile(wb, `${props.uploadId}_Template.xlsx`)
}

// ================= PARSE FILE =================
async function parseFile(fileInput: File) {
  if (!fileInput) return

  const data = await fileInput.arrayBuffer()
  const workbook = XLSX.read(data)

  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json(sheet)

  previewData.value = json.map((row, index) => ({
    ...row,
    __rowNumber: index + 1
  }))

  headers.value = [
    { title: "Row", key: "__rowNumber", width: 80 },
    ...Object.keys(json[0] || {}).map(key => ({
      title: key,
      key
    }))
  ]

  result.value = null
  groupedErrors.value = []
  errorRowSet.value.clear()
}

// ================= GROUP ERRORS =================
function groupErrors(errors: any[]) {
  const map: Record<number, any> = {}
  const errorRows = new Set<number>()

  for (const err of errors) {
    errorRows.add(err.row)

    if (!map[err.row]) {
      map[err.row] = {
        row: err.row,
        fields: new Set<string>(),
        messages: new Set<string>()
      }
    }

    map[err.row].fields.add(err.field)
    map[err.row].messages.add(`${err.field}: ${err.message}`)
  }

  errorRowSet.value = errorRows

  return Object.values(map).map((r: any) => ({
    row: r.row,
    fields: Array.from(r.fields),
    messages: Array.from(r.messages)
  }))
}

// ================= VALIDATE =================
async function validateOnly() {
  if (!previewData.value.length) return

  loading.value = true

  try {
    const res: any = await $fetch("/api/fileUpload/emcUpload", {
      method: "POST",
      body: {
        uploadId: props.uploadId,
        rows: previewData.value,
        confirm: false
      }
    })

    result.value = res

    groupedErrors.value = res?.errors ? groupErrors(res.errors) : []

  } catch (e: any) {
    result.value = { error: e.message }
  }

  loading.value = false
}

// ================= CONFIRM =================
async function confirmUpload() {
  const res: any = await $fetch("/api/fileUpload/emcUpload", {
    method: "POST",
    body: {
      uploadId: props.uploadId,
      rows: previewData.value,
      confirm: true
    }
  })
  debugger
  // 🔥 ONLY AFTER SUCCESS → SEND DATA BACK
  emit("applied", res?.result?.result?.data || previewData.value)
}

// ================= CLICK ERROR =================
function onErrorRowClick(event: any, row: any) {
  selectedRow.value = row.item.row

  const index = previewData.value.findIndex(
    r => r.__rowNumber === row.item.row
  )

  const table = document.querySelector('.v-data-table')
  if (table && index !== -1) {
    table.scrollTop = index * 48
  }
}

// ================= ROW STYLE =================
function getRowProps(item: any) {
  return {
    class: {
      'error-row': errorRowSet.value.has(item.__rowNumber),
      'selected-row': selectedRow.value === item.__rowNumber
    }
  }
}

onUnmounted(() => {
  resetUpload()
})

// ================= RESET =================
function resetUpload() {
  file.value = null
  previewData.value = []
  headers.value = []
  result.value = null
  groupedErrors.value = []
  errorRowSet.value.clear()
  selectedRow.value = null
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="1100">
    <!-- {{ result }} -->
    <!-- {{ previewData }} -->

    <v-card>

      <!-- TITLE -->
      <v-card-title class="text-h6">
        Upload - {{ props.uploadId }}
      </v-card-title>

      <v-card-text>

        <!-- ACTION BAR -->
        <div class="d-flex align-center gap-4 mb-4">
          <v-file-input v-model="file" label="Upload Excel" accept=".xlsx,.xls" density="compact"
            @update:modelValue="parseFile" style="max-inline-size: 300px;" />

          <v-btn color="primary" :loading="loading" @click="validateOnly" :disabled="!previewData.length">
            Validate
          </v-btn>

          <v-btn color="success" :disabled="groupedErrors.length > 0" @click="confirmUpload">
            Apply
          </v-btn>
        </div>

        <!-- TEMPLATE LINK -->
        <div class="text-caption mb-3">
          Need help?
          <a href="#" @click.prevent="downloadTemplate">
            Download template
          </a>
        </div>

        <!-- PREVIEW -->
        <div v-if="previewData.length">

          <div class="d-flex justify-space-between align-center mb-2">
            <h3 class="text-subtitle-1">Preview</h3>

            <v-btn size="small" variant="text" color="warning" @click="resetUpload">
              Reset
            </v-btn>
          </div>

          <v-data-table :headers="headers" :items="previewData" density="compact" height="300" :item-props="getRowProps"
            class="elevation-1 mb-4" />

        </div>

        <!-- ERROR SECTION -->
        <div v-if="groupedErrors.length">

          <v-alert type="error" class="mb-3">
            {{ groupedErrors.length }} Rows with Errors
          </v-alert>

          <v-data-table :headers="[
            { title: 'Row', key: 'row' },
            { title: 'Fields', key: 'fields' },
            { title: 'Errors', key: 'messages' }
          ]" :items="groupedErrors" density="compact" height="250" class="elevation-1" @click:row="onErrorRowClick">

            <template #item.fields="{ item }">
              <v-chip v-for="f in item.fields" :key="f" size="small" class="ma-1" color="warning" variant="outlined">
                {{ f }}
              </v-chip>
            </template>

            <template #item.messages="{ item }">
              <div v-for="m in item.messages" :key="m">
                • {{ m }}
              </div>
            </template>

          </v-data-table>

        </div>

      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false">Close</v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<style scoped>
.error-row {
  background-color: rgba(255, 0, 0, 8%);
}

.selected-row {
  outline: 2px solid #ff5252;
}
</style>
