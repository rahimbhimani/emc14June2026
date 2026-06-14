import bcrypt from 'bcryptjs'
import EmcUser from '~/server/models/emcUser'

const SALT_ROUNDS = 10

const USERS = [
  {
    email: 'admin@demo.com',
    username: 'admin@demo.com',
    fullName: 'Jack Smith',
    password: 'admin',
    role: 'admin',
    abilityRules: [
      { action: 'read', subject: 'Auth' },
      { action: 'read', subject: 'AclDemo' },
      { action: 'manage', subject: 'emcSubAdmin' },
      { action: 'manage', subject: 'emcCurrency' },
      { action: 'manage', subject: 'emcCurrencyMgmt' },
    ],
    organizationId: 12313,
    organizationCode: 'ORG000001',
  },
  {
    email: 'client@demo.com',
    username: 'janedoe',
    fullName: 'Jane Doe',
    password: 'client',
    role: 'client',
    abilityRules: [
      { action: 'read', subject: 'Auth' },
      { action: 'read', subject: 'AclDemo' },
    ],
    organizationId: 12313,
    organizationCode: 'ORG000001',
  },
  {
    email: 'sales@emc.com',
    username: 'sales@emc.com',
    fullName: 'Husein Bhimani',
    password: 'sales',
    role: 'sales',
    abilityRules: [
      { action: 'read', subject: 'emcSubAdmin' },
      { action: 'create', subject: 'emcSubAdmin' },
      { action: 'update', subject: 'emcSubAdmin' },
    ],
    organizationId: 12313,
    organizationCode: 'ORG000001',
  },
  {
    email: 'customs@emc.com',
    username: 'customs@emc.com',
    fullName: 'Customs User',
    password: 'customs',
    role: 'customs',
    abilityRules: [
      { action: 'read', subject: 'emcCurrency' },
      { action: 'read', subject: 'emcCurrencyMgmt' },
    ],
    organizationId: 12313,
    organizationCode: 'ORG000001',
  },
  {
    email: 'crew@emc.com',
    username: 'crew@emc.com',
    fullName: 'Sarah Johnson',
    password: 'crew',
    role: 'crew',
    abilityRules: [
      { action: 'read', subject: 'Transaction' },
    ],
    organizationId: 12313,
    organizationCode: 'ORG000001',
  },
  {
    email: 'administrator@emc.com',
    username: 'administrator@emc.com',
    fullName: 'System Administrator',
    password: 'administrator',
    role: 'administrator',
    abilityRules: [
      { action: 'manage', subject: 'all' },
    ],
    organizationId: 12313,
    organizationCode: 'ORG000001',
  },
  {
    email: 'ifs@emc.com',
    username: 'ifs@emc.com',
    fullName: 'IFS User',
    password: 'ifs',
    role: 'ifs',
    abilityRules: [
      { action: 'read', subject: 'emcCurrencyMgmt' },
    ],
    organizationId: 12313,
    organizationCode: 'ORG000001',
  },
]

export async function seedEmcUsers(): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0

  for (const userData of USERS) {
    const exists = await EmcUser.findOne({ email: userData.email })

    if (exists) {
      skipped++
      continue
    }

    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS)

    await EmcUser.create({
      email: userData.email,
      username: userData.username,
      fullName: userData.fullName,
      passwordHash,
      role: userData.role,
      abilityRules: userData.abilityRules,
      isActive: true,
      organizationId: userData.organizationId,
      organizationCode: userData.organizationCode,
    })

    created++
  }

  return { created, skipped }
}
