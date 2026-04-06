<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"

const props = defineProps({
  master: { type: Object, required: true },
  containerType: { type: String, required: true },
  actionId: { type: String, required: true },
  actionConfig: { type: Object, default: () => ({}) }
})

function handleUploadApplied(data: any) {
  if (!currentUploadType.value) return
  alert("Data applied from upload: " + JSON.stringify(data))
  applyUploadData(currentUploadType.value, data)

  uploadDialog.value = false
}

function applyUploadData(type: string, rows: any[]) {
  const group = groupedChildren.value[type]
  if (!group) return

  if (group.config.inventoryManaged) {
    rows.forEach((r: any) => {
      quantityMap.value[r.IDX] = r.quantity || 0
    })
    return
  }

  const keyPath = group.config?.storage?.primaryKey || "IDX"

  const selected = group.items.filter((item: any) =>
    rows.some((r: any) => r[keyPath] === getValue(item, keyPath))
  )

  selectedUserContainers.value[type] = selected
}

const uploadDialog = ref(false)
const currentUploadType = ref<string | null>(null)

function openUpload(type: string) {
  currentUploadType.value = type
  uploadDialog.value = true
}

const emit = defineEmits(["close", "completed"])

const organizationId = 12313

const groupedChildren = ref<any>({})
const quantityMap = ref<Record<string, number>>({})
const selectedUserContainers = ref<Record<string, any[]>>({})
const loading = ref(false)

/* ================= SCROLL ================= */

const activeTab = ref("")
const sectionRefs = ref<Record<string, HTMLElement | null>>({})

function scrollToSection(type: string) {
  sectionRefs.value[type]?.scrollIntoView({ behavior: "smooth" })
}

/* ================= STATUS ================= */

const sectionStatus = (type: string) => {
  const group = groupedChildren.value[type]

  if (group.config.inventoryManaged) {
    for (const item of group.items) {
      if ((quantityMap.value[item.IDX] || 0) > item.totalAvailable)
        return "error"
    }
    return "done"
  }

  return (selectedUserContainers.value[type]?.length || 0) > 0
    ? "done"
    : "pending"
}

const hasError = computed(() =>
  Object.keys(groupedChildren.value).some(
    (t) => sectionStatus(t) === "error"
  )
)

const totalSelected = computed(() =>
  Object.values(selectedUserContainers.value).flat().length
)

const completionPercent = computed(() => {
  const total = Object.keys(groupedChildren.value).length
  const done = Object.keys(groupedChildren.value).filter(
    (t) => sectionStatus(t) === "done"
  ).length
  return total ? (done / total) * 100 : 0
})

/* ================= HELPERS ================= */

function getValue(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj)
}

function getName(item: any, config: any) {
  const nameField =
    config?.projection?.listView?.find((f: string) =>
      f.toLowerCase().includes("name")
    ) || "IDX"

  return `${getValue(item, nameField) || item.IDX}`
}

/* ================= LOAD ================= */

async function loadMovement() {
  const res: any = await $fetch("/api/emc/movement/emcPrepareMovement", {
    method: "POST",
    body: {
      organizationId,
      destinationType: props.containerType,
      destinationIDX: props.master?.IDX,
      actionId: props.actionId
    }
  })

  groupedChildren.value = res.groupedChildren || {}

  // reset safely
  for (const k in selectedUserContainers.value) delete selectedUserContainers.value[k]

  for (const type in groupedChildren.value) {
    selectedUserContainers.value[type] = []

    const group = groupedChildren.value[type]

    if (!group.config.inventoryManaged) {
      group.items.forEach((item: any) => {
        item.__type = type

        if (item.assignedHere) {
          selectedUserContainers.value[type].push(item)
        }
      })
    }
  }

  activeTab.value = Object.keys(groupedChildren.value)[0]

  await nextTick()
}

watch(() => props.master?.IDX, loadMovement)
onMounted(loadMovement)

/* ================= ACTION ================= */

function scrollToFirstError() {
  for (const type in groupedChildren.value) {
    if (sectionStatus(type) === "error") {
      scrollToSection(type)
      return
    }
  }
}

