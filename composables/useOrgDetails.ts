export function useOrgDetails() {
  const { data: sessionData } = useAuth()

  const organization = computed(() => {
    const user = sessionData.value?.user

    return {
      id:
        user?.organizationId ||
        useCookie(
          'organizationId'
        ).value,
      Name:
        user?.organizationName ||
        useCookie(
          'organizationName'
        ).value,
      icon:
        user?.organizationIcon ||
        useCookie(
          'organizationIcon'
        ).value,
      logo:
        user?.organizationLogo ||
        useCookie(
          'organizationLogo'
        ).value,
      code:
        user?.organizationCode ||
        useCookie(
          'organizationCode'
        ).value,
    }
  })

  return {
    organization,
  }
}
