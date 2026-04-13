<script setup lang="ts">
const props = defineProps({
  items: {
    type: Object,
    default: () => ({})
  },

  loading: {
    type: Boolean,
    default: false
  },

  title: {
    type: String,
    default: ""
  },

  containerIDX: {
    type: String,
    default: ""
  }
})

function badgeValue(row: any) {
  if (row.quantity !== undefined) {
    return row.quantity
  }

  if (row.itemCount !== undefined) {
    return row.itemCount
  }

  return null
}

function sectionCount(rows: any[]) {
  if (!rows?.length) return 0

  const hasQuantity =
    rows.some(
      (r: any) =>
        r.quantity !== undefined
    )

  if (hasQuantity) {
    return rows.reduce(
      (sum: number, r: any) =>
        sum +
        Number(
          r.quantity || 0
        ),
      0
    )
  }

  return rows.length
}
</script>

<template>
  <div class="inventory-wrapper">

    <!-- HEADER -->

    <div v-if="title || containerIDX" class="viewer-title">
      {{
        title ||
        `Inventory — ${containerIDX}`
      }}
    </div>

    <!-- LOADING -->

    <div v-if="loading" class="inventory-loading">
      <v-progress-circular indeterminate />
    </div>

    <!-- CONTENT -->

    <template v-else>

      <div v-for="(rows, type) in items" :key="type" class="inventory-section">

        <div class="section-title">

          {{ type }}

          <v-chip size="small" class="ml-2" color="primary" variant="tonal">
            {{ sectionCount(rows) }}
          </v-chip>

        </div>

        <v-list density="compact">

          <v-list-item v-for="row in rows" :key="row.idx" class="inventory-row">

            <template #title>

              <div class="row-content">

                <div class="row-label">
                  {{
                    row.label ||
                    row.idx
                  }}
                </div>

                <div v-if="row.subLabel" class="row-sub">
                  {{ row.subLabel }}
                </div>

              </div>

            </template>

            <template #append>

              <v-chip v-if="badgeValue(row) !== null" size="small" color="grey" variant="tonal">
                {{ badgeValue(row) }}
              </v-chip>

            </template>

          </v-list-item>

        </v-list>

      </div>

      <div v-if="Object.keys(items).length === 0" class="empty-state">
        No inventory found
      </div>

    </template>

  </div>
</template>

<style scoped>
.inventory-wrapper {
  block-size: 100%;
}

.viewer-title {
  font-size: 18px;
  font-weight: 700;
  padding-block: 16px 8px;
  padding-inline: 16px;
}

.inventory-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.inventory-section {
  margin-block-end: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  margin-block-end: 8px;
}

.inventory-row {
  border-block-end: 1px solid #f0f0f0;
}

.row-content {
  display: flex;
  flex-direction: column;
}

.row-label {
  font-size: 15px;
  font-weight: 500;
}

.row-sub {
  color: #888;
  font-size: 12px;
  margin-block-start: 2px;
}

.empty-state {
  padding: 40px;
  color: #888;
  text-align: center;
}
</style>
