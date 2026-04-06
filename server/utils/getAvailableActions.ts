import mongoose from "mongoose"

interface Params {
  organizationId: number
  containerType: string
  containerIDX: string
  role?: string
}

export async function getAvailableActions(params: Params) {

  const {
    organizationId,
    containerType,
    containerIDX,
    role
  } = params

  if (!organizationId || !containerType || !containerIDX) {
    throw new Error("Missing required parameters")
  }

  const db = mongoose.connection.db

  /* ======================================================
     LOAD CONFIG
  ====================================================== */

  const config = await db
    .collection("emcOrganizationContainerConfig")
    .findOne({ organizationId, type: containerType })

  if (!config) {
    throw new Error("Container config not found")
  }

  /* ======================================================
     LOAD CONTAINER INSTANCE
  ====================================================== */

  const collectionName = config.storage.collection
  const primaryKey = config.storage.primaryKey

  const container = await db.collection(collectionName).findOne({
    organizationId,
    [primaryKey]: containerIDX
  })

  if (!container) {
    throw new Error("Container not found")
  }

  const lifecycle = container.lifecycle || {}

  const actions: any[] = []
  const addedActionIds = new Set<string>()

  /* ======================================================
     1️⃣ LIFECYCLE TRANSITION ACTIONS
     (Based on current state)
  ====================================================== */

  for (const trackName in config.lifecycles || {}) {

    const trackConfig = config.lifecycles[trackName]
    const currentState = lifecycle[trackName]

    if (!trackConfig?.transitions) continue

    for (const transition of trackConfig.transitions) {
      // console.log("Evaluating action:", { containerIDX, transition })
      if (transition.from !== currentState) continue

      const actionId = transition.action

      const actionDef = config.actions?.find(
        (a: any) => a.id === actionId
      )

      // console.log("Evaluating action1:", { containerIDX, actionId, currentState, transition, actionDef })

      if (!actionDef) continue

      /* ===== ROLE CHECK ===== */
      if (actionDef.roles && role) {
        if (!actionDef.roles.includes(role)) continue
      }

      /* ===== AVOID DUPLICATES ===== */
      if (addedActionIds.has(actionId)) continue

      actions.push({
        actionId,
        label: actionDef.label || actionId
      })

      addedActionIds.add(actionId)
    }
  }

  /* ======================================================
     2️⃣ ALWAYS AVAILABLE ACTIONS
     (Plugin-based or manual actions)
  ====================================================== */

  for (const actionDef of config.actions || []) {

    const actionId = actionDef.id

    if (!actionDef.alwaysAvailable) continue
    if (addedActionIds.has(actionId)) continue

    /* ===== ROLE CHECK ===== */
    if (actionDef.roles && role) {
      if (!actionDef.roles.includes(role)) continue
    }

    actions.push({
      actionId,
      label: actionDef.label || actionId
    })

    addedActionIds.add(actionId)
  }

  /* ======================================================
     RETURN
  ====================================================== */

  return actions
}
