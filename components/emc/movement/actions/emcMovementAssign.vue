<script setup lang="ts">
const emit = defineEmits(["close"])
</script>

<template>
  <v-container>
    <h3>Transfer Movement (Coming Soon)</h3>
    <v-btn @click="emit('close')">Close</v-btn>
  </v-container>
</template>
