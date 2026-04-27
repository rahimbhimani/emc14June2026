<script setup>
const { signIn, data: sessionData } = useAuth()

import { emailValidator, requiredValidator } from '@core/utils/validators'
import { VForm } from 'vuetify/components/VForm'

definePageMeta({
  layout: 'blank',
  unauthenticatedOnly: true,
})

const isPasswordVisible = ref(false)
const route = useRoute()

const ability = useAbility()

const errors = ref({
  email: undefined,
  password: undefined,
})

const refVForm = ref()

const credentials = ref({
  email: 'admin@demo.com',
  password: 'admin',
})

const bookingCode = ref('')
const rememberMe = ref(false)
const activeTab = ref('Login')

async function login() {
  const response = await signIn('credentials', {
    callbackUrl: '/',
    redirect: false,
    ...credentials.value,
  })

  // If error is not null => Error is occurred
  if (response && response.error) {
    const apiStringifiedError = response.error
    const apiError = JSON.parse(apiStringifiedError)

    errors.value = apiError.data  

    // If err => Don't execute further
    return
  }

  // If no response or response indicates failure, don't continue
  if (!response || response.status !== 200) {
    errors.value = {
      email: ['Login failed. Please check your credentials.'],
    }
    return
  }

  // Reset error on successful login
  errors.value = {}

  // Fetch user data directly from API since session might not be ready
  try {
    const { user } = await $fetch('/api/login/', {
      method: 'POST',
      body: credentials.value,
    })

    if (!user) {
      errors.value = {
        email: ['Failed to retrieve user data. Please try again.'],
      }
      return
    }

    // Store user data in cookies
    useCookie('userData').value = user
    useCookie('userAbilityRules').value = user.abilityRules

    // Store organization details
    if (user.organizationId) {
      useCookie('organizationId').value = user.organizationId
      useCookie('organizationName').value = user.organizationName || ''
      useCookie('organizationIcon').value = user.organizationIcon || ''
      useCookie('organizationLogo').value = user.organizationLogo || ''
    }

    // Update user abilities
    ability.update(user.abilityRules ?? [])

    // Navigate to home or requested page
    navigateTo(route.query.to ? String(route.query.to) : '/', { replace: true })
  } catch (error) {
    console.error('Login error:', error)
    errors.value = {
      email: ['An error occurred during login. Please try again.'],
    }
  }
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid)
      login()
  })
}
</script>

<template>
  <div class="airplane-login-wrapper">
    <!-- Fullscreen airplane wing background -->
    <div class="airplane-fullscreen-bg">
      <!-- Marketing content on the right -->
      <div class="marketing-overlay">

      </div>
    </div>
    
    <!-- Floating form card on the left -->
    <div class="form-overlay">
      <VCard class="airline-floating-card">
        <!-- Tab Navigation -->
        <VCardText class="pa-0 mb-4">
          <VTabs
            v-model="activeTab"
            class="airline-tabs mb-6"
            color="primary"
          >
            <VTab value="Login" class="airline-tab">
              <i class="ri-plane-fill me-2"></i>
              Login
            </VTab>
            <VTab value="Sign In" class="airline-tab">
              Sign In
            </VTab>
          </VTabs>
        </VCardText>
        
       
        <VCardText class="pa-0">
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- Crew Login Tab -->
              <template v-if="activeTab === 'Login'">
                <!-- email -->
                <VCol cols="12">
                  <VTextField
                    v-model="credentials.email"
                    placeholder="Enter your email or booking code"
                    label="User email"
                    type="email"
                    autofocus
                    variant="outlined"
                    class="airline-input1"
                    hide-details="auto"
                    :rules="[requiredValidator, emailValidator]"
                    :error-messages="errors.email"
                  />
                </VCol>

                <!-- password -->
                <VCol cols="12">
                  <VTextField
                    v-model="credentials.password"
                    placeholder="••••••••"
                    label="Password"
                    :rules="[requiredValidator]"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    autocomplete="password"
                    variant="outlined"
                    class="airline-input1"
                    hide-details="auto"
                    :error-messages="errors.password"
                    :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                    @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  />
                </VCol>
              </template>

              <!-- Check-in Tab -->
              <template v-else>
                <!-- Booking Code -->
                <VCol cols="12">
                  <VTextField
                    v-model="bookingCode"
                    label="Booking Code"
                    placeholder="ABC123"
                    autofocus
                    variant="outlined"
                    class="airline-input"
                    hide-details="auto"
                    :rules="[requiredValidator]"
                  />
                </VCol>

                <!-- Last Name -->
                <VCol cols="12">
                  <VTextField
                    v-model="credentials.email"
                    label="Last Name"
                    placeholder="Enter your last name"
                    variant="outlined"
                    class="airline-input"
                    hide-details="auto"
                    :rules="[requiredValidator]"
                    :error-messages="errors.email"
                  />
                </VCol>
              </template>

              <!-- Submit Button -->
              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  color="primary"
                  size="x-large"
                  class="airline-signin-btn mt-6"
                >
                  SIGN IN
                </VBtn>
              </VCol>
              
              <!-- Additional info -->
              <VCol cols="12" class="text-center mt-4">
                <div class="airline-footer-info">
                  <div class="d-flex align-center justify-center mb-2">
                    <i class="ri-shield-check-line me-2 text-success"></i>
                    <span class="text-caption">Secure checkout included.</span>
                  </div>
                  <div class="d-flex align-center justify-center">
                    <i class="ri-information-line me-2 text-primary"></i>
                    <span class="text-caption">Pre-filled booking code in confirmation email. Check for successful booking.</span>
                  </div>
                </div>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";

