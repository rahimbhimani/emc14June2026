<script setup lang="ts">
import { onMounted, ref, watch } from "vue"

const props = defineProps({
  master: Object,
  containerType: String
})

const emit = defineEmits(["close", "completed"])

const organizationId = 12313

const config = ref<any>(null)

const selectedTrack = ref("")
const selectedStatus = ref("")
const reason = ref("")

const loading = ref(false)

/* =====================================
   LOAD CONFIG
===================================== */

async function loadConfig() {

  const res: any = await $fetch(
    "/api/emc/container/emcRetrieveContainerConfigs",
    {
      method: "POST",
      body: { organizationId }
    }
  )

  config.value = res.configs.find(
    (c: any) => c.type === props.containerType
  )

}

onMounted(loadConfig)

/* =====================================
   TRACKS + STATES
===================================== */

const tracks = () => {

  if (!config.value?.lifecycles) return []

  return Object.keys(config.value.lifecycles).map(track => ({
    title: track.toUpperCase(),
    value: track
  }))
}

const states = () => {
  if (!selectedTrack.value) return []

  const rawStates =
    config.value?.lifecycles?.[selectedTrack.value]?.states || []

  return rawStates.map((s: any) => {
    // If already object
    if (typeof s === "object") {
      return {
        title: s.label || s.code,
        value: s.code || s.value
      }
    }

    // If string
    return {
      title: s,
      value: s
    }
  })
}

/* =====================================
   RESET STATUS WHEN TRACK CHANGES
===================================== */

watch(selectedTrack, () => {
  selectedStatus.value = ""
})

/* =====================================
   CONFIRM
===================================== */

async function confirm() {

  /* VALIDATION */

  if (!selectedTrack.value || !selectedStatus.value) {
    alert("Please select track and status")
    return
  }

  loading.value = true

  try {

    const requestPayload = {
      organizationId,

      actionId: "CHANGE_STATUS",

      destination: {
        type: props.containerType,
        idx: props.master?.IDX
      },

      containers: {},

      /* ✅ CORRECT STRUCTURE */

      input: {
        track: selectedTrack.value,
        status: selectedStatus.value,
        remarks: reason.value
      },

      userContext: {
        userId: "USR-001",
        role: "ADMIN"
      }
    }

    console.log("CHANGE_STATUS PAYLOAD", requestPayload)
    console.log("Selected Track:", selectedTrack.value)
    console.log("Selected Status:", selectedStatus.value)
    await $fetch(
      "/api/emc/movement/emcExecuteAction",
      {
        method: "POST",
        body: requestPayload
      }
    )

    emit("completed")

  } catch (err) {

    console.error("CHANGE_STATUS error", err)

  } finally {

    loading.value = false

  }

}
</script>

<template>
  <v-card>

    <!-- HEADER -->

    <v-card-title>
      Change Status — {{ master?.IDX }}
    </v-card-title>

    <v-card-text>

      <!-- TRACK -->

      <v-select v-model="selectedTrack" :items="tracks()" item-title="title" item-value="value" label="Lifecycle Track"
        density="comfortable" />

      <!-- STATUS -->

      <v-select v-model="selectedStatus" :items="states()" item-title="title" item-value="value" label="Select Status"
        density="comfortable" :disabled="!selectedTrack" />

      <!-- REASON -->

      <v-textarea v-model="reason" label="Reason (Optional)" rows="2" />

    </v-card-text>

    <!-- ACTIONS -->

    <v-card-actions>

      <v-btn color="primary" :loading="loading" @click="confirm">
        Confirm
      </v-btn>

      <v-btn variant="text" @click="emit('close')">
        Cancel
      </v-btn>

    </v-card-actions>

  </v-card>
</template>
