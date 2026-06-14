import { logAuditEvent } from './emcAudit'
import { saveChangeLog } from './emcChangeLog'

export async function trackEntityChange({
  module,

  entityType,
  entityId,

  action,

  performedBy,

  oldData = null,
  newData = null,

  version = 1,

  organizationId = null,

  details = {},
}: any) {
  try {
    // ==================================================
    // AUDIT EVENT
    // ==================================================

    await logAuditEvent({
      module,

      entityType,
      entityId,

      organizationId,

      action,

      performedBy,

      details,
    })

    // ==================================================
    // CHANGE LOG
    // ==================================================

    if (
      oldData !== null
      && newData !== null
    ) {
      await saveChangeLog({
        module,

        entityType,
        entityId,

        organizationId,

        changedBy:
          performedBy,

        oldData,
        newData,

        version,
      })
    }

    return {
      success: true,
    }
  }
  catch (error) {
    console.error(
      'trackEntityChange failed',
      error,
    )

    return {
      success: false,
      error,
    }
  }
}
