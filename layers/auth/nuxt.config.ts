// Auth & Authorization layer
// Owns: NextAuth handler, CASL plugin, ACL middleware, server guard, auth composables.
// Root app extends this via: extends: ['./layers/auth']
export default defineNuxtConfig({
  modules: ['@sidebase/nuxt-auth'],

  auth: {
    baseURL: process.env.AUTH_ORIGIN
      ? `${process.env.AUTH_ORIGIN}/api/auth`
      : 'http://localhost:3000/api/auth',
    globalAppMiddleware: false,
    provider: {
      type: 'authjs',
    },
  },
})
