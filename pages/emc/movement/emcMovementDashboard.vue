<script setup lang="ts">
import { computed, ref } from "vue"

/**
 * Enterprise SaaS Hybrid UI
 * Replace API endpoints/components with your existing ones where needed.
 */

const organizationId = 12313
const userRole = "MANAGER"

/* --------------------------
STATE
-------------------------- */
const loading = ref(false)
const viewMode = ref<"card" | "list">("card")
const searchText = ref("")
const selectedConfig = ref<any>(null)
const instances = ref<any[]>([])

const movementDrawer = ref(false)
const activeContainer = ref<any>(null)
const activeAction = ref<string | null>(null)
const activeActionConfig = ref<any>(null)

/* --------------------------
CONFIG LOAD
-------------------------- */
const { data: configData } = useFetch(
  "/api/emc/container/emcRetrieveContainerConfigs",
  {
    method: "POST",
    body: { organizationId }
  }
)

const configs = computed(
  () => configData.value?.configs || []
)

/* --------------------------
HELPERS
-------------------------- */
function getValue(obj: any, path: string) {
  return path
    .split(".")
    .reduce((acc, key) => acc?.[key], obj)
}

function resolveField(item: any, field: any) {
  if (!field) return ""

  if (Array.isArray(field.path)) {
    return field.path
      .map((p: string) => getValue(item, p))
      .filter(Boolean)
      .join(field.separator || " ")
  }

  return getValue(item, field.path)
}

function resolveTitle(item: any) {
  const fields =
    selectedConfig.value?.ui?.listView || []

  const titleField =
    fields.find((f: any) => f.isTitle) ||
    fields.find((f: any) => f.label === "Name") ||
    fields[0]

  return (
    resolveField(item, titleField) ||
    item.IDX
  )
}

function lifecycleColor(item: any) {
  const track =
    selectedConfig.value?.display?.primaryLifecycle

  const code =
    item.lifecycle?.[track]

  const states =
    selectedConfig.value?.lifecycles?.[track]
      ?.states || []

  return (
    states.find(
      (s: any) => s.code === code
    )?.color || "grey"
  )
}

function lifecycleLabel(item: any) {
  const track =
    selectedConfig.value?.display?.primaryLifecycle

  const code =
    item.lifecycle?.[track]

  const states =
    selectedConfig.value?.lifecycles?.[track]
      ?.states || []

  return (
    states.find(
      (s: any) => s.code === code
    )?.label || code || "N/A"
  )
}

/* --------------------------
FILTER
-------------------------- */
const filteredInstances = computed(() => {
  const term =
    searchText.value
      .trim()
      .toLowerCase()

  if (!term) return instances.value

  return instances.value.filter((x) =>
    JSON.stringify(x)
      .toLowerCase()
      .includes(term)
  )
})

/* --------------------------
LOAD INSTANCES
-------------------------- */
async function selectConfig(config: any) {
  selectedConfig.value = config
  loading.value = true

  try {
    const res: any = await $fetch(
      "/api/emc/container/emcRetreiveContainerData",
      {
        method: "POST",
        body: {
          organizationId,
          type: config.type
        }
      }
    )

    instances.value =
      res.instances || []

    for (const row of instances.value) {
      row.availableActions =
        await loadAvailableActions(row)
    }
  }
  finally {
    loading.value = false
  }
}

async function loadAvailableActions(
  row: any
) {
  try {
    const res: any = await $fetch(
      "/api/emc/container/getAvailableActions",
      {
        method: "POST",
        body: {
          organizationId,
          containerType:
            selectedConfig.value.type,
          containerIDX: row.IDX,
          role: userRole
        }
      }
    )

    return res.actions || []
  }
  catch {
    return []
  }
}

/* --------------------------
ACTIONS
-------------------------- */
function executeAction(
  row: any,
  action: any
) {
  activeContainer.value = row
  activeAction.value =
    action.actionId || action

  activeActionConfig.value =
    action.actionId
      ? action
      : {
        actionId: action,
        label: action
      }

  movementDrawer.value = true
}

