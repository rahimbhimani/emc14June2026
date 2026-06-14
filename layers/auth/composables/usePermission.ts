import { useAbility } from '@casl/vue'
import type { Actions, Subjects } from '@/plugins/casl/ability'

/**
 * Typed CASL permission composable.
 *
 * Usage:
 *   const { can, requirePermission, hasRole } = usePermission()
 *   if (can('read', 'Transaction')) { ... }
 *   await requirePermission('manage', 'all')   // redirects if denied
 */
export function usePermission() {
  const ability = useAbility()
  const { data: session } = useAuth()

  /** True when the current user holds the given permission. */
  function can(action: Actions, subject: Subjects): boolean {
    return ability.can(action, subject)
  }

  /** True when the current user does NOT hold the given permission. */
  function cannot(action: Actions, subject: Subjects): boolean {
    return ability.cannot(action, subject)
  }

  /**
   * Navigates to /not-authorized if the user lacks the permission.
   * Call at the top of a page's setup() to guard the whole page.
   */
  async function requirePermission(action: Actions, subject: Subjects): Promise<void> {
    if (ability.cannot(action, subject))
      await navigateTo({ name: 'not-authorized' }, { replace: true })
  }

  /** True when the signed-in user's role matches the given string. */
  function hasRole(role: string): boolean {
    return session.value?.user?.role === role
  }

  /** True when a valid session exists. */
  function isAuthenticated(): boolean {
    return !!session.value?.user
  }

  return { ability, can, cannot, requirePermission, hasRole, isAuthenticated }
}
