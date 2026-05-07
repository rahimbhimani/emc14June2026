<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"

const props = defineProps({
  master: { type: Object, required: true },
  masterConfig: { type: Object, default: () => ({}) },
  containerType: { type: String, required: true },
  actionId: { type: String, required: true },
  actionConfig: { type: Object, default: () => ({}) }
})

function getGroupSummary(group: any) {
  let totalTypes = 0
  let totalItems = 0

  for (const item of group.items || []) {
    totalTypes += Number(item.typeCount || 0)
    totalItems += Number(item.itemCount || 0)
  }

  return {
    typeCount: totalTypes,
    itemCount: totalItems
  }
}

const emit = defineEmits(["close", "completed"])

const organizationId = 12313

const groupedChildren = ref<any>({})
const orchestration = ref<any>({})
const quantityMap = ref<Record<string, Record<string, number>>>({})
const selectedUserContainers = ref<Record<string, any[]>>({})
const loading = ref(false)

const uploadDialog = ref(false)
const currentUploadType = ref<string | null>(null)

const activeTab = ref("")
const sectionRefs = ref<Record<string, HTMLElement | null>>({})

/* ================= HELPERS ================= */

function openUpload(type: string) {
  currentUploadType.value = type
  uploadDialog.value = true
}

function handleUploadApplied(data: any) {
  if (!currentUploadType.value) return
  applyUploadData(currentUploadType.value, data)
  uploadDialog.value = false
}

function applyUploadData(type: string, rows: any[]) {
  const group = groupedChildren.value[type]
  if (!group) return

  if (group.config.inventoryManaged) {
    if (!quantityMap.value[type]) quantityMap.value[type] = {}
    rows.forEach(r => {
      quantityMap.value[type][r.IDX] = r.quantity || 0
    })
  } else {
    selectedUserContainers.value[type] = rows
  }
}

function setSectionRef(type: string) {
  return (el: HTMLElement | null) => {
    if (el) sectionRefs.value[type] = el
  }
}

function scrollToSection(type: string) {
  activeTab.value = type
  sectionRefs.value[type]?.scrollIntoView({ behavior: "smooth" })
}

function getAvailable(item: any) {
  return item.totalAvailable ?? item.available ?? 0
}

/* ================= VALIDATION ================= */

