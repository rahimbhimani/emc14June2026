<script setup lang="ts">
import { onMounted, ref } from "vue"

const props = defineProps({
  containerType: String,
  containerIDX: String
})

const organizationId = 12313

const tab = ref("lifecycle")

const history = ref<any[]>([])
const auditLogs = ref<any[]>([])
const refs = ref<any[]>([])

const loading = ref(false)

/* LOAD ALL DATA */

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

    /* LOAD AUDIT */

    const auditRes: any = await $fetch(
      "/api/emc/audit/emcGetAuditLogs",
      {
        method: "POST",
        body: {
          organizationId,
          containerType: props.containerType,
          containerIDX: props.containerIDX
        }
      }
    )

    auditLogs.value = auditRes.logs || []

    /* LOAD REFERENCES */

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
  <v-card class="history-drawer">

    <!-- HEADER -->

    <div class="drawer-header">
      History — {{ containerIDX }}
    </div>

    <!-- TABS -->

    <v-tabs v-model="tab">
      <v-tab value="lifecycle">Lifecycle</v-tab>
      <v-tab value="audit">Audit</v-tab>
      <v-tab value="compliance">Compliance</v-tab>
    </v-tabs>

    <v-divider />

    <!-- LOADING -->

    <div v-if="loading" class="loading">
      <v-progress-circular indeterminate />
    </div>

    <!-- CONTENT -->

    <v-window v-model="tab">

      <!-- ======================================
           LIFECYCLE TAB
      ====================================== -->

      <v-window-item value="lifecycle">

        <div class="content">

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

      </v-window-item>

      <!-- ======================================
           AUDIT TAB
      ====================================== -->

      <v-window-item value="audit">

        <div class="content">

          <v-list density="compact">

            <v-list-item v-for="log in auditLogs" :key="log._id" class="audit-row">

              <v-list-item-title>
                {{ log.actionId }}
              </v-list-item-title>

              <v-list-item-subtitle>

                {{ log.performedBy?.userId }} ({{ log.performedBy?.role }})

              </v-list-item-subtitle>

              <template #append>

                <div class="text-caption">
                  {{ new Date(log.timestamp).toLocaleString() }}
                </div>

              </template>

              <div class="text-caption mt-1">
                {{ log.remarks }}
              </div>

            </v-list-item>

          </v-list>

        </div>

      </v-window-item>

      <!-- ======================================
           COMPLIANCE TAB 🔥
      ====================================== -->

      <v-window-item value="compliance">

        <div class="content">

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

            <!-- DATE -->

            <div class="text-caption mt-1">
              {{ new Date(ref.createdAt).toLocaleString() }}
            </div>

            <!-- SEAL -->

            <div v-if="ref.referenceType === 'SEAL'" class="mt-2">

              Seal Number:
              {{ ref.data?.input?.sealNumber || "-" }}

            </div>

            <!-- BCL -->

            <div v-if="ref.referenceType === 'BCL'" class="mt-2">

              Items:
              {{ ref.data?.inventorySnapshot?.length || 0 }}

            </div>

          </v-card>

        </div>

      </v-window-item>

    </v-window>

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

.content {
  padding: 16px;
  max-block-size: 80vh;
  overflow-y: auto;
}

.audit-row {
  border-block-end: 1px solid #eee;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}
</style>
