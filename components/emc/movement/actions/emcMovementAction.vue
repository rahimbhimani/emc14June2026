<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"

const orchestration = ref<any>({})

const props = defineProps({
  master: { type: Object, required: true },
  masterConfig: { type: Object, default: () => ({}) },
  containerType: { type: String, required: true },
  actionId: { type: String, required: true },
  actionConfig: { type: Object, default: () => ({}) }
})

const emit = defineEmits(["close", "completed"])

const organizationId = 12313

const groupedChildren = ref<any>({})
const quantityMap = ref<Record<string, Record<string, number>>>({})
const selectedUserContainers = ref<Record<string, any[]>>({})
const loading = ref(false)

const activeTab = ref("")
const sectionRefs = ref<Record<string, HTMLElement | null>>({})

/* =========================================
STATUS PANEL
========================================= */
const currentStatuses = ref<any[]>([])
const lifecycleRemark = ref<any>(null)
const infoTab = ref("status")

/* =========================================
UPLOAD
========================================= */
const uploadDialog = ref(false)
const currentUploadType = ref<string | null>(null)

function openUpload(type: string) {
  currentUploadType.value = type
  uploadDialog.value = true
}

function handleUploadApplied(data: any) {
  if (!currentUploadType.value) return
  applyUploadData(currentUploadType.value, data)
  uploadDialog.value = false
}

/* =========================================
HELPERS
========================================= */
function setSectionRef(type: string) {
  return (el: HTMLElement | null) => {
    if (el) sectionRefs.value[type] = el
  }
}

function scrollToSection(type: string) {
  sectionRefs.value[type]?.scrollIntoView({
    behavior: "smooth"
  })
}

function getAvailable(item: any) {
  return (
    item.totalAvailable ??
    item.availableQty ??
    item.available ??
    0
  )
}

function getValue(obj: any, path: string) {
  return path
    .split(".")
    .reduce(
      (acc, key) => acc?.[key],
      obj
    )
}

function isSelected(type: string, item: any) {
  return selectedUserContainers.value[type]?.some((i: any) => {
    const row = i?.raw || i
    return row.IDX === item.IDX
  })
}

function getInventoryMode(group: any) {
  return (
    group?.actionConfig?.ui?.inventoryMode ||
    props.actionConfig?.ui?.inventoryMode ||
    "edit"
  )
}

function getName(item: any, config: any) {
  const nameField =
    config?.projection?.listView?.find((f: string) =>
      f.toLowerCase().includes("name")
    ) || "IDX"

  return `${getValue(item, nameField) || item.IDX}`
}

/* =========================================
STATUS PANEL (CONFIG DRIVEN)
========================================= */
async function loadStatusPanel() {
  debugger
  const statuses: any[] = []
  lifecycleRemark.value = null

  const lifecycle = props.master?.lifecycle || {}
  const configTracks =
    props.masterConfig?.lifecycles ||
    props.actionConfig?.masterConfig?.lifecycles ||
    {}

  for (const track in configTracks) {
    const stateCode = lifecycle[track]
    if (!stateCode) continue

    const stateDef =
      configTracks[track]?.states?.find(
        (s: any) => s.code === stateCode
      ) || {}

    statuses.push({
      track,
      code: stateCode,
      label: stateDef.label || stateCode,
      color: stateDef.color || "primary",
      showRemarks:
        stateDef?.presentation?.showRemarks || false
    })

    if (stateDef?.presentation?.showRemarks) {
      try {
        const res: any = await $fetch(
          "/api/emc/movement/emdRetreiveLifecycleRemarks",
          {
            method: "POST",
            body: {
              organizationId,
              containerIDX: props.master?.IDX,
              track,
              state: stateCode
            }
          }
        )

        lifecycleRemark.value = {
          data: res?.data || res || null
        }
      }
      catch (err) {
        console.error(err)
      }
    }
  }

  currentStatuses.value = statuses
}

/* =========================================
UPLOAD APPLY
========================================= */
function applyUploadData(type: string, rows: any[]) {
  const group = groupedChildren.value[type]
  if (!group) return

  if (group.config.inventoryManaged) {
    if (!quantityMap.value[type]) {
      quantityMap.value[type] = {}
    }

    rows.forEach((r: any) => {
      quantityMap.value[type][r.IDX] =
        r.quantity || 0
    })

    return
  }

  const existingItems = group.items || []
  const result: any[] = []

  rows.forEach((r: any) => {
    const existing = existingItems.find(
      (x: any) => x.IDX === r.IDX
    )

    if (existing) {
      result.push(existing)
    }
    else {
      const newRow = {
        ...r,
        isUploaded: true,
        parentIDX: group.parentIDX
      }

      existingItems.push(newRow)
      result.push(newRow)
    }
  })

  selectedUserContainers.value[type] = result
}

