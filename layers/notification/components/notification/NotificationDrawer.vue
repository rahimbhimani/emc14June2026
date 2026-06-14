<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllRead } = useNotification()

watch(
  () => props.modelValue,
  open => { if (open) fetchNotifications() },
)
</script>

<template>
  <VNavigationDrawer
    :model-value="modelValue"
    location="right"
    temporary
    width="400"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Header -->
    <div class="d-flex align-center justify-space-between pa-4">
      <div class="d-flex align-center gap-2">
        <span class="text-h6 font-weight-semibold">Notifications</span>
        <VChip v-if="unreadCount" size="small" color="error" variant="elevated">
          {{ unreadCount }} new
        </VChip>
      </div>
      <div class="d-flex gap-1">
        <VBtn
          v-if="unreadCount"
          variant="text"
          size="small"
          color="primary"
          @click="markAllRead"
        >
          Mark all read
        </VBtn>
        <VBtn variant="text" size="small" :to="{ path: '/emc/notifications' }" @click="emit('update:modelValue', false)">
          View all
        </VBtn>
      </div>
    </div>

    <VDivider />
    <VProgressLinear v-if="loading" indeterminate color="primary" height="2" />

    <!-- List -->
    <VList v-if="notifications.length" lines="two" class="pa-0">
      <NotificationItem
        v-for="n in notifications"
        :key="String(n._id)"
        :notification="n"
        @read="markAsRead(String(n._id))"
      />
    </VList>

    <!-- Empty state -->
    <div
      v-else-if="!loading"
      class="d-flex flex-column align-center justify-center pa-8 text-medium-emphasis"
      style="min-height: 200px"
    >
      <VIcon icon="mdi-bell-off-outline" size="52" class="mb-3 opacity-40" />
      <span class="text-subtitle-2">No notifications yet</span>
    </div>
  </VNavigationDrawer>
</template>
