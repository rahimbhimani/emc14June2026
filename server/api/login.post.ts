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

      organizationDetails = await emcOrganization
        .findOne({
          organizationId: dbUser.organizationId,
        })
        .lean()

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

          organizationDetails = await emcOrganization
            .findOne({
              organizationId:
                dbUser.organizationId,
            })
            .lean()

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
    console.log(
      'organizationDetails from DB:',
      organizationDetails
    )

    // Map organization details to user object
    const organization = {
      id: organizationDetails.organizationId,
      organizationId:
        organizationDetails.organizationId,
      code:
        organizationDetails.code ||
        dbUser.organizationCode,
      Name:
        organizationDetails.name ||
        organizationDetails.Name,
      icon: organizationDetails.branding?.icon || null,
      logo: organizationDetails.branding?.logo || null,
      description:
        organizationDetails.description ||
        null,
      email:
        organizationDetails.email ||
        null,
      phone:
        organizationDetails.phone ||
        null,
      address:
        organizationDetails.address ||
        null,
      city: organizationDetails.city || null,
      country:
        organizationDetails.country ||
        null,
      isActive:
        organizationDetails.isActive,
    }

    // Attach all organization data to user
    Object.assign(user, {
      organizationName: organization.Name,
      organizationIcon: organization.icon,
      organizationLogo: organization.logo,
      organizationDetails: organization,
    })

    console.log(
      'User object after org attachment:',
      {
        organizationName:
          user.organizationName,
        organizationIcon:
          user.organizationIcon,
        organizationLogo:
          user.organizationLogo,
      }
    )

    console.log(
      'Organization details attached to user'
    )
  } else {
    // Provide defaults
    const organization = {
      id: dbUser.organizationId,
      organizationId:
        dbUser.organizationId,
      code: dbUser.organizationCode,
      Name:
        dbUser.organizationCode ||
        'Default Organization',
      icon: null,
      logo: null,
      description: null,
      email: null,
      phone: null,
      address: null,
      city: null,
      country: null,
      isActive: false,
    }

    Object.assign(user, {
      organizationName: organization.Name,
      organizationIcon: organization.icon,
      organizationLogo: organization.logo,
      organizationDetails: organization,
    })

    console.warn(
      'Using default organization details',
      organization
    )
  }

  console.timeEnd('login:total')
  console.log('User login successful:', user.email)
  return { user }
})
