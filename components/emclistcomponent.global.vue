<script setup lang="ts">
import { computed } from 'vue';

/* ================= PROPS ================= */
const props = defineProps<{
  OutputDataForList: any[]
  ListHeaders: { title: string; key: string }[]
}>()

const listviewmode = defineModel('listviewmode')
/* ================= EMITS ================= */
const emit = defineEmits(['selectionchanged'])

/* ================= MODELS ================= */
const PaginationParameters = defineModel<any>('PaginationParameters')
const SelectedRows = defineModel<any[]>('SelectedRows', { default: [] })
const loading = defineModel<boolean>('loading')

/* ================= VIEW TYPE ================= */
// const listviewmode = ref<'table' | 'card'>('card')

/* ================= HELPERS ================= */
const getValueByPath = (obj: any, path: string) => {
  return path?.split('.').reduce((acc, key) => acc?.[key], obj)
}

/* ================= DISPLAY HELPERS ================= */
const getDisplay = (val: any) => {
  if (val === null || val === undefined) {
    return { value: 'No data', isEmpty: true }
  }

  if (typeof val === 'string' && val.trim() === '') {
    return { value: 'No data', isEmpty: true }
  }

  return { value: val, isEmpty: false }
}

/* ================= HEADER DISPLAY CACHE ================= */
/* Computed ONCE per data change – NOT per render */
const headerDisplayMap = computed(() => {
  const map = new Map<string, { value: any; isEmpty: boolean }>()

  for (const item of props.OutputDataForList || []) {
    const raw = getValueByPath(item, props.ListHeaders[0]?.key)
    map.set(item._id, getDisplay(raw))
  }

  return map
})

/* ================= SELECTION (_id ONLY) ================= */
const isSelected = (item: any) => {
  return SelectedRows.value.some(row => row._id === item._id)
}

const onCheckboxChange = (checked: boolean, item: any) => {
  const index = SelectedRows.value.findIndex(
    row => row._id === item._id
  )

  if (checked && index === -1) {
    SelectedRows.value.push(item)
  }

  if (!checked && index > -1) {
    SelectedRows.value.splice(index, 1)
  }
}
</script>

<template>
  <div v-if="props.OutputDataForList">

    <!-- ================= LOADER ================= -->
    <VSkeletonLoader
      type="table-row-divider, table-tbody"
      :loading="loading"
    >

      <!-- ================= TABLE VIEW ================= -->
      <VDataTable
        v-if="listviewmode === 'table'"
        v-model="SelectedRows"
        :headers="props.ListHeaders"
        :items="props.OutputDataForList"
        class="truncate-table"
        density="comfortable"
        disable-pagination
        hide-default-footer
        :items-per-page="-1"
        fixed-header
        return-object
        show-select
      />

      <!-- ================= CARD VIEW ================= -->
      <VRow
        v-if="listviewmode === 'card'"
        class="ma-1"
        dense
      >
        <VCol
          v-for="item in props.OutputDataForList"
          :key="item._id"
          cols="12"
          sm="6"
          md="3"
        >
          <VCard elevation="2" border>

            <!-- HEADER ROW -->
            <VCardTitle class="d-flex align-center justify-space-between">
              <span
                :class="headerDisplayMap.get(item._id)?.isEmpty
                  ? 'text-medium-emphasis text-caption font-italic'
                  : 'font-weight-bold'"
              >
                {{ headerDisplayMap.get(item._id)?.value }}
              </span>

              <VCheckbox
                :model-value="isSelected(item)"
                density="compact"
                hide-details
                @click.stop
                @update:model-value="val => onCheckboxChange(val, item)"
              />
            </VCardTitle>

            <VDivider />

            <!-- DATA ROWS -->
            <VCardText class="py-1 px-2">
              <VRow
                v-for="header in props.ListHeaders.slice(1)"
                :key="header.key"
                dense
                class="py-1"
              >
                <VCol cols="4" class="text-caption text-grey pa-0">
                  {{ header.title }}
                </VCol>

                <VCol
                  cols="8"
                  class="font-weight-medium text-truncate pa-0"
                  :title="getValueByPath(item, header.key)"
                >
                  {{ getValueByPath(item, header.key) ?? '-' }}
                </VCol>
              </VRow>
            </VCardText>

          </VCard>
        </VCol>
      </VRow>

      <!-- ================= PAGINATION (SERVER SIDE) ================= -->
      <VDivider />

      <VContainer
        fluid
        density="compact"
        class="h-10 pa-1 ma-0"
      >
        <VRow
          justify="start"
          density="compact"
          class="align-center"
        >

          <VCol
            v-if="SelectedRows?.length > 0"
            cols="2"
            class="pa-0 ma-0"
          >
            Selected rows : {{ SelectedRows.length }}
          </VCol>

          <VSpacer />

          <VCol cols="2" align="right">
            <VSelect
              v-model="PaginationParameters.Limit"
              :items="[1, 2, 5, 10, 50, 100]"
              density="compact"
              style="inline-size: 60%;"
              @update:model-value="
                PaginationParameters.CurrentPage = 1;
                emit('selectionchanged')
              "
            />
          </VCol>

          <VCol cols="4">
            <VPagination
              v-model:model-value="PaginationParameters.CurrentPage"
              density="compact"
              :length="PaginationParameters?.TotalPages"
              @update:model-value="emit('selectionchanged')"
            />
          </VCol>

          <VCol cols="2" class="center">
            Total Count : {{ PaginationParameters?.TotalRecordCount }}
          </VCol>

        </VRow>
      </VContainer>

    </VSkeletonLoader>
  </div>
</template>

<style scoped>
.truncate-table .v-data-table__td,
.truncate-table .v-data-table__th {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
