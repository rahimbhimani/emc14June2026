<script lang="ts" setup>
const route = useRoute()

const RateConfiguration = {rateType : 'RahRateType'}

console.log('route.params', route.params)
</script>

<template>
  <div>
    {{route}} 
  </div>
</template>
