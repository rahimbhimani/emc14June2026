export default defineEventHandler(async () => {
  const { created, skipped } = await seedEmcUsers()

  return {
    message: `emcUsers seeded — ${created} created, ${skipped} already existed.`,
    created,
    skipped,
  }
})
