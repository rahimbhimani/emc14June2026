import { createMongoAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import type { Rule } from './ability'

export default defineNuxtPlugin(nuxtApp => {
  const raw = useCookie<Rule[] | string>('userAbilityRules').value

  // Guard against legacy double-encoded cookies (stored as JSON string of JSON string)
  let rules: Rule[]
  if (!raw)
    rules = []
  else if (typeof raw === 'string')
    try { rules = JSON.parse(raw) } catch { rules = [] }
  else
    rules = raw

  const initialAbility = createMongoAbility(Array.isArray(rules) ? rules : [])

  nuxtApp.vueApp.use(abilitiesPlugin, initialAbility, {
    useGlobalProperties: true,
  })
})
