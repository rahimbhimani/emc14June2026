<script lang="ts" setup>
const route = useRoute()

console.log(route.params)

const mFormData = await useEmcList('emcFormDesign', { 'FormParameters.master': route.params.vmaster })
</script>

<template>
  <div>
    rate 
  </div>
</template>
