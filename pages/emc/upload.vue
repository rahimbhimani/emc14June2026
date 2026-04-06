<script setup lang="ts">
const showUpload = ref(false)
</script>

<template>
  <v-container>

    <v-btn color="primary" @click="showUpload = true">
      Upload Crew Mapping
    </v-btn>

    <emcFileUploadDialog v-model="showUpload" uploadId="CREW_FLIGHT_MAPPING" />

  </v-container>
</template>
