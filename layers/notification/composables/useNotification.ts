import type { CreateNotificationDto, NotificationView } from '../types/notification'

// Shared reactive state so the bell badge stays in sync across components.
const notifications = ref<NotificationView[]>([])
const unreadCount = ref(0)
const loading = ref(false)

export function useNotification() {
  // ── Fetch ───────────────────────────────────────────────────────────────
  async function fetchNotifications(page = 1, unreadOnly = false) {
    loading.value = true
    try {
      const data = await $fetch<{
        notifications: NotificationView[]
        unreadCount: number
        total: number
      }>('/api/notifications', {
        query: { page, limit: 20, unread: unreadOnly || undefined },
      })
      notifications.value = data.notifications
      unreadCount.value = data.unreadCount
    }
    finally {
      loading.value = false
    }
  }

  // ── Read / Unread ────────────────────────────────────────────────────────
  async function markAsRead(notificationId: string) {
    await $fetch(`/api/notifications/${notificationId}`, {
      method: 'PATCH',
      body: { action: 'read' },
    })
    const n = notifications.value.find(n => String(n._id) === notificationId)
    if (n && !n.isRead) {
      n.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  }

  async function markAllRead() {
    const unread = notifications.value.filter(n => !n.isRead)
    await Promise.all(unread.map(n => markAsRead(String(n._id))))
  }

  // ── Send ─────────────────────────────────────────────────────────────────
  async function sendNotification(dto: CreateNotificationDto) {
    return $fetch('/api/notifications', { method: 'POST', body: dto })
  }

  async function broadcast(dto: {
    title: string
    body: string
    channels: CreateNotificationDto['channels']
    organizationId?: number
    metadata?: Record<string, unknown>
  }) {
    return $fetch('/api/notifications/broadcast', { method: 'POST', body: dto })
  }

  return {
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    loading: readonly(loading),
    fetchNotifications,
    markAsRead,
    markAllRead,
    sendNotification,
    broadcast,
  }
}
