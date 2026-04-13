<script setup lang="ts">
import emcInventoryViewer from "@/components/emcInventoryViewer.vue"
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

    inventoryItems.value =
      res.items || {}
  } finally {
    loading.value = false
  }
}

onMounted(loadInventory)
</script>

<template>
  <v-card class="inventory-card">

    <emcInventoryViewer :items="inventoryItems" :loading="loading" :title="`Inventory — ${containerIDX}`" />

  </v-card>
</template>

<style scoped>
.inventory-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  block-size: 100%;
}
</style>