/* =========================================
SECTION STATUS
========================================= */
const sectionStatus = (type: string) => {
  const group = groupedChildren.value[type]

  if (group.config.inventoryManaged) {
    for (const item of group.items) {
      if (
        (quantityMap.value[type]?.[item.IDX] || 0) >
        getAvailable(item)
      ) {
        return "error"
      }
    }

    return "done"
  }

  return (selectedUserContainers.value[type]?.length || 0) > 0
    ? "done"
    : "pending"
}

const hasError = computed(() =>
  Object.keys(groupedChildren.value).some(
    t => sectionStatus(t) === "error"
  )
)

const totalSelected = computed(() =>
  Object.values(selectedUserContainers.value).flat().length
)

const completionPercent = computed(() => {
  const total = Object.keys(groupedChildren.value).length

  const done = Object.keys(groupedChildren.value).filter(
    t => sectionStatus(t) === "done"
  ).length

  return total ? (done / total) * 100 : 0
})

/* =========================================
LOAD MOVEMENT
========================================= */
async function loadMovement() {
  const res: any = await $fetch(
    "/api/emc/movement/emcPrepareMovement",
    {
      method: "POST",
      body: {
        organizationId,
        destinationType: props.containerType,
        destinationIDX: props.master?.IDX,
        actionId: props.actionId
      }
    }
  )

  groupedChildren.value =
    res.groupedChildren || {}

  orchestration.value =
    res.orchestration || {}

  for (const k in selectedUserContainers.value)
    delete selectedUserContainers.value[k]

  for (const k in quantityMap.value)
    delete quantityMap.value[k]

  for (const type in groupedChildren.value) {
    selectedUserContainers.value[type] = []

    const group = groupedChildren.value[type]

    if (group.config.inventoryManaged) {
      quantityMap.value[type] = {}

      group.items.forEach((item: any) => {
        if (item.assignedHere) {
          quantityMap.value[type][item.IDX] =
            item.quantity || 0
        }
      })

      continue
    }

    group.items.forEach((item: any) => {
      if (item.assignedHere) {
        selectedUserContainers.value[type].push(item)
      }
    })
  }

  activeTab.value =
    Object.keys(groupedChildren.value)[0]

  await nextTick()
  await loadStatusPanel()
}

watch(() => props.master?.IDX, loadMovement)
onMounted(loadMovement)

/* =========================================
CONFIRM
========================================= */
function scrollToFirstError() {
  for (const type in groupedChildren.value) {
    if (sectionStatus(type) === "error") {
      scrollToSection(type)
      return
    }
  }
}

