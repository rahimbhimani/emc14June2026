<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()

/**
 * Fetch container data
 */
const { data, pending, error } = await useFetch(
  '/api/emc/container/emcRetreiveContainerData',
  {
    method: 'POST',
    body: {
      containerId: route.params.id
    }
  }
)

const container = computed(() => data.value?.container)
const children = computed(() => data.value?.children || [])

/**
 * Navigate deeper
 */
const goToContainer = (child: any) => {
  navigateTo(`/emc/container/${child.id}`)
}
</script>

<template>
  <v-container fluid class="pa-8">

    <!-- Loading -->
    <div v-if="pending" class="loading-wrapper">
      <v-progress-circular indeterminate size="40" />
    </div>

    <!-- Error -->
    <v-alert v-else-if="error" type="error">
      Failed to load container
    </v-alert>

    <div v-else>

      <!-- Breadcrumb -->
      <v-breadcrumbs class="mb-6">
        <v-breadcrumbs-item title="Planning" @click="navigateTo('/emc/planning')" />
        <v-breadcrumbs-item :title="container?.id" disabled />
      </v-breadcrumbs>

      <!-- Container Header -->
      <div class="container-header">
        <div>
          <h1>{{ container?.id }}</h1>
          <div class="subtitle">
            {{ container?.type }}
          </div>
        </div>

        <v-chip :color="container?.lifecycle === 'ACTIVE'
          ? 'green'
          : container?.lifecycle === 'READY'
            ? 'blue'
            : 'grey'">
          {{ container?.lifecycle }}
        </v-chip>
      </div>

      <v-divider class="my-6" />

      <!-- Children Section -->
      <h2 class="mb-4">Contained Containers</h2>

      <v-row align="stretch">

        <v-col v-for="child in children" :key="child.id" cols="12" sm="6" md="4" lg="3" class="d-flex">
          <div class="airbnb-card" @click="goToContainer(child)">

            <div class="card-body">

              <div class="text-section">
                <div class="title">
                  {{ child.id }}
                </div>

                <div class="subtitle">
                  {{ child.type }}
                </div>
              </div>

              <v-chip size="small" :color="child.lifecycle === 'ACTIVE'
                ? 'green'
                : child.lifecycle === 'READY'
                  ? 'blue'
                  : 'grey'">
                {{ child.lifecycle }}
              </v-chip>

            </div>

          </div>
        </v-col>

      </v-row>

      <div v-if="children.length === 0" class="empty-state">
        No child containers available
      </div>

    </div>

  </v-container>
</template>

<style scoped>
/* Header */
.container-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.container-header h1 {
  font-size: 28px;
  font-weight: 600;
}

.subtitle {
  color: #717171;
  margin-block-start: 4px;
}

/* Loading */
.loading-wrapper {
  display: flex;
  justify-content: center;
  margin-block-start: 80px;
}

/* Card */
.airbnb-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  border-radius: 16px;
  background: white;
  block-size: 180px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 6%);
  cursor: pointer;
  inline-size: 100%;
  transition: all 0.25s ease;
}

.airbnb-card:hover {
  box-shadow: 0 12px 25px rgba(0, 0, 0, 12%);
  transform: translateY(-6px);
}

/* Text */
.title {
  font-size: 16px;
  font-weight: 600;
}

.subtitle {
  color: #717171;
  font-size: 13px;
  margin-block-start: 4px;
}

/* Empty state */
.empty-state {
  color: #999;
  margin-block-start: 40px;
  text-align: center;
}
</style>
