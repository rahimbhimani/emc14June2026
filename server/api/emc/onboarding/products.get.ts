import { db } from '@/server/fake-db/emc/onboarding/index'

export default defineEventHandler(async event => {
  const { domainId } = getQuery(event)
  if (!domainId || typeof domainId !== 'string')
    throw createError({ statusCode: 400, message: 'domainId is required' })

  setResponseStatus(event, 200)
  return db.allProducts.filter(p => p.domainId === domainId)
})
