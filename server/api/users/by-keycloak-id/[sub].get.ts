import EmcUser from '~/server/models/emcUser'

export default defineEventHandler(async event => {
  const sub = getRouterParam(event, 'sub')

  if (!sub)
    throw createError({ statusCode: 400, statusMessage: 'Keycloak sub is required' })

  const user = await EmcUser.findOne({ keycloakId: sub }).lean()

  if (!user) {
    // User authenticated via Keycloak but has no app record yet — safe defaults.
    return {
      role: 'viewer',
      abilityRules: [],
      organizationId: null,
      organizationCode: null,
      organizationName: null,
      organizationIcon: null,
      organizationLogo: null,
      organizationDetails: null,
    }
  }

  return {
    role: user.role,
    abilityRules: user.abilityRules ?? [],
    organizationId: user.organizationId,
    organizationCode: user.organizationCode,
    organizationName: user.organizationName,
    organizationIcon: user.organizationIcon,
    organizationLogo: user.organizationLogo,
    organizationDetails: user.organizationDetails,
  }
})