async function confirmMovement() {
  if (hasError.value) {
    return scrollToFirstError()
  }

  loading.value = true

  try {
    const containers: Record<string, any> = {}

    for (const type in groupedChildren.value) {
      const group = groupedChildren.value[type]

      /* INVENTORY */
      if (group.config?.inventoryManaged) {
        const qtyMap =
          quantityMap.value[type] || {}

        const quantities: Record<string, number> = {}
        const sources: Record<string, any> = {}

        for (const item of group.items || []) {
          const qty = Number(
            qtyMap[item.IDX] || 0
          )

          if (qty <= 0) continue

          quantities[item.IDX] = qty

          if (
            orchestration.value?.movementType ===
            "TRANSFER"
          ) {
            const sourceRows =
              item.sources || []

            if (sourceRows.length) {
              let remaining = qty
              sources[item.IDX] = {}

              for (const src of sourceRows) {
                if (remaining <= 0) break

                const available = Number(
                  src.available || 0
                )

                if (available <= 0) continue

                const take = Math.min(
                  available,
                  remaining
                )

                sources[item.IDX][
                  src.containerIDX
                ] = take

                remaining -= take
              }
            }
          }
        }

        containers[type] = {
          quantities,
          ...(Object.keys(sources).length
            ? { sources }
            : {})
        }

        continue
      }

      /* STRUCTURAL */
      const selectedRows =
        selectedUserContainers.value[type] || []

      const selectedIDs = selectedRows
        .map((row: any) => {
          const raw = row?.raw || row
          return raw?.IDX
        })
        .filter(Boolean)

      containers[type] = {
        children: selectedIDs
      }
    }

    await $fetch(
      "/api/emc/movement/emcExecuteAction",
      {
        method: "POST",
        body: {
          organizationId,
          actionId: props.actionId,
          destination: {
            type: props.containerType,
            idx: props.master.IDX
          },
          userContext: {
            userId: "USR-001",
            role: "MANAGER"
          },
          containers,
          input: {}
        }
      }
    )

    emit("completed")
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <v-card class="movement-shell">
    <!-- {{ lifecycleRemark }} -->
    <!-- HEADER -->
    <div class="pa-4 d-flex justify-space-between">
      <div>
        {{ actionConfig?.label }} →
        {{ master?.IDX }}
      </div>

      <v-btn icon="mdi:close" variant="text" @click="emit('close')" />
    </div>

    <!-- STATUS PANEL -->
    <!-- STATUS PANEL -->
    <v-card class="mx-4 mb-3 pa-0 overflow-hidden" variant="tonal">

      <v-tabs v-model="infoTab" density="compact" color="primary" grow>
        <v-tab value="status">
          Status
        </v-tab>

        <v-tab v-if="
          lifecycleRemark &&
          lifecycleRemark.data &&
          (
            lifecycleRemark.data.data?.input?.reason ||
            lifecycleRemark.data.data?.input?.remarks ||
            lifecycleRemark.data.referenceNumber
          )
        " value="remarks" prepend-icon="mdi:comment-text-outline">
          Remarks
        </v-tab>
      </v-tabs>

      <v-window v-model="infoTab">

        <!-- STATUS TAB -->
        <v-window-item value="status">
          <div class="pa-3">
            <div class="d-flex flex-wrap ga-2">
              <v-chip v-for="row in currentStatuses" :key="row.track" size="small" :color="row.color" variant="flat">
                {{ row.track }} :
                {{ row.label }}
              </v-chip>
            </div>
          </div>
        </v-window-item>

        <!-- REMARKS TAB -->
        <v-window-item v-if="
          lifecycleRemark &&
          lifecycleRemark.data &&
          (
            lifecycleRemark.data.data?.input?.reason ||
            lifecycleRemark.data.data?.input?.remarks ||
            lifecycleRemark.data.referenceNumber
          )
        " value="remarks">
          <div class="pa-3 remarks-tab">

            <div class="remarks-row">
              <span class="remarks-label">Reason</span>
              <span class="remarks-value">
                {{
                  lifecycleRemark.data.data?.input?.reason ||
                  "-"
                }}
              </span>
            </div>

            <div v-if="lifecycleRemark.data.data?.input?.remarks" class="remarks-row remarks-row-top">
              <span class="remarks-label">Remarks</span>

              <div class="remarks-box">
                {{ lifecycleRemark.data.data.input.remarks }}
              </div>
            </div>

            <div v-if="lifecycleRemark.data.createdBy" class="remarks-row">
              <span class="remarks-label">By</span>
              <span class="remarks-value">
                {{ lifecycleRemark.data.createdBy }}
              </span>
            </div>

            <div v-if="lifecycleRemark.data.createdAt" class="remarks-row">
              <span class="remarks-label">At</span>
              <span class="remarks-value">
                {{ lifecycleRemark.data.createdAt }}
              </span>
            </div>

            <div v-if="lifecycleRemark.data.referenceNumber" class="remarks-row">
              <span class="remarks-label">Reference</span>
              <span class="remarks-value">
                {{ lifecycleRemark.data.referenceNumber }}
              </span>
            </div>

          </div>
        </v-window-item>

      </v-window>

    </v-card>

    <v-progress-linear :model-value="completionPercent" height="6" class="mb-2" />

    <!-- TABS -->
    <div class="tabs">
      <div v-for="(group, type, i) in groupedChildren" :key="type" class="tab" :class="[
        activeTab === type ? 'active' : '',
        sectionStatus(type)
      ]" @click="scrollToSection(type)">
        {{ i + 1 }}.
        {{ group.config?.label }}
        ({{ selectedUserContainers[type]?.length || 0 }})
      </div>
    </div>

    <!-- SUMMARY -->
    <v-card class="pa-2 mb-2">
      {{ totalSelected }} items selected
      <span v-if="hasError" class="text-error">
        • Fix errors
      </span>
    </v-card>

    <!-- CONTENT -->
    <div class="scroll">

      <div v-for="(group, type) in groupedChildren" :key="type" :ref="setSectionRef(type)" class="section">
        <v-card class="pa-3 mb-3">

          <!-- SECTION HEADER -->
          <div class="d-flex align-center mb-2">
            <strong>
              {{ group.config?.label }}
            </strong>

            <v-spacer />

            <v-chip size="x-small" class="mr-2">
              {{ group.items.length }} items
            </v-chip>

            <v-btn size="small" variant="text" color="primary" prepend-icon="mdi:file-excel" @click="openUpload(type)">
              Upload
            </v-btn>
          </div>

          <!-- NON INVENTORY -->
          <v-data-table v-if="!group.config.inventoryManaged" class="selection-table" :headers="[
            { title: '', key: 'data-table-select', width: 46 },
            { title: group.config?.label || 'Items', key: 'name' },
            ...(group.config?.showItemCount
              ? [{ title: 'Qty', key: 'qty', width: 90, align: 'center' }]
              : []),
            { title: '', key: 'status', width: 42, align: 'center' }
          ]" :items="group.items" item-value="IDX" v-model="selectedUserContainers[type]" show-select return-object>
            <template #item="{ item, isSelected: rowSelected, toggleSelect }">
              <tr class="click-row" @click="toggleSelect({ value: item })">
                <td @click.stop>
                  <v-checkbox-btn :model-value="rowSelected({ value: item })"
                    @click.stop="toggleSelect({ value: item })" />
                </td>

                <td>
                  <v-tooltip location="top">
                    <template #activator="{ props: tipProps }">
                      <div class="name-wrap" v-bind="tipProps">
                        <div class="truncate-line">
                          {{ item.Name }}
                        </div>
                        <div class="sub-line">
                          {{ item.IDX }}
                        </div>
                      </div>
                    </template>

                    {{ item.Name }} ({{ item.IDX }})
                  </v-tooltip>
                </td>

                <td v-if="group.config?.showItemCount" class="text-center">
                  {{ item.itemCount || 0 }}
                </td>

                <td class="text-center">
                  <v-icon v-if="item.parentIDX === master.IDX" size="18" color="primary">
                    mdi:link-variant
                  </v-icon>

                  <v-icon v-else-if="isSelected(type, item)" size="18" color="success">
                    mdi:check-circle
                  </v-icon>
                </td>
              </tr>
            </template>
          </v-data-table>

          <!-- INVENTORY -->
          <v-data-table v-else density="compact" class="inventory-table" :headers="[
            { title: group.config?.label || 'Items', key: 'name' },
            { title: 'Stock', key: 'stock', width: 130, align: 'center' },
            { title: 'Move', key: 'qty', width: 110, align: 'center' }
          ]" :items="group.items" item-value="IDX" :fixed-header="group.items.length > 6"
            :height="group.items.length > 6 ? 420 : undefined">
            <template #item.name="{ item }">
              <v-tooltip location="top">
                <template #activator="{ props: tipProps }">
                  <div class="product-cell" v-bind="tipProps">
                    <div class="product-name truncate-line">
                      {{ item.Name }}
                    </div>
                    <div class="product-code">
                      {{ item.IDX }}
                    </div>
                  </div>
                </template>

                {{ item.Name }} ({{ item.IDX }})
              </v-tooltip>
            </template>

            <template #item.stock="{ item }">
              <v-chip size="small" color="primary" variant="tonal" class="stock-chip">
                <template v-if="actionConfig.actionId === 'INSTOCK'">
                  {{ item.currentQuantity || 0 }}
                </template>

                <template v-else>
                  {{ item.currentQuantity || 0 }} /
                  {{ item.totalAvailable || 0 }}
                </template>
              </v-chip>
            </template>

            <template #item.qty="{ item }">
              <div class="qty-wrap">
                <v-text-field v-if="getInventoryMode(group) === 'edit'" v-model.number="quantityMap[type][item.IDX]"
                  type="number" min="0" :max="item.totalAvailable || 0" density="compact" variant="outlined"
                  hide-details class="qty-box" single-line />

                <v-chip v-else-if="getInventoryMode(group) === 'readonly'" size="small" color="primary" variant="tonal">
                  {{
                    quantityMap[type]?.[item.IDX] ||
                    item.currentQuantity ||
                    0
                  }}
                </v-chip>
              </div>
            </template>
          </v-data-table>

        </v-card>
      </div>

    </div>

    <!-- FOOTER -->
    <div class="footer-bar">
      <v-btn block color="primary" :loading="loading" @click="confirmMovement">
        {{
          hasError
            ? "Fix errors first"
            : "Confirm Movement"
        }}
      </v-btn>
    </div>

  </v-card>

  <emcFileUploadDialog v-model="uploadDialog" :uploadId="currentUploadType" @applied="handleUploadApplied" />
