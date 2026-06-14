import { db } from '~/server/fake-db/emc/onboarding/index'

export default defineEventHandler(async event => {
  setResponseStatus(event, 200)
  return db.businessDomains
})
