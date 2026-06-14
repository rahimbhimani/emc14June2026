import { db } from '../../../fake-db/emc/onboarding'

export default defineEventHandler(() => {
  return db.subscriptionPlans
})
