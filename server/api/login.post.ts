import bcrypt from 'bcryptjs'
import EmcUser from '~/server/models/emcUser'
import { emcOrganization } from '~/server/models/emcOrganization'

export default defineEventHandler(async event => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Email and password are required',
      data: { email: ['Email and password are required'] },
    })
  }

  const user = await EmcUser.findOne({ email: email.toLowerCase(), isActive: true }).lean()

  if (!user || !user.passwordHash) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid email or password',
      data: { email: ['Invalid email or password'] },
    })
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash)

  if (!passwordValid) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid email or password',
      data: { email: ['Invalid email or password'] },
    })
  }

  // Fetch organisation details from emcOrganization collection
  let organizationDetails = null

  if (user.organizationId) {
    organizationDetails = await emcOrganization
      .findOne({ organizationId: user.organizationId })
      .lean()
  }

  // Build response — never expose passwordHash
  const { passwordHash: _, keycloakId: __, ...safeUser } = user

  return {
    user: {
      ...safeUser,
      id: String(user._id),
      organizationName: organizationDetails?.name ?? user.organizationName ?? null,
      organizationIcon: (organizationDetails as any)?.branding?.icon ?? user.organizationIcon ?? null,
      organizationLogo: (organizationDetails as any)?.branding?.logo ?? user.organizationLogo ?? null,
      organizationDetails: organizationDetails ?? null,
    },
  }
})
