import { emcOrganization } from '~/server/models/emcOrganization'

export default defineEventHandler(async event => {
  console.time('login:total')
  console.log('login handler start')
  const { email, password } = await readBody(event)
  console.log('login payload', email)

  console.time('login:import-db')
  const { db } = await import('@/server/fake-db/auth')
  console.timeEnd('login:import-db')
  if (!email || !password) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Email and Password is required to login',
      data: {
        email: ['Email and Password is required to login'],
      },
    })
  }

  const dbUser = db.users.find(u => u.email === email && u.password === password)
  console.log('db user', dbUser)
  if (!dbUser) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid email or password',
      data: {
        email: ['Invalid email or password'],
      },
    })
  }

  // Fetch organization details
  let organizationDetails = null
  if (dbUser.organizationId) {
    try {
      organizationDetails = await emcOrganization.findOne({
        organizationId: dbUser.organizationId,
      })
    } catch (err) {
      console.error('Error fetching organization:', err)
    }
  }

  // ℹ️ Don't send password in response
  const { password: _, ...user } = dbUser

  // Attach organization details to user
  if (organizationDetails) {
    Object.assign(user, {
      organizationName: organizationDetails.name,
      organizationIcon: organizationDetails.icon,
      organizationLogo: organizationDetails.logo,
    })
  }

  console.timeEnd('login:total')
  console.log('db user123', dbUser)
  return { user }
})

