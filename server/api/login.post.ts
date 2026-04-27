import { emcOrganization } from '~/server/models/emcOrganization'
import { seedOrganizationData } from '~/server/utils/seedOrganization'

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
      console.log(
        'Fetching organization for ID:',
        dbUser.organizationId
      )

      organizationDetails = await emcOrganization.findOne({
        organizationId: dbUser.organizationId,
      })

      console.log(
        'Organization found:',
        organizationDetails
      )

      // If organization not found, try to seed data
      if (!organizationDetails) {
        console.log(
          'Organization not found, attempting to seed data...'
        )

        try {
          await seedOrganizationData()
          console.log(
            'Seed completed, fetching organization again...'
          )

          organizationDetails = await emcOrganization.findOne(
            {
              organizationId:
                dbUser.organizationId,
            }
          )

          console.log(
            'Organization found after seeding:',
            organizationDetails
          )
        } catch (seedErr) {
          console.error(
            'Error during seed:',
            seedErr
          )
        }
      }
    } catch (err) {
      console.error(
        'Error fetching organization:',
        err
      )
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

    console.log(
      'Organization details attached to user'
    )
  } else {
    // Provide defaults
    Object.assign(user, {
      organizationName:
        dbUser.organizationCode ||
        'Default Organization',
      organizationIcon: null,
      organizationLogo: null,
    })

    console.warn(
      'Using default organization details'
    )
  }

  console.timeEnd('login:total')
  console.log('User login successful:', user.email)
  return { user }
})
