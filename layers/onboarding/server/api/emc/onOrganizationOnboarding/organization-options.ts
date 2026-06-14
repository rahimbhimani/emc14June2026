import { db } from '../../../fake-db/emc/onboarding'

export default defineEventHandler(() => {
  return {
    countries: db.countries,
    timezones: db.timezones,
    industries: db.industries,
    organizationSizes: db.organizationSizes,
  }
})
