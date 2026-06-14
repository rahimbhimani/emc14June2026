// ── Per-channel configuration ───────────────────────────────────────────────
// This is the single place to configure every notification provider.
// All values are read from environment variables — see .env.example for the
// full list of keys. Add new channels here; notificationSender.ts reads them.

export interface EmailConfig {
  smtp: {
    host: string
    port: number
    secure: boolean   // true = TLS on connect (port 465); false = STARTTLS (port 587)
    user: string
    pass: string
  }
  defaultFrom: ContactInfo
}

export interface SmsConfig {
  provider: 'twilio'
  accountSid: string
  authToken: string
  defaultFrom: string    // Twilio phone number or alphanumeric sender ID
}

export interface WhatsAppConfig {
  provider: 'twilio' | 'meta'
  // Twilio WhatsApp
  twilio?: {
    accountSid: string
    authToken: string
    from: string        // "whatsapp:+1415..."
  }
  // Meta Cloud API (WhatsApp Business)
  meta?: {
    phoneNumberId: string
    accessToken: string
    from: string
  }
}

export interface PhoneConfig {
  provider: 'twilio'
  accountSid: string
  authToken: string
  defaultFrom: string   // Twilio voice number
}

export interface ContactInfo {
  name: string
  email: string
}

export interface NotificationChannelConfig {
  email: EmailConfig
  sms: SmsConfig
  whatsapp: WhatsAppConfig
  phone: PhoneConfig
  // System-wide default sender identity used when a caller doesn't specify from.name / from.email
  systemSender: ContactInfo
}

// ── Environment variable keys (reference) ──────────────────────────────────
// EMAIL
//   SMTP_HOST          e.g. smtp.gmail.com
//   SMTP_PORT          e.g. 587
//   SMTP_SECURE        true | false
//   SMTP_USER          your SMTP login
//   SMTP_PASS          your SMTP password / app password
//   SMTP_FROM_NAME     display name  (default: EMC Platform)
//   SMTP_FROM_EMAIL    from address  (e.g. no-reply@yourapp.com)
//
// SMS / PHONE / WHATSAPP (Twilio)
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM_PHONE      e.g. +15005550006
//   TWILIO_WHATSAPP_FROM   e.g. whatsapp:+14155238886
//
// WHATSAPP (Meta Cloud API alternative)
//   META_WA_PHONE_NUMBER_ID
//   META_WA_ACCESS_TOKEN
//   META_WA_FROM_PHONE

export function getChannelConfig(): NotificationChannelConfig {
  return {
    systemSender: {
      name: process.env.SMTP_FROM_NAME ?? 'EMC Platform',
      email: process.env.SMTP_FROM_EMAIL ?? '',
    },

    email: {
      smtp: {
        host: process.env.SMTP_HOST ?? '',
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? '',
      },
      defaultFrom: {
        name: process.env.SMTP_FROM_NAME ?? 'EMC Platform',
        email: process.env.SMTP_FROM_EMAIL ?? '',
      },
    },

    sms: {
      provider: 'twilio',
      accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
      authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
      defaultFrom: process.env.TWILIO_FROM_PHONE ?? '',
    },

    whatsapp: {
      provider: (process.env.WHATSAPP_PROVIDER as 'twilio' | 'meta') ?? 'twilio',
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
        authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
        from: process.env.TWILIO_WHATSAPP_FROM ?? '',
      },
      meta: {
        phoneNumberId: process.env.META_WA_PHONE_NUMBER_ID ?? '',
        accessToken: process.env.META_WA_ACCESS_TOKEN ?? '',
        from: process.env.META_WA_FROM_PHONE ?? '',
      },
    },

    phone: {
      provider: 'twilio',
      accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
      authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
      defaultFrom: process.env.TWILIO_PHONE_FROM ?? '',
    },
  }
}
