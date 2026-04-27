import { seedOrganizationData } from '~/server/utils/seedOrganization'
import mongoose from 'mongoose'

/**
 * Seed endpoint for organization data
 * This is a dev/admin endpoint to populate the emcOrganization collection
 *
 * Usage: POST /api/seed/organizations
 */
export default defineEventHandler(async event => {
    try {
        console.log(
            'Manual seed triggered'
        )

        // Check connection first
        if (
            mongoose.connection.readyState !==
            1
        ) {
            console.warn(
                'MongoDB not connected, attempting to wait...'
            )

            // Wait up to 5 seconds for connection
            let attempts = 0
            while (
                mongoose.connection
                    .readyState !== 1 &&
                attempts < 50
            ) {
                await new Promise(resolve =>
                    setTimeout(
                        resolve,
                        100
                    )
                )
                attempts++
            }

            if (
                mongoose.connection
                    .readyState !== 1
            ) {
                throw new Error(
                    'MongoDB connection not established'
                )
            }
        }

        console.log(
            'Starting organization data seeding...'
        )

        await seedOrganizationData()

        return {
            success: true,
            message:
                'Organization data seeded successfully',
        }
    } catch (error: any) {
        console.error(
            'Seeding failed:',
            error
        )

        throw createError({
            statusCode: 500,
            statusMessage:
                error.message ||
                'Failed to seed organization data',
        })
    }