const sectionStatus = (type: string) => {
  const group = groupedChildren.value[type]

  if (group.config.inventoryManaged) {
    for (const item of group.items) {
      if ((quantityMap.value[type]?.[item.IDX] || 0) > getAvailable(item)) {
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

/* ================= LOAD ================= */

async function loadMovement() {
  const res: any = await $fetch("/api/emc/movement/emcPrepareMovement", {
    method: "POST",
    body: {
      organizationId,
      destinationType: props.containerType,
      destinationIDX: props.master?.IDX,
      actionId: props.actionId
    }
  })

  groupedChildren.value = res.groupedChildren || {}
  orchestration.value = res.orchestration || {}

  for (const k in selectedUserContainers.value) delete selectedUserContainers.value[k]
  for (const k in quantityMap.value) delete quantityMap.value[k]

  for (const type in groupedChildren.value) {
    const group = groupedChildren.value[type]

    selectedUserContainers.value[type] = []

    if (group.config.inventoryManaged) {
      quantityMap.value[type] = {}

      group.items.forEach((item: any) => {
        quantityMap.value[type][item.IDX] =
          item.assignedHere ? item.quantity || 0 : 0
      })
      continue
    }

    group.items.forEach((item: any) => {
      if (item.assignedHere) {
        selectedUserContainers.value[type].push(item)
      }
    })
  }

  activeTab.value = Object.keys(groupedChildren.value)[0]

  await nextTick()
}

watch(() => props.master?.IDX, loadMovement)
onMounted(loadMovement)

/* ================= CONFIRM ================= */

function scrollToFirstError() {
  for (const type in groupedChildren.value) {
    if (sectionStatus(type) === "error") {
      scrollToSection(type)
      return
    }
  }
}

async function confirmMovement() {
  if (hasError.value) return scrollToFirstError()

  loading.value = true

  try {
    const containers: Record<string, any> = {}

    for (const type in groupedChildren.value) {
      const group = groupedChildren.value[type]

      /* INVENTORY */
      if (group.config.inventoryManaged) {
        const quantities: Record<string, number> = {}
        const sources: Record<string, any> = {}

        const qMap = quantityMap.value[type] || {}

        for (const item of group.items || []) {
          const qty = Number(qMap[item.IDX] || 0)
          if (qty <= 0) continue

          quantities[item.IDX] = qty

          if (orchestration.value?.movementType === "TRANSFER") {
            let remaining = qty
            sources[item.IDX] = {}

            for (const src of item.sources || []) {
              if (remaining <= 0) break
              if (!src?.containerIDX) continue

              const available = Number(src.available || 0)
              if (available <= 0) continue

              const take = Math.min(available, remaining)
              sources[item.IDX][src.containerIDX] = take
              remaining -= take
            }

            if (!Object.keys(sources[item.IDX]).length) {
              delete sources[item.IDX]
            }
          }
        }

        containers[type] = {
          quantities,
          ...(Object.keys(sources).length ? { sources } : {})
        }

        continue
      }

      /* STRUCTURAL */
      const selectedRows = selectedUserContainers.value[type] || []

      containers[type] = {
        children: selectedRows.map((r: any) => r.IDX)
      }
    }

    await $fetch("/api/emc/movement/emcExecuteAction", {
      method: "POST",
      body: {
        organizationId,
        actionId: props.actionId,
        destination: {
          type: props.containerType,
          idx: props.master?.IDX
        },
        userContext: {
          userId: "USR-001",
          role: "MANAGER"
        },
        containers,
        input: {}
      }
    })

    emit("completed")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-card class="movement-shell">
    <!-- HEADER -->
    <div class="header">
      <div class="title">
        {{ actionConfig?.label }} → {{ master?.IDX }}
      </div>
      <v-btn icon="mdi:close" variant="text" @click="emit('close')" />
    </div>

    <!-- TABS -->
    <div class="type-tabs">
      <div v-for="(group, type) in groupedChildren" :key="type" class="tab-chip" :class="{ active: activeTab === type }"
        @click="scrollToSection(type)">
        {{ group.config?.label }}
        ({{ selectedUserContainers[type]?.length || 0 }})
      </div>
    </div>

    <!-- CONTENT -->
    <div class="scroll">

      <div v-for="(group, type) in groupedChildren" :key="type" :ref="setSectionRef(type)">
        <v-card class="section-card">

          <div class="section-header">
            <div>
              <div class="section-title">
                {{ group.config?.label }}
              </div>

              <div class="section-sub">
                <template v-if="group.config?.showItemCount">
                  {{ getGroupSummary(group).typeCount }}
                  {{ getGroupSummary(group).typeCount === 1 ? 'type' : 'types' }}
                </template>

                <span v-if="group.config?.showItemCount && group.config?.showQuantity">
                  •
                </span>

                <template v-if="group.config?.showQuantity">
                  {{ getGroupSummary(group).itemCount }}
                  {{ getGroupSummary(group).itemCount === 1 ? 'item' : 'items' }}
                </template>
              </div>
            </div>

            <v-btn size="small" variant="text" @click="openUpload(type)">
              Upload
            </v-btn>
          </div>

          <!-- STRUCTURAL -->
          <v-data-table v-if="!group.config.inventoryManaged" class="clean-list" :items="group.items" item-value="IDX"
            v-model="selectedUserContainers[type]" show-select return-object density="compact" hide-default-header
            :hide-default-footer="group.items.length <= 10">
            <template #item="{ item, isSelected, toggleSelect }">
              <tr class="list-row" :class="{ selected: isSelected({ value: item }) }"
                @click="toggleSelect({ value: item })">
                <!-- CHECKBOX -->
                <td class="checkbox">
                  <v-checkbox-btn density="compact" :model-value="isSelected({ value: item })"
                    @click.stop="toggleSelect({ value: item })" />
                </td>
                <!-- CONTENT -->
                <td class="content">
                  <div class="name">{{ item.Name }}</div>

                  <div class="sub-line">
                    {{ item.IDX }}

                    <span v-if="group.config?.showItemCount || group.config?.showQuantity">
                      •
                    </span>

                    <template v-if="group.config?.showItemCount">
                      {{ item.typeCount || 0 }}
                      {{ item.typeCount === 1 ? 'type' : 'types' }}
                    </template>

                    <span v-if="group.config?.showItemCount && group.config?.showQuantity">
                      •
                    </span>

                    <template v-if="group.config?.showQuantity">
                      {{ item.itemCount || 0 }}
                      {{ item.itemCount === 1 ? 'item' : 'items' }}
                    </template>
                  </div>
                </td>

                <!-- STATUS ICON -->
                <td class="icon">
                  <v-icon v-if="item.parentIDX === master.IDX" size="16" color="primary">
                    mdi:link-variant
                  </v-icon>
                </td>
              </tr>
            </template>
          </v-data-table>

          <!-- INVENTORY -->
          <v-data-table v-else class="inventory-table" :items="group.items" item-value="IDX" density="compact">
            <template #headers>
              <tr>
                <th>Product</th>
                <th class="center">Stock</th>
                <th class="right">Move</th>
              </tr>
            </template>

            <template #item="{ item }">
              <tr>
                <td>
                  <div class="title">{{ item.Name }}</div>
                  <div class="subtitle">{{ item.IDX }}</div>
                </td>

                <td class="center">
                  <v-chip size="small">
                    {{ item.currentQuantity || 0 }} /
                    {{ item.totalAvailable || 0 }}
                  </v-chip>
                </td>

                <td class="right">
                  <v-text-field v-model.number="quantityMap[type][item.IDX]" type="number" density="compact"
                    variant="outlined" hide-details :max="item.totalAvailable" style="inline-size: 70px;" />
                </td>
              </tr>
            </template>
          </v-data-table>

        </v-card>
      </div>

    </div>

    <!-- FOOTER -->
    <div class="footer">
      <v-btn block color="primary" :loading="loading" @click="confirmMovement">
        Confirm ({{ totalSelected }})
      </v-btn>
    </div>

  </v-card>

  <emcFileUploadDialog v-model="uploadDialog" :uploadId="currentUploadType" @applied="handleUploadApplied" />
</template>

<style scoped>
.movement-shell {
  display: flex;
  flex-direction: column;
  block-size: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  padding-block: 12px;
  padding-inline: 16px;
}

.title {
  font-weight: 600;
}

.type-tabs {
  display: flex;
  border-block-end: 1px solid #eee;
  gap: 8px;
  padding-block: 8px;
  padding-inline: 16px;
}

.tab-chip {
  border-radius: 14px;
  background: #eee;
  cursor: pointer;
  padding-block: 5px;
  padding-inline: 12px;
}

.tab-chip.active {
  background: #1976d2;
  color: white;
}

.scroll {
  overflow: auto;
  flex: 1;
}

.section-card {
  padding: 10px;
  margin: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  margin-block-end: 6px;
}

.subtitle {
  color: #888;
  font-size: 11px;
}

.footer {
  padding: 10px;
  border-block-start: 1px solid #eee;
}

.center {
  text-align: center;
}

.right {
  text-align: end;
}

.clean-list :deep(table) {
  border-collapse: separate;
  border-spacing: 0 6px;
}

.list-row {
  background: #fafafa;
  cursor: pointer;
  transition: 0.15s;
}

.list-row td {
  padding-block: 10px;
  padding-inline: 8px;
}

.list-row.selected td {
  background: #e8f0ff;
}

/* checkbox spacing FIX */
.checkbox {
  inline-size: 32px;
  padding-inline-start: 6px;
}

/* content */
.content {
  padding-inline-start: 4px;
}

.name {
  font-weight: 500;
}

.sub {
  color: #888;
  font-size: 11px;
}

.meta {
  color: #666;
  font-size: 11px;
  margin-block-start: 2px;
}

/* right icon */
.icon {
  inline-size: 32px;
  padding-inline-end: 8px;
  text-align: end;
}

.sub-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  color: #777;
  font-size: 12px;
  gap: 4px;
}

.section-sub {
  color: #777;
  font-size: 12px;
  margin-block-start: 2px;
}
</style>
