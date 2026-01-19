<script setup lang="ts">
import { computed, ref } from 'vue'

definePageMeta({
  layout: 'blank',
  unauthenticatedOnly: true,
})

/* Background image from assets */
const bgImage = computed(() =>
  `url(${new URL('~/assets/images/airplanewing.png', import.meta.url).href})`
)

/* Form state */
const bookingCode = ref('admin@demo.com')
const password = ref('')
const showPassword = ref(false)

const login = () => {
  console.log({
    bookingCode: bookingCode.value,
    password: password.value,
  })
}
</script>

<template>
  <div
    class="login-page"
    :style="{ backgroundImage: bgImage }"
  >
    <VContainer fluid class="fill-height d-flex align-start">
      <VRow class="w-100">
        <VCol
          cols="12"
          md="5"
          lg="4"
          class="d-flex justify-center"
        >
          <VCard class="login-card pa-6" elevation="14">

            <!-- Booking Code -->
            <VTextField
              v-model="bookingCode"
              label="Booking Code / Email"
              variant="outlined"
              rounded="lg"
            />

            <!-- Password -->
            <VTextField
              v-model="password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              rounded="lg"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
            />

            <!-- Login Button -->
            <VBtn
              block
              size="large"
              color="white"
              variant="flat"
              class="login-btn"
              @click="login"
            >
              SIGN IN
            </VBtn>

            <div class="text-center text-caption text-grey mt-6">
              Secure checkout included.<br />
              Pre-filled booking code in confirmation email.
            </div>

          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>

<style scoped>
/* FULL PAGE BACKGROUND */
.login-page {
  position: relative;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  min-block-size: 100vh;
}

/* VERY LIGHT OVERLAY */
.login-page::before {
  position: absolute;
  z-index: 0;
  background: rgba(0, 0, 0, 8%);
  content: "";
  inset: 0;
}

.login-page > * {
  position: relative;
  z-index: 1;
}

/* Login Card */
.login-card {
  border-radius: 24px;
  background-color: lightgray;
  inline-size: 100%;
  margin-block-start: 140px;
  max-inline-size: 420px;
}

/* 🔹 LIGHT GRAY INPUT BOXES (Vuetify-safe)
.login-input :deep(.v-field) {
  border-radius: 12px;
  background-color: #eef1f4;
} */

/* Login Button */
.login-btn {
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 18%);
  color: #5b2bbf;
  font-weight: 600;
  letter-spacing: 1px;
}
</style>
