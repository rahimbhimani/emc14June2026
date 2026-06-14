<script setup lang="ts">
const props = defineProps<{
  form: any
  countries: string[]
  timezones: string[]
  industries: string[]
  organizationSizes: string[]
}>()

const orgSection = ref<'org' | 'admin'>('org')
const isPwVisible = ref(false)
const isCpwVisible = ref(false)

const rules = {
  required: (v: string) => !!v || 'Required',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Invalid email',
  minLen: (n: number) => (v: string) =>
    (v?.length ?? 0) >= n || `Min ${n} characters`,
  url: (v: string) =>
    !v || /^https?:\/\/.+/.test(v) || 'Must start with https://',
  pwMatch: (v: string) =>
    v === props.form.admin.password || 'Passwords do not match',
}

const orgFilled = computed(() =>
  !!(props.form.org?.organizationName && props.form.org?.country && props.form.org?.industry),
)

const adminFilled = computed(() =>
  !!(props.form.admin?.firstName && props.form.admin?.email && props.form.admin?.password),
)
</script>

<template>
  <div>
    <!-- Section tabs -->
    <div class="ob-tabs mb-6">
      <button
        class="ob-tab"
        :class="{ 'ob-tab--active': orgSection === 'org' }"
        @click="orgSection = 'org'"
      >
        <span class="ob-tab__dot" :class="orgFilled ? 'ob-tab__dot--done' : 'ob-tab__dot--idle'" />
        <VIcon icon="ri-building-2-line" size="15" />
        Organisation Details
      </button>

      <button
        class="ob-tab"
        :class="{ 'ob-tab--active': orgSection === 'admin' }"
        @click="orgSection = 'admin'"
      >
        <span class="ob-tab__dot" :class="adminFilled ? 'ob-tab__dot--done' : 'ob-tab__dot--idle'" />
        <VIcon icon="ri-shield-user-line" size="15" />
        Administrator Account
      </button>
    </div>

    <Transition name="fade" mode="out-in">

      <!-- ===== ORGANISATION ===== -->
      <VForm v-if="orgSection === 'org'" key="org">
        <VCard variant="outlined" rounded="lg">
          <VCardText>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.org.organizationName"
                  label="Organisation Name *"
                  :rules="[rules.required]"
                  prepend-inner-icon="ri-building-2-line"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.org.legalName"
                  label="Legal Name *"
                  :rules="[rules.required]"
                  prepend-inner-icon="ri-bank-line"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.org.businessRegNumber"
                  label="Business Registration Number"
                  prepend-inner-icon="ri-file-list-3-line"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.org.taxRegNumber"
                  label="Tax Registration Number"
                  prepend-inner-icon="ri-bill-line"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.org.website"
                  label="Website"
                  :rules="[rules.url]"
                  prepend-inner-icon="ri-global-line"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VSelect
                  v-model="form.org.industry"
                  :items="industries"
                  label="Industry *"
                  :rules="[rules.required]"
                />
              </VCol>

              <VCol cols="12" md="4">
                <VSelect
                  v-model="form.org.country"
                  :items="countries"
                  label="Country *"
                  :rules="[rules.required]"
                />
              </VCol>

              <VCol cols="12" md="4">
                <VSelect
                  v-model="form.org.timeZone"
                  :items="timezones"
                  label="Time Zone *"
                  :rules="[rules.required]"
                />
              </VCol>

              <VCol cols="12" md="4">
                <VSelect
                  v-model="form.org.organizationSize"
                  :items="organizationSizes"
                  label="Organisation Size"
                />
              </VCol>

              <VCol cols="12">
                <VFileInput
                  v-model="form.org.logoFile"
                  label="Organisation Logo"
                  accept="image/*"
                  prepend-icon=""
                  prepend-inner-icon="ri-image-line"
                  show-size
                  chips
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <div class="text-end mt-4">
          <VBtn color="primary" append-icon="ri-arrow-right-line" @click="orgSection = 'admin'">
            Next: Administrator
          </VBtn>
        </div>
      </VForm>

      <!-- ===== ADMINISTRATOR ===== -->
      <VForm v-else key="admin">
        <VCard variant="outlined" rounded="lg">
          <VCardText>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.admin.firstName"
                  label="First Name *"
                  :rules="[rules.required]"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.admin.lastName"
                  label="Last Name *"
                  :rules="[rules.required]"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.admin.designation"
                  label="Designation *"
                  :rules="[rules.required]"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.admin.email"
                  label="Email *"
                  :rules="[rules.required, rules.email]"
                  prepend-inner-icon="ri-mail-line"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.admin.mobile"
                  label="Mobile Number *"
                  :rules="[rules.required]"
                  prepend-inner-icon="ri-smartphone-line"
                />
              </VCol>

              <VCol cols="12">
                <VDivider class="my-2">
                  <span class="px-3 text-caption text-medium-emphasis">Login Credentials</span>
                </VDivider>
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.admin.password"
                  label="Password *"
                  :type="isPwVisible ? 'text' : 'password'"
                  :rules="[rules.required, rules.minLen(8)]"
                  :append-inner-icon="isPwVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  @click:append-inner="isPwVisible = !isPwVisible"
                />
              </VCol>

              <VCol cols="12" md="6">
                <VTextField
                  v-model="form.admin.confirmPassword"
                  label="Confirm Password *"
                  :type="isCpwVisible ? 'text' : 'password'"
                  :rules="[rules.required, rules.pwMatch]"
                  :append-inner-icon="isCpwVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                  @click:append-inner="isCpwVisible = !isCpwVisible"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VForm>

    </Transition>
  </div>
</template>

<style scoped>
.ob-tabs {
  display: flex;
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  gap: 4px;
}

/* border: none (configured) keeps configured ordering intact */
.ob-tab {
  display: inline-flex;
  align-items: center;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  gap: 6px;
  padding-block: 12px;
  padding-inline: 14px;
  transition: color 0.15s ease;
}

.ob-tab--active {
  border-block-end: 2px solid rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
  margin-block-end: -1px;
}

.ob-tab__dot {
  display: inline-block;
  border-radius: 50%;
  block-size: 7px;
  inline-size: 7px;
  transition: background 0.2s ease;
}

.ob-tab__dot--idle {
  background: rgba(var(--v-theme-on-surface), 0.2);
}

.ob-tab__dot--done {
  background: rgb(var(--v-theme-success));
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