// Airplane Wing Login Design
.airplane-login-wrapper {
  position: relative;
  overflow: hidden;
  inline-size: 100vw;
  min-block-size: 100vh;
}

// Fullscreen airplane wing background
.airplane-fullscreen-bg {
  position: absolute;
  background:
    linear-gradient(135deg, rgba(70, 130, 180, 3%) 0%, rgba(30, 144, 255, 5%) 100%),
    linear-gradient(180deg, rgba(0, 0, 0, 2%) 0%, rgba(30, 144, 255, 6%) 50%, transparent 100%),
    url("~/assets/images/airplanewing.png");
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  block-size: 100%;
  filter: contrast(1.1) saturate(1.15) brightness(1.05);
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  inline-size: 100%;
  inset-block-start: 0;
  inset-inline-start: 0;

  // Add subtle cloud enhancement effects
  &::after {
    position: absolute;
    z-index: 1;
    border-radius: 50px;
    background: rgba(255, 255, 255, 8%);
    block-size: 60px;
    box-shadow:
      150px -20px 0 10px rgba(255, 255, 255, 5%),
      350px -40px 0 8px rgba(255, 255, 255, 4%),
      550px -10px 0 12px rgba(255, 255, 255, 6%);
    content: "";
    inline-size: 200px;
    inset-block-end: 20%;
    inset-inline-start: 10%;
  }
}

// Marketing content overlay (right side)
.marketing-overlay {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: linear-gradient(135deg, rgba(0, 0, 0, 5%) 0%, transparent 100%);
  block-size: 100%;
  inline-size: 55%;
  inset-block-start: 0;
  inset-inline-end: 0;
  padding-block: 4rem;
  padding-inline: 4rem 6rem;
  pointer-events: none;

  .marketing-content {
    padding: 2rem;
    border-radius: 16px;
    backdrop-filter: blur(8px);
    background: rgba(0, 0, 0, 25%);
    color: white;
    max-inline-size: 500px;
    text-align: end;

    .marketing-title {
      color: #fff;
      font-size: 6rem;
      font-weight: 300;
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-block-end: 1.5rem;
      text-shadow:
        0 2px 4px rgba(0, 0, 0, 80%),
        0 4px 8px rgba(0, 0, 0, 60%),
        0 8px 16px rgba(0, 0, 0, 40%);
    }

    .marketing-subtitle {
      color: #f0f0f0;
      font-size: 1.3rem;
      font-weight: 400;
      letter-spacing: 0.5px;
      margin-block-end: 2.5rem;
      text-shadow:
        0 1px 2px rgba(0, 0, 0, 80%),
        0 2px 4px rgba(0, 0, 0, 60%);
    }

    .rating-stars {
      color: #ffd700;
      font-size: 2rem;

      i {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 90%));
        margin-inline-end: 0.3rem;
      }
    }
  }
}

// Form overlay (left side)
.form-overlay {
  position: absolute;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  block-size: 100%;
  inline-size: 40%;
  inset-block-start: 0;
  inset-inline-start: 0;
  padding-block: 2rem 4rem;
  padding-inline: 4rem 2rem;
}

