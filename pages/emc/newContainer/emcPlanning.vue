<script setup lang="ts">
import { onMounted, ref } from 'vue'

const user = ref<any>(null)
const organizationConfigs = ref<any[]>([])
const containers = ref<any[]>([])
const filteredContainers = ref<any[]>([])


// ============================
// Load User Context
// ============================
const loadUser = async () => {
  const { data } = await useFetch('/api/auth/me')
  user.value = data.value
}


// ============================
// Load Organization Config
// ============================
const loadConfigs = async () => {
  const { data } = await useFetch('/api/emc/org-config')
  organizationConfigs.value = data.value.configs
}


// ============================
// Load Containers
// ============================
const loadContainers = async () => {
  const { data } = await useFetch('/api/emc/containers')
  containers.value = data.value
}


// ============================
// Filter by Role + Config
// ============================
const filterContainers = () => {
  const userRoles = user.value.roles.map((r: any) => r.name)

  filteredContainers.value = containers.value.filter(container => {

    const config = organizationConfigs.value.find(
      c => c.type === container.type
    )

    if (!config) return false

    const allowedActions = config.actions.filter(action => {
      return action.roles?.some(role =>
        typeof role === 'string'
          ? userRoles.includes(role)
          : userRoles.includes(role.name)
      )
    })

    if (!allowedActions.length) return false

    return true
  })
}


// ============================
// Init
// ============================
onMounted(async () => {
  await loadUser()
  await loadConfigs()
  await loadContainers()
  filterContainers()
})
</script>

<template>
  <v-container fluid>

    <v-card class="mb-4">
      <v-card-title>Planning Workspace</v-card-title>
      <v-card-subtitle>
        Containers you are authorized to manage
      </v-card-subtitle>
    </v-card>


    <v-row>
      <v-col v-for="container in filteredContainers" :key="container.id" cols="12" md="4">
        <v-card elevation="2" class="hover-card">

          <v-img :src="container.imageUrl" height="180" cover />

          <v-card-title>
            {{ container.label }}
          </v-card-title>

          <v-card-subtitle>
            {{ container.type }}
          </v-card-subtitle>

          <v-card-text>
            <v-chip :color="container.lifecycle === 'ACTIVE' ? 'green' : 'grey'" size="small">
              {{ container.lifecycle }}
            </v-chip>
          </v-card-text>

          <v-card-actions>
            <v-btn color="primary" @click="$router.push(`/emc/engine?container=${container.id}`)">
              Open
            </v-btn>
          </v-card-actions>

        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<style scoped>
.hover-card {
  transition: transform 0.2s ease;
}

.hover-card:hover {
  transform: translateY(-4px);
}
</style>
