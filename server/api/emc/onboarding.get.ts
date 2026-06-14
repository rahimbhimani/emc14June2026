import { db } from '@/server/fake-db/emc/onboarding/index'

export default defineEventHandler(async _event => {
  setResponseStatus(_event, 200)
  return db
})
