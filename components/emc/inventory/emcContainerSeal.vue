<script setup lang="ts">
import { computed, onMounted, ref } from "vue"

const props = defineProps({
  master: { type: Object, required: true },
  containerType: { type: String, required: true },
  actionId: { type: String, required: true },
  actionConfig: { type: Object, required: true }
})

const emit = defineEmits(["close", "completed"])

const organizationId = 12313
const loading = ref(false)
const tab = ref("seal")

/* ======================================================
ALERT
====================================================== */
const alertShow = ref(false)
const alertText = ref("")
const alertColor = ref("error")

function showAlert(
  message: string,
  color = "error"
) {
  alertText.value = message
  alertColor.value = color
  alertShow.value = true
}

function getErrorMessage(err: any) {
  return (
    err?.data?.message ||
    err?.response?._data?.message ||
    err?.message ||
    "Something went wrong"
  )
}

/* ======================================================
CONFIG
====================================================== */
const tabs = computed(
  () => props.actionConfig?.ui?.tabs || []
)

const sealCfg = computed(() => {
  const found =
    tabs.value.find(
      (t: any) => t.id === "seal"
    ) || {}

  return {
    label: found.label || "Seal",
    actionRef:
      found.actionRef ||
      "SEAL_CONTAINER",
    requireSealNumber:
      found.requireSealNumber || false,
    requireRemarks:
      found.requireRemarks || false
  }
})

const rejectCfg = computed(() => {
  const found =
    tabs.value.find(
      (t: any) => t.id === "rejection"
    ) || {}

  return {
    label:
      found.label || "Rejection",
    actionRef:
      found.actionRef,
    reasonMandatory:
      found.reasonMandatory || false,
    remarksMandatory:
      found.remarksMandatory || false,
    reasons:
      found.reasons || []
  }
})

const inventoryCfg = computed(() => {
  const found =
    tabs.value.find(
      (t: any) => t.id === "inventory"
    ) || {}

  return {
    label:
      found.label || "Inventory"
  }
})

/* ======================================================
FORM STATE
====================================================== */
const sealNumber = ref("")
const sealRemarks = ref("")

const rejectReason = ref("")
const rejectRemarks = ref("")

/* ======================================================
DATA
====================================================== */
const groupedChildren = ref<any>({})
const inventoryItems = ref<any>({})

/* ======================================================
LOAD
====================================================== */
onMounted(async () => {
  await loadMovement()
  await loadInventory()
})

async function loadMovement() {
  loading.value = true

  try {
    const res: any = await $fetch(
      "/api/emc/movement/emcPrepareMovement",
      {
        method: "POST",
        body: {
          organizationId,
          destinationType:
            props.containerType,
          destinationIDX:
            props.master.IDX,
          actionId:
            sealCfg.value.actionRef
        }
      }
    )

    groupedChildren.value =
      res.groupedChildren || {}
  }
  catch (err: any) {
    console.error(err)
    showAlert(
      getErrorMessage(err)
    )
  }
  finally {
    loading.value = false
  }
}

async function loadInventory() {
  try {
    const res: any = await $fetch(
      "/api/emc/emcInventory/emcRetrieveInventory",
      {
        method: "POST",
        body: {
          organizationId,
          containerType:
            props.containerType,
          containerIDX:
            props.master.IDX
        }
      }
    )

    inventoryItems.value =
      res.items || {}
  }
  catch (err: any) {
    console.error(err)
    showAlert(
      getErrorMessage(err)
    )
  }
}

/* ======================================================
SEAL ACTION
====================================================== */
async function confirmSeal() {
  if (
    sealCfg.value.requireSealNumber &&
    !sealNumber.value
  ) {
    showAlert(
      "Seal Number is required"
    )
    return
  }

  if (
    sealCfg.value.requireRemarks &&
    !sealRemarks.value
  ) {
    showAlert(
      "Remarks are required"
    )
    return
  }

  loading.value = true

  try {
    await $fetch(
      "/api/emc/movement/emcExecuteAction",
      {
        method: "POST",
        body: {
          organizationId,
          actionId:
            sealCfg.value.actionRef,
          destination: {
            type:
              props.containerType,
            idx:
              props.master.IDX
          },
          containers:
            groupedChildren.value,
          input: {
            sealNumber:
              sealNumber.value,
            remarks:
              sealRemarks.value
          }
        }
      }
    )

    showAlert(
      "Seal completed successfully",
      "success"
    )

    emit("completed")
  }
  catch (err: any) {
    console.error(err)
    showAlert(
      getErrorMessage(err)
    )
  }
  finally {
    loading.value = false
  }
}

