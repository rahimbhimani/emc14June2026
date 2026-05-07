<script setup lang="ts">
// Static header – no logic needed
</script>

<template>
  <div class="header-banner">
    <div class="header-wrapper">
      <!-- Logo -->
      <div class="logo-box">
        <VImg src="/Customer_LOGO.png" contain />
      </div>




      <!-- Text -->
      <div class="text-wrapper">
        <div class="airline-name">
          Middle East Airlines
        </div>

        <div class="sub-line">
          <VChip color="primary" variant="tonal" size="small">
            Sales OnBoard
          </VChip>

          <span class="separator mx-2">|</span>

          <span class="product-name">
            Demo Environment
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* OUTER BANNER — replaces VRow */
.header-banner {
  display: flex;
  overflow: inherit;
  justify-content: center;
  block-size: inherit;
  inline-size: 100%;
}

/* INNER CONTENT */
.header-wrapper {
  display: flex;
  align-items: center;
}

.logo-box {
  display: flex;
  /* 🔑 */
  flex-shrink: 0;
  align-items: center;
  /* 🔑 */
  justify-content: center;
  /* 🔑 */
  block-size: 250px;
  inline-size: 250px;
}

/* TEXT BLOCK */
.text-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.airline-name {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.sub-line {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-block-start: 4px;
}

.product-name {
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

.separator {
  color: #bbb;
}

/* RESPONSIVE (mobile) */
@media (max-width: 600px) {
  .header-wrapper {
    flex-direction: column;
    gap: 8px;
  }

  .text-wrapper {
    display: none;
  }

  .logo-box {
    position: absolute;
    display: flex;
    align-items: center;
    /* vertical centering */
    justify-content: center;
    /* horizontal centering */
    block-size: 110px;
    inline-size: 260px;
    inset-block-start: 0;
    inset-inline-start: 0;
  }

  .logo-box img {
    block-size: auto;
    max-block-size: 100%;
    max-inline-size: 100%;
  }
}
</style>