// Floating form card
.airline-floating-card {
  position: relative;
  padding: 1.5rem !important;
  border: 1px solid rgba(255, 255, 255, 40%);
  border-radius: 20px !important;
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(15, 9, 69, 98%) !important;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 10%),
    0 8px 20px rgba(0, 0, 0, 6%),
    inset 0 1px 0 rgba(255, 255, 255, 90%) !important;
  inline-size: 100%;
  max-inline-size: 320px;

  &::before {
    position: absolute;
    padding: 1px;
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 60%), transparent, rgba(255, 255, 255, 30%));
    content: "";
    inset: 0;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
  }
}

// Back link microtext
.back-link {
  color: rgba(0, 0, 0, 70%);
  font-size: 0.75rem;
  margin-block-end: 0.5rem;
}

.back-link-inner {
  display: inline-flex;
  align-items: center;
  color: inherit;
  gap: 6px;
  text-decoration: none;
  transition: color 0.2s ease;
}

.back-link i {
  font-size: 1rem;
}

.back-link:hover {
  color: rgb(var(--v-theme-primary));
}

// Tab styling
.airline-tabs {
  margin-block-end: 1.5rem !important;

  .v-tab {
    border-radius: 12px;
    color: rgba(0, 0, 0, 65%);
    font-weight: 600;
    letter-spacing: 0.8px;
    margin-block: 0;
    margin-inline: 6px;
    padding-block: 14px;
    padding-inline: 24px;
    text-transform: lowercase;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &.v-tab--selected {
      background: rgba(var(--v-theme-primary), 0.12);
      color: rgb(var(--v-theme-primary));
      font-weight: 700;
      transform: translateY(-1px);
    }

    &:hover {
      background: rgba(var(--v-theme-primary), 0.08);
      color: rgba(0, 0, 0, 80%);
      transform: translateY(-1px);
    }
  }

  .v-tabs-slider {
    display: none;
  }

  i {
    font-size: 1.2rem;
    margin-inline-end: 8px;
  }
}

// Footer info
.airline-footer-info {
  margin-block-start: 1.5rem;

  .text-caption {
    color: rgba(0, 0, 0, 70%);
    font-size: 0.75rem;
    line-height: 1.5;
  }

  i {
    font-size: 1rem;
    opacity: 1;
  }
}

// User info styling
.user-info {
  margin-block-end: 2rem;

  .text-caption {
    color: rgba(0, 0, 0, 65%);
    font-size: 0.7rem !important;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .text-h6 {
    color: rgba(0, 0, 0, 90%);
    font-weight: 600 !important;
  }
}

// Input field styling
.airline-input {
  margin-block-end: 1rem;

  .v-field {
    border-radius: 14px;
    background: rgba(255, 255, 255, 95%);

    .v-field__outline {
      --v-field-border-opacity: 0.3;
      --v-field-border-width: 2px;
    }

    &:hover .v-field__outline {
      --v-field-border-opacity: 0.5;
    }

    &.v-field--focused .v-field__outline {
      --v-field-border-opacity: 1;
      --v-field-border-width: 2px;
    }
  }

  .v-field__input {
    color: rgba(0, 0, 0, 95%);
    font-size: 1rem;
    font-weight: 600;
    padding-block: 18px;
    padding-inline: 24px;

    &::placeholder {
      color: rgba(0, 0, 0, 40%);
      font-weight: 400;
    }
  }

  .v-field__append-inner {
    padding-inline-end: 20px;
  }
}

// Sign in button
.airline-signin-btn {
  border-radius: 14px !important;
  box-shadow:
    0 8px 25px rgba(var(--v-theme-primary), 0.35),
    0 3px 10px rgba(var(--v-theme-primary), 0.2) !important;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 2px;
  margin-block-start: 1.5rem !important;
  padding-block: 18px !important;
  padding-inline: 0 !important;
  text-transform: uppercase;

  &:hover {
    box-shadow:
      0 12px 30px rgba(var(--v-theme-primary), 0.4),
      0 5px 15px rgba(var(--v-theme-primary), 0.25) !important;
    transform: translateY(-2px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:active {
    transform: translateY(0);
  }
}

// Mobile responsiveness
@media (max-width: 960px) {
  .airplane-fullscreen-bg {
    background-attachment: scroll;
  }

  .marketing-overlay {
    display: none;
  }

  .form-overlay {
    padding: 1rem;
    inline-size: 100%;
  }

  .airline-floating-card {
    margin: 1rem;
    max-inline-size: none;
  }
}

@media (max-width: 600px) {
  .airline-floating-card {
    padding: 1.5rem !important;
    border-radius: 20px !important;
  }

  .marketing-content .marketing-title {
    font-size: 3rem;
  }
}
</style>