async function reloadContainers() {
  movementDrawer.value = false

  if (selectedConfig.value) {
    await selectConfig(
      selectedConfig.value
    )
  }
}

function goBack() {
  selectedConfig.value = null
  instances.value = []
}

/* --------------------------
REPORT
-------------------------- */
const { runReport } =
  useReportRunner()

function generateReport() {
  runReport({
    reportId: "BCL_REPORT",
    reportName:
      "Bar Check List Report",
    params: {
      referenceNumber:
        "BCL-000041"
    },
    output: "HTML"
  })
}

/* --------------------------
TABLE HEADERS
-------------------------- */
const headers = [
  { title: "Name", key: "name" },
  { title: "IDX", key: "IDX" },
  { title: "Items", key: "items" },
  { title: "Qty", key: "qty" },
  { title: "Status", key: "status" },
  {
    title: "",
    key: "actions",
    sortable: false,
    width: 60
  }
]
</script>

<template>
  <v-container fluid class="page-wrap">
    <!-- PAGE HEADER -->
    <div class="page-header">
      <div>
        <div class="eyebrow">
          Operations
        </div>
        <h1 class="page-title">
          Movement Planning
        </h1>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" prepend-icon="mdi:file-document" @click="generateReport">
          Generate Report
        </v-btn>
      </div>
    </div>

    <!-- CONFIG GRID -->
    <div v-if="!selectedConfig">
      <v-row>
        <v-col v-for="config in configs" :key="config.type" cols="12" sm="6" md="4" lg="3">
          <v-card class="config-card" rounded="xl" @click="selectConfig(config)">
            <v-img height="170" cover :src="config.imageUrl || '/images/placeholder.jpg'" />
            <v-card-text class="pa-4">
              <div class="card-title">
                {{ config.label }}
              </div>

              <div class="card-subtitle">
                {{ config.category }}
              </div>

              <div class="mt-4">
                <v-btn block rounded="lg" color="primary" variant="tonal">
                  Open
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- INSTANCE SCREEN -->
    <div v-else>
      <!-- TOOLBAR -->
      <v-card rounded="xl" class="toolbar-card">
        <div class="toolbar-grid">
          <div class="d-flex align-center ga-2">
            <v-btn icon="mdi:arrow-left" variant="text" @click="goBack" />

            <div>
              <div class="toolbar-label">
                {{ selectedConfig.label }}
              </div>

              <div class="toolbar-sub">
                {{ filteredInstances.length }} records
              </div>
            </div>
          </div>

          <div class="toolbar-actions">
            <v-text-field v-model="searchText" density="compact" variant="solo-filled" flat hide-details clearable
              prepend-inner-icon="mdi:magnify" placeholder="Search..." class="search-box" />

            <v-btn-toggle v-model="viewMode" mandatory rounded="lg">
              <v-btn variant="flat" value="card" icon="mdi:view-grid" class="mr-1" />
              <v-btn variant="flat" value="list" icon="mdi:format-list-bulleted" />
            </v-btn-toggle>

            <v-btn icon="mdi:refresh" variant="text" @click="reloadContainers" />
          </div>
        </div>
      </v-card>

      <!-- LOADING -->
      <div v-if="loading" class="loading-wrap">
        <v-progress-circular indeterminate size="42" />
      </div>

      <!-- CARD VIEW -->
      <v-row v-else-if="viewMode === 'card'">
        <v-col v-for="row in filteredInstances" :key="row.IDX" cols="12" sm="6" md="4" lg="3" xl="2">
          <v-card rounded="xl" class="instance-card" @click="
            executeAction(
              row,
              'CONTAINER_HISTORY'
            )
            ">
            <v-img height="96" cover :src="selectedConfig.imageUrl || '/images/placeholder.jpg'" />

            <v-card-text class="pa-4">
              <div class="instance-head">
                <div class="min-w-0">
                  <div class="instance-title">
                    {{ resolveTitle(row) }}
                  </div>

                  <div class="instance-sub">
                    IDX: {{ row.IDX }}
                  </div>
                </div>

                <v-menu>
                  <template #activator="{ props }">
                    <v-btn icon="mdi:dots-vertical" variant="text" size="small" v-bind="props" @click.stop />
                  </template>

                  <v-list density="compact">
                    <v-list-item v-for="action in row.availableActions" :key="action.actionId" @click.stop="
                      executeAction(
                        row,
                        action
                      )
                      ">
                      <v-list-item-title>
                        {{ action.label }}
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <!-- DYNAMIC FIELDS -->
              <div v-for="field in selectedConfig.ui?.listView" :key="field.label" class="meta-row">
                <template v-if="
                  !field.isTitle &&
                  field.label !== 'IDX' &&
                  resolveField(row, field)
                ">
                  <span class="meta-label">
                    {{ field.label }}:
                  </span>

                  <span class="meta-value">
                    {{
                      resolveField(
                        row,
                        field
                      )
                    }}
                  </span>
                </template>
              </div>

              <!-- KPI -->
              <div class="kpi-grid">
                <div class="kpi-box">
                  <div class="kpi-label">
                    Items
                  </div>

                  <div class="kpi-value">
                    {{
                      row.inventorySummary?.itemCount
                      ?? row.inventoryCount
                      ?? 0
                    }}
                  </div>
                </div>

                <div class="kpi-box">
                  <div class="kpi-label">
                    Qty
                  </div>

                  <div class="kpi-value">
                    {{
                      row.inventorySummary?.totalQty
                      ?? 0
                    }}
                  </div>
                </div>
              </div>

              <!-- STATUS -->
              <div class="status-grid">
                <div>
                  <div class="status-label">
                    Operational
                  </div>

                  <v-chip size="small" :color="lifecycleColor(row)" variant="flat">
                    {{ lifecycleLabel(row) }}
                  </v-chip>
                </div>

                <div>
                  <div class="status-label">
                    Compliance
                  </div>

                  <v-chip size="small" color="primary" variant="tonal">
                    {{
                      row.lifecycle?.compliance || "N/A"
                    }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- LIST VIEW -->
      <v-card v-else rounded="xl" class="table-card">
        <v-data-table :items="filteredInstances" :headers="headers" item-value="IDX" density="comfortable" fixed-header
          height="70vh" hover>
          <template #item.name="{ item }">
            <div class="row-link" @click="
              executeAction(
                item,
                'CONTAINER_HISTORY'
              )
              ">
              {{ resolveTitle(item) }}
            </div>
          </template>

          <template #item.items="{ item }">
            {{
              item.inventorySummary?.itemCount
              ?? item.inventoryCount
              ?? 0
            }}
          </template>

          <template #item.qty="{ item }">
            {{
              item.inventorySummary?.totalQty
              ?? 0
            }}
          </template>

          <template #item.status="{ item }">
            <v-chip size="small" :color="lifecycleColor(item)" variant="flat">
              {{ lifecycleLabel(item) }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-menu>
              <template #activator="{ props }">
                <v-btn icon="mdi:dots-vertical" variant="text" size="small" v-bind="props" />
              </template>

              <v-list density="compact">
                <v-list-item v-for="action in item.availableActions" :key="action.actionId" @click="
                  executeAction(
                    item,
                    action
                  )
                  ">
                  <v-list-item-title>
                    {{ action.label }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          <template #no-data>
            <div class="pa-8 text-medium-emphasis text-center">
              No matching records found
            </div>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- DRAWER -->
    <v-navigation-drawer v-model="movementDrawer" location="right" width="520" temporary>
      <emcMovementAction v-if="
        movementDrawer &&
        activeContainer &&
        activeAction !== 'VIEW_INVENTORY' &&
        activeAction !== 'SEAL_CONTAINER' &&
        activeAction !== 'CUSTOMS_ACTIONS' &&
        activeAction !== 'CHANGE_STATUS' &&
        activeAction !== 'CONTAINER_HISTORY'
      " :master="activeContainer" :masterConfig="selectedConfig" :containerType="selectedConfig.type"
        :actionId="activeAction" :actionConfig="activeActionConfig" @close="movementDrawer = false"
        @completed="reloadContainers" />

      <emcContainerInventory v-else-if="
        movementDrawer &&
        activeContainer &&
        activeAction === 'VIEW_INVENTORY'
      " :containerType="selectedConfig.type" :containerIDX="activeContainer.IDX" @close="movementDrawer = false"
        @completed="reloadContainers" />

      <emcContainerSeal v-else-if="
        movementDrawer &&
        activeContainer &&
        (
          activeAction === 'SEAL_CONTAINER' ||
          activeAction === 'CUSTOMS_ACTIONS'
        )
      " :master="activeContainer" :containerType="selectedConfig.type" :actionId="activeAction"
        :actionConfig="activeActionConfig" @close="movementDrawer = false" @completed="reloadContainers" />

      <emcChangeStatus v-else-if="
        movementDrawer &&
        activeContainer &&
        activeAction === 'CHANGE_STATUS'
      " :master="activeContainer" :containerType="selectedConfig.type" :containerIDX="activeContainer.IDX"
        @close="movementDrawer = false" @completed="reloadContainers" />

      <emcContainerHistory v-else-if="
        movementDrawer &&
        activeContainer &&
        activeAction === 'CONTAINER_HISTORY'
      " :master="activeContainer" :containerType="selectedConfig.type" :containerIDX="activeContainer.IDX"
        @close="movementDrawer = false" @completed="reloadContainers" />
    </v-navigation-drawer>
  </v-container>
</template>

<style scoped>
.page-wrap {
  padding: 24px;
  background: #f8fafc;
  min-block-size: 100vh;
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-block-end: 18px;
}

.eyebrow {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
}

.config-card,
.instance-card,
.toolbar-card,
.table-card {
  border: 1px solid #eef2f7;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 6%);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
}

.card-subtitle {
  color: #64748b;
  font-size: 13px;
  margin-block-start: 4px;
}

.toolbar-card {
  margin-block-end: 16px;
  padding-block: 14px;
  padding-inline: 16px;
}

.toolbar-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.toolbar-label {
  font-size: 18px;
  font-weight: 700;
}

.toolbar-sub {
  color: #64748b;
  font-size: 13px;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.search-box {
  max-inline-size: 360px;
  min-inline-size: 280px;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding-block: 50px;
  padding-inline: 0;
}

.instance-head {
  display: grid;
  align-items: start;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto;
}

:deep(.instance-head .v-btn) {
  margin-block-start: -4px;
  margin-inline-end: -6px;
}

.instance-title {
  overflow: hidden;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.instance-sub {
  color: #64748b;
  font-size: 13px;
  margin-block-start: 4px;
}

.meta-row {
  font-size: 13px;
  margin-block-start: 6px;
}

.meta-label {
  color: #64748b;
  font-weight: 600;
}

.meta-value {
  color: #0f172a;
}

.kpi-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr 1fr;
  margin-block-start: 12px;
}

.kpi-box {
  padding: 10px;
  border: 1px solid #eef2f7;
  border-radius: 12px;
  background: #f8fafc;
}

.kpi-label {
  color: #64748b;
  font-size: 11px;
}

.kpi-value {
  font-size: 16px;
  font-weight: 800;
  margin-block-start: 4px;
}

.status-grid {
  display: grid;
  border-block-start: 1px solid #eef2f7;
  gap: 14px;
  grid-template-columns: 1fr 1fr;
  margin-block-start: 14px;
  padding-block-start: 12px;
}

.status-label {
  color: #64748b;
  font-size: 12px;
  margin-block-end: 6px;
}

.table-card {
  overflow: hidden;
}

.row-link {
  cursor: pointer;
  font-weight: 700;
}

.row-link:hover {
  text-decoration: underline;
}

:deep(.v-data-table thead th) {
  background: #f8fafc;
  color: #334155;
  font-weight: 800 !important;
}

:deep(.v-data-table tbody tr:hover) {
  background: rgba(15, 23, 42, 3%);
}
</style>
