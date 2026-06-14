<script setup lang="ts">
const { status, getSession } = useAuth()

if (status.value === 'loading')
  await getSession()

if (status.value !== 'authenticated') {
  await navigateTo('/login', { replace: true })
}
else {
  await navigateTo('/dashboards/analytics', { replace: true })
}
</script>

<template>
  <div />
</template>
