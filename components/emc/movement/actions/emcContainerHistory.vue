<script setup lang="ts">
import { onMounted, ref } from "vue"

const props = defineProps({
  containerType: String,
  containerIDX: String
})

const organizationId = 12313

const history = ref<any[]>([])
const refs = ref<any[]>([])
const loading = ref(false)

/* LOAD DATA */

async function loadData() {

  loading.value = true

  try {

    /* LOAD CONTAINER */

    const res: any = await $fetch(
      "/api/emc/container/emcRetreiveContainerData",
      {
        method: "POST",
        body: {
          organizationId,
          type: props.containerType
        }
      }
    )

    const instance = res.instances.find(
      (i: any) => i.IDX === props.containerIDX
    )

    history.value = instance?.lifecycle?.history || []

    /* LOAD REFERENCE DATA */

    const refRes: any = await $fetch(
      "/api/emc/reference/emcGetReferenceData",
      {
        method: "POST",
        body: {
          organizationId,
          containerType: props.containerType,
          containerIDX: props.containerIDX
        }
      }
    )

    refs.value = refRes.refs || []

  }
  finally {
    loading.value = false
  }

}

onMounted(loadData)
</script>

<template>
  HISTORY do not use this component yet, it's a WIP
  <v-card class="history-drawer">

    <div class="drawer-header">
      History — {{ containerIDX }}
    </div>

    <v-divider />

    <div v-if="loading" class="loading">
      <v-progress-circular indeterminate />
    </div>

    <div v-else class="drawer-content">

      <!-- ======================================
           LIFECYCLE TIMELINE
      ====================================== -->

      <div class="section">

        <div class="section-title">
          Lifecycle Timeline
        </div>

        <v-timeline density="compact">

          <v-timeline-item v-for="(item, i) in history" :key="i" dot-color="primary">

            <div class="text-caption">
              {{ new Date(item.updatedAt).toLocaleString() }}
            </div>

            <div v-if="item.operational">
              Operational:
              {{ item.operational.from }} → {{ item.operational.to }}
            </div>

            <div v-if="item.compliance">
              Compliance:
              {{ item.compliance.from }} → {{ item.compliance.to }}
            </div>

            <div class="text-caption">
              {{ item.remarks }}
            </div>

          </v-timeline-item>

        </v-timeline>

      </div>

      <!-- ======================================
           COMPLIANCE REFERENCES 🔥
      ====================================== -->

      <div class="section">

        <div class="section-title">
          Compliance Records
        </div>

        <v-card v-for="ref in refs" :key="ref.referenceNumber" class="mb-3 pa-3">

          <!-- HEADER -->

          <div class="d-flex justify-space-between">

            <div>
              <strong>{{ ref.referenceType }}</strong>
            </div>

            <v-chip size="small" color="primary">
              {{ ref.referenceNumber }}
            </v-chip>

          </div>

          <!-- DETAILS -->

          <div class="text-caption mt-2">
            {{ new Date(ref.createdAt).toLocaleString() }}
          </div>

          <!-- SEAL DETAILS -->

          <div v-if="ref.referenceType === 'SEAL'" class="mt-2">

            Seal Number:
            {{ ref.data?.input?.sealNumber || "-" }}

          </div>

          <!-- BCL DETAILS -->

          <div v-if="ref.referenceType === 'BCL'" class="mt-2">

            Items:
            {{ ref.data?.inventorySnapshot?.length || 0 }}

          </div>

        </v-card>

      </div>

    </div>

  </v-card>
</template>

<style scoped>
.history-drawer {
  display: flex;
  flex-direction: column;
  block-size: 100vh;
}

.drawer-header {
  padding: 16px;
  font-weight: 600;
}

.drawer-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.section {
  margin-block-end: 20px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-block-end: 10px;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}
</style>
