import { db } from '../../../fake-db/emc/onboarding'

export default defineEventHandler(event => {
  const query = getQuery(event)

  if (!query.domainId)
    return []


  return db.allProducts.filter(
    p => p.domainId === query.domainId,
  )
})
