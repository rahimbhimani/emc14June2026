import { reactive, watch } from "vue"

export interface DynamicWatchInput {
  ReturnIDX: string
  path: string
  IsMandatory: boolean
}

// ✅ your project already has this somewhere, keep it if you already have it
function getByPath(obj: any, path: string) {
  if (!obj || !path) return undefined

  // supports: GroupBox0.Name12 OR [dtVariants].SKU
  const cleanPath = path
    .replace(/\[(\w+)\]/g, ".$1") // [abc] -> .abc
    .replace(/^\./, "")

  return cleanPath.split(".").reduce((acc, key) => {
    if (acc == null) return undefined
    return acc[key]
  }, obj)
}

export function useDynamicWatcher() {
  function watchDynamicInputs(
    root: any,
    InputForWatch: DynamicWatchInput[],
    onReady: (
      derived: Record<string, any>,
      raw: Array<{
        [key: string]: any
        IsMandatory: boolean
        path: string
      }>
    ) => void
  ) {
    /* ⛔ NO INPUT → NO WATCH */
    if (!Array.isArray(InputForWatch) || InputForWatch.length === 0) {
      return () => {}
    }

    const collected = reactive<Record<string, any>>({})
    const paths = InputForWatch.map(i => i.path)

    const stop = watch(
      () => paths.map(p => getByPath(root, p)),
      (newVals, oldVals) => {
        // update collected values
        newVals.forEach((val, index) => {
          if (val == null) return
          if (oldVals && val === oldVals[index]) return

          const input = InputForWatch[index]
          collected[input.ReturnIDX] = val
        })

        // check mandatory completion
        const mandatorySatisfied = InputForWatch
          .filter(i => i.IsMandatory)
          .every(i => collected[i.ReturnIDX] != null)

        if (!mandatorySatisfied) return

        // raw contextual output
        const raw = InputForWatch
          .filter(i => collected[i.ReturnIDX] != null)
          .map(i => ({
            [i.ReturnIDX]: collected[i.ReturnIDX],
            IsMandatory: i.IsMandatory,
            path: i.path
          }))

        // derived clean object (mandatory + optional)
        const derived: Record<string, any> = {}
        raw.forEach(item => {
          const key = Object.keys(item).find(
            k => k !== "IsMandatory" && k !== "path"
          )
          if (key) derived[key] = item[key]
        })

        onReady(derived, raw)
      }
    )

    return () => stop()
  }

  return {
    watchDynamicInputs
  }
}
