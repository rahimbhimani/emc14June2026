import connectDB from '@/utils/db'

export async function logAuditEvent({
  module,
  entityType,
  entityId,
  organizationId = null,
  action,
  performedBy,
  details = {},
}: any) {
  try {
    const db = await connectDB()

    await db.collection('emcAuditLog').insertOne({
      module,

      entityType,
      entityId,

      organizationId,

      action,

      performedBy,

      performedDate: new Date(),

      details,
    })

    return true
  }
  catch (error) {
    console.error(
      'logAuditEvent failed',
      error,
    )

    return false
  }
}
