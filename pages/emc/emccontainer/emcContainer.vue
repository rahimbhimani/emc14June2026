<script setup lang="ts">
import { ref } from 'vue'

const route = useRoute()
const typeKey = route.query.type as string

// fetched from backend
const containerType = ref({
  label: 'ULD',
  fixedDefault: false,
  attributesSchema: [
    { key: 'uldType', label: 'ULD Type', control: 'select', options: ['AKE', 'PMC'] },
    { key: 'airlineCode', label: 'Airline Code', control: 'text' },
    { key: 'serialNumber', label: 'Serial Number', control: 'text' },
    { key: 'maxWeightKg', label: 'Max Weight (kg)', control: 'number' }
  ]
})

const form = ref({
  name: '',
  code: '',
  parentContainerId: null,
  attributes: {}
})
</script>

<template>
  rahim
  <v-container>
    <v-card>
      <v-card-title>
        Create {{ containerType.label }}
      </v-card-title>

      <v-card-text>
        <!-- Common Fields -->
        <v-text-field label="Name" v-model="form.name" />
        <v-text-field label="Code" v-model="form.code" />

        <!-- Dynamic Attributes -->
        <v-divider class="my-4" />

        <div v-for="attr in containerType.attributesSchema" :key="attr.key">
          <v-text-field v-if="attr.control === 'text'" :label="attr.label" v-model="form.attributes[attr.key]" />

          <v-select v-if="attr.control === 'select'" :label="attr.label" :items="attr.options"
            v-model="form.attributes[attr.key]" />

          <v-text-field v-if="attr.control === 'number'" type="number" :label="attr.label"
            v-model="form.attributes[attr.key]" />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-btn color="primary">Save</v-btn>
        <v-btn variant="text">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
