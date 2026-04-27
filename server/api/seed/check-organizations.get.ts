import { emcOrganization } from '~/server/models/emcOrganization'
import mongoose from 'mongoose'

/**
 * Diagnostic endpoint to check organization data
 * Usage: GET /api/seed/check-organizations
 */
export default defineEventHandler(async event => {
    try {
        // Check database connection
        const connectionStatus = {
            isConnected:
                mongoose.connection.readyState === 1,
            readyState:
                mongoose.connection.readyState,
            readyStateDescriptions: {
                0: 'disconnected',
                1: 'connected',
                2: 'connecting',
                3: 'disconnecting',
            },
        }

        console.log(
            'Database connection status:',
            connectionStatus
        )

        const count =
            await emcOrganization.countDocuments()
        const orgs = await emcOrganization
            .find({})
            .limit(10)

        console.log(
            `Found ${count} organizations in database`
        )

        return {
            success: true,
            database: connectionStatus,
            totalCount: count,
            sample: orgs,
            message:
                count > 0
                    ? `Found ${count} organizations`
                    : 'No organizations found - please run seed first',
        }
    } catch (error: any) {
        console.error(
            'Error checking organizations:',
            error
        )

        return {
            success: false,
            error: error.message,
            stack: error.stack,
            message:
                'Failed to check organization data',
        }
    }
