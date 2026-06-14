import mongoose from 'mongoose'

const { Schema, model, models } = mongoose

export interface IEmcUser {
  _id?: string
  // ── Identity ──────────────────────────────────────────────────────────────
  email: string
  username?: string
  fullName?: string
  avatar?: string
  passwordHash?: string      // Credential login — bcrypt hash (omitted for SSO-only users)
  keycloakId?: string        // SSO login — Keycloak UUID (sub claim)

  // ── Authorisation ─────────────────────────────────────────────────────────
  role: string
  abilityRules: { action: string; subject: string }[]
  isActive: boolean

  // ── Organisation ──────────────────────────────────────────────────────────
  organizationId?: number
  organizationCode?: string
  organizationName?: string
  organizationIcon?: string
  organizationLogo?: string
  organizationDetails?: Record<string, unknown>

  createdAt?: Date
  updatedAt?: Date
}

const emcUserSchema = new Schema<IEmcUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    username: { type: String, trim: true },
    fullName: { type: String, trim: true },
    avatar: String,
    passwordHash: String,
    keycloakId: { type: String, sparse: true, unique: true, index: true },

    role: { type: String, required: true, default: 'viewer' },
    abilityRules: { type: [{ action: String, subject: String }], default: [] },
    isActive: { type: Boolean, default: true },

    organizationId: Number,
    organizationCode: String,
    organizationName: String,
    organizationIcon: String,
    organizationLogo: String,
    organizationDetails: Schema.Types.Mixed,
  },
  { timestamps: true },
)

export default models.EmcUser || model<IEmcUser>('EmcUser', emcUserSchema)
