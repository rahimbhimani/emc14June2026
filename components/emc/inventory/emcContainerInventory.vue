<script setup lang="ts">
import { onMounted, ref } from "vue"

const props = defineProps({
  containerType: String,
  containerIDX: String
})

const organizationId = 12313

const inventoryItems = ref<any>({})
const loading = ref(false)

async function loadInventory() {

  loading.value = true

  try {

    const res: any = await $fetch(
      "/api/emc/emcInventory/emcRetrieveInventory",
      {
        method: "POST",
        body: {
          organizationId,
          containerType: props.containerType,
          containerIDX: props.containerIDX
        }
      }
    )

    inventoryItems.value = res.items || {}

  }
  finally {

    loading.value = false

  }

}

onMounted(loadInventory)
</script>

<template>

  <v-card class="inventory-card">

    <!-- HEADER -->

    <div class="inventory-header">

      <div class="title">
        Inventory — {{ containerIDX }}
      </div>

    </div>

    <v-divider />

    <!-- LOADING -->

    <div v-if="loading" class="inventory-loading">

      <v-progress-circular indeterminate />

    </div>


    <!-- INVENTORY CONTENT -->

    <div v-else class="inventory-content">

      <div v-for="(items, type) in inventoryItems" :key="type" class="inventory-section">

        <!-- SECTION TITLE -->

        <div class="section-title">

          {{ type }}

          <v-chip size="small" class="ml-2" color="primary" variant="tonal">
            {{ items.length }}
          </v-chip>

        </div>


        <!-- ITEM LIST -->

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


      <!-- EMPTY STATE -->

      <div v-if="Object.keys(inventoryItems).length === 0" class="empty-state">
        No inventory found
      </div>

    </div>

  </v-card>

</template>

<style scoped>
.inventory-card {
  display: flex;
  flex-direction: column;
  block-size: 100%;
}

.inventory-header {
  padding: 16px;
  font-size: 18px;
  font-weight: 600;
}

.inventory-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.inventory-section {
  margin-block-end: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-block-end: 8px;
}

.inventory-row {
  border-block-end: 1px solid #f0f0f0;
}

.inventory-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.empty-state {
  padding: 40px;
  color: #888;
  text-align: center;
}
</style>