/* ======================================================
REJECTION ACTION
====================================================== */
async function rejectAction() {
  if (
    rejectCfg.value.reasonMandatory &&
    !rejectReason.value
  ) {
    showAlert(
      "Reason is required"
    )
    return
  }

  if (
    rejectCfg.value.remarksMandatory &&
    !rejectRemarks.value
  ) {
    showAlert(
      "Remarks are required"
    )
    return
  }

  loading.value = true

  try {
    await $fetch(
      "/api/emc/movement/emcExecuteAction",
      {
        method: "POST",
        body: {
          organizationId,
          actionId:
            rejectCfg.value.actionRef,
          destination: {
            type:
              props.containerType,
            idx:
              props.master.IDX
          },
          input: {
            reason:
              rejectReason.value,
            remarks:
              rejectRemarks.value
          }
        }
      }
    )

    showAlert(
      "Rejected successfully",
      "success"
    )

    emit("completed")
  }
  catch (err: any) {
    console.error(err)
    showAlert(
      getErrorMessage(err)
    )
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
        {{
          actionConfig.label ||
          "Customs Actions"
        }}
        →
        {{ master.IDX }}
      </div>

      <v-btn icon="mdi-close" variant="text" @click="emit('close')" />
    </div>

    <!-- TABS -->
    <v-tabs v-model="tab">
      <v-tab value="seal">
        {{ sealCfg.label }}
      </v-tab>

      <v-tab value="rejection">
        {{ rejectCfg.label }}
      </v-tab>

      <v-tab value="inventory">
        {{ inventoryCfg.label }}
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">

      <!-- SEAL -->
      <v-window-item value="seal">
        <div class="drawer-content">

          <v-card class="action-card">
            <div class="section-title">
              Seal Details
            </div>

            <v-text-field v-model="sealNumber" label="Seal Number" density="comfortable" variant="outlined"
              class="field-gap" hide-details="auto" />

            <v-textarea v-model="sealRemarks" label="Remarks" rows="2" auto-grow density="comfortable"
              variant="outlined" class="field-gap" hide-details="auto" />
          </v-card>

          <v-btn block color="primary" size="large" class="action-btn" :loading="loading" @click="confirmSeal">
            Confirm Seal
          </v-btn>

        </div>
      </v-window-item>

      <!-- REJECTION -->
      <v-window-item value="rejection">
        <div class="drawer-content">

          <v-card class="action-card">
            <div class="section-title">
              Rejection Details
            </div>

            <v-select v-model="rejectReason" :items="rejectCfg.reasons" item-title="label" item-value="value"
              label="Reason" density="comfortable" variant="outlined" class="field-gap" hide-details="auto" clearable />

            <v-textarea v-model="rejectRemarks" label="Remarks" rows="2" auto-grow density="comfortable"
              variant="outlined" class="field-gap" hide-details="auto" />
          </v-card>

          <v-btn block color="error" size="large" class="action-btn" :loading="loading" @click="rejectAction">
            Reject BCL
          </v-btn>

        </div>
      </v-window-item>

      <!-- INVENTORY -->
      <v-window-item value="inventory">
        <div class="drawer-content">
          <emcContainerInventory :containerType="containerType
            " :containerIDX="master.IDX
              " />
        </div>
      </v-window-item>

    </v-window>

    <!-- ALERT -->
    <v-snackbar v-model="alertShow" :color="alertColor" timeout="4000" location="top">
      {{ alertText }}

      <template #actions>
        <v-btn variant="text" @click="alertShow = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>

  </v-card>
</template>

<style scoped>
.movement-drawer {
  display: flex;
  flex-direction: column;
  background: #fafafa;
  block-size: 100vh;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-block-end: 1px solid #ececec;
  padding-block: 14px;
  padding-inline: 18px;
}

.title {
  font-size: 20px;
  font-weight: 700;
}

.drawer-content {
  padding: 18px;
}

.action-card {
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 6%);
  margin-block-end: 18px;
}

.section-title {
  color: #444;
  font-size: 16px;
  font-weight: 700;
  margin-block-end: 16px;
}

.field-gap {
  margin-block-end: 14px;
}

.action-btn {
  border-radius: 12px;
  block-size: 48px;
  font-weight: 700;
}
</style>
