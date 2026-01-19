<script setup>
const props = defineProps(['OutputDataForList', 'ListHeaders'])
const selectionchanged = defineEmits(['selectionchanged'])
const PaginationParameters = defineModel('PaginationParameters')
</script>

<template>

  kasjdhlkasjhflfkjh
  <!-- <div v-if="props.OutputDataForList">
    <VDataTable
      v-model:server-items-length="PaginationParameters.TotalRecordCount"
      :headers="props.ListHeaders"
      :items="props.OutputDataForList"
      :items-per-page-options="[1, 2, 5, 10, 50, 100]"
      show-current-page
      density="compact"
      class="fixed-height-table"
    >
      <template #bottom>
        <VContainer fluid>
          <VRow justify="end">
            <VCol
              cols="2"
              align="right"
            >
              <VSelect
                v-model="PaginationParameters.Limit"
                :items="[1, 2, 5, 10, 50, 100]"
                density="compact"
                style="inline-size:60%"
                @update:model-value="$emit('selectionchanged')"
              />
            </VCol>
            <VCol cols="4">
              <VPagination
                v-model:model-value="PaginationParameters.CurrentPage"
                :length="PaginationParameters.TotalPages"
                :total-visible="15"
                @click="$emit('selectionchanged')"
              />
            </VCol>
          </VRow>
        </VContainer>
      </template>
    </VDataTable>
  </div> -->
</template>

<style scoped>
.fixed-height-table {
  block-size: 400px; /* Set your desired fixed height */
  overflow-y: auto; /* Enable vertical scrolling */
}
</style>
