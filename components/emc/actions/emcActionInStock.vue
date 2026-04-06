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
const quantityMap = ref<Record<string, number>>({})

/* ======================================================
   LOAD PREPARE ACTION
====================================================== */

const { data, refresh } = await useFetch(
  "/api/emc/container/emcPrepareAction",
  {
    method: "POST",
    body: {
      organizationId,
      containerType: props.containerType,
      containerIDX: props.master?.IDX,
      actionId: "INSTOCK"
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
   STRUCTURAL RULE HELPERS
====================================================== */

const isMappedToCurrent = (item: any) => {
  return (
    item.parentContainerType === props.containerType &&
    item.parentContainerIDX === props.master?.IDX
  )
}

const isAvailableForMapping = (item: any) => {
  return !item.parentContainerIDX
}

/* ======================================================
   FIELD RESOLVER
====================================================== */

const resolveField = (obj: any, path: string) => {
  if (!obj || !path) return ""

  return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? ""
}

/* ======================================================
   PAYLOAD BUILDER
====================================================== */

const buildPayload = () => {

  const cleanQuantities: Record<string, number> = {}

  for (const key of Object.keys(quantityMap.value)) {
    const qty = Number(quantityMap.value[key] || 0)
    if (qty > 0) {
      cleanQuantities[key] = qty
    }
  }

  return {
    quantities: cleanQuantities,
    selectedChildren: selectedChildren.value
  }
}

/* ======================================================
   CONFIRM VALIDATION
====================================================== */

const canConfirm = computed(() => {

  const hasQty = Object.values(quantityMap.value)
    .some(q => Number(q) > 0)

  const hasSelection = selectedChildren.value.length > 0

  return hasQty || hasSelection
})

/* ======================================================
   CONFIRM ACTION
====================================================== */

const confirmInstock = async () => {

  if (!canConfirm.value) return

  loading.value = true

  try {

    await $fetch("/api/emc/container/emcExecuteLifecycleAction", {
      method: "POST",
      body: {
        organizationId,
        containerType: props.containerType,
        containerIDX: props.master.IDX,
        actionId: "INSTOCK",
        payload: buildPayload(),
        userContext: {
          userId: "USR-001",
          role: "MANAGER"
        }
      }
    })

    emit("completed")

  } catch (err) {
    console.error("InStock failed:", err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  IN STOCK COMPONENT
  <v-container class="pa-4">

    <!-- HEADER -->
    <div class="d-flex align-center mb-4">
      <h3>In Stock - {{ master?.IDX }}</h3>
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" @click="emit('close')" />
    </div>

    <div class="overflow-y-auto" style="max-block-size: 80vh;">

      <div v-for="(group, type) in groupedChildren" :key="type" class="mb-8">

        <h4 class="mb-3">{{ type }}</h4>

        <v-list density="compact">

          <v-list-item v-for="item in group.items" :key="item.IDX" class="align-start">

            <!-- INVENTORY MANAGED -->
            <template v-if="group.config?.inventoryManaged">

              <v-text-field v-model.number="quantityMap[item.IDX]" type="number" min="0" density="compact"
                variant="outlined" label="Add Qty" style="max-inline-size: 120px;" />

            </template>

            <!-- STRUCTURAL -->
            <template v-else>

              <v-checkbox :model-value="isMappedToCurrent(item) || selectedChildren.includes(item.IDX)"
                :disabled="isMappedToCurrent(item)" @update:model-value="val => {
                  if (val) selectedChildren.push(item.IDX)
                  else selectedChildren = selectedChildren.filter(i => i !== item.IDX)
                }" hide-details />

            </template>

            <div class="ml-3 flex-grow-1">

              <div v-for="field in group.config?.projection?.listView" :key="field" class="text-caption">
                {{ resolveField(item, field) }}
              </div>

              <div v-if="group.config?.inventoryManaged" class="text-caption text-primary mt-1">
                Current Qty: {{ item.currentQuantity || 0 }}
              </div>

              <!-- Already Loaded Indicator -->
              <div v-if="!group.config?.inventoryManaged && isMappedToCurrent(item)"
                class="text-caption text-success mt-1">
                Already loaded in this container
              </div>

            </div>

          </v-list-item>

        </v-list>

      </div>

    </div>

    <v-btn block color="primary" :loading="loading" :disabled="!canConfirm" @click="confirmInstock">
      Confirm In Stock
    </v-btn>

  </v-container>
</template>
