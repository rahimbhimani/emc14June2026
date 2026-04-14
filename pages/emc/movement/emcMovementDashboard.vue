<script setup lang="ts">
import { computed, ref } from "vue"

const organizationId = 12313
const userRole = "MANAGER"

const selectedConfig = ref<any>(null)
const instances = ref<any[]>([])
const loadingInstances = ref(false)

const movementDrawer = ref(false)

const activeContainer = ref<any>(null)
const activeAction = ref<string | null>(null)
const activeActionConfig = ref<any>(null)

function getValue(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj)
}

function resolveTitle(container: any) {
  const fields = selectedConfig.value?.ui?.listView || []

  const nameField = fields.find((f: any) => f.label === "Name")

  if (nameField) {
    if (Array.isArray(nameField.path)) {
      return nameField.path
        .map((p: string) => getValue(container, p))
        .filter(Boolean)
        .join(" ")
    }

    return getValue(container, nameField.path)
  }

  return container.IDX
}

function resolveField(container: any, field: any) {
  if (!field) return ""

  if (Array.isArray(field.path)) {
    return field.path
      .map((p: string) => getValue(container, p))
      .filter(Boolean)
      .join(field.separator || " ")
  }

  return getValue(container, field.path)
}

const { data: configData } = await useFetch(
  "/api/emc/container/emcRetrieveContainerConfigs",
  {
    method: "POST",
    body: { organizationId }
  }
)

const configs = computed(() => configData.value?.configs || [])

/* ======================================================
SELECT CONFIG
====================================================== */

async function selectConfig(config: any) {
  selectedConfig.value = config
  loadingInstances.value = true

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

    instances.value = res.instances || []

    for (const container of instances.value) {
      container.availableActions =
        await loadAvailableActions(container)
    }
  }
  finally {
    loadingInstances.value = false
  }
}

/* ======================================================
LOAD ACTIONS
====================================================== */

async function loadAvailableActions(container: any) {
  if (!container?.IDX) return []

  try {
    const res: any = await $fetch(
      "/api/emc/container/getAvailableActions",
      {
        method: "POST",
        body: {
          organizationId,
          containerType: selectedConfig.value.type,
          containerIDX: container.IDX,
          role: userRole
        }
      }
    )

    return res?.actions || []
  }
  catch (err) {
    console.error("actions error", err)
    return []
  }
}

/* ======================================================
EXECUTE ACTION
====================================================== */

function executeAction(container: any, action: any) {
  activeContainer.value = container
  activeAction.value = action.actionId || action
  activeActionConfig.value =
    action.actionId
      ? action
      : {
        actionId: action,
        label: action
      }

  movementDrawer.value = true
}

/* ======================================================
RELOAD
====================================================== */

async function reloadContainers() {
  movementDrawer.value = false

  if (selectedConfig.value) {
    await selectConfig(selectedConfig.value)
  }
}

function goBack() {
  selectedConfig.value = null
  instances.value = []
}

/* ======================================================
LIFECYCLE COLOR
====================================================== */

function lifecycleColor(container: any) {
  if (!selectedConfig.value) return "grey-300"

  const track =
    selectedConfig.value?.display?.primaryLifecycle

  if (!track) return "grey-300"

  const state =
    container.lifecycle?.[track]

  if (!state) return "grey-300"

  const states =
    selectedConfig.value?.lifecycles?.[track]?.states || []

  const match =
    states.find((s: any) => s.code === state)

  return match?.color || "grey-300"
}

/* ======================================================
REFERENCE LOOKUP
====================================================== */

function getLatestReference(
  container: any,
  channel: string
) {
  const refs =
    container?.references || []

  if (!Array.isArray(refs) || !refs.length) {
    return null
  }

  const currentState =
    container?.lifecycle?.[channel]

  const filtered = refs.filter((r: any) => {
    if (r?.binding?.channel !== channel) {
      return false
    }

    const states =
      r?.binding?.visibleWhenStates || []

    if (!states.length) {
      return true
    }

    return states.includes(currentState)
  })

  if (!filtered.length) {
    return null
  }

  return filtered[filtered.length - 1]
}

/* ======================================================
REPORT
====================================================== */

async function generateReport() {
  await $fetch("/api/report/emcRunReport", {
    method: "POST",
    body: {
      reportId: "BCL_REPORT",
      params: {
        containerId: "TROLLEY-01"
      }
    }
  })
}
</script>

