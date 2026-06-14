import { NuxtAuthHandler } from '#auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import KeycloakProvider from 'next-auth/providers/keycloak'
import type { NuxtError } from 'nuxt/app'

async function refreshKeycloakToken(token: Record<string, unknown>) {
  try {
    const params = new URLSearchParams({
      client_id: process.env.KEYCLOAK_CLIENT_ID!,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken as string,
    })

    const refreshed = await $fetch<{
      access_token: string
      expires_in: number
      refresh_token?: string
    }>(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    }
  }
  catch {
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,

  providers: [
    // ── Credentials (username / password via your own backend) ─────────────
    // @ts-expect-error .default required for SSR
    CredentialsProvider.default({
      name: 'Credentials',
      credentials: {},
      async authorize(credentials: any) {
        const { user } = await $fetch<any>(
          `${process.env.NUXT_PUBLIC_API_BASE_URL}/login/`,
          {
            method: 'POST',
            body: JSON.stringify(credentials),
          },
        ).catch((err: NuxtError) => {
          throw createError({
            statusCode: err.statusCode || 403,
            statusMessage: JSON.stringify(err.data),
          })
        })

        return user || null
      },
    }),

    // ── Keycloak SSO ────────────────────────────────────────────────────────
    // @ts-expect-error .default required for SSR
    KeycloakProvider.default({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],

  pages: {
    signIn: '/login',
  },

  callbacks: {
    jwt: async ({ token, account, profile, user }) => {
      // ── Credentials sign-in ────────────────────────────────────────────────
      if (account?.provider === 'credentials' && user) {
        token.provider = 'credentials'
        token.id = user.id
        token.fullName = user.fullName || user.name
        token.username = user.username
        token.avatar = user.avatar
        token.abilityRules = user.abilityRules ?? []
        token.role = user.role
        token.organizationId = user.organizationId
        token.organizationCode = user.organizationCode
        token.organizationName = user.organizationName
        token.organizationIcon = user.organizationIcon
        token.organizationLogo = user.organizationLogo
        token.organizationDetails = user.organizationDetails
        return token
      }

      // ── Keycloak SSO sign-in ───────────────────────────────────────────────
      if (account?.provider === 'keycloak' && profile) {
        token.provider = 'keycloak'
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 300_000

        token.sub = profile.sub
        token.fullName = profile.name
        token.username = (profile as any).preferred_username
        token.avatar = (profile as any).picture ?? null

        try {
          const apiBase = process.env.NUXT_PUBLIC_API_BASE_URL
          const userData = await $fetch<{
            role?: string
            abilityRules?: unknown[]
            organizationId?: number
            organizationCode?: string
            organizationName?: string
            organizationIcon?: string
            organizationLogo?: string
            organizationDetails?: unknown
          }>(`${apiBase}/users/by-keycloak-id/${profile.sub}`)

          token.role = userData.role
          token.abilityRules = userData.abilityRules ?? []
          token.organizationId = userData.organizationId
          token.organizationCode = userData.organizationCode
          token.organizationName = userData.organizationName
          token.organizationIcon = userData.organizationIcon
          token.organizationLogo = userData.organizationLogo
          token.organizationDetails = userData.organizationDetails
        }
        catch {
          token.abilityRules = []
        }

        return token
      }

      // ── Subsequent requests ────────────────────────────────────────────────
      // Credentials tokens don't expire via a refresh token — return as-is.
      if (token.provider === 'credentials')
        return token

      // Keycloak: return cached token if still valid, otherwise refresh.
      if (Date.now() < (token.accessTokenExpires as number))
        return token

      return refreshKeycloakToken(token)
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string ?? token.id as string
        session.user.name = token.fullName as string
        session.user.username = token.username as string
        session.user.fullName = token.fullName as string
        session.user.avatar = token.avatar as string
        session.user.abilityRules = token.abilityRules as any
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as number
        session.user.organizationCode = token.organizationCode as string
        session.user.organizationName = token.organizationName as string
        session.user.organizationIcon = token.organizationIcon as string
        session.user.organizationLogo = token.organizationLogo as string
        session.user.organizationDetails = token.organizationDetails as any
      }

      if (token.error)
        (session as any).error = token.error

      return session
    },
  },
})
