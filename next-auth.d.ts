import type { DefaultSession } from 'next-auth'
import { Rule } from './plugins/casl/ability'


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
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends UserAdditionalData { }
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