<template>
  <v-container fluid class="pa-8">
    <v-btn class="mb-6" @click="generateReport">
      Generate BCL Report for TROLLEY-01
    </v-btn>

    <!-- CONFIG VIEW -->
    <div v-if="!selectedConfig">
      <h1 class="mb-6">
        Movement Planning
      </h1>

      <v-row>
        <v-col v-for="config in configs" :key="config.type" cols="12" sm="6" md="4" lg="3">
          <div class="airbnb-card" @click="selectConfig(config)">
            <img class="card-image" :src="config.imageUrl || '/images/placeholder.jpg'">

            <div class="card-content">
              <div class="title">
                {{ config.label }}
              </div>

              <div class="subtitle">
                {{ config.category }}
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- INSTANCE VIEW -->
    <div v-else>
      <div class="d-flex align-center mb-6">
        <v-btn icon="mdi:arrow-left" variant="text" @click="goBack" />

        <h2 class="ml-3">
          {{ selectedConfig.label }} Instances
        </h2>
      </div>

      <v-row v-if="loadingInstances" justify="center">
        <v-progress-circular indeterminate />
      </v-row>

      <v-row v-else>
        <!-- TEMPLATE: Replace only the card block inside v-for="container in instances" -->

        <v-col v-for="container in instances" :key="container.IDX" cols="12" sm="6" md="4" lg="3">
          <div class="ops-card" @click="executeAction(container, 'CONTAINER_HISTORY')">
            <!-- IMAGE -->
            <img class="ops-card-image" :src="selectedConfig.imageUrl || '/images/placeholder.jpg'">

            <!-- BODY -->
            <div class="ops-card-body">

              <!-- HEADER -->
              <div class="ops-card-header">
                <div>
                  <div class="ops-title">
                    {{
                      resolveField(
                        container,
                        selectedConfig.ui?.listView?.find((f: any) => f.isTitle)
                        || selectedConfig.ui?.listView?.[0]
                        || { path: "IDX" }
                      )
                    }}
                  </div>

                  <div class="ops-subtitle">
                    IDX: {{ container.IDX }}
                  </div>
                </div>

                <v-menu>
                  <template #activator="{ props }">
                    <v-btn icon="mdi:dots-vertical" variant="text" size="small" v-bind="props" @click.stop />
                  </template>

                  <v-list density="compact">
                    <v-list-item v-for="action in container.availableActions" :key="action.actionId"
                      @click.stop="executeAction(container, action)">
                      <v-list-item-title>
                        {{ action.label }}
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <!-- EXTRA FIELDS -->
              <div v-for="field in selectedConfig.ui?.listView" :key="field.label" class="ops-meta">
                <span v-if="
                  !field.isTitle &&
                  field.label !== 'IDX' &&
                  resolveField(container, field)
                ">
                  <strong>{{ field.label }}:</strong>
                  {{ resolveField(container, field) }}
                </span>
              </div>

              <!-- STATS -->
              <div class="ops-stats">
                <div class="stat-box">
                  <div class="stat-label">Items</div>
                  <div class="stat-value">
                    {{
                      container.inventorySummary?.itemCount
                      ?? container.inventoryCount
                      ?? 0
                    }}
                  </div>
                </div>

                <div class="stat-box">
                  <div class="stat-label">Qty</div>
                  <div class="stat-value">
                    {{
                      container.inventorySummary?.totalQty
                      ?? 0
                    }}
                  </div>
                </div>
              </div>

              <!-- STATUS SECTION -->
              <div class="status-section">

                <!-- Operational -->
                <div class="status-row">
                  <div class="status-caption">
                    Operational
                  </div>

                  <v-chip size="small" :color="lifecycleColor(container)" variant="flat">
                    {{
                      container.lifecycle?.[
                      selectedConfig.display?.primaryLifecycle
                      ] || "N/A"
                    }}
                  </v-chip>

                  <div v-if="
                    getLatestReference(
                      container,
                      'operational'
                    )?.referenceNumber
                  " class="ref-number">
                    {{
                      getLatestReference(
                        container,
                        'operational'
                      )?.referenceNumber
                    }}
                  </div>
                </div>

                <!-- Compliance -->
                <div class="status-row">
                  <div class="status-caption">
                    Compliance
                  </div>

                  <v-chip size="small" color="primary" variant="tonal">
                    {{
                      container.lifecycle?.compliance || "N/A"
                    }}
                  </v-chip>

                  <div v-if="
                    getLatestReference(
                      container,
                      'compliance'
                    )?.referenceNumber
                  " class="ref-number">
                    {{
                      getLatestReference(
                        container,
                        'compliance'
                      )?.referenceNumber
                    }}
                  </div>

                  <div v-else class="pending-text">
                    Pending
                  </div>
                </div>

              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- DRAWER -->
    <v-navigation-drawer v-model="movementDrawer" location="right" width="520" temporary>
      <emcMovementAction v-if="
        movementDrawer &&
        activeContainer &&
        (
          activeAction !== 'VIEW_INVENTORY' &&
          activeAction !== 'SEAL_CONTAINER' &&
          activeAction !== 'CHANGE_STATUS' &&
          activeAction !== 'CONTAINER_HISTORY'
        )
      " :master="activeContainer" :containerType="selectedConfig.type" :actionId="activeAction"
        :actionConfig="activeActionConfig" @close="movementDrawer = false" @completed="reloadContainers" />

      <emcContainerInventory v-if="
        movementDrawer &&
        activeContainer &&
        activeAction === 'VIEW_INVENTORY'
      " :containerType="selectedConfig.type" :containerIDX="activeContainer.IDX" @close="movementDrawer = false"
        @completed="reloadContainers" />

      <emcContainerSeal v-if="
        movementDrawer &&
        activeContainer &&
        activeAction === 'SEAL_CONTAINER'
      " :master="activeContainer" :containerType="selectedConfig.type" :actionId="activeAction"
        :actionConfig="activeActionConfig" @close="movementDrawer = false" @completed="reloadContainers" />

      <emcChangeStatus v-if="
        movementDrawer &&
        activeContainer &&
        activeAction === 'CHANGE_STATUS'
      " :master="activeContainer" :containerType="selectedConfig.type" :containerIDX="activeContainer.IDX"
        @close="movementDrawer = false" @completed="reloadContainers" />

      <emcContainerHistory v-if="
        movementDrawer &&
        activeContainer &&
        activeAction === 'CONTAINER_HISTORY'
      " :master="activeContainer" :containerType="selectedConfig.type" :containerIDX="activeContainer.IDX"
        @close="movementDrawer = false" @completed="reloadContainers" />
    </v-navigation-drawer>
  </v-container>
