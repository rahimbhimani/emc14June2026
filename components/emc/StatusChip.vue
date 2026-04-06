<template>
  <v-chip :color="color" size="small" variant="tonal" class="text-uppercase">
    {{ displayValue }}
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps({
  value: {
    type: String,
    default: ""
  },
  item: {
    type: Object,
    default: () => ({})
  }
})

/* ======================================================
   COLOR MAPPING (CONFIG-DRIVEN READY)
====================================================== */

const colorMap: Record<string, string> = {
  READY: "grey",
  LOADING: "warning",
  LOADED: "primary",
  SEALED: "success",
  CLOSED: "error",
  BCL_REJECTED: "error",

  UNSEALED: "orange"
}

/* ======================================================
   DISPLAY VALUE
====================================================== */

const displayValue = computed(() => {
  if (!props.value) return "-"
  return props.value.replaceAll("_", " ")
})

/* ======================================================
   COLOR RESOLUTION
====================================================== */

const color = computed(() => {
  if (!props.value) return "default"
  return colorMap[props.value] || "default"
})
</script>

<style scoped>
.text-uppercase {
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
</style>
