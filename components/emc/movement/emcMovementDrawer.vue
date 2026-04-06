<script setup lang="ts">
import emcContainerInventory from "@/components/emc/inventory/emcContainerInventory.vue"
import { computed } from "vue"
import emcMovementAssign from "./actions/emcMovementAssign.vue"
import emcMovementIn from "./actions/emcMovementIn.vue"
import emcMovementTransfer from "./actions/emcMovementTransfer.vue"

const props = defineProps({
  container: Object,
  actionId: String,
  containerType: String
})

const emit = defineEmits(["close"])

const organizationId = 12313

/* ======================================================
   LOAD ACTION CONFIG
====================================================== */

const { data } = await useFetch(
  "/api/emc/container/emcGetActionDefinition",
  {
    method: "POST",
    body: {
      organizationId,
      containerType: props.containerType,
      actionId: props.actionId
    }
  }
)

const movementType = computed(
  () => data.value?.action?.orchestration?.movementType
)

/* ======================================================
   DYNAMIC COMPONENT RESOLUTION
====================================================== */

const movementComponent = computed(() => {

  switch (movementType.value) {
    case "IN":
      return emcMovementIn
    case "VIEW_INVENTORY":
      return emcContainerInventory
    case "TRANSFER":
      return emcMovementTransfer
    case "ASSIGN":
      return emcMovementAssign
    default:
      return null
  }
})
</script>

<template>
  <v-navigation-drawer :model-value="true" location="right" width="500" temporary>
    <component v-if="movementComponent" :is="movementComponent" :container="container" :containerType="containerType"
      :actionId="actionId" @close="emit('close')" />

    <v-container v-else>
      <h3>Movement type not supported</h3>
      <v-btn @click="emit('close')">Close</v-btn>
    </v-container>

  </v-navigation-drawer>
</template>
