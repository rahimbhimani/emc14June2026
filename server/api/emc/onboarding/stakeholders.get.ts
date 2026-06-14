import { db } from '@/server/fake-db/emc/onboarding/index'

export default defineEventHandler(async event => {
  const query      = getQuery(event)
  const domainId   = query.domainId as string
  const productIds = query.productIds
    ? (Array.isArray(query.productIds) ? query.productIds : [query.productIds]) as string[]
    : []

  if (!domainId)
    throw createError({ statusCode: 400, message: 'domainId is required' })

  let results = db.allStakeholders.filter(s => s.domainId === domainId)

  if (productIds.length)
    results = results.filter(s => s.productIds.some(pid => productIds.includes(pid as string)))

  setResponseStatus(event, 200)
  return results
})
