<script setup>
// import res from '@db/apps/ecommerce/board.json'

// const res = fetch('../../static/data/board.json')

// onMounted(() => {
//   axios.get('../../static/data/board.json')
//     .then(response => {
//       fileContents = response.data
//     })
//     .catch(error => {
//       console.error(error)
//     })
// })
const jsonData = ''

// try {
//   // const res = await useAsyncData(async () => {
//   //   return await $fetch('/assets/board.json')
//   // })
//   // const res = await fetch('@db/apps/ecommerce/board.json')

//   // const res = await useFetch('@static/data/board.json')
//   if (!res.ok)
//     throw new Error(`Failed to fetch file: ${res.statusText}`)

//   jsonData = await res.json()

//   console.log('File contents:', jsonData)
// }
// catch (error) {
//   jsonData = error
//   console.error('Fetch error:', error)
// }
</script>

<template>
  <div>
    rahiim
    <!-- {{ res }}
    {{ jsonData }} -->
  </div>
</template>

<style>
/* Helper classes */
.bg-basil {
  background-color: #fffbe6 !important;
}

.text-basil {
  color: #356859 !important;
}

.container {
  display: flex;
  align-items: middle;
}

.mydiv {
  inline-size: 80px;
}
</style>
