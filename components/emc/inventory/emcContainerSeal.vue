<script setup lang="ts">
import { onMounted, ref } from "vue"

const props = defineProps({
  master: { type: Object, required: true },
  containerType: { type: String, required: true },
  actionId: { type: String, required: true },
  actionConfig: { type: Object, default: () => ({}) }
})

const emit = defineEmits(["close", "completed"])

const organizationId = 12313

const loading = ref(false)

const tab = ref("available")

/* ==========================
SEAL DATA
========================== */

const sealNumber = ref("")
const sealRemarks = ref("")

const groupedChildren = ref<any>({})
const inventoryItems = ref<any[]>([])

const quantityMap = ref<Record<string, number>>({})
const movementMap = ref<Record<string, any>>({})

const selectedContainers = ref<string[]>([])
const selectedUserContainers = ref<string[]>([])

let sourceStrategy =
  props.actionConfig?.orchestration?.sourceStrategy || "NONE"

/* ======================================================
LOAD MOVEMENT DATA
====================================================== */

async function loadMovement() {

  loading.value = true

  try {

    const res: any = await $fetch(
      "/api/emc/movement/emcPrepareMovement",
      {
        method: "POST",
        body: {
          organizationId,
          destinationType: props.containerType,
          destinationIDX: props.master?.IDX,
          actionId: props.actionId
        }
      }
    )

    sourceStrategy =
      res.orchestration?.sourceStrategy || "NONE"

    groupedChildren.value = res.groupedChildren || {}

    initializeSelections()

  }
  catch (err) {
    console.error("movement load error", err)
  }
  finally {
    loading.value = false
  }

}

/* ======================================================
LOAD CURRENT INVENTORY
====================================================== */

async function loadInventory() {

  try {

    const res: any = await $fetch(
      "/api/emc/emcInventory/emcRetrieveInventory",
      {
        method: "POST",
        body: {
          organizationId,
          containerType: props.containerType,
          containerIDX: props.master.IDX
        }
      }
    )

    inventoryItems.value = res.items || []

  }
  catch (err) {
    console.error("inventory load error", err)
  }

}

onMounted(async () => {
  await loadMovement()
  await loadInventory()
})

/* ======================================================
STRUCTURAL LOGIC
====================================================== */

function isAssignedHere(item: any) {
  return item.parentIDX === props.master.IDX
}

function isAssignedElsewhere(item: any) {
  return item.parentIDX && item.parentIDX !== props.master.IDX
}

function initializeSelections() {

  const selected: string[] = []

  const trolleys = groupedChildren.value?.Trolley?.items || []

  for (const item of trolleys) {

    if (item.parentIDX === props.master.IDX) {
      selected.push(item.IDX)
    }

  }

  selectedContainers.value = selected

}

/* ======================================================
USER SELECTION
====================================================== */

function toggleContainer(idx: string) {

  if (!selectedUserContainers.value.includes(idx))
    selectedUserContainers.value.push(idx)
  else
    selectedUserContainers.value =
      selectedUserContainers.value.filter(i => i !== idx)

}

/* ======================================================
MULTI SOURCE QTY
====================================================== */

function setSourceQty(productIDX: string, sourceIDX: string, qty: number) {

  if (!movementMap.value[productIDX])
    movementMap.value[productIDX] = {}

  movementMap.value[productIDX][sourceIDX] = qty

}

/* ======================================================
CONFIRM MOVEMENT
====================================================== */

async function confirmMovement() {

  if (!sealNumber.value) {
    alert("Seal Number is required")
    return
  }

  loading.value = true

  try {

    const containers: any = {}

    for (const type in groupedChildren.value) {

      const group = groupedChildren.value[type]
      const config = group.config

      if (config.inventoryManaged) {

        const quantities = quantityMap.value
        const sources = movementMap.value

        if (
          Object.keys(quantities).length ||
          Object.keys(sources).length
        ) {

          containers[type] = {}

          if (Object.keys(quantities).length)
            containers[type].quantities = quantities

          if (Object.keys(sources).length)
            containers[type].sources = sources

        }

      }
      else {

        if (selectedUserContainers.value.length) {

          containers[type] = {
            children: selectedUserContainers.value
          }

        }

      }

    }

    const payload = {

      organizationId,

      actionId: props.actionId,

      destination: {
        type: props.containerType,
        idx: props.master.IDX
      },

      containers,

      input: {
        sealNumber: sealNumber.value,
        remarks: sealRemarks.value
      },

      userContext: {
        userId: "USR-001",
        role: "MANAGER"
      }

    }

    await $fetch(
      "/api/emc/movement/emcExecuteAction",
      {
        method: "POST",
        body: payload
      }
    )

    /* =========================
    REFRESH DATA
    ========================= */

    await loadMovement()
    await loadInventory()

    quantityMap.value = {}
    movementMap.value = {}

    selectedUserContainers.value = []

    sealNumber.value = ""
    sealRemarks.value = ""
    emit("completed")
  }
  catch (err) {
    console.error("movement failed", err)
  }
  finally {
    loading.value = false
  }

}

