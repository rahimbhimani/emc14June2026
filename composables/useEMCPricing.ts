
const sourceData = {
  TabReservation: {
    TbResDetails: {
      TbResDetails: {
        Origin: { _id: '68c94188a74b535a9d0de96c', title: 'BOM (BOMBAY)' },
        Destination: { _id: '68c96ec2c8fbf1f0eacac791', title: 'MAA (MADRAS)1' }
      }
    }
  }
}

const dbRecords = [
  {
    _id: '68fe494b44ef488b659669b5',
    TabRate: {
      TbResDetails: {
        GbRateCriteria: {
          GrdRateCriteria: [
            {
              RateCriteriaOrigin: { _id: 'Any', title: 'DEL (DELHI)' },
              RateCriteriaDestination: { _id: '68c96ec2c8fbf1f0eacac791', title: 'MAA (MADRAS)2' }
            }
          ]
        }
      }
    }
  },
  {
    _id: '68ff000b44ef488b65960000',
    TabRate: {
      TbResDetails: {
        GbRateCriteria: {
          GrdRateCriteria: [
            {
              RateCriteriaOrigin: { _id: 'Any', title: 'DEL (DELHI)' },
              RateCriteriaDestination: { _id: 'Any', title: 'MAA (MADRAS)3' }
            }
          ]
        }
      }
    }
  }
]

const mappingMaster = {
  MatchingType: 'Pricing',
  threshold: 100,
  mappings: [
    {
      path: 'TabReservation.TbResDetails.ResDetails.Origin._id',
      elementCode:
        'TabRate.TbResDetails.GbRateCriteria.GrdRateCriteria[].RateCriteriaOrigin._id',
      priority: 100
    },
    {
      path: 'TabReservation.TbResDetails.ResDetails.Destination._id',
      elementCode:
        'TabRate.TbResDetails.GbRateCriteria.GrdRateCriteria[].RateCriteriaDestination._id',
      priority: 99
    }    
  ]
}

export async function useEmcPerformMatching(vMatchingType: any, vSource: any = {}) {


  return (await useEmcGenericList('/api/emcapi/emcPricingFunctions', { MatchingType: vMatchingType, SourceData: vSource }))


}


export async function useEmcPerformMatching1(vSource: any = null) {
  const { matchDBRecords, getMatchedRecords, enableDebug, log } = useDBRecordMatcher()

  // Enable debugging if needed
  enableDebug(true)

  // Perform the matching — ✅ FIXED: pass the full object, not just mappings
  const result = matchDBRecords(
    vSource || sourceData,
    dbRecords,
    {
      mappings: mappingMaster.mappings,
      threshold: mappingMaster.threshold
    }
  )

  // Optional debug output
  console.log('--- Matching log ---')
  console.log(log.value)

  console.log('--- Matching result ---')
  console.log(result)

  return {result: result}
}
