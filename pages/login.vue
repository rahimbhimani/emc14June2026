<script setup lang="ts">
import airplaneWing from '@images/airplanewing.png'
import type { User } from 'next-auth'
import type { NuxtError } from 'nuxt/app'
import { VForm } from 'vuetify/components/VForm'

const { signIn, data: sessionData } = useAuth()

definePageMeta({
  layout: 'blank',
  unauthenticatedOnly: true,
})

const isPasswordVisible = ref(false)
const route = useRoute()
const ability = useAbility()

const errors = ref<Record<string, string | undefined>>({
  email: undefined,
  password: undefined,
})

const refVForm = ref<VForm>()

const credentials = ref({
  email: 'admin@demo.com',
  password: 'admin',
})

const rememberMe = ref(false)

async function login() {
  const response = await signIn('credentials', {
    callbackUrl: '/',
    redirect: false,
    ...credentials.value,
  })

  if (response && response.error) {
    const apiStringifiedError = response.error
    const apiError: NuxtError = JSON.parse(apiStringifiedError)

    errors.value = apiError.data as Record<string, string | undefined>

    return
  }

  errors.value = {}

  const { user } = sessionData.value!

  useCookie<Partial<User>>('userData').value = user
  useCookie<User['abilityRules']>('userAbilityRules').value = user.abilityRules
  ability.update(user.abilityRules ?? [])
  navigateTo(route.query.to ? String(route.query.to) : '/', { replace: true })
}

const onSubmit = () => {
  refVForm.value?.validate()
    .then(({ valid: isValid }) => {
      if (isValid)
        login()
    })
}
</script>

<template>
  <div class="flight-login-container">
    <!-- Background with flight image -->
    <div class="flight-background">
      <img
        :src="airplaneWing"
        alt="Flight Background"
        class="flight-bg-image"
      >
      <div class="flight-overlay" />
    </div>

    <!-- Marketing Text - Left side -->

    <!-- Login Form - Right side -->

    <div class="login-form-container">
      <VCard
        class="login-card elevation-12"
        align="right"
      >
        <VCardText>
          <div class="text-center mb-6">
            <h2 class="text-h4 font-weight-bold mb-2">
              Welcome✈️
            </h2>
            <p class="text-body-1 text-medium-emphasis">
              Sign in to your account
            </p>
          </div>

          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
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
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <div class="d-flex justify-space-between align-center">
                  <VCheckbox
                    v-model="rememberMe"
                    label="Remember me"
                    hide-details
                  />
                  <NuxtLink
                    class="text-primary"
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
                >
                  Sign In
                </VBtn>
              </VCol>

              <VCol
                cols="12"
                class="text-center"
              >
                <span class="text-body-2">Don't have an account? </span>
                <NuxtLink
                  class="text-primary font-weight-medium"
                  :to="{ name: 'register' }"
                >
                  Create one
                </NuxtLink>
              </VCol>
            </VRow>
          </VForm>
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
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
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
  z-index: 0;
  block-size: 100%;
  inline-size: 100%;
  object-fit: cover;
  object-position: center;
}

.flight-overlay {
  position: absolute;
  z-index: 1;
  background:
    linear-gradient(
      135deg,
      rgba(25, 118, 210, 20%) 0%,
      rgba(13, 71, 161, 30%) 100%
    );
  block-size: 100%;
  inline-size: 100%;
  inset-block-start: 0;
  inset-inline-start: 0;
}

/* Marketing Text - Left side */
.marketing-text {
  position: relative;
  z-index: 10;
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: flex-start;
  padding: 2rem;

  &::before,
  &::after {
    display: none !important;
    content: none !important;
  }
}

.marketing-title {
  position: relative;
  z-index: 1;
  color: #fff;
  font-size: 4rem;
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1.15;
  text-align: center;
  text-shadow:
    0 2px 8px rgba(0, 0, 0, 70%),
    0 4px 16px rgba(0, 0, 0, 50%),
    0 8px 32px rgba(0, 0, 0, 30%);
  white-space: normal;
  word-wrap: break-word;

  &::before,
  &::after {
    display: none !important;
    content: none !important;
  }
}

/* Login Form - Right, just before the text */
.login-form-container {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  inline-size: 190px;
  margin-block-start: 75px;
  margin-inline: 10rem;
  min-inline-size: 400px;
  padding-block: 1.5rem;
  padding-inline: 0;
}

.login-card {
  border: 1px solid rgba(255, 255, 255, 30%);
  border-radius: 16px !important;
  backdrop-filter: blur(15px);
  background: transparent !important;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 15%) !important;
  inline-size: 100%;
  padding-block: 32px !important;
  padding-inline: 24px !important;
}

.flight-login-btn {
  border-radius: 8px !important;
  background: linear-gradient(45deg, #1976d2, #1565c0) !important;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: none;
}

:deep(.v-field) {
  border-radius: 8px !important;
}

:deep(.v-field__input) {
  padding-block: 16px;
  padding-inline: 0;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .marketing-title {
    font-size: 3rem;
  }

  .login-form-container {
    inline-size: 400px;
    min-inline-size: 350px;
  }
}

@media (max-width: 960px) {
  .flight-login-container {
    flex-direction: column;
  }

  .marketing-text {
    flex: none;
    padding: 1rem;
    min-block-size: 40vh;
  }

  .marketing-title {
    font-size: 2.5rem;
  }

  .login-form-container {
    padding: 1rem;
    inline-size: 100%;
    min-inline-size: auto;
  }
}

@media (max-width: 600px) {
  .marketing-text {
    min-block-size: 30vh;
  }

  .marketing-title {
    font-size: 2rem;
  }

  .login-card {
    padding-block: 24px !important;
    padding-inline: 20px !important;
  }
}
</style>
