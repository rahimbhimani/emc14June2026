import { db } from '@/server/fake-db/emc/onboarding/index'

export default defineEventHandler(async event => {
  setResponseStatus(event, 200)
  return {
    countries:          db.countries,
    timezones:          db.timezones,
    organizationSizes:  db.organizationSizes,
    industries:         db.industries,
    operationalRegions: db.operationalRegions,
    ghaServicesList:    db.ghaServicesList,
  }
})
