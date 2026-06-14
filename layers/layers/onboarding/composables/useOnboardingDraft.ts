export function useOnboardingDraft() {
  async function saveDraft(
    form: any,
    currentStep: number,
  ) {
    return await $fetch(
      '/api/emc/onOrganizationOnboarding/save-draft',
      {
        method: 'POST',

        body: {
          onboardingReference:
            form.onboardingReference,

          currentStep,

          form,
        },
      },
    )
  }

  return {
    saveDraft,
  }
}
