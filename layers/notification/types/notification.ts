// ── Channel ────────────────────────────────────────────────────────────────
export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'phone' | 'in_app'

// ── Address / Contact ──────────────────────────────────────────────────────
// Represents a sender or recipient. Each channel reads the relevant field.
//   email    → email + name
//   sms      → phone
//   whatsapp → phone + name
//   phone    → phone
//   in_app   → userId + name
// role is informational — resolution happens upstream in resolveRecipients().
export interface ContactAddress {
  name?: string
  email?: string
  phone?: string
  userId?: string
  role?: string
}

// ── Direction ──────────────────────────────────────────────────────────────
// Who sends to whom
export type NotificationDirection =
  | 'platform_to_community'     // Platform admin → every user in the system
  | 'platform_to_organization'  // Platform admin → all users of a specific org
  | 'organization_to_users'     // Org admin → users within their own org
  | 'direct'                    // Targeted: specific role, status, or individual user(s)

// ── Sender ─────────────────────────────────────────────────────────────────
export type NotificationSenderType = 'platform' | 'organization' | 'user'

// ── Target ─────────────────────────────────────────────────────────────────
export type NotificationTargetType =
  | 'all'                // Everyone (within the direction scope)
  | 'role'               // Users with a specific role string
  | 'user'               // A single user by ID
  | 'organization_users' // All users of a specific org (for platform senders)
  | 'status'             // Users filtered by isActive = true | false

export interface NotificationTarget {
  type: NotificationTargetType
  // role → role name | user → userId | organization_users → orgId | status → 'active'|'inactive'
  value?: string | number
}

// ── Status ─────────────────────────────────────────────────────────────────
export type NotificationStatus = 'draft' | 'scheduled' | 'queued' | 'sent' | 'failed'
export type ReceiptStatus = 'pending' | 'delivered' | 'read' | 'failed'
export type JobStatus = 'pending' | 'processing' | 'done' | 'failed'

// ── Core entity ────────────────────────────────────────────────────────────
export interface IEmcNotification {
  _id?: string
  title: string
  body: string
  channels: NotificationChannel[]
  direction: NotificationDirection
  senderType: NotificationSenderType
  senderId?: string        // organizationId (as string) or userId
  senderName?: string
  targets: NotificationTarget[]
  metadata?: Record<string, unknown>
  scheduledAt?: Date | string
  sentAt?: Date | string
  status: NotificationStatus
  createdAt?: Date | string
  updatedAt?: Date | string
}

// Per-recipient delivery record
export interface INotificationReceipt {
  _id?: string
  notificationId: string
  userId: string
  userEmail?: string
  userPhone?: string
  organizationId?: number
  channel: NotificationChannel
  address: string         // email address / phone number / userId for in_app
  deliveredAt?: Date | string
  readAt?: Date | string
  status: ReceiptStatus
  errorMessage?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

// ── DTOs ───────────────────────────────────────────────────────────────────
export interface CreateNotificationDto {
  title: string
  body: string
  channels: NotificationChannel[]
  direction: NotificationDirection
  targets: NotificationTarget[]
  metadata?: Record<string, unknown>
  scheduledAt?: string
}

// What the client sees — notification enriched with the current user's read state
export interface NotificationView extends IEmcNotification {
  isRead: boolean
  receiptId?: string
  channel?: NotificationChannel  // the channel this receipt was delivered on
  deliveredAt?: Date | string
}

// ── Job (queue entry) ───────────────────────────────────────────────────────
export interface INotificationJob {
  _id?: string
  notificationId: string
  receiptId?: string         // linked NotificationReceipt _id
  channel: NotificationChannel
  from: ContactAddress
  to: ContactAddress
  subject: string
  body: string
  html?: string
  metadata?: Record<string, unknown>
  status: JobStatus
  attempts: number
  maxAttempts: number
  nextAttemptAt: Date | string
  lastError?: string
  processedAt?: Date | string
  createdAt?: Date | string
  updatedAt?: Date | string
}

// ── UI helpers ─────────────────────────────────────────────────────────────
export const CHANNEL_META: Record<NotificationChannel, { label: string; icon: string; color: string }> = {
  email:    { label: 'Email',    icon: 'mdi-email-outline',       color: 'info' },
  sms:      { label: 'SMS',      icon: 'mdi-message-text-outline', color: 'success' },
  whatsapp: { label: 'WhatsApp', icon: 'mdi-whatsapp',            color: 'success' },
  phone:    { label: 'Phone',    icon: 'mdi-phone-outline',       color: 'warning' },
  in_app:   { label: 'In-App',   icon: 'mdi-bell-outline',        color: 'primary' },
}

export const DIRECTION_META: Record<NotificationDirection, { label: string; desc: string }> = {
  platform_to_community:    { label: 'Platform → Everyone',      desc: 'Broadcast to all users across all organizations' },
  platform_to_organization: { label: 'Platform → Organization',  desc: 'All users of a specific organization' },
  organization_to_users:    { label: 'Organization → Users',     desc: 'Users within your organization' },
  direct:                   { label: 'Direct',                   desc: 'Target by role, status, or specific user' },
}
