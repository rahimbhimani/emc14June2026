import { NotificationReceipt } from '../../models/emcNotification'

// PATCH /api/notifications/:id
// Marks a receipt as read or unread for the current user.
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  const notificationId = getRouterParam(event, 'id')
  const body = await readBody<{ action: 'read' | 'unread' }>(event)

  if (!notificationId) throw createError({ statusCode: 400, statusMessage: 'Missing notification id' })
  if (body.action !== 'read' && body.action !== 'unread')
    throw createError({ statusCode: 400, statusMessage: "action must be 'read' or 'unread'" })

  const update =
    body.action === 'read'
      ? { readAt: new Date(), status: 'read' }
      : { $unset: { readAt: 1 }, status: 'delivered' }

  const receipt = await NotificationReceipt.findOneAndUpdate(
    { notificationId, userId: user.id },
    update,
    { new: true },
  )

  if (!receipt)
    throw createError({ statusCode: 404, statusMessage: 'Receipt not found' })

  return { ok: true }
})
