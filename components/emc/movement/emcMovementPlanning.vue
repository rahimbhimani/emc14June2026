<script setup lang="ts">
import emcMovementIn from "@/components/emc/movement/actions/emcMovementIn.vue"
import { computed, ref, watch } from "vue"

/* ======================================================
   STATE
====================================================== */

const organizationId = 12313
const userRole = "MANAGER"

const selectedConfig = ref<any>(null)
const instances = ref<any[]>([])
const loadingInstances = ref(false)

const activeContainer = ref<any>(null)
const activeAction = ref<string | null>(null)
const isDrawerOpen = ref(false)

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

  if (!selectedConfig.value || !container?.IDX) return []

  try {

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

  } catch (err) {
    console.error("Failed loading actions:", err)
    return []
  }
}

/* ======================================================
   EXECUTE ACTION
====================================================== */

const executeAction = (container: any, action: any) => {

  activeContainer.value = container
  activeAction.value = action.actionId

  isDrawerOpen.value = true
}

/* ======================================================
   HANDLE DRAWER CLOSE
====================================================== */

watch(isDrawerOpen, (val) => {
  if (!val) {
    activeAction.value = null
    activeContainer.value = null
  }
})

/* ======================================================
   BACK
====================================================== */

const goBack = () => {
  selectedConfig.value = null
}
</script>

<template>
  <v-container fluid class="pa-8">
    RAHIM
    <!-- CONFIG LIST VIEW -->
    <div v-if="!selectedConfig">

      <h1 class="mb-6">Movement Planning</h1>

      <v-row>
        <v-col v-for="config in configs" :key="config.type" cols="12" sm="6" md="4" lg="3">
          <div class="airbnb-card" @click="selectConfig(config)">
            <img class="card-image" :src="config.imageUrl || '/images/placeholder.jpg'" />
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
      </div>

      <v-row v-if="loadingInstances" justify="center">
        <v-progress-circular indeterminate />
      </v-row>

      <v-row v-else>

        <v-col v-for="container in instances" :key="container.IDX" cols="12" sm="6" md="4" lg="3">
          <div class="airbnb-card">

            <img class="card-image" :src="selectedConfig.imageUrl || '/images/placeholder.jpg'" />

            <div class="card-content">

              <div class="card-header">
                <div>
                  <div class="title">{{ container.IDX }}</div>
                </div>

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

    <!-- MOVEMENT DRAWER -->

    <v-navigation-drawer v-model="isDrawerOpen" location="right" width="500" temporary>
      <emcMovementIn v-if="activeAction" :container="activeContainer" :containerType="selectedConfig?.type"
        :actionId="activeAction" @close="isDrawerOpen = false" />
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
}
</style>
