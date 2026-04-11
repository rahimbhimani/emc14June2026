<script setup lang="ts">
import { computed, onMounted, ref } from "vue"

const props = defineProps({
  containerType: String,
  containerIDX: String
})

const organizationId = 12313

const tab = ref("activity")
const loading = ref(false)

const history = ref<any[]>([])
const auditLogs = ref<any[]>([])
const refs = ref<any[]>([])

/* ======================================================
   HELPERS
====================================================== */

function formatDate(value: any) {
  if (!value) return "-"
  return new Date(value).toLocaleString()
}

function titleCase(value: string) {
  if (!value) return ""
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
}

function actionLabel(actionId: string) {
  return titleCase(actionId || "Action")
}

function normalize(value: any) {
  return String(value || "")
    .trim()
    .toUpperCase()
}

function valuesMatch(
  source: any,
  target: any
) {
  return (
    normalize(source) ===
    normalize(target)
  )
}

/* ======================================================
   GENERIC ID DETECTION
   No hardcode by type
====================================================== */

function rowContainsCurrentIDX(
  row: any
) {
  if (!row) return false

  const candidates = [
    row.IDX,
    row.idx,
    row.code,
    row.itemIDX,
    row.containerIDX,
    row.productIDX,
    row.entityIDX,
    row.referenceIDX
  ]

  return candidates.some((v) =>
    valuesMatch(
      v,
      props.containerIDX
    )
  )
}

/* ======================================================
   TRACK CHANGES
====================================================== */

function getTrackChanges(item: any) {
  const rows: any[] = []

  for (const key of Object.keys(item || {})) {
    if (
      [
        "updatedAt",
        "updatedBy",
        "remarks",
        "actionId"
      ].includes(key)
    ) continue

    const change = item[key]

    if (
      change &&
      typeof change === "object" &&
      "from" in change &&
      "to" in change
    ) {
      if (change.from === change.to)
        continue

      rows.push({
        track:
          titleCase(key),
        from: change.from,
        to: change.to
      })
    }
  }

  return rows
}

/* ======================================================
   SUMMARY BUILDERS
====================================================== */

function buildInventorySummary(
  log: any
) {
  const rows =
    log?.details?.inventory ||
    []

  if (!rows.length)
    return null

  return rows.map((x: any) => {
    const name =
      x.productName ||
      x.Name ||
      x.title ||
      x.label ||
      x.IDX ||
      x.productIDX ||
      x.code

    const qty =
      x.quantity ||
      x.qty ||
      x.count ||
      0

    return `${name} × ${qty}`
  })
}

function buildAssignmentSummary(
  log: any
) {
  const rows =
    log?.details
      ?.assignments || []

  if (!rows.length)
    return null

  return rows.map((x: any) => {
    const icon =
      x.action ===
        "ASSIGNED"
        ? "➕"
        : "➖"

    return `${icon} ${x.type}: ${x.name} (${x.idx})`
  })
}

/* ======================================================
   LOAD DATA
====================================================== */

