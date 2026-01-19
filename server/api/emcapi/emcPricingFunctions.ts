import { f } from "ofetch/dist/shared/ofetch.441891d5"
import { lte } from "zod"
import Rating from "~/pages/forms/rating.vue"

let mReturnPricingCalculatedData = {
  "RatingBasicDetails" : {
    "status":"Active",
    "effectiveDate":"2024-12-01",
    "expiryDate":"2025-11-30",
    "currency":"INR",
    "distributionStatus":"Pubished",
    "ReferenceNo" : "RATE12345",
    "Type":"Air Freight",
  },
  "RatingLines": [
    {
      "referenceNo":"RATE12345-1",
      "DueParty":"Airline",
      "DuePartyRateType":"Freight Charges",
      "ChargeCode":"FRTC",
      "rateType":"Rate/Wt",
      "rate":150,
      "ChargeBasis":"Per Kg",
      "Charge":900,
      "currency":"INR",
      "validFrom":"2024-12-01",
      "validTo":"2025-11-30",
      "Sr.No":1,
      "CostOrRevenue":"Cost",
    },
    {
      "referenceNo":"RATE12345-2",
      "DueParty":"Airline",
      "DuePartyRateType":"Other Charges",
      "rateType":"Rate/Wt",
      "Charge":900,
      "currency":"INR",
      "Sr.No":2,
      "chargeBreakup": [
          {
            "referenceNo":"RATE12345-3",
            "DueParty":"Airline",
            "DuePartyRateType":"Other Charges",
            "ChargeCode":"SHC",
            "rateType":"Rate/Wt",
            "rate":150,
            "ChargeBasis":"Per Kg",
            "Charge":900,
            "currency":"INR",
            "validFrom":"2024-12-01",
            "validTo":"2025-11-30",
            "Sr.No":1,
            "CostOrRevenue":"Cost",
          },
      ]
    }    
  ],
  "RevenueDetails": {
    "RevenueEarned":900,
    "CostIncurred":600,
    "Profit":300,
    "ProfitPercentage":33.33
  }
}

// /d:/EMcFreshDownload08Dec2024/server/api/emcapi/emcPricingFunctions.ts
export default defineEventHandler(async (event) => {
  // your DB query logic
  const body = await readBody(event)
  const lreturn = await PerformPricingFunction(body.MatchingType, body.SourceData)
  return { success: true, data: lreturn }
})



export async function PerformPricingFunction(vMatchedData, vPricingFor = null, vSource = null, vCalculatedData = null) {
  // const lPricingData = vMatchedData //CalculatePricingAmount(lPricingData, vSource)
  const lPricingData = updateDataToReturn(vMatchedData, vPricingFor, vSource, vCalculatedData )
  return lPricingData
} 


function updateDataToReturn(vMatchedData, vPricingFor = null, vSource = null, vCalculatedData = null) {
  //Update any data in return object based on source data if required
  console.log('vCalculatedData', vCalculatedData)
  mReturnPricingCalculatedData.RatingBasicDetails.ReferenceNo = vMatchedData[0].TabRate.TbResDetails.IntRefNumber  || "Not Found"
  mReturnPricingCalculatedData.RatingLines = []
  const lObj = {
      "referenceNo":"RATE12345-1",
      "DueParty":"Airline",
      "DuePartyRateType":"Freight Charges",
      "ChargeCode":"FRTC",
      "rateType":"Rate/Wt",
      "rate":150,
      "ChargeBasis":"Per Kg",
      "Charge":900,
      "currency":"INR",
      "validFrom":"2024-12-01",
      "validTo":"2025-11-30",
      "Sr.No":1,
      "CostOrRevenue":"Revenue",
    }
    lObj.referenceNo = vCalculatedData.applicableRate.refNo
    lObj["Sr.No"] = vCalculatedData.applicableRate.id
    lObj.rateType = vCalculatedData.applicableRate.rateType
    lObj.rate = vCalculatedData.applicableRate.rate
    lObj.Charge = vCalculatedData.total
    lObj.validFrom = vCalculatedData.applicableRate.dateFrom
    lObj.validTo = vCalculatedData.applicableRate.dateUntil
    mReturnPricingCalculatedData.RatingLines.push(lObj) 
  // vMatchedData[0].GrpBxRateDef.RateDefinition.rates.forEach(element => {
  //   console.log('element in pricing function', element)
  //   const ltempObj = JSON.parse(JSON.stringify(lObj))
  //   ltempObj.referenceNo = element.refNo 
  //   ltempObj.ChargeCode = 'FRTC'
  //   ltempObj.rateType = element.rateType, 
  //   ltempObj.rate = element.rate
  //   ltempObj.Charge = element.calculatedCharge
  //   mReturnPricingCalculatedData.RatingLines.push(ltempObj)
  // })

    mReturnPricingCalculatedData = calculateSummary(mReturnPricingCalculatedData)

    console.log('vMatchedData in pricing function', mReturnPricingCalculatedData.RatingLines)
    return mReturnPricingCalculatedData
}

function calculateSummary(vPricingData) {
  vPricingData.RevenueDetails.RevenueEarned = mReturnPricingCalculatedData.RatingLines
  .filter(item => item.CostOrRevenue === 'Revenue')
  .reduce((sum, item) => sum + (Number(item.Charge) || 0), 0);

  vPricingData.RevenueDetails.CostIncurred = mReturnPricingCalculatedData.RatingLines
  .filter(item => item.CostOrRevenue === 'Cost')
  .reduce((sum, item) => sum + (Number(item.Charge) || 0), 0);

  vPricingData.RevenueDetails.Profit = vPricingData.RevenueDetails.RevenueEarned - vPricingData.RevenueDetails.CostIncurred
  vPricingData.RevenueDetails.ProfitPercentage = vPricingData.RevenueDetails.RevenueEarned !== 0 ?
    (vPricingData.RevenueDetails.Profit / vPricingData.RevenueDetails.RevenueEarned) * 100 : 0;

  return vPricingData
}
