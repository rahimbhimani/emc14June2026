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

  // try "Name" first
  const nameField = fields.find((f: any) => f.label === "Name")

  if (nameField) {

    // concat support
    if (Array.isArray(nameField.path)) {
      return nameField.path
        .map((p: string) => getValue(container, p))
        .filter(Boolean)
        .join(" ")
    }

    return getValue(container, nameField.path)
  }

  // fallback
  return container.IDX
}

function resolveField(container: any, field: any) {

  if (!field) return ""

  // concat support
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
  activeActionConfig.value = action.actionId ? action : { actionId: action, label: action }

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

  const track = selectedConfig.value?.display?.primaryLifecycle
  if (!track) return "grey-300"

  const state = container.lifecycle?.[track]
  if (!state) return "grey-300"

  const states =
    selectedConfig.value?.lifecycles?.[track]?.states || []

  const match =
    states.find((s: any) => s.code === state)

  return match?.color || "grey-300"

}

function getLatestCompliance(container: any) {
  const list =
    container?.lifecycle?.complianceStatus || []

  if (!Array.isArray(list) || !list.length) {
    return null
  }

  const active = list.filter(
    (x: any) =>
      x &&
      x.referenceNumber
  )

  if (!active.length) {
    return null
  }

  return active[
    active.length - 1
  ]
}

async function generateReport() {
  await $fetch("/api/report/emcRunReport", {
    method: "POST",
    body: {
      reportId: "BCL_REPORT",
      params: { containerId: "TROLLEY-01" }
    }
  })

}

</script>

<template>
  <v-container fluid class="pa-8">
    <v-btn class="mb-6" @click="generateReport">Generate BCL Report for TROLLEY-01</v-btn>
    <!-- CONFIG VIEW -->
    <div v-if="!selectedConfig">

      <h1 class="mb-6">Movement Planning</h1>

      <v-row>

        <v-col v-for="config in configs" :key="config.type" cols="12" sm="6" md="4" lg="3">

          <div class="airbnb-card" @click="selectConfig(config)">

            <img class="card-image" :src="config.imageUrl || '/images/placeholder.jpg'" />

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

        <v-col v-for="container in instances" :key="container.IDX" cols="12" sm="6" md="4" lg="3">

          <div class="airbnb-card" @click="executeAction(container, 'CONTAINER_HISTORY')">

            <img class="card-image" :src="selectedConfig.imageUrl || '/images/placeholder.jpg'" />

            <div class="card-content">

              <div class="card-header">

                <div>
                  <!-- TITLE -->
                  <div class="title">
                    {{
                      resolveField(
                        container,
                        selectedConfig.ui?.listView?.find(f => f.isTitle)
                        || selectedConfig.ui?.listView?.[0]
                        || { path: "IDX" }
                      )
                    }}
                  </div>

                  <!-- PARENT -->
                  <div v-for="field in selectedConfig.ui?.listView" :key="field.label" class="subtitle">

                    <span v-if="
                      !field.isTitle &&
                      resolveField(container, field)
                    ">
                      <strong>{{ field.label }}:</strong>
                      {{ resolveField(container, field) }}
                    </span>

                  </div>

                  <!-- 🔥 INVENTORY SUMMARY -->
                  <div class="d-flex align-center mt-2">

                    <v-chip size="x-small" color="info" variant="tonal">
                      {{ container.inventorySummary?.itemCount ?? container.inventoryCount ?? 0 }} items
                    </v-chip>

                    <v-chip size="x-small" class="ml-2" color="success" variant="tonal">
                      Qty: {{ container.inventorySummary?.totalQty ?? 0 }}
                    </v-chip>

                  </div>

                  <!-- LIFECYCLE -->
                  <v-chip size="small" class="mt-2" :color="lifecycleColor(container)" variant="flat">
                    {{
                      container.lifecycle?.[
                      selectedConfig.display?.primaryLifecycle
                      ] || "No lifecycle"
                    }}
                  </v-chip>

                  <div v-if="getLatestCompliance(container)?.referenceNumber" class="reference-number">
                    {{
                      getLatestCompliance(container)?.referenceNumber
                    }}
                  </div>

                </div>

                <!-- ACTION MENU -->
                <v-menu>

                  <template #activator="{ props }">
                    <v-btn icon="mdi:dots-vertical" variant="text" size="small" v-bind="props" />
                  </template>

                  <v-list density="compact">

                    <v-list-item v-for="action in container.availableActions" :key="action.actionId"
                      @click="executeAction(container, action)">

                      <v-list-item-title>
                        {{ action.label }}
                      </v-list-item-title>

                    </v-list-item>

                  </v-list>

                </v-menu>

              </div>

            </div>

          </div>

        </v-col>

      </v-row>

    </div>

    <!-- DRAWER -->
    <v-navigation-drawer v-model="movementDrawer" location="right" width="520" temporary>

      <emcMovementAction
        v-if="movementDrawer && activeContainer && (activeAction !== 'VIEW_INVENTORY' && activeAction !== 'SEAL_CONTAINER' && activeAction !== 'CHANGE_STATUS' && activeAction !== 'CONTAINER_HISTORY')"
        :master="activeContainer" :containerType="selectedConfig.type" :actionId="activeAction"
        :actionConfig="activeActionConfig" @close="movementDrawer = false" @completed="reloadContainers" />

      <emcContainerInventory v-if="movementDrawer && activeContainer && activeAction === 'VIEW_INVENTORY'"
        :containerType="selectedConfig.type" :containerIDX="activeContainer.IDX" @close="movementDrawer = false"
        @completed="reloadContainers" />

      <emcContainerSeal v-if="movementDrawer && activeContainer && activeAction === 'SEAL_CONTAINER'"
        :master="activeContainer" :containerType="selectedConfig.type" :actionId="activeAction"
        :actionConfig="activeActionConfig" @close="movementDrawer = false" @completed="reloadContainers" />

      <emcChangeStatus v-if="movementDrawer && activeContainer && activeAction === 'CHANGE_STATUS'"
        :master="activeContainer" :containerType="selectedConfig.type" :containerIDX="activeContainer.IDX"
        @close="movementDrawer = false" @completed="reloadContainers" />

      <emcContainerHistory v-if="movementDrawer && activeContainer && activeAction === 'CONTAINER_HISTORY'"
        :master="activeContainer" :containerType="selectedConfig.type" :containerIDX="activeContainer.IDX"
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

.reference-number {
  color: #1565c0;
  font-size: 13px;
  font-weight: 600;
  margin-block-start: 6px;
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
</style>
