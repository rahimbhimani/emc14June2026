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
const groupedChildren = ref<any>({})

const selectedChildren = ref<string[]>([])
const selectedUserChildren = ref<string[]>([])

const quantityMap = ref<Record<string, number>>({})
const movementMap = ref<Record<string, any>>({})

const strategy =
  props.actionConfig?.orchestration?.sourceStrategy || "PARENT"



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

    groupedChildren.value = res?.groupedChildren || {}

    initializeSelections()

  }
  catch (err) {

    console.error("movement load error", err)

  }
  finally {

    loading.value = false

  }

}

onMounted(loadMovement)



/* ======================================================
STRUCTURAL RULES
====================================================== */

function isAssignedHere(item: any) {
  return item?.assignedHere || item?.parentIDX === props.master?.IDX
}

function isAssignedElsewhere(item: any) {
  return item?.assignedElsewhere ||
    (item?.parentIDX && item.parentIDX !== props.master?.IDX)
}



function initializeSelections() {

  const selected: string[] = []

  const trolleys = groupedChildren.value?.Trolley?.items || []

  for (const item of trolleys) {

    if (item?.assignedHere || item?.parentIDX === props.master?.IDX) {

      selected.push(item.IDX)

    }

  }

  selectedChildren.value = selected

}



/* ======================================================
USER SELECTION TRACKING
====================================================== */

function addToUserSelected(idx: string) {

  if (!selectedUserChildren.value.includes(idx)) {

    selectedUserChildren.value.push(idx)

  }
  else {

    selectedUserChildren.value =
      selectedUserChildren.value.filter(i => i !== idx)

  }

}



/* ======================================================
MULTI SOURCE QUANTITY
====================================================== */

function setQty(productIDX: string, sourceIDX: string, qty: number) {

  if (!movementMap.value[productIDX])
    movementMap.value[productIDX] = {}

  movementMap.value[productIDX][sourceIDX] = qty

}



/* ======================================================
CONFIRM MOVEMENT
====================================================== */

async function confirmMovement() {

  loading.value = true

  try {

    await $fetch(
      "/api/emc/movement/emcExecuteAction",
      {
        method: "POST",
        body: {
          organizationId,
          destinationType: props.containerType,
          destinationIDX: props.master?.IDX,
          actionId: props.actionId,

          payload: {
            products: quantityMap.value,
            sources: movementMap.value,
            containers: selectedUserChildren.value
          },

          userContext: {
            userId: "USR-001",
            role: "MANAGER"
          }
        }
      }
    )

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

  <v-card class="movement-drawer">

    <!-- HEADER -->

    <div class="drawer-header">

      <div class="title">

        {{ actionConfig?.label || actionId }} → {{ master?.IDX }}

      </div>

      <v-btn icon="mdi-close" variant="text" @click="emit('close')" />

    </div>



    <!-- CONTENT -->

    <div class="drawer-content">

      <div v-for="(group, type) in groupedChildren" :key="type" class="mb-6">

        <h3 class="section-title">

          {{ group?.config?.label || type }}

        </h3>



        <!-- INVENTORY PRODUCTS -->

        <div v-if="group?.config?.inventoryManaged">

          <v-card v-for="item in group?.items || []" :key="item?.IDX" class="product-card">

            <div class="product-name">

              {{ item?.name || item?.tbProduct?.Name || item?.IDX }}

            </div>



            <!-- CURRENT -->

            <div class="product-stock">

              Current: {{ item?.currentQuantity || 0 }}

            </div>



            <!-- NONE -->

            <div v-if="!item?.sources">

              <v-text-field v-model.number="quantityMap[item.IDX]" type="number" density="compact" label="Add Qty" />

            </div>



            <!-- SINGLE SOURCE -->

            <div v-if="item?.sources?.length === 1">

              <v-row>

                <v-col cols="4">

                  {{ item.sources[0].containerIDX }}

                </v-col>

                <v-col cols="2">

                  {{ item.sources[0].available }}

                </v-col>

                <v-col cols="6">

                  <v-text-field v-model.number="quantityMap[item.IDX]" type="number" density="compact" label="Qty" />

                </v-col>

              </v-row>

            </div>



            <!-- MULTI SOURCE -->

            <div v-if="item?.sources?.length > 1">

              <v-table density="compact">

                <thead>

                  <tr>
                    <th>Source</th>
                    <th>Available</th>
                    <th>Qty</th>
                  </tr>

                </thead>

                <tbody>

                  <tr v-for="source in item.sources" :key="source.containerIDX">

                    <td>{{ source.containerIDX }}</td>

                    <td>{{ source.available }}</td>

                    <td>

                      <v-text-field type="number" :min="0" :max="source.available" density="compact"
                        @update:model-value="
                          val => setQty(item.IDX, source.containerIDX, Number(val))
                        " />

                    </td>

                  </tr>

                </tbody>

              </v-table>

            </div>

          </v-card>

        </div>



        <!-- STRUCTURAL CONTAINERS -->

        <v-list v-else>

          <v-list-item v-for="item in group?.items || []" :key="item?.IDX" v-if="!isAssignedElsewhere(item)">

            <v-checkbox v-model="selectedChildren" :value="item.IDX" :disabled="isAssignedHere(item)"
              :model-value="isAssignedHere(item)" @update:model-value="addToUserSelected(item.IDX)" hide-details />

            <v-list-item-title>

              {{ item?.name || item?.tbTrolley?.tbMain?.Name || item?.IDX }}

            </v-list-item-title>

          </v-list-item>

        </v-list>

      </div>

    </div>



    <!-- FOOTER -->

    <div class="drawer-footer">

      <v-btn block color="primary" size="large" :loading="loading" @click="confirmMovement">

        Confirm Movement

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
  padding: 12px;
  margin-block-end: 12px;
}

.product-name {
  font-weight: 600;
}

.product-stock {
  color: #666;
  font-size: 12px;
  margin-block-end: 6px;
}
</style>
