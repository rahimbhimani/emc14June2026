import { useAbility } from '@casl/vue'

// Runs only on the client after every Keycloak login.
// Syncs abilityRules from the NextAuth session into CASL + the cookie
// that the CASL plugin reads on cold start.
export default defineNuxtPlugin(() => {
  const { data: session } = useAuth()
  const ability = useAbility()

  watch(
    () => session.value?.user?.abilityRules,
    rules => {
      if (!rules)
        return
      useCookie<any[]>('userAbilityRules').value = rules as any[]
      ability.update(rules as any)
    },
    { immediate: true },
  )
})
