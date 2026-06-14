export function generateOnboardingReference() {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  const randomPart = (length: number) =>
    Array.from({ length })
      .map(
        () =>
          chars[
          Math.floor(
            Math.random() * chars.length
          )
          ],
      )
      .join('')

  return `EMC-${randomPart(4)}-${randomPart(4)}`
}
