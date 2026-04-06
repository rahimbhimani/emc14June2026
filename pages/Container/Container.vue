<template>

  rahim
  <v-container fluid class="pa-4 pa-md-8">
    {{ data }}
    <!-- HEADER -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h5 text-md-h4 font-weight-bold">
          Container Management
        </h1>
        <div class="text-grey-darken-1 text-body-2">
          Manage structure and relationships
        </div>
      </div>

      <!-- VIEW TOGGLE -->
      <v-btn-toggle v-model="viewMode" mandatory>
        <v-btn value="card" icon="mdi:view-grid" />
        <v-btn value="list" icon="mdi:view-list" />
      </v-btn-toggle>
    </div>

    <!-- TYPE SELECTION (Top Level) -->
    <v-row dense v-if="!selectedContainer">
      <v-col v-for="group in groupedContainers" :key="group.type" cols="12" sm="6" md="4" lg="3">
        <v-card class="airbnb-card" elevation="4" @click="selectType(group.type)">
          <v-img :src="getImage(group.type)" height="180" cover class="rounded-top-xl" />
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between">
              <div class="font-weight-bold">
                {{ group.type }}
              </div>
              <v-chip size="small">
                {{ group.count }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- SPLIT PANEL -->
    <v-row v-else>

      <!-- LEFT PANEL -->
      <v-col cols="12" md="4" lg="3">
        <v-card class="pa-4" elevation="4">
          <div class="text-h6 font-weight-bold">
            {{ selectedContainer.label }}
          </div>

          <v-chip class="mt-2" :color="selectedContainer.lifecycle === 'Available' ? 'green' : 'orange'" size="small">
            {{ selectedContainer.lifecycle }}
          </v-chip>

          <v-divider class="my-4" />

          <div class="text-body-2 mb-2">
            <strong>Type:</strong> {{ selectedContainer.type }}
          </div>

          <div class="text-body-2 mb-2">
            <strong>Category:</strong> {{ selectedContainer.category }}
          </div>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 font-weight-medium mb-2">
            Actions
          </div>

          <v-btn v-for="action in getActions(selectedContainer)" :key="action.name" size="small" block class="mb-2"
            color="primary" variant="tonal">
            {{ action.label }}
          </v-btn>

          <v-btn variant="text" block class="mt-4" @click="selectedContainer = null">
            Back
          </v-btn>
        </v-card>
      </v-col>

      <!-- RIGHT PANEL -->
      <v-col cols="12" md="8" lg="9">
        <div class="text-h6 font-weight-bold mb-4">
          Add Containers to {{ selectedContainer.label }}
        </div>

        <v-row dense>
          <v-col v-for="container in attachableContainers" :key="container.id" cols="12" sm="6" md="4" lg="3">
            <v-card elevation="3" class="pa-3 attach-card" @click="attach(container)">
              <div class="d-flex justify-space-between align-center">
                <div>{{ container.label }}</div>
                <v-chip size="x-small">
                  {{ container.type }}
                </v-chip>
              </div>

              <v-chip class="mt-2" size="x-small" :color="container.lifecycle === 'Available' ? 'green' : 'orange'">
                {{ container.lifecycle }}
              </v-chip>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

    </v-row>

  </v-container>
</template>

<script setup lang="ts">
const { data } = await useFetch('/api/container/container')

const viewMode = ref("card")
const selectedContainer = ref<any>(null)

const groupedContainers = computed(() => {
  if (!data.value) return []

  const grouped: Record<string, any[]> = {}

  data.value.containers.forEach((c: any) => {
    if (!grouped[c.type]) grouped[c.type] = []
    grouped[c.type].push(c)
  })

  return Object.entries(grouped).map(([type, items]) => ({
    type,
    count: items.length,
    items
  }))
})

const selectType = (type: string) => {
  const first = data.value.containers.find((c: any) => c.type === type)
  selectedContainer.value = first
}

const getActions = (container: any) => {
  const def = data.value.containerTypeDefinitions.find(
    (d: any) => d.type === container.type
  )

  if (!def) return []

  return def.actions
}

const attachableContainers = computed(() => {
  if (!selectedContainer.value) return []

  return data.value.containers.filter(
    (c: any) =>
      c.id !== selectedContainer.value.id &&
      c.lifecycle === "Available"
  )
})

const attach = (container: any) => {
  console.log("Attach", container.id)
}

const getImage = (type: string) => {
  if (type === "Warehouse")
    return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d"
  if (type === "ULD")
    return "https://images.unsplash.com/photo-1570710891163-6d3b5c47248b"
}
</script>

<style scoped>
.airbnb-card {
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.airbnb-card:hover {
  transform: translateY(-4px);
}

.rounded-top-xl {
  border-start-end-radius: 20px;
  border-start-start-radius: 20px;
}

.attach-card {
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.attach-card:hover {
  transform: scale(1.03);
}
</style>
