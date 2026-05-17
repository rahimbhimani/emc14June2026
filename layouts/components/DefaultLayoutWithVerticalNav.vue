<script lang="ts" setup>
import navItems from '@/navigation/vertical'
import { themeConfig } from '@themeConfig'

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavBarNotifications from '@/layouts/components/NavBarNotifications.vue'
import NavSearchBar from '@/layouts/components/NavSearchBar.vue'
import NavbarShortcuts from '@/layouts/components/NavbarShortcuts.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'

// @layouts plugin
import { useAbility } from '@casl/vue'
import { VerticalNavLayout } from '@layouts'
import { computed } from 'vue'
import EmcCustomerDetailsOnTopPanel from './emcCustomerDetailsOnTopPanel.vue'

const ability = useAbility()

const filterNavItems = (items) => {
  return items
    .map(item => {
      // Keep headings visible
      if (item.heading)
        return item

      // Determine required subject: explicit `item.subject` or default to 'Admin'
      const requiredSubject = item.subject ?? 'Admin'
      // console.log('item.subject', item.subject)
      const rules = sessionData.value?.user?.abilityRules || []
      const hasSubject = rules.some(r => {
        const subj = String(r.subject).toLowerCase()
        const target = String(requiredSubject).toLowerCase()
        // console.log('target', target, 'subject', subj)
        return subj === target || subj === 'all'
      })
      // console.log('hassubject', hasSubject)
      if (!hasSubject)
        return null
      // console.log('item.children', item.children)
      // If item has children, filter them recursively
      if (item.children && Array.isArray(item.children)) {
        const children = filterNavItems(item.children)
        // console.log('withinchildren', children)
        if (children.length === 0) return null
        return { ...item, children }
      }
      // console.log('final return',item)
      return item
    })
    .filter(Boolean)
}

const { data: sessionData } = useAuth()

const filteredNavItems = computed(() => {
  // Debug: show current user role and Sales permission
  console.log('nav filter - user role', sessionData.value?.user?.role, 'canReadSales', ability.can('read', 'Sales'))
  return filterNavItems(navItems)
})
</script>

<template>

  <VerticalNavLayout :nav-items="filteredNavItems">
    <!-- {{ filteredNavItems }} -->
    <!-- {{ sessionData?.user?.abilityRules }} -->
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn id="vertical-nav-toggle-btn" class="ms-n2 d-lg-none" @click="toggleVerticalOverlayNavActive(true)">
          <VIcon icon="ri-menu-line" />
        </IconBtn>

        <NavSearchBar class="ms-lg-n2" />

        <VSpacer />
        <EmcCustomerDetailsOnTopPanel></EmcCustomerDetailsOnTopPanel>
        <VSpacer />

        <NavBarI18n v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig" />
        <NavbarThemeSwitcher />
        <NavbarShortcuts />
        <NavBarNotifications class="me-2" />
        <UserProfile />
      </div>
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <TheCustomizer />
  </VerticalNavLayout>
</template>