async function loadData() {
  loading.value = true

  try {
    const containerRes: any =
      await $fetch(
        "/api/emc/container/emcRetreiveContainerData",
        {
          method: "POST",
          body: {
            organizationId,
            type:
              props.containerType
          }
        }
      )

    const instance =
      (
        containerRes.instances ||
        []
      ).find(
        (x: any) =>
          x.IDX ===
          props.containerIDX
      )

    history.value =
      instance?.lifecycle
        ?.history || []

    const auditRes: any =
      await $fetch(
        "/api/emc/audit/emcGetAuditLogs",
        {
          method: "POST",
          body: {
            organizationId,
            containerType:
              props.containerType,
            containerIDX:
              props.containerIDX
          }
        }
      )

    auditLogs.value =
      auditRes.logs || []

    const refRes: any =
      await $fetch(
        "/api/emc/reference/emcGetReferenceData",
        {
          method: "POST",
          body: {
            organizationId,
            containerType:
              props.containerType,
            containerIDX:
              props.containerIDX
          }
        }
      )

    refs.value =
      refRes.refs || []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

/* ======================================================
   RELEVANT AUDIT LOGS
   Existing logic preserved + generic match
====================================================== */

const relevantAuditLogs =
  computed(() => {
    return auditLogs.value.filter(
      (log: any) => {
        /* Direct entity */
        if (
          valuesMatch(
            log.entityIDX,
            props.containerIDX
          )
        ) {
          return true
        }

        /* Assignments */
        const assignments =
          log?.details
            ?.assignments ||
          []

        if (
          assignments.some(
            (x: any) =>
              rowContainsCurrentIDX(
                x
              )
          )
        ) {
          return true
        }

        /* Inventory */
        const inventory =
          log?.details
            ?.inventory || []

        if (
          inventory.some(
            (x: any) =>
              rowContainsCurrentIDX(
                x
              )
          )
        ) {
          return true
        }

        return false
      }
    )
  })

/* ======================================================
   COMPUTED
====================================================== */

const lifecycleRows =
  computed(() => {
    return history.value.filter(
      (x: any) =>
        getTrackChanges(x)
          .length > 0
    )
  })

const activityFeed =
  computed(() => {
    const rows: any[] = []

    for (const item of lifecycleRows.value) {
      rows.push({
        type: "lifecycle",
        timestamp:
          item.updatedAt,
        user:
          item.updatedBy,
        changes:
          getTrackChanges(
            item
          )
      })
    }

    for (const log of relevantAuditLogs.value) {
      rows.push({
        type: "audit",
        timestamp:
          log.timestamp,
        actionId:
          log.actionId,
        user:
          log.performedBy
            ?.userId,
        role:
          log.performedBy
            ?.role,
        inventory:
          buildInventorySummary(
            log
          ),
        assignments:
          buildAssignmentSummary(
            log
          )
      })
    }

    for (const ref of refs.value) {
      rows.push({
        type: "reference",
        timestamp:
          ref.createdAt,
        referenceType:
          ref.referenceType,
        referenceNumber:
          ref.referenceNumber
      })
    }

    return rows.sort(
      (a, b) =>
        new Date(
          b.timestamp
        ).getTime() -
        new Date(
          a.timestamp
        ).getTime()
    )
  })
</script>

<template>
  <v-card class="history-drawer">

    <div class="drawer-header">
      <div class="header-title">
        History — {{ containerIDX }}
      </div>

      <div class="header-subtitle">
        {{ containerType }}
      </div>
    </div>

    <v-tabs v-model="tab" color="primary" density="comfortable" show-arrows="false" class="history-tabs">
      <v-tab value="activity">
        Activity
      </v-tab>

      <v-tab value="lifecycle">
        Lifecycle
      </v-tab>

      <v-tab value="audit">
        Audit
      </v-tab>

      <v-tab value="compliance">
        Compliance
      </v-tab>
    </v-tabs>

    <v-divider />

    <div v-if="loading" class="loading">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else class="tab-content-wrapper">

      <!-- ACTIVITY -->

      <div v-if="tab === 'activity'" class="content">
        <template v-if="activityFeed.length">
          <div class="timeline-list">

            <div v-for="(row, i) in activityFeed" :key="i" class="timeline-row">
              <div class="timeline-left">
                <div class="timeline-dot" />
                <div class="timeline-line" />
              </div>

              <div class="event-card">

                <div class="event-time">
                  {{
                    formatDate(
                      row.timestamp
                    )
                  }}
                </div>

                <template v-if="
                  row.type ===
                  'lifecycle'
                ">
                  <div class="event-title">
                    Status Updated
                  </div>

                  <div v-for="(chg, x) in row.changes" :key="x" class="event-text">
                    {{ chg.track }}:
                    <strong>
                      {{ chg.from }}
                    </strong>
                    →
                    <strong>
                      {{ chg.to }}
                    </strong>
                  </div>

                  <div class="event-sub">
                    By {{ row.user }}
                  </div>
                </template>

                <template v-else-if="
                  row.type ===
                  'audit'
                ">
                  <div class="event-title">
                    {{
                      actionLabel(
                        row.actionId
                      )
                    }}
                  </div>

                  <div class="event-sub">
                    Performed by
                    {{ row.user }}
                    <span v-if="row.role">
                      ({{ row.role }})
                    </span>
                  </div>

                  <div v-if="
                    row.inventory?.length
                  " class="info-box">
                    <div v-for="(line, k) in row.inventory" :key="k" class="info-line">
                      📦 {{ line }}
                    </div>
                  </div>

                  <div v-if="
                    row.assignments?.length
                  " class="info-box">
                    <div v-for="(line, k) in row.assignments" :key="k" class="info-line">
                      👥 {{ line }}
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="event-title">
                    {{
                      row.referenceType
                    }}
                    Created
                  </div>

                  <div class="event-sub">
                    {{
                      row.referenceNumber
                    }}
                  </div>
                </template>

              </div>
            </div>

          </div>
        </template>

        <div v-else class="empty-state">
          No Activity Found
        </div>
      </div>

      <!-- LIFECYCLE -->

      <div v-else-if="
        tab ===
        'lifecycle'
      " class="content">
        <template v-if="
          lifecycleRows.length
        ">
          <div class="timeline-list">

            <div v-for="(row, i) in lifecycleRows" :key="i" class="timeline-row">
              <div class="timeline-left">
                <div class="timeline-dot" />
                <div class="timeline-line" />
              </div>

              <div class="event-card">
                <div class="event-time">
                  {{
                    formatDate(
                      row.updatedAt
                    )
                  }}
                </div>

                <div v-for="(chg, x) in getTrackChanges(row)" :key="x" class="event-text">
                  {{ chg.track }}:
                  <strong>
                    {{ chg.from }}
                  </strong>
                  →
                  <strong>
                    {{ chg.to }}
                  </strong>
                </div>

                <div class="event-sub">
                  By
                  {{
                    row.updatedBy
                  }}
                </div>
              </div>
            </div>

          </div>
        </template>

        <div v-else class="empty-state">
          No Lifecycle Changes
        </div>
      </div>

      <!-- AUDIT -->

      <div v-else-if="
        tab === 'audit'
      " class="content">
        <template v-if="
          relevantAuditLogs.length
        ">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel v-for="log in relevantAuditLogs" :key="log._id">
              <v-expansion-panel-title>
                <div class="audit-grid">
                  <div>
                    {{
                      formatDate(
                        log.timestamp
                      )
                    }}
                  </div>

                  <div>
                    {{
                      actionLabel(
                        log.actionId
                      )
                    }}
                  </div>

                  <div>
                    {{
                      log.performedBy?.userId
                    }}
                  </div>

                  <div>
                    {{
                      log.performedBy?.role
                    }}
                  </div>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>

                <div v-if="
                  buildInventorySummary(log)?.length
                " class="info-box">
                  <div v-for="(line, i) in buildInventorySummary(log)" :key="i" class="info-line">
                    📦 {{ line }}
                  </div>
                </div>

                <div v-if="
                  buildAssignmentSummary(log)?.length
                " class="info-box">
                  <div v-for="(line, i) in buildAssignmentSummary(log)" :key="i" class="info-line">
                    👥 {{ line }}
                  </div>
                </div>

              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </template>

        <div v-else class="empty-state">
          No Audit Logs
        </div>
      </div>

      <!-- COMPLIANCE -->

      <div v-else class="content">
        <template v-if="
          refs.length
        ">
          <v-card v-for="ref in refs" :key="ref.referenceNumber
            " class="event-card mb-3">
            <div class="event-title">
              {{
                ref.referenceType
              }}
            </div>

            <div class="event-sub">
              {{
                ref.referenceNumber
              }}
            </div>

            <div class="event-time">
              {{
                formatDate(
                  ref.createdAt
                )
              }}
            </div>
          </v-card>
        </template>

        <div v-else class="empty-state">
          No Compliance Records
        </div>
      </div>

    </div>
  </v-card>
</template>

<style scoped>
.history-drawer {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  block-size: 100%;
}

.drawer-header {
  padding: 16px;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
}

.header-subtitle {
  color: #777;
  font-size: 13px;
}

.history-tabs {
  flex: 0 0 auto;
}

.history-tabs :deep(.v-slide-group__prev),
.history-tabs :deep(.v-slide-group__next) {
  display: none !important;
}

.tab-content-wrapper {
  overflow: hidden;
  flex: 1;
  min-block-size: 0;
}

.content {
  block-size: 100%;
  overflow-y: auto;
  padding-block: 12px 24px;
  padding-inline: 16px;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-row {
  display: flex;
  gap: 12px;
}

.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  inline-size: 24px;
}

.timeline-dot {
  border-radius: 50%;
  background: #1976d2;
  block-size: 14px;
  inline-size: 14px;
  margin-block-start: 8px;
}

.timeline-line {
  flex: 1;
  background: #ddd;
  inline-size: 2px;
  margin-block-start: 4px;
}

.timeline-row:last-child .timeline-line {
  display: none;
}

.event-card {
  flex: 1;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: white;
}

.event-time {
  color: #777;
  font-size: 12px;
}

.event-title {
  font-weight: 700;
  margin-block-start: 4px;
}

.event-text {
  margin-block-start: 4px;
}

.event-sub {
  color: #666;
  font-size: 13px;
  margin-block-start: 6px;
}

.info-box {
  border: 1px dashed #ddd;
  border-radius: 10px;
  background: #fafafa;
  margin-block-start: 10px;
  padding-block: 8px;
  padding-inline: 10px;
}

.info-line {
  font-size: 13px;
  margin-block-start: 4px;
}

.audit-grid {
  display: grid;
  font-size: 13px;
  gap: 12px;
  grid-template-columns: 170px 1fr 120px 100px;
  inline-size: 100%;
}

.empty-state {
  padding: 30px;
  color: #777;
  text-align: center;
}
</style>
