import { canNavigate } from '@layouts/plugins/casl'

export default defineNuxtRouteMiddleware(async to => {
  if (to.meta.public || to.path === '/login')
    return

  const { status, getSession } = useAuth()

  // After an OAuth callback the session is still resolving on the client.
  // Wait for it to settle before making any navigation decision.
  if (status.value === 'loading')
    await getSession()

  const isLoggedIn = status.value === 'authenticated'

  if (to.meta.unauthenticatedOnly) {
    if (isLoggedIn)
      return navigateTo('/')
    else
      return undefined
  }

  if (!canNavigate(to) && to.matched.length) {
    return navigateTo(isLoggedIn
      ? { name: 'not-authorized' }
      : {
          name: 'login',
          query: {
            ...to.query,
            to: to.fullPath !== '/' ? to.path : undefined,
          },
        })
  }
})
