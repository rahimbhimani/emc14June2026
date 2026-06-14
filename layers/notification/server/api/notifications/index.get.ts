import { EmcNotification, NotificationReceipt } from '../../models/emcNotification'

// GET /api/notifications
// Returns the calling user's notification feed with read state.
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page ?? 1))
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)))
  const skip = (page - 1) * limit
  const unreadOnly = query.unread === 'true'

  const receiptFilter: Record<string, unknown> = { userId: user.id }
  if (unreadOnly) receiptFilter.readAt = { $exists: false }

  const [receipts, total, unreadCount] = await Promise.all([
    NotificationReceipt.find(receiptFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    NotificationReceipt.countDocuments(receiptFilter),
    NotificationReceipt.countDocuments({ userId: user.id, readAt: { $exists: false } }),
  ])

  const notifIds = receipts.map(r => r.notificationId)
  const notifDocs = await EmcNotification.find({ _id: { $in: notifIds } }).lean()
  const notifMap = Object.fromEntries(notifDocs.map(n => [String(n._id), n]))

  const notifications = receipts.map(r => ({
    ...notifMap[r.notificationId],
    receiptId: String(r._id),
    isRead: !!r.readAt,
    channel: r.channel,
    deliveredAt: r.deliveredAt,
  }))

  return { notifications, unreadCount, total, page, limit }
})