async function confirmMovement() {
  if (hasError.value) return scrollToFirstError()

  loading.value = true

  try {
    const containers: any = {}

    for (const type in groupedChildren.value) {
      const group = groupedChildren.value[type]

      /* INVENTORY */
      if (group.config.inventoryManaged) {
        if (Object.keys(quantityMap.value || {}).length) {
          containers[type] = {
            quantities: quantityMap.value
          }
        }
        continue
      }

      /* 🔥 FIXED KEY HANDLING */
      const keyPath = group.config?.storage?.primaryKey || "IDX"

      const selectedItems = selectedUserContainers.value[type]
        ?.map((i: any) => getValue(i, keyPath))
        ?.filter(Boolean) || []

      if (group.config?.canContainRules?.length) {
        containers[type] = { children: selectedItems }
      } else {
        containers[type] = { items: selectedItems }
      }
    }

    await $fetch("/api/emc/movement/emcExecuteAction", {
      method: "POST",
      body: {
        organizationId,
        actionId: props.actionId,
        destination: {
          type: props.containerType,
          idx: props.master.IDX
        },
        userContext: {
          userId: "USR-001",
          role: "MANAGER"
        },
        containers
      }
    })

    emit("completed")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-card>
    <!-- HEADER -->
    <div class="pa-4 d-flex justify-space-between">
      <div>{{ actionConfig?.label }} → {{ master?.IDX }}</div>
      <v-btn icon="mdi:close" variant="text" @click="emit('close')" />
    </div>

    <!-- PROGRESS -->
    <v-progress-linear :model-value="completionPercent" height="6" class="mb-2" />

    <!-- TABS -->
    <div class="tabs">
      <div v-for="(group, type, i) in groupedChildren" :key="type" class="tab"
        :class="[activeTab === type ? 'active' : '', sectionStatus(type)]" @click="scrollToSection(type)">
        {{ i + 1 }}. {{ group.config?.label }}
        ({{ selectedUserContainers[type]?.length || 0 }})
      </div>
    </div>

    <!-- SUMMARY -->
    <v-card class="pa-2 mb-2">
      {{ totalSelected }} items selected
      <span v-if="hasError" class="text-error"> • Fix errors</span>
    </v-card>

    <!-- CONTENT -->
    <div class="scroll">

      <div v-for="(group, type) in groupedChildren" :key="type" :ref="el => sectionRefs[type] = el" class="section">
        <v-card class="pa-3 mb-3">

          <!-- HEADER -->
          <div class="d-flex justify-space-between align-center mb-2">
            <strong>{{ group.config?.label }}</strong>
            <div class="d-flex align-center gap-2">

              <!-- <strong>{{ group.config?.label }}</strong> -->

              <v-btn size="x-small" variant="outlined" color="primary" @click="openUpload(type)">
                Upload
              </v-btn>

            </div>

            <v-chip size="x-small">
              {{ group.items.length }} items
            </v-chip>
          </div>

          <!-- SELECT ALL -->
          <v-btn v-if="!group.config.inventoryManaged" size="x-small" class="mb-2" @click="
            selectedUserContainers[type].length === group.items.length
              ? selectedUserContainers[type] = []
              : selectedUserContainers[type] = [...group.items]
            ">
            {{
              selectedUserContainers[type].length === group.items.length
                ? 'Clear All'
                : 'Select All'
            }}
          </v-btn>
          <!-- {{ selectedUserContainers[type] }} -->
          <!-- STRUCTURAL -->
          <v-data-table v-if="!group.config.inventoryManaged" :headers="[
            { title: group.config?.label || 'Items', key: 'name' }
          ]" :items="group.items" item-value="IDX" v-model="selectedUserContainers[type]" show-select return-object>

            <template #item.name="{ item }">

              <div class="row-card">

                <!-- HEADER -->
                <div class="row-header">

                  <div class="row-title">
                    {{ getName(item, group.config) }} ({{ getName(item, "primaryKey") }})
                  </div>

                  <!-- EXISTING -->
                  <v-chip v-if="item.parentIDX === master.IDX" size="x-small" color="primary" variant="tonal">
                    Existing
                  </v-chip>

                  <!-- NEWLY SELECTED -->
                  <v-chip v-else-if="selectedUserContainers[type]?.some(i => i.IDX === item.IDX)" size="x-small"
                    color="success" variant="tonal">
                    Selected
                  </v-chip>

                </div>

                <!-- META
                <div class="row-meta">

                  <span v-if="item.Location?.title">
                    📍 {{ item.Location.title }}
                  </span>

                  <span v-if="item.ManufactureYear">
                    🏭 {{ item.ManufactureYear }}
                  </span>

                  <span v-if="item.tbManufacture?.Manufacturer?.title">
                    {{ item.tbManufacture.Manufacturer.title }}
                  </span>

                </div> -->

              </div>

            </template>

          </v-data-table>

          <!-- INVENTORY -->
          <!-- <v-data-table v-else :headers="[
            { title: 'Item', key: 'name' },
            { title: 'Stock', key: 'stock' },
            { title: 'Load', key: 'load' }
          ]" :items="group.items">

            <template #item.name="{ item }">
              {{ getName(item, group.config) }}
            </template>

            <template #item.stock="{ item }">
              {{ item.totalAvailable }} / {{ item.currentQuantity }}
            </template>

            <template #item.load="{ item }">
              <v-text-field v-model.number="quantityMap[item.IDX]" type="number" density="compact"
                style="inline-size: 80px;" />
            </template>

          </v-data-table> -->

        </v-card>
      </div>

    </div>

    <!-- FOOTER -->
    <div class="pa-4">
      <v-btn block :loading="loading" @click="confirmMovement">
        {{ hasError ? "Fix errors first" : "Confirm Movement" }}
      </v-btn>
    </div>

  </v-card>

  <emcFileUploadDialog v-model="uploadDialog" :uploadId="currentUploadType" @applied="handleUploadApplied" />

</template>

<style scoped>
.tabs {
  display: flex;
  padding: 8px;
  gap: 8px;
}

.tab {
  border-radius: 20px;
  background: #eee;
  cursor: pointer;
  padding-block: 6px;
  padding-inline: 12px;
}

.tab.active {
  background: #1976d2;
  color: white;
}

.tab.done {
  background: #4caf50;
  color: white;
}

.tab.error {
  background: #f44336;
  color: white;
}

.scroll {
  max-block-size: 60vh;
  overflow-y: auto;
}

.section {
  scroll-margin-top: 80px;
}

/* ROW UI */
.row-card {
  display: flex;
  flex-direction: column;
}

.row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.row-title {
  font-weight: 500;
}

.row-meta {
  display: flex;
  color: #777;
  font-size: 12px;
  gap: 10px;
  margin-block-start: 2px;
}
</style>