</script>

<template>
  lETS SEAL IT
  <v-card class="movement-drawer">

    <!-- HEADER -->

    <div class="drawer-header">

      <div class="title">
        {{ actionConfig?.label || actionId }} → {{ master?.IDX }}
      </div>

      <v-btn icon="mdi:close" variant="text" @click="emit('close')" />

    </div>

    <!-- TABS -->

    <v-tabs v-model="tab">
      <v-tab value="available">Seal Details</v-tab>
      <v-tab value="inventory">Current Inventory</v-tab>
    </v-tabs>

    <v-window v-model="tab">

      <!-- ======================================
      TAB 1 : AVAILABLE
      ====================================== -->

      <v-window-item value="available">

        <div class="drawer-content">

          <!-- SEAL INFORMATION -->

          <v-card class="mb-6 pa-4">

            <div class="section-title">
              Seal Information
            </div>

            <v-row>

              <v-col cols="12">

                <v-text-field v-model="sealNumber" label="Seal Number" density="compact" required />

              </v-col>

              <v-col cols="12">

                <v-textarea v-model="sealRemarks" label="Remarks" density="compact" rows="2" />

              </v-col>

            </v-row>

          </v-card>

          <!-- EXISTING MOVEMENT UI -->

          <div v-for="(group, type) in groupedChildren" :key="type" class="mb-6">

            <h3 class="section-title">
              {{ group.config?.label || type }}
            </h3>

            <!-- INVENTORY PRODUCTS -->

            <div v-if="group.config.inventoryManaged">

              <v-row class="font-weight-bold mb-2">

                <v-col cols="4">Product</v-col>
                <v-col cols="2">Source</v-col>
                <v-col cols="2">Available</v-col>
                <v-col cols="2">In Container</v-col>
                <v-col cols="2">Load</v-col>

              </v-row>

              <v-card v-for="item in group.items" :key="item.IDX" class="product-card">

                <v-row align="center">

                  <v-col cols="4">
                    {{ item.tbProduct?.Name || item.IDX }}
                  </v-col>

                  <v-col cols="2">
                    {{ item.sources?.[0]?.containerIDX || "-" }}
                  </v-col>

                  <v-col cols="2">
                    {{ item.sources?.[0]?.available || 0 }}
                  </v-col>

                  <v-col cols="2">
                    {{ item.currentQuantity || 0 }}
                  </v-col>

                  <v-col cols="2">

                    <v-text-field v-model.number="quantityMap[item.IDX]" type="number" density="compact" label="Load" />

                  </v-col>

                </v-row>

              </v-card>

            </div>

            <!-- STRUCTURAL CONTAINERS -->

            <v-list v-else>

              <v-list-item v-for="item in group.items.filter(i => !isAssignedElsewhere(i))" :key="item.IDX">

                <v-checkbox v-model="selectedContainers" :value="item.IDX" :disabled="isAssignedHere(item)"
                  :model-value="isAssignedHere(item)" @update:model-value="toggleContainer(item.IDX)" hide-details />

                <v-list-item-title>
                  {{ item.tbTrolley?.tbMain?.Name || item.IDX }}
                </v-list-item-title>

              </v-list-item>

            </v-list>

          </div>

        </div>

      </v-window-item>

      <!-- ======================================
      TAB 2 : CURRENT INVENTORY
      ====================================== -->

      <v-window-item value="inventory">

        <div class="drawer-content">

          <div v-for="(items, type) in inventoryItems" :key="type" class="inventory-section">

            <div class="section-title">

              {{ type }}

              <v-chip size="small" class="ml-2" color="primary" variant="tonal">
                {{ items.length }}
              </v-chip>

            </div>

            <v-list density="compact">

              <v-list-item v-for="row in items" :key="row.idx" class="inventory-row">

                <v-list-item-title>
                  {{ row.label }}
                </v-list-item-title>

                <template #append>

                  <v-chip v-if="row.quantity !== undefined" color="green" size="small" variant="tonal">
                    {{ row.quantity }}
                  </v-chip>

                </template>

              </v-list-item>

            </v-list>

          </div>

        </div>

      </v-window-item>

    </v-window>

    <!-- FOOTER -->

    <div class="drawer-footer">

      <v-btn block color="primary" size="large" :loading="loading" @click="confirmMovement">
        Confirm Seal
      </v-btn>

    </div>

  </v-card>

</template>

<style scoped>
.movement-drawer {
  display: flex;
  flex-direction: column;
  block-size: 100vh;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-block-end: 1px solid #eee;
}

.drawer-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.drawer-footer {
  padding: 16px;
  border-block-start: 1px solid #eee;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-block-end: 10px;
}

.product-card {
  padding: 10px;
  margin-block-end: 6px;
}
</style>
