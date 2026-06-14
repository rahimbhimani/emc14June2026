import type { NotificationChannel } from '../../types/notification'

export interface SendPayload {
  channel: NotificationChannel
  address: string   // email address | phone number | userId (in_app)
  title: string
  body: string
  metadata?: Record<string, unknown>
}

export interface SendResult {
  ok: boolean
  error?: string
}

// ── Channel implementations ─────────────────────────────────────────────────
// Swap each stub for a real provider (SendGrid, Twilio, Meta Cloud API, etc.)
// without touching the notification layer's business logic.

async function sendEmail(payload: SendPayload): Promise<void> {
  const nodemailer = await import('nodemailer')

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME ?? 'EMC Platform'}" <${process.env.SMTP_FROM_EMAIL}>`,
    to: payload.address,
    subject: payload.title,
    text: payload.body,
    // html: payload.metadata?.html as string | undefined,  // pass HTML via metadata if needed
  })
}

async function sendSms(payload: SendPayload): Promise<void> {
  // TODO: wire up Twilio SMS
  // Example:
  //   await twilioClient.messages.create({ to: payload.address, from: process.env.TWILIO_FROM, body: payload.body })
  console.log(`[notify:sms] → ${payload.address} | ${payload.body.slice(0, 60)}`)
}

async function sendWhatsApp(payload: SendPayload): Promise<void> {
  // TODO: wire up Twilio WhatsApp or Meta Cloud API (WhatsApp Business)
  // Example (Twilio):
  //   await twilioClient.messages.create({ to: `whatsapp:${payload.address}`, from: `whatsapp:${process.env.TWILIO_WA_FROM}`, body: payload.body })
  console.log(`[notify:whatsapp] → ${payload.address} | ${payload.body.slice(0, 60)}`)
}

async function sendPhone(payload: SendPayload): Promise<void> {
  // TODO: wire up Twilio Voice / Amazon Connect / Vonage
  // Phone channel typically triggers a voice call that reads the title/body via TTS.
  // Example (Twilio):
  //   await twilioClient.calls.create({ to: payload.address, from: process.env.TWILIO_PHONE_FROM, twiml: `<Response><Say>${payload.title}</Say></Response>` })
  console.log(`[notify:phone] → ${payload.address} | ${payload.title}`)
}

async function sendInApp(_payload: SendPayload): Promise<void> {
  // In-app delivery is handled by writing a NotificationReceipt to MongoDB.
  // No external call required — the client polls /api/notifications.
}

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
    console.error(`[notify:${payload.channel}] failed for ${payload.address}:`, err?.message)
    return { ok: false, error: err?.message ?? 'Unknown error' }
  }
}
