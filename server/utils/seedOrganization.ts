import type { IemcOrganization } from '~/server/models/emcOrganization'
import { emcOrganization } from '~/server/models/emcOrganization'

export const seedOrganizationData = async (): Promise<void> => {
    try {
        console.log('🌱 Seeding emcOrganization data...')

        const seedData: IemcOrganization[] = [
            {
                organizationId: 12313,
                name: 'Emirates Cargo Management',
                code: 'ORG000001',
                icon: 'mdi:building-outline',
                logo: 'https://via.placeholder.com/100?text=ECM',
                description:
                    'Emirates Cargo Management - Air Cargo Solutions',
                email: 'admin@emiratescargo.com',
                phone: '+971-4-XXX-XXXX',
                address: 'Dubai Airport Free Zone',
                city: 'Dubai',
                country: 'UAE',
                isActive: true,
            },
            {
                organizationId: 12314,
                name: 'Global Logistics Inc',
                code: 'ORG000002',
                icon: 'mdi:truck-outline',
                logo: 'https://via.placeholder.com/100?text=GLI',
                description:
                    'Global Logistics Inc - International Shipping',
                email: 'admin@globallogistics.com',
                phone: '+1-800-XXX-XXXX',
                address: 'New York, USA',
                city: 'New York',
                country: 'USA',
                isActive: true,
            },
            {
                organizationId: 12315,
                name: 'Asian Trade Partners',
                code: 'ORG000003',
                icon: 'mdi:factory',
                logo: 'https://via.placeholder.com/100?text=ATP',
                description:
                    'Asian Trade Partners - Regional Distribution',
                email: 'admin@asiantrade.com',
                phone: '+65-6XXX-XXXX',
                address: 'Singapore',
                city: 'Singapore',
                country: 'Singapore',
                isActive: true,
            },
        ]

        // Delete existing data
        const deleteResult =
            await emcOrganization.deleteMany({})
        if (deleteResult.deletedCount > 0) {
            console.log(
                `🗑️  Deleted ${deleteResult.deletedCount
                } existing organization documents`
            )
        }

        // Insert seed data
        const result =
            await emcOrganization.insertMany(seedData)
        console.log(
            `✅ Seeded ${result.length} organizations`
        )
    } catch (error) {
        console.error(
            '❌ Error seeding organization data:',
            error
        )
        throw error
    }
}
