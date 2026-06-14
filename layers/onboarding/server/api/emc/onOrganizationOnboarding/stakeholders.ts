import { db } from '../../../fake-db/emc/onboarding'

export default defineEventHandler(event => {
  const query = getQuery(event)

  const productIds = Array.isArray(query.productIds)
    ? query.productIds
    : [query.productIds]

  return db.allStakeholders.filter(s =>
    s.productIds.some(id =>
      productIds.includes(id),
    ),
  )
})
