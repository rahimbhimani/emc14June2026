import { ref } from 'vue'

function getValueByPath(obj: any, path: string) {
  if (!obj || !path) return undefined
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  return parts.reduce((acc, key) => (acc ? acc[key] : undefined), obj)
}

function resolveArrayPath(obj: any, path: string): any[] {
  const match = path.match(/(.*)\[\]\.(.*)/)
  if (!match) return [getValueByPath(obj, path)]
  const [, arrayPath, subPath] = match
  const arr = getValueByPath(obj, arrayPath) || []
  return arr.map((item: any) => getValueByPath(item, subPath))
}

  export async function useEMCPerformMatching(vPricingFor: any, vSource: any = null) {
    //Retrive matching data from DB
    console.log('performMatching - retrieving DB records', vSource)
    console.log('performMatching - retrieving DB records999', vPricingFor)

    return (await useEmcGenericList('/api/emcapi/emcMatchingServerFunctions', { MatchingType: vPricingFor, SourceData: vSource }))
  }

export function useDBRecordMatcher() {
  const log = ref<string[]>([])
  const debug = ref(false)

  const enableDebug = (v: boolean) => (debug.value = v)
  const addLog = (msg: string) => { if (debug.value) log.value.push(msg) }



  const matchDBRecords = (
    sourceData: any,
    dbRecords: any[],
    options: { mappings: any[]; threshold?: number }
  ) => {
    const { mappings, threshold = 0 } = options
    const results: { record: any; score: number }[] = []

    dbRecords.forEach((record, rIndex) => {
      let totalScore = 0
      let allMatched = true

      addLog(`\n🔍 Checking record #${rIndex + 1} (${record._id})`)

      for (const map of mappings) {
        const sourceVal = getValueByPath(sourceData, map.path)
        const targetVals = resolveArrayPath(record, map.elementCode)
        
        console.log('sourceVal', sourceVal, 'targetVals', targetVals) 

        let matchType: 'exact' | 'wildcard' | 'none' = 'none'

        for (const targetVal of targetVals) {
          if (!targetVal) continue

          // Wildcard detection
          const isWildcard =
            (typeof targetVal === 'string' && targetVal.toLowerCase() === 'any') ||
            (typeof targetVal === 'object' && targetVal._id?.toLowerCase() === 'any')

          if (isWildcard) {
            matchType = 'wildcard'
            break
          }

          // Object exact match
          if (typeof sourceVal === 'object' && typeof targetVal === 'object') {
            if (sourceVal._id === targetVal._id) {
              matchType = 'exact'
              break
            }
          }

          // Primitive match
          if (sourceVal === targetVal) {
            matchType = 'exact'
            break
          }
        }

        if (matchType === 'none') {
          allMatched = false
          addLog(`  ❌ No match for ${map.path} ↔ ${map.elementCode}`)
          break
        }

        // Weighted score — exact gets full weight, wildcard gets half
        const weight = map.priority || 1
        const gained = matchType === 'exact' ? weight : weight * 0.5
        totalScore += gained

        addLog(
          `  ✅ ${matchType === 'exact' ? 'Exact' : 'Wildcard'} match for ${map.path} ↔ ${map.elementCode} (+${gained})`
        )
      }

      if (allMatched) {
        results.push({ record, score: totalScore })
        addLog(`  🎯 Record ${rIndex + 1} total score = ${totalScore}`)
      }
    })

    if (results.length === 0) {
      addLog('🚫 No records matched.')
      return []
    }

    // pick best-scoring record
    const maxScore = Math.max(...results.map(r => r.score))
    const bestRecord = results.find(r => r.score === maxScore)?.record

    addLog(`🏆 Best match: ${bestRecord?._id || 'none'} (score: ${maxScore})`)
    return bestRecord ? [bestRecord] : []
  }

  return { matchDBRecords, enableDebug, log }
}