</template>

<style scoped>
.remarks-row-top {
  align-items: start;
}

.remarks-box {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  line-height: 1.45;
  max-block-size: 90px;
  overflow-y: auto;
  padding-block: 8px;
  padding-inline: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.remarks-tab {
  display: grid;
  gap: 8px;
}

.remarks-row {
  display: grid;
  align-items: start;
  font-size: 13px;
  gap: 10px;
  grid-template-columns: 110px 1fr;
}

.remarks-label {
  color: #666;
  font-weight: 600;
}

.remarks-value {
  color: #222;
  word-break: break-word;
}

.status-alert {
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  padding-block: 10px;
  padding-inline: 12px;
}

.alert-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.alert-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ef4444;
  block-size: 22px;
  color: white;
  font-size: 13px;
  font-weight: 700;
  inline-size: 22px;
}

.alert-content {
  flex: 1;
  min-inline-size: 0;
}

.alert-title {
  color: #991b1b;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.alert-message {
  color: #7f1d1d;
  font-size: 14px;
  font-weight: 600;
}

.alert-meta {
  color: #555;
  font-size: 12px;
  line-height: 1.5;
  margin-block-start: 6px;
}

.movement-shell {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  block-size: 100vh;
  max-block-size: 100vh;
}

.scroll {
  flex: 1 1 auto;
  max-block-size: none !important;
  min-block-size: 0;
  overflow-y: auto;
}

