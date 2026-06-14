<script setup lang="ts">
definePageMeta({ title: 'Notifications' })

const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllRead } = useNotification()

const tab = ref<'all' | 'unread'>('all')

onMounted(() => fetchNotifications())

const displayed = computed(() =>
  tab.value === 'unread' ? notifications.value.filter(n => !n.isRead) : notifications.value,
)

function onTabChange(val: 'all' | 'unread') {
  tab.value = val
  fetchNotifications(1, val === 'unread')
}
</script>

<template>
  <VRow>
    <VCol cols="12" md="9" lg="7" offset-md="1" offset-lg="2">
      <VCard>
        <!-- Header -->
        <div class="d-flex align-center justify-space-between pa-5 pb-4">
          <div class="d-flex align-center gap-3">
            <VIcon icon="mdi-bell-outline" color="primary" size="28" />
            <span class="text-h5 font-weight-semibold">Notifications</span>
            <VChip v-if="unreadCount" color="error" size="small" variant="elevated">
              {{ unreadCount }}
            </VChip>
          </div>
          <div class="d-flex gap-2">
            <VBtn
              variant="text"
              size="small"
              :disabled="!unreadCount"
              @click="markAllRead"
            >
              Mark all read
            </VBtn>
            <VBtn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-send-outline"
              :to="{ path: '/emc/notifications/compose' }"
            >
              Compose
            </VBtn>
          </div>
        </div>

        <!-- Tabs -->
        <VTabs :model-value="tab" @update:model-value="onTabChange($event as any)">
          <VTab value="all">All</VTab>
          <VTab value="unread">
            Unread
            <VChip v-if="unreadCount" size="x-small" color="error" class="ms-1">{{ unreadCount }}</VChip>
          </VTab>
        </VTabs>

        <VDivider />
        <VProgressLinear v-if="loading" indeterminate color="primary" height="2" />

        <!-- List -->
        <VList v-if="displayed.length" lines="two" class="pa-0">
          <NotificationItem
            v-for="n in displayed"
            :key="String(n._id)"
            :notification="n"
            @read="markAsRead(String(n._id))"
          />
        </VList>

        <!-- Empty -->
        <div
          v-else-if="!loading"
          class="d-flex flex-column align-center justify-center pa-12 text-medium-emphasis"
        >
          <VIcon icon="mdi-bell-off-outline" size="72" class="mb-4 opacity-30" />
          <span class="text-h6 mb-1">
            {{ tab === 'unread' ? 'All caught up!' : 'No notifications yet' }}
          </span>
          <span class="text-body-2">
            {{ tab === 'unread' ? 'You have no unread notifications.' : 'Notifications will appear here.' }}
          </span>
        </div>
      </VCard>
    </VCol>
  </VRow>
</template>
