import { defu } from 'defu'
import type { UseFetchOptions } from 'nuxt/app'

/**
 * Reactive fetch wrapper (use in component setup / templates).
 * Session is carried automatically via the NextAuth cookie — no manual
 * token injection needed.  A 401 response signs the user out.
 */
export const useApi: typeof useFetch = <T>(
  url: MaybeRefOrGetter<string>,
  options: UseFetchOptions<T> = {},
) => {
  const config = useRuntimeConfig()
  const { signOut } = useAuth()

  const defaults: UseFetchOptions<T> = {
    baseURL: config.public.apiBaseUrl,
    credentials: 'include',
    onResponseError: async ({ response }) => {
      if (response.status === 401)
        await signOut({ callbackUrl: '/login' })
    },
  }

  return useFetch(url, defu(options, defaults))
}

/**
 * Imperative fetch helper (use in event handlers / actions, not in setup).
 * Mirrors useApi behaviour: same base URL, session cookie forwarded,
 * 401 triggers sign-out.
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: Parameters<typeof $fetch>[1] & { baseURL?: string } = {},
): Promise<T> {
  const config = useRuntimeConfig()
  const { signOut } = useAuth()

  try {
    return await $fetch<T>(url, {
      baseURL: config.public.apiBaseUrl,
      credentials: 'include',
      ...options,
    })
  }
  catch (error: any) {
    if (error?.statusCode === 401 || error?.status === 401)
      await signOut({ callbackUrl: '/login' })

    throw error
  }
}