</template>

<style scoped>
.airbnb-card {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  border-radius: 16px;
  background: white;
  block-size: 320px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 6%);
  cursor: pointer;
  transition: all 0.25s ease;
}

/* STYLE: Replace existing card CSS */

.ops-card {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 8%);
  cursor: pointer;
  min-block-size: 190px;
  transition: all 0.25s ease;
}

.ops-card:hover {
  box-shadow: 0 14px 32px rgba(0, 0, 0, 14%);
  transform: translateY(-4px);
}

.ops-card-image {
  block-size: 110px;
  inline-size: 100%;
  object-fit: cover;
}

.ops-card-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 16px;
}

.ops-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.ops-title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.ops-subtitle {
  color: #777;
  font-size: 13px;
  margin-block-start: 4px;
}

.ops-meta {
  color: #666;
  font-size: 13px;
  margin-block-start: 4px;
}

.ops-stats {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
  margin-block-start: 14px;
}

.stat-box {
  padding: 10px;
  border-radius: 12px;
  background: #f8f9fb;
}

.stat-label {
  color: #777;
  font-size: 12px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  margin-block-start: 2px;
}

.status-section {
  display: grid;
  border-block-start: 1px solid #eee;
  gap: 18px;
  grid-template-columns: 1fr 1fr;
  margin-block-start: 14px;
  padding-block-start: 12px;
}

.status-row {
  display: grid;
  align-items: start;
  grid-template-rows: 20px 34px 24px;
}

.status-row .v-chip {
  margin-block-start: 4px;
}

.status-row.status-row {
  margin-block-start: 14px;
}

.status-caption {
  margin: 0;
  color: #777;
  font-size: 12px;
}

.ref-number,
.pending-text {
  font-size: 13px;
  margin-block-start: 0;
}

.ref-number {
  color: #1565c0;
  font-family: monospace;
  font-size: 13px;
  font-weight: 700;
  margin-block-start: 6px;
}

.pending-text {
  color: #999;
  font-size: 13px;
  margin-block-start: 6px;
}

.airbnb-card:hover {
  box-shadow: 0 12px 25px rgba(0, 0, 0, 12%);
  transform: translateY(-6px);
}

.card-image {
  block-size: 160px;
  inline-size: 100%;
  object-fit: cover;
}

.card-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.subtitle {
  color: #717171;
  font-size: 13px;
  margin-block-start: 4px;
}

.status-block {
  margin-block-start: 8px;
}

.status-label {
  color: #777;
  font-size: 12px;
  margin-block-end: 4px;
}

.reference-number {
  color: #1565c0;
  font-size: 13px;
  font-weight: 600;
  margin-block-start: 6px;
}

.compliance-empty {
  color: #999;
  font-size: 13px;
}
</style>
