<script setup lang="ts">
import airplaneWing from '@images/airplanewing.png'
import type { NuxtError } from 'nuxt/app'
import { VForm } from 'vuetify/components/VForm'

definePageMeta({
  layout: 'blank',
  unauthenticatedOnly: true,
})

const { signIn, data: sessionData } = useAuth()
const ability = useAbility()
const route = useRoute()

const refVForm = ref<InstanceType<typeof VForm>>()
const isPasswordVisible = ref(false)
const isCredentialLoading = ref(false)
const isSsoLoading = ref(false)

const credentials = ref({ email: '', password: '' })
const errors = ref<Record<string, string | undefined>>({ email: undefined, password: undefined })

// ── Credential login ───────────────────────────────────────────────────────
async function loginWithCredentials() {
  isCredentialLoading.value = true
  errors.value = {}

  const response = await signIn('credentials', {
    callbackUrl: '/',
    redirect: false,
    ...credentials.value,
  })

  if (response?.error) {
    const apiError: NuxtError = JSON.parse(response.error)
    errors.value = apiError.data as Record<string, string | undefined>
    isCredentialLoading.value = false
    return
  }

  const { user } = sessionData.value!

  useCookie('userData').value = user as any
  useCookie<any[]>('userAbilityRules').value = user.abilityRules ?? []
  ability.update(user.abilityRules ?? [])

  if (user.organizationId) {
    useCookie('organizationId').value = String(user.organizationId)
    useCookie('organizationName').value = user.organizationName || ''
    useCookie('organizationIcon').value = user.organizationIcon || ''
    useCookie('organizationLogo').value = user.organizationLogo || ''
  }

  navigateTo(route.query.to ? String(route.query.to) : '/dashboards/analytics', { replace: true })
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid }) => {
    if (valid)
      loginWithCredentials()
  })
}

// ── SSO login ──────────────────────────────────────────────────────────────
async function loginWithSSO() {
  isSsoLoading.value = true
  await signIn('keycloak', { callbackUrl: route.query.to ? String(route.query.to) : '/' })
}
</script>

<template>
  <div class="flight-login-container">
    <!-- Background -->
    <div class="flight-background">
      <img
        :src="airplaneWing"
        alt="Flight Background"
        class="flight-bg-image"
      >
      <div class="flight-overlay" />
    </div>

    <!-- Login card -->
    <div class="login-form-container">
      <VCard class="login-card elevation-12">
        <VCardText>
          <div class="text-center mb-6">
            <h2 class="text-h4 font-weight-bold mb-1">
              Welcome ✈️
            </h2>
            <p class="text-body-2 text-medium-emphasis">
              Sign in to your account
            </p>
          </div>

          <!-- Credential form -->
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow dense>
              <VCol cols="12">
                <VTextField
                  v-model="credentials.email"
                  label="Email"
                  placeholder="Enter your email"
                  type="email"
                  variant="outlined"
                  prepend-inner-icon="ri-mail-line"
                  :rules="[requiredValidator, emailValidator]"
                  :error-messages="errors.email"
                  density="comfortable"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="credentials.password"
                  label="Password"
                  placeholder="Enter your password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  variant="outlined"
                  prepend-inner-icon="ri-lock-line"
                  :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  :rules="[requiredValidator]"
                  :error-messages="errors.password"
                  density="comfortable"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <div class="d-flex justify-end">
                  <NuxtLink
                    class="text-primary text-body-2"
                    :to="{ name: 'forgot-password' }"
                  >
                    Forgot Password?
                  </NuxtLink>
                </div>
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  size="large"
                  class="flight-login-btn"
                  :loading="isCredentialLoading"
                  :disabled="isCredentialLoading || isSsoLoading"
                >
                  Sign In
                </VBtn>
              </VCol>
            </VRow>
          </VForm>

          <!-- Divider -->
          <div class="divider-row my-4">
            <VDivider />
            <span class="divider-label text-caption text-medium-emphasis px-3">OR</span>
            <VDivider />
          </div>

          <!-- SSO button -->
          <VBtn
            block
            variant="outlined"
            size="large"
            class="sso-btn"
            :loading="isSsoLoading"
            :disabled="isCredentialLoading || isSsoLoading"
            prepend-icon="ri-shield-keyhole-line"
            @click="loginWithSSO"
          >
            Sign In with SSO
          </VBtn>

          <p class="text-center text-caption text-medium-emphasis mt-2">
            Secured by Keycloak
          </p>

          <VDivider class="my-4" />

          <p class="text-center text-body-2 text-medium-emphasis">
            Don't have an account?
            <NuxtLink
              :to="{ path: '/emc/emcOrganizationOnboarding' }"
              class="text-primary font-weight-semibold text-decoration-none"
            >
              Sign Up
            </NuxtLink>
          </p>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.flight-login-container {
  position: relative;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: flex-end;
  min-block-size: 100vh;
}

.flight-background {
  position: absolute;
  z-index: 0;
  block-size: 100%;
  inline-size: 100%;
  inset-block-start: 0;
  inset-inline-start: 0;
}

.flight-bg-image {
  block-size: 100%;
  inline-size: 100%;
  object-fit: cover;
  object-position: center;
}

.flight-overlay {
  position: absolute;
  z-index: 1;
  background: linear-gradient(135deg, rgba(25, 118, 210, 20%) 0%, rgba(13, 71, 161, 30%) 100%);
  block-size: 100%;
  inline-size: 100%;
  inset-block-start: 0;
  inset-inline-start: 0;
}

.login-form-container {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  inline-size: 440px;
  margin-inline-end: 8rem;
}

.login-card {
  border: none;
  border-radius: 20px !important;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 92%) !important;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 25%) !important;
  inline-size: 100%;
  padding-block: 40px !important;
  padding-inline: 36px !important;
}

.flight-login-btn {
  border-radius: 10px !important;
  background: linear-gradient(45deg, #1976d2, #1565c0) !important;
  font-size: 1rem !important;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
}

.sso-btn {
  border-color: rgba(25, 118, 210, 60%) !important;
  border-radius: 10px !important;
  color: #1565c0 !important;
  font-size: 1rem !important;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
}

.divider-row {
  display: flex;
  align-items: center;
}

/* stylelint-disable-next-line selector-pseudo-class-no-unknown */
:deep(.v-field) {
  border-radius: 8px !important;
}

@media (max-width: 960px) {
  .flight-login-container {
    justify-content: center;
  }

  .login-form-container {
    inline-size: 90%;
    margin-inline-end: 0;
  }
}

@media (max-width: 600px) {
  .login-form-container {
    padding: 1.5rem;
    inline-size: 100%;
  }

  .login-card {
    padding-block: 28px !important;
    padding-inline: 20px !important;
  }
}
</style>
