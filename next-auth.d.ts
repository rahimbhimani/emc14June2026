import type { DefaultSession } from 'next-auth'
import { Rule } from './layers/auth/plugins/casl/ability'


interface UserAdditionalData {
  username?: string
  fullName?: string
  avatar?: string
  role?: string
  abilityRules?: Rule[]
  organizationId?: number
  organizationCode?: string
  organizationName?: string
  organizationIcon?: string
  organizationLogo?: string
  organizationDetails?: {
    id?: number
    organizationId?: number
    code?: string
    name?: string
    icon?: string | null
    logo?: string | null
    description?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    city?: string | null
    country?: string | null
    isActive?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends UserAdditionalData {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: 'RefreshAccessTokenError'
  }
}

declare module "next-auth" {

  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: UserAdditionalData & DefaultSession['user']
  }

  interface User extends UserAdditionalData { }
}
