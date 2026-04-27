export function useOrganization() {
    const organizationId = useCookie(
        'organizationId'
    )
    const organizationName = useCookie(
        'organizationName'
    )
    const organizationIcon = useCookie(
        'organizationIcon'
    )
    const organizationLogo = useCookie(
        'organizationLogo'
    )

    const organization = computed(() => ({
        id: organizationId.value,
        name: organizationName.value,
        icon: organizationIcon.value,
        logo: organizationLogo.value,
    }))

    const clearOrganization = () => {
        organizationId.value = null
        organizationName.value = null
        organizationIcon.value = null
        organizationLogo.value = null
    }

    return {
        organization,
        organizationId,
        organizationName,
        organizationIcon,
        organizationLogo,
        clearOrganization,
    }
}
