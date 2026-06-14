// layers/onboarding/composables/useOnboarding.ts

export const useOnboarding = () => {
  const saveDraft = async (data: any) => {
    return await $fetch('/api/emc/onOrganizationOnboarding/draft', {
      method: 'POST',
      body: data,
    })
  }

  const loadDraft = async (id: string) => {
    return await $fetch(`/api/emc/onOrganizationOnboarding/draft/${id}`)
  }

  const createTenant = async (draftId: string) => {
    return await $fetch('/api/emc/onOrganizationOnboarding/create', {
      method: 'POST',
      body: {
        draftId,
      },
    })
  }

  return {
    saveDraft,
    loadDraft,
    createTenant,
  }
}
