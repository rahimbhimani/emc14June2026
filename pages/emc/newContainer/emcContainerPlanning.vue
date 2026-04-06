<script setup lang="ts">
import EmcActionInStock from "@/components/emc/actions/emcActionInStock.vue"
import { computed, ref } from "vue"

/* ======================================================
   STATE
====================================================== */
const selectedConfig = ref<any>(null)
const instances = ref<any[]>([])
const loadingInstances = ref(false)
const viewMode = ref<"grid" | "list">("grid")

const activeAction = ref<string | null>(null)
const activeContainer = ref<any>(null)

const organizationId = 12313
const userRole = "MANAGER"

/* ======================================================
   LOAD CONFIGS
====================================================== */
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
const selectConfig = async (config: any) => {
  selectedConfig.value = config
  loadingInstances.value = true

  const response: any = await $fetch(
    "/api/emc/container/emcRetreiveContainerData",
    {
      method: "POST",
      body: {
        organizationId,
        type: config.type
      }
    }
  )

  instances.value = response.instances || []

  for (const container of instances.value) {
    container.availableActions = await loadAvailableActions(container)
  }

  loadingInstances.value = false
}

/* ======================================================
   LOAD AVAILABLE ACTIONS
====================================================== */
const loadAvailableActions = async (container: any) => {
  try {
    if (!selectedConfig.value) return []
    if (!container?.IDX) return []

    const response: any = await $fetch(
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

    return response?.actions || []
  } catch (error) {
    console.error("Failed loading actions:", error)
    return []
  }
}

/* ======================================================
   EXECUTE ACTION
====================================================== */
const executeAction = async (container: any, action: any) => {
  try {

    // Actions that require drawer UI
    if (
      action.actionId === "START_LOADING" ||
      action.actionId === "INSTOCK"
    ) {
      activeContainer.value = container
      activeAction.value = action.actionId
      return
    }

    // Normal lifecycle execution
    await $fetch(
      "/api/emc/container/emcExecuteLifecycleAction",
      {
        method: "POST",
        body: {
          organizationId,
          containerType: selectedConfig.value.type,
          containerIDX: container.IDX,
          actionId: action.actionId,
          userContext: {
            userId: "USR-001",
            role: userRole
          }
        }
      }
    )

    await selectConfig(selectedConfig.value)

  } catch (error) {
    console.error("Action execution failed:", error)
  }
}

/* ======================================================
   ACTION COMPLETED HANDLER
====================================================== */
const handleActionCompleted = async () => {
  activeAction.value = null
  await selectConfig(selectedConfig.value)
}

/* ======================================================
   SAFE SUBTITLE
====================================================== */
const getSubtitle = (container: any) => {
  if (!selectedConfig.value) return ""

  if (selectedConfig.value.type === "Trolley") {
    return container.tbTrolley?.tbMain?.Name || ""
  }

  if (selectedConfig.value.type === "Product") {
    return container.tbProduct?.Name || ""
  }

  if (selectedConfig.value.type === "Warehouse") {
    return container.tbWarehouse?.Name || ""
  }

  return ""
}

/* ======================================================
   SAFE LIFECYCLE TRACKS
====================================================== */
const getTracks = () => {
  if (!selectedConfig.value) return []

  return (
    selectedConfig.value?.display?.showTracks ||
    Object.keys(selectedConfig.value?.lifecycles || {})
  )
}

/* ======================================================
   SAFE LIFECYCLE VALUE
====================================================== */
const getLifecycleValue = (container: any, track: string) => {
  if (!container) return ""

  if (container.lifecycle?.[track]) {
    return container.lifecycle[track]
  }

  if (container[`lifecycle.${track}`]) {
    return container[`lifecycle.${track}`]
  }

  return ""
}

/* ======================================================
   SAFE LIFECYCLE COLOR
====================================================== */
const getLifecycleColor = (track: string, value: string) => {
  if (!selectedConfig.value?.lifecycles) return "grey"

  const lifecycleConfig = selectedConfig.value.lifecycles[track]
  if (!lifecycleConfig) return "grey"

  const state = lifecycleConfig.states?.find(
    (s: any) => s.code === value
  )

  return state?.color || "grey"
}

/* ======================================================
   BACK
====================================================== */
const goBack = () => {
  selectedConfig.value = null
}
</script>

<template>
  <v-container fluid class="pa-8">

    <!-- CONFIG VIEW -->
    <div v-if="!selectedConfig">
      <h1 class="mb-6">Container Planning</h1>

      <v-row>
        <v-col v-for="config in configs" :key="config.type" cols="12" sm="6" md="4" lg="3" class="d-flex">
          <div class="airbnb-card" @click="selectConfig(config)">
            <img class="card-image" :src="config.imageUrl || '/images/placeholder.jpg'" alt="container" />
            <div class="card-content">
              <div class="title">{{ config.label }}</div>
              <div class="subtitle">{{ config.category }}</div>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- INSTANCE VIEW -->
    <div v-else>

      <div class="d-flex align-center mb-6">
        <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" />
        <h2 class="ml-3">{{ selectedConfig.label }} Instances</h2>
        <v-spacer />
        <v-btn-toggle v-model="viewMode" mandatory>
          <v-btn value="grid" icon="mdi-view-grid" />
          <v-btn value="list" icon="mdi-view-list" />
        </v-btn-toggle>
      </div>

      <v-row v-if="loadingInstances" justify="center">
        <v-progress-circular indeterminate />
      </v-row>

      <v-row v-else-if="viewMode === 'grid'" align="stretch">

        <v-col v-for="container in instances" :key="container.IDX" cols="12" sm="6" md="4" lg="3" class="d-flex">
          <div class="airbnb-card">
            <img class="card-image" :src="selectedConfig.imageUrl || '/images/placeholder.jpg'" alt="container" />

            <div class="card-content">

              <div class="card-header">
                <div>
                  <div class="title">{{ container.IDX }}</div>
                  <div class="subtitle">
                    {{ getSubtitle(container) }}
                  </div>
                </div>

                <v-menu>
                  <template #activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" v-bind="props" variant="text" size="small" />
                  </template>

                  <v-list density="compact">
                    <v-list-item v-for="action in container.availableActions" :key="action.actionId"
                      @click="executeAction(container, action)">
                      <!-- {{ container.availableActions }} -->
                      <v-list-item-title>
                        {{ action.label }}
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <!-- LIFECYCLE CHIPS -->
              <div class="mt-3">
                <v-chip v-for="track in getTracks()" :key="track" size="small" class="mr-2"
                  :color="getLifecycleColor(track, getLifecycleValue(container, track))">
                  {{ getLifecycleValue(container, track) }}
                </v-chip>
              </div>

            </div>
          </div>
        </v-col>

      </v-row>

    </div>

    <!-- LOAD ACTION DRAWER -->
    <v-navigation-drawer v-model="activeAction" location="right" width="500" temporary>
      <!-- <EmcActionLoad v-if="activeAction === 'START_LOADING'" :master="activeContainer"
        :containerType="selectedConfig.type" @close="activeAction = null" @completed="handleActionCompleted" /> -->
      <EmcActionInStock v-if="activeAction === 'START_LOADING'" :master="activeContainer"
        :containerType="selectedConfig.type" @close="activeAction = null" @completed="handleActionCompleted" />
      <EmcActionInStock v-if="activeAction === 'INSTOCK'" :master="activeContainer" :containerType="selectedConfig.type"
        @close="activeAction = null" @completed="handleActionCompleted" />
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
  inline-size: 100%;
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
  flex-grow: 1;
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
  font-size: 14px;
  margin-block-start: 4px;
}
</style>
