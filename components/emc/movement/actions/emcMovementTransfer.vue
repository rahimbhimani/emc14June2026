<script setup lang="ts">
import { computed, ref, watch } from "vue"

const props = defineProps({
  master: { type: Object, required: true },
  containerType: { type: String, required: true },
  actionId: { type: String, required: true }
})

const emit = defineEmits(["close", "completed"])

const organizationId = 12313

const loading = ref(false)
const movementMap = ref<Record<string, Record<string, number>>>({})

/* LOAD PREPARE MOVEMENT */

const { data, refresh } = await useFetch(
  "/api/emc/movement/emcPrepareMovement",
  {
    method: "POST",
    body: {
      organizationId,
      destinationType: props.containerType,
      destinationIDX: props.master?.IDX,
      actionId: props.actionId
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

const groupedChildren = computed(() => data.value?.groupedChildren || {})

/* FIELD RESOLVER */

const resolveField = (obj: any, path: string) => {
  if (!obj || !path) return ""

  const parts = path.split(".")
  let val = obj

  for (const p of parts) {
    val = val?.[p]
  }

  return val ?? ""
}

/* TOTAL TRANSFER */

const getTotalTransfer = (productIDX: string) => {

  const sources = movementMap.value[productIDX] || {}

  return Object.values(sources).reduce((a, b) => a + (b || 0), 0)
}

/* CONFIRM TRANSFER */

const confirmTransfer = async () => {

  loading.value = true

  try {

    const movements: any[] = []

    for (const productIDX in movementMap.value) {

      const sources = movementMap.value[productIDX]

      const srcList: any[] = []

      for (const containerIDX in sources) {

        const qty = sources[containerIDX]

        if (qty > 0) {

          srcList.push({
            containerIDX,
            quantity: qty
          })
        }
      }

      if (srcList.length) {

        movements.push({
          type: "inventoryTransfer",
          productIDX,
          sources: srcList
        })
      }
    }

    await $fetch("/api/emc/movement/emcExecuteAction", {
      method: "POST",
      body: {
        organizationId,
        destinationType: props.containerType,
        destinationIDX: props.master.IDX,
        actionId: props.actionId,
        movements
      }
    })

    emit("completed")

  }
  catch (err) {
    console.error("Transfer failed", err)
  }
  finally {
    loading.value = false
  }
}
</script>


<template>

  <v-container class="pa-4">

    <div class="d-flex align-center mb-4">
      <h3>Transfer to {{ master.IDX }}</h3>
      <v-spacer />
      <v-btn icon="mdi-close" variant="text" @click="emit('close')" />
    </div>

    <div class="movement-body">

      <div v-for="(group, type) in groupedChildren" :key="type">

        <v-card v-for="product in group.items" :key="product.IDX" class="mb-4 pa-4" elevation="1">

          <v-card-title class="text-subtitle-1 font-weight-medium">
            {{ resolveField(product, "tbProduct.Name") }}
          </v-card-title>

          <v-card-subtitle>
            Total Available: {{ product.totalAvailable }}
          </v-card-subtitle>

          <v-divider class="my-3" />

          <v-row v-for="src in product.sources" :key="src.containerIDX" class="align-center">

            <v-col cols="4">
              {{ src.containerIDX }}
            </v-col>

            <v-col cols="3">
              Available: {{ src.available }}
            </v-col>

            <v-col cols="5">

              <v-text-field v-model.number="movementMap[product.IDX][src.containerIDX]" type="number" min="0"
                :max="src.available" density="compact" variant="outlined" label="Qty" />

            </v-col>

          </v-row>

          <v-divider class="my-3" />

          <div class="text-caption text-grey">
            Transfer Total: {{ getTotalTransfer(product.IDX) }}
          </div>

        </v-card>

      </div>

    </div>

    <v-btn block color="primary" size="large" :loading="loading" @click="confirmTransfer">
      Confirm Transfer
    </v-btn>

  </v-container>

</template>


<style scoped>
.movement-body {
  max-block-size: 65vh;
  overflow-y: auto;
}
</style>
