import EmcUser from '~~/server/models/emcUser'
import { EmcNotification, NotificationReceipt } from '../../models/emcNotification'
import { NotificationJob } from '../../models/emcNotificationJob'
import { getChannelConfig } from '../../utils/notificationConfig'
import type { CreateNotificationDto, NotificationChannel, NotificationTarget, ContactAddress } from '../../../types/notification'

// ── Resolve recipients from target descriptors ──────────────────────────────
async function resolveRecipients(targets: NotificationTarget[], senderOrgId?: number) {
  const orQueries = targets.flatMap((t): Record<string, unknown>[] => {
    switch (t.type) {
      case 'all':                return [{}]
      case 'role':               return [{ role: t.value }]
      case 'user':               return [{ _id: t.value }]
      case 'organization_users': return [{ organizationId: t.value ?? senderOrgId }]
      case 'status':             return [{ isActive: t.value === 'active' }]
      default:                   return []
    }
  })
  if (!orQueries.length) return []
  return EmcUser.find({ $or: orQueries }).lean()
}

// POST /api/notifications
export default defineEventHandler(async (event) => {
  const user = await getUserFromEvent(event)
  const body = await readBody<CreateNotificationDto>(event)

  const isPlatformAdmin = user.role === 'platform_admin'

  if (
    (body.direction === 'platform_to_community' || body.direction === 'platform_to_organization')
    && !isPlatformAdmin
  ) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: platform admin role required' })
  }

  const effectiveTargets: NotificationTarget[] =
    body.direction === 'organization_to_users'
      ? [{ type: 'organization_users', value: user.organizationId }]
      : body.targets

  const notification = await EmcNotification.create({
    title:       body.title,
    body:        body.body,
    channels:    body.channels,
    direction:   body.direction,
    targets:     effectiveTargets,
    metadata:    body.metadata,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    senderType:  isPlatformAdmin ? 'platform' : 'organization',
    senderId:    String(user.organizationId ?? user.id),
    senderName:  user.fullName ?? user.email,
    status:      body.scheduledAt ? 'scheduled' : 'queued',
  })

  // Scheduled notifications are picked up by the queue when scheduledAt is reached
  if (body.scheduledAt) {
    return { ok: true, notificationId: String(notification._id), status: 'scheduled' }
  }

  // ── Enqueue one job per recipient × channel ───────────────────────────────
  const { systemSender } = getChannelConfig()

  const from: ContactAddress = {
    name:   user.fullName ?? systemSender.name,
    email:  systemSender.email,
    userId: user.id,
  }

  const recipients = await resolveRecipients(effectiveTargets, user.organizationId)
  const receiptDocs: Record<string, unknown>[] = []
  const jobDocs:     Record<string, unknown>[] = []

  for (const recipient of recipients) {
    const to: ContactAddress = {
      name:   recipient.fullName,
      email:  recipient.email,
      phone:  (recipient as any).phone,
      userId: String(recipient._id),
      role:   recipient.role,
    }

    for (const channel of body.channels as NotificationChannel[]) {
      // Skip if the channel has no delivery address for this recipient
      const hasAddress =
        channel === 'email'    ? !!to.email :
        channel === 'sms'      ? !!to.phone :
        channel === 'whatsapp' ? !!to.phone :
        channel === 'phone'    ? !!to.phone :
        true // in_app always has userId

      if (!hasAddress) continue

      receiptDocs.push({
        notificationId: String(notification._id),
        userId:         String(recipient._id),
        userEmail:      recipient.email,
        userPhone:      (recipient as any).phone,
        organizationId: recipient.organizationId,
        channel,
        address: to.email ?? to.phone ?? String(recipient._id),
        status:  'pending',
      })
    }
  }

  const receipts = receiptDocs.length
    ? await NotificationReceipt.insertMany(receiptDocs)
    : []

  // Build job docs now that we have receipt _ids
  for (let i = 0; i < receipts.length; i++) {
    const rd = receiptDocs[i] as any
    jobDocs.push({
      notificationId: String(notification._id),
      receiptId:      String(receipts[i]._id),
      channel:        rd.channel,
      from,
      to: {
        name:   recipients.find(r => String(r._id) === rd.userId)?.fullName,
        email:  rd.userEmail,
        phone:  rd.userPhone,
        userId: rd.userId,
      },
      subject:      body.title,
      body:         body.body,
      metadata:     body.metadata,
      status:       'pending',
      attempts:     0,
      maxAttempts:  3,
      nextAttemptAt: new Date(),
    })
  }

  if (jobDocs.length) await NotificationJob.insertMany(jobDocs)

  return {
    ok: true,
    notificationId: String(notification._id),
    status: 'queued',
    recipients: recipients.length,
    jobs: jobDocs.length,
  }
})
