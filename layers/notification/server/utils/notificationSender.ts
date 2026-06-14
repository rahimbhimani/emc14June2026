import type { NotificationChannel, ContactAddress } from '../../types/notification'
import { getChannelConfig } from './notificationConfig'

// ── Payload ─────────────────────────────────────────────────────────────────
// from / to are structured contacts, not raw strings.
// Each channel reads the relevant field (email, phone, userId) from the object.
export interface SendPayload {
  channel: NotificationChannel
  from: ContactAddress   // sender — name + email | phone | userId depending on channel
  to: ContactAddress     // recipient — email | phone | userId depending on channel
  subject: string        // email subject line / SMS/voice title
  body: string           // plain-text body
  html?: string          // optional HTML body for email
  metadata?: Record<string, unknown>
}

export interface SendResult {
  ok: boolean
  error?: string
}

// ── Email ────────────────────────────────────────────────────────────────────
async function sendEmail(payload: SendPayload): Promise<void> {
  const { email: cfg } = getChannelConfig()
  const nodemailer = await import('nodemailer')

  const transporter = nodemailer.createTransport({
    host: cfg.smtp.host,
    port: cfg.smtp.port,
    secure: cfg.smtp.secure,
    auth: { user: cfg.smtp.user, pass: cfg.smtp.pass },
  })

  const fromName  = payload.from.name  ?? cfg.defaultFrom.name
  const fromEmail = payload.from.email ?? cfg.defaultFrom.email
  const toName    = payload.to.name
  const toEmail   = payload.to.email

  if (!toEmail) throw new Error('Email recipient has no email address')

  await transporter.sendMail({
    from: toName ? `"${fromName}" <${fromEmail}>` : fromEmail,
    to:   toEmail ? `"${toName}" <${toEmail}>` : toEmail,
    subject: payload.subject,
    text: payload.body,
    html: payload.html,
  })
}

// ── SMS ──────────────────────────────────────────────────────────────────────
async function sendSms(payload: SendPayload): Promise<void> {
  const { sms: cfg } = getChannelConfig()
  if (!payload.to.phone) throw new Error('SMS recipient has no phone number')

  // TODO: uncomment when Twilio credentials are configured
  // const twilio = (await import('twilio')).default
  // const client = twilio(cfg.accountSid, cfg.authToken)
  // await client.messages.create({ to: payload.to.phone, from: cfg.defaultFrom, body: payload.body })

  console.log(`[notify:sms] from=${cfg.defaultFrom} to=${payload.to.phone} | ${payload.body.slice(0, 60)}`)
}

// ── WhatsApp ─────────────────────────────────────────────────────────────────
async function sendWhatsApp(payload: SendPayload): Promise<void> {
  const { whatsapp: cfg } = getChannelConfig()
  if (!payload.to.phone) throw new Error('WhatsApp recipient has no phone number')

  if (cfg.provider === 'twilio' && cfg.twilio) {
    // TODO: uncomment when Twilio credentials are configured
    // const twilio = (await import('twilio')).default
    // const client = twilio(cfg.twilio.accountSid, cfg.twilio.authToken)
    // await client.messages.create({ to: `whatsapp:${payload.to.phone}`, from: cfg.twilio.from, body: payload.body })
    console.log(`[notify:whatsapp/twilio] to=${payload.to.phone} | ${payload.body.slice(0, 60)}`)
  }
  else if (cfg.provider === 'meta' && cfg.meta) {
    // TODO: Meta Cloud API
    // await $fetch(`https://graph.facebook.com/v18.0/${cfg.meta.phoneNumberId}/messages`, {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${cfg.meta.accessToken}` },
    //   body: { messaging_product: 'whatsapp', to: payload.to.phone, type: 'text', text: { body: payload.body } },
    // })
    console.log(`[notify:whatsapp/meta] to=${payload.to.phone} | ${payload.body.slice(0, 60)}`)
  }
}

// ── Phone (voice call) ───────────────────────────────────────────────────────
async function sendPhone(payload: SendPayload): Promise<void> {
  const { phone: cfg } = getChannelConfig()
  if (!payload.to.phone) throw new Error('Phone recipient has no phone number')

  // TODO: uncomment when Twilio credentials are configured
  // const twilio = (await import('twilio')).default
  // const client = twilio(cfg.accountSid, cfg.authToken)
  // await client.calls.create({
  //   to: payload.to.phone,
  //   from: cfg.defaultFrom,
  //   twiml: `<Response><Say>${payload.subject}. ${payload.body}</Say></Response>`,
  // })

  console.log(`[notify:phone] from=${cfg.defaultFrom} to=${payload.to.phone} | ${payload.subject}`)
}

// ── In-App ───────────────────────────────────────────────────────────────────
// Delivery is purely via the NotificationReceipt written to MongoDB.
// No external call needed — clients poll GET /api/notifications.
async function sendInApp(_payload: SendPayload): Promise<void> {}

// ── Dispatcher ───────────────────────────────────────────────────────────────
const SENDERS: Record<NotificationChannel, (p: SendPayload) => Promise<void>> = {
  email:    sendEmail,
  sms:      sendSms,
  whatsapp: sendWhatsApp,
  phone:    sendPhone,
  in_app:   sendInApp,
}

export async function sendViaChannel(payload: SendPayload): Promise<SendResult> {
  try {
    await SENDERS[payload.channel](payload)
    return { ok: true }
  }
  catch (err: any) {
    const dest = payload.to.email ?? payload.to.phone ?? payload.to.userId ?? '?'
    console.error(`[notify:${payload.channel}] failed → ${dest}:`, err?.message)
    return { ok: false, error: err?.message ?? 'Unknown error' }
  }
}
