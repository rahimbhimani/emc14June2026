<script setup lang="ts">
import { computed, ref, watch } from "vue"

const props = defineProps({
  master: { type: Object, required: true },
  containerType: { type: String, required: true }
})

const emit = defineEmits(["close", "completed"])

const organizationId = 12313
const loading = ref(false)
const selectedChildren = ref<string[]>([])
const searchMap = ref<Record<string, string>>({})

/* ======================================================
   LOAD AVAILABLE CHILD CONTAINERS
====================================================== */

const { data, refresh } = await useFetch(
  "/api/emc/container/emcPrepareAction",
  {
    method: "POST",
    body: {
      organizationId,
      containerType: props.containerType,
      containerIDX: props.master?.IDX,
      actionId: "START_LOADING"
    },
    immediate: false
  }
)

watch(
  () => props.master,
  async () => {
    if (!props.master?.IDX) return
    await refresh()
  },
  { immediate: true }
)

const groupedChildren = computed(
  () => data.value?.groupedChildren || {}
)

/* ======================================================
   FIELD RESOLVER (DOT NOTATION SUPPORT)
====================================================== */

const resolveField = (obj: any, path: string) => {
  if (!obj || !path) return ""

  const parts = path.split(".")
  let value = obj

  for (const p of parts) {
    value = value?.[p]
    if (value === undefined) break
  }

  return value ?? ""
}

/* ======================================================
   FILTER ITEMS PER TYPE
====================================================== */

const getFilteredItems = (group: any, type: string) => {

  const items = Array.isArray(group) ? group : group?.items || []

  const search = (searchMap.value[type] || "").toLowerCase()
  if (!search) return items

  const fields =
    group?.config?.projection?.listView || ["IDX"]

  return items.filter((item: any) => {
    return fields.some((field: string) => {
      const value = resolveField(item, field)
      return String(value)
        .toLowerCase()
        .includes(search)
    })
  })
}

/* ======================================================
   CONFIRM LOAD
====================================================== */

const confirmLoad = async () => {

  if (selectedChildren.value.length === 0) return

  loading.value = true

  try {
    await $fetch("/api/emc/container/emcExecuteLifecycleAction", {
      method: "POST",
      body: {
        organizationId,
        containerType: props.containerType,
        containerIDX: props.master.IDX,
        actionId: "START_LOADING",
        payload: {
          selectedChildren: selectedChildren.value
        },
        userContext: {
          userId: "USR-001",
          role: "MANAGER"
        }
      }
    })

    emit("completed")

  } catch (err) {
    console.error("Load failed:", err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="pa-4">

    <!-- HEADER -->
    <div class="d-flex align-center mb-4">
      <h3 class="font-weight-bold">
        Load {{ master?.IDX }}
      </h3>
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" @click="emit('close')" />
    </div>

    <!-- MASTER CARD -->
    <v-card class="pa-4 mb-6" elevation="2">
      <div class="text-subtitle-1 font-weight-medium">
        {{ master?.IDX }}
      </div>

      <div class="mt-2">
        <v-chip v-for="(value, key) in master?.lifecycle" :key="key" size="small" class="mr-2">
          {{ value }}
        </v-chip>
      </div>
    </v-card>

    <!-- CHILD GROUPS -->
    <div v-for="(group, type) in groupedChildren" :key="type" class="mb-8">

      <h4 class="mb-2 font-weight-medium">
        {{ type }}
      </h4>

      <!-- SEARCH -->
      <v-text-field v-model="searchMap[type]" density="compact" variant="outlined" placeholder="Search..."
        prepend-inner-icon="mdi-magnify" class="mb-3" hide-details />

      <!-- LIST -->
      <v-list density="compact">

        <v-list-item v-for="item in getFilteredItems(group, type)" :key="item.IDX" class="align-start">

          <v-checkbox v-model="selectedChildren" :value="item.IDX" hide-details />

          <div class="ml-3 flex-grow-1">

            <!-- Static Projection Fields -->
            <div v-for="field in group.config?.projection?.listView" :key="field" class="text-caption">
              {{ resolveField(item, field) }}
            </div>

            <!-- Inventory Quantity (ONLY for inventoryManaged types) -->
            <div v-if="group.config?.inventoryManaged" class="text-caption font-weight-medium text-primary mt-1">
              Current Qty: {{ item.currentQuantity || 0 }}
            </div>

          </div>

        </v-list-item>

      </v-list>

      <div v-if="getFilteredItems(group, type)?.length === 0" class="text-grey text-caption mt-2">
        No matching {{ type }}
      </div>

    </div>

    <!-- CONFIRM BUTTON -->
    <v-btn block color="primary" size="large" :loading="loading" :disabled="selectedChildren.length === 0"
      @click="confirmLoad">
      Confirm Load
    </v-btn>

  </v-container>
</template>

<style scoped>
h3 {
  font-size: 18px;
}

h4 {
  font-size: 16px;
}
</style>
