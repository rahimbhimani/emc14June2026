<script setup>
const props = defineProps({
  groupObject: {
    type: Object,
  },
  parentId: {
    type: String,
    default: '',
  },
})

const loading = defineModel('loading')
</script>

<template>
  <!-- {{ props.groupObject }} -->

  <VContainer
    v-if="props.groupObject !== undefined"
    id="mainContainer"

    class="pl-3 pr-0"
  >
    <VRow>
      
      <EmcDTcontrolwithingroups :group-object="props.groupObject" :parent-id="props.parentId" />
    </VRow>
  </VContainer>
  <VContainer
    v-if="props.groupObject === undefined"
    id="mainContainer"
    fluid
  >
    <div>
      No data found
    </div>
  </VContainer>
</template>
