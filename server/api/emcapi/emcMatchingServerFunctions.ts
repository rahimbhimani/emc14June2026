import { useDBRecordMatcher } from '~/composables/useEMCMatching'
import connectDB from '~/utils/db'
import { PerformPricingFunction } from './emcPricingFunctions'

let cn: any = null
let mMatchingData : any = null

export default defineEventHandler(async (event) => {
  // your DB query logic
  // cn = await connectDB()
  const body = await readBody(event)
  // console.log('body in emcMatchingServerFunctions', body)
  const lreturn = await performMatchingFunction(body.MatchingType, body.SourceData)
  return { success: true, data: lreturn }
})



async function getMatchingEntity(vPerformmatchingFor = null) {
    const collectionMaster = cn.collection('emcMatching')
    let cursor = collectionMaster.find({ MatchingType: vPerformmatchingFor })
    if ((await cursor.count()) === 0) {
      throw new Error(`No matching configuration found for type: ${vPerformmatchingFor}`)
    }
    cursor = await cursor.toArray()
    return cursor[0]
}

async function getTargetData() {
    const collectionTarget =  await cn.collection(mMatchingData.TargetDetails.TargetEntity)
    let cursor = collectionTarget.find()
    cursor = await cursor.toArray()
    return cursor
}

export async function performMatchingFunction(vPerformmatchingFor = null, vSource = null) {
    cn = await connectDB()
    mMatchingData = await getMatchingEntity(vPerformmatchingFor)
    mMatchingData['targetData'] = await getTargetData()

    const lMatchedData = MatchSourceAndTargets(vSource, mMatchingData.targetData, mMatchingData)
    console.log('Matching result in server function', lMatchedData[0].GrpBxRateDef.RateDefinition.rates)
    if(lMatchedData.length === 0)
      throw new Error(`No pricing data matched for : ${vPerformmatchingFor}`)
    
    const lCalculatedData = PerformCalculationsOnMatchedData(lMatchedData, vSource)

    const result = passResultFurtherOrBack(lMatchedData, vPerformmatchingFor, vSource, lCalculatedData)

    return result
}

function passResultFurtherOrBack(vMatchedData, vPerformmatchingFor = null, vSource = null, vCalculatedData) {
    switch (mMatchingData.Calulations.PerformAction) {
      case 'RateCalculation':
        return PerformPricingFunction(vMatchedData, vPerformmatchingFor, vSource, vCalculatedData)
        break
      default:
        return vMatchedData
        break;
    }
}



function getWhereClause(vPrincingObject=null) {
    return []
}

function PerformCalculationsOnMatchedData(vMatchedData: any = null, vSource: any = null) {
    //placeholder for any calculations on matched data
    switch (mMatchingData.Calulations.PerformAction) {
      case 'RateCalculation':
        //perform pricing calculations
        console.log('lRateObject1', vMatchedData[0].TabRate.TbResDetails)
        let lRateObject = getValueByPath(vMatchedData[0] , mMatchingData.Calulations.LocationOfTargetObject)
        lRateObject = CalculateRateAmount(lRateObject, vSource)
        console.log('lRateObject2', lRateObject)
        return lRateObject
        break;
      case 'Return' :
        return vMatchedData
        break;
      default:
        return vMatchedData
        break;
    }
    return vMatchedData
}

function CalculateRateAmount(vRateObject: any = null, vSource: any = null) {
  const lObjSourceDataToPass = getRateInputObject(vSource)
  const result = RateEngine(vRateObject, lObjSourceDataToPass)
  console.log('calculated rate result', result)
  return result
}

export function RateEngine(rateDef: any, input: any) {
  if (!rateDef || !rateDef.rates?.length) {
    throw new Error("Invalid rate definition");
  }

  const { mode, basis, rates } = rateDef;
  const value = mode === "Weight" ? Number(input.weight || 0) : Number(input.pieces || 0);
  const date = new Date(input.date);

  // Step 1: Filter rows by date validity
  const validRates = rates.filter(r => {
    const fromDate = new Date(r.dateFrom);
    const untilDate = new Date(r.dateUntil);
    return date >= fromDate && date <= untilDate;
  });

  if (!validRates.length) {
    return { applicableRate: null, total: 0, reason: "No valid date range found" };
  }

  let applicableRate: any;

  // Step 2: Determine applicable rate
  switch (basis) {
    case "Slab":
    case "Range":
      applicableRate = validRates.find(r =>
        value >= Number(r.from || 0) &&
        (r.to === "" || r.to == null || value <= Number(r.to))
      );
      break;

    case "Threshold":
      const sorted = validRates.sort((a, b) => Number(a.weightOrPcs) - Number(b.weightOrPcs));
      applicableRate = sorted.reduce((acc, r) => (value >= Number(r.weightOrPcs) ? r : acc), sorted[0]);
      console.log('applicableRate in threshold', applicableRate)
      break;

    default:
      applicableRate = null;
  }

  if (!applicableRate) {
    return { applicableRate: null, total: 0, reason: "No applicable rate found" };
  }

  // Step 3: Compute total
  const rateValue = Number(applicableRate.rate || 0);
  let total = 0;

  if (["Rate/Wt", "Rate/Pcs"].includes(applicableRate.rateType)) {
    total = value * rateValue;
  } else if (applicableRate.rateType === "Flat") {
    total = rateValue;
  }

  const result = {
    mode,
    basis,
    value,
    applicableRate,
    baseRate: rateValue,
    total,
    computedAt: new Date(),
    currency: applicableRate.currency || "INR"
  };

  if (process.dev) console.log("🎯 RateEngine Result:", result);

  return result;
}

function getRateInputObject(vSource: any = null) {
console.log('Source909', vSource)
const lCreateObject = mMatchingData.Calulations.SourceDataAttributesToSendToTarget

    let lobjToSend : any = {}

    for (const attr of lCreateObject) {
      // console.log('attributeSource', attr.attributeSource)
      // console.log('attributeValue', vSource[attr.attributeSource])
      lobjToSend[attr.attributeName] = getValueByPath(vSource, attr.attributeSource)
    }

    if(lobjToSend['date'] === null || lobjToSend['date'] === undefined)
      lobjToSend['date'] = '01-01-2019'

  // console.log('attributeSourceRahim', lobjToSend)

  return lobjToSend
//   return {
//   weight: 250,
//   pieces: 5,
//   currency: 'INR',
//   date: '01-01-2019',
// }
}

function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined
  return path
    .replace(/\[(\d+)\]/g, '.$1') // converts [0] → .0
    .split('.')
    .reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), obj)
}

function constructWhereClause(vWhereObj) {
  const query = {}
  if (Array.isArray(vWhereObj) === false) {
    console.log('not an array')
    return {}
  }
  vWhereObj.forEach(cond => {
    query[cond.Attribute.DBName] = returnConditionWithObject(cond)
    console.log('constructWhereClause12', query[cond.Attribute.DBName])
  })
  return query
}


function MatchSourceAndTargets(vSource: any = null, vDBRecords: any[] = [], mappingMaster: any = null) {
  const { matchDBRecords, enableDebug, log } = useDBRecordMatcher()

  // Enable debugging if needed
  enableDebug(true)

  // Perform the matching — ✅ FIXED: pass the full object, not just mappings
  const result = matchDBRecords(
    vSource,
    vDBRecords,
    {
      mappings: mappingMaster.mappings,
      threshold: mappingMaster.threshold,
    }
  )

  console.log('--- Source ---')
  console.log(vSource)

  // Optional debug output
  console.log('--- Matching log ---')
  console.log(log.value)

  console.log('--- Matching result ---')
  console.log(result)

  return result
}