.footer-bar {
  position: sticky;
  z-index: 10;
  flex: 0 0 auto;
  padding: 12px;
  background: white;
  border-block-start: 1px solid #eee;
  inset-block-end: 0;
}

.remark-panel {
  padding: 10px;
  border-radius: 10px;
  background: #fff3e0;
}

.remark-row {
  font-size: 13px;
  margin-block-start: 4px;
}

/* tabs */
.tabs {
  display: flex;
  flex-wrap: wrap;
  padding: 8px;
  gap: 8px;
}

.tab {
  border-radius: 20px;
  background: #eee;
  cursor: pointer;
  padding-block: 6px;
  padding-inline: 12px;
  transition: 0.2s ease;
}

.tab.active {
  background: #1976d2;
  color: #fff;
}

.tab.done {
  background: #4caf50;
  color: #fff;
}

.tab.error {
  background: #f44336;
  color: #fff;
}

.section {
  scroll-margin-top: 80px;
}

/* shared */
.truncate-line {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-line {
  color: #888;
  font-size: 12px;
}

.click-row {
  cursor: pointer;
}

.click-row:hover td {
  background: #f8f9ff !important;
}

.name-wrap {
  max-inline-size: 100%;
  min-inline-size: 0;
}

/* inventory */
.inventory-table {
  overflow: hidden;
  padding: 6px;
  border-radius: 12px;
  background: #f8f9fc;
}

.inventory-table :deep(table) {
  border-collapse: separate;
  border-spacing: 0 8px;
}

.inventory-table :deep(th) {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
}

.inventory-table :deep(td) {
  background: #fff;
  border-block-end: 1px solid #eee;
  border-block-start: 1px solid #eee;
  padding-block: 8px;
  padding-inline: 6px;
  vertical-align: middle;
}

.inventory-table :deep(td:first-child) {
  border-end-start-radius: 10px;
  border-inline-start: 1px solid #eee;
  border-start-start-radius: 10px;
}

.inventory-table :deep(td:last-child) {
  border-end-end-radius: 10px;
  border-inline-end: 1px solid #eee;
  border-start-end-radius: 10px;
}

.inventory-table :deep(tbody tr:hover td) {
  background: #f4f7ff;
}

.product-name {
  font-size: 15px;
  font-weight: 600;
}

.product-code {
  color: #888;
  font-size: 12px;
}

.stock-chip {
  justify-content: center;
  font-weight: 700;
  min-inline-size: 82px;
}

.qty-wrap {
  display: flex;
  justify-content: center;
}

.qty-box {
  inline-size: 72px;
}

.qty-box :deep(.v-field) {
  border-radius: 8px;
  min-block-size: 34px !important;
}

.qty-box :deep(input) {
  padding: 0;
  font-weight: 600;
  text-align: center;
}

.remark-title {
  font-weight: 700;
  margin-block-end: 6px;
}

.remark-row {
  font-size: 13px;
  line-height: 1.4;
  margin-block-start: 4px;
}
</style>
