<!-- <template>
  <VDataTable
    :headers="headers"
    :items="rules"
    :sort-by="[{ key: 'id', order: 'asc' }]"
    density="compact"
    disable-pagination
    hide-default-footer
    :items-per-page="-1"
  >
    <template #top>
      <v-toolbar density="compact" 
      style = "justify-content: center">
      <div class="text-center">
        <v-btn
          prepend-icon="mdi-pencil"
          @click="newItem"
        >
          New Rule
        </v-btn>
    </div>
      </v-toolbar>
    </template>

    <template #item.actions="{ item }">
      <v-icon class="me-2" size="small" @click="editItem(item)">mdi-pencil</v-icon>
      <v-icon size="small" @click="deleteItem(item)">mdi-delete</v-icon>
    </template>
    <template #bottom>
    </template>
  </VDataTable>
  <VDialog v-model="dialog" max-width="500px">
    <VForm  ref="formRule" @submit.prevent>
      <v-card>
      <v-card-title>{{ formTitle }}</v-card-title>
      <v-card-text>
        <v-container dense>
          <v-row dense row-gap="2">
            <v-col cols="12">
              <v-text-field v-model="editedItem.Name" label="Rule Name" :rules="mandatoryRule"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="editedItem.Type" label="Rule Type"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="editedItem.RuleText" label="Rule"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="editedItem.RuleFailureMessage" label="Message on failure"></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" type="submit" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
    </VForm>
  </VDialog>
</template>

<script setup>

import { ref, computed } from 'vue'
const formRule = ref(null)
const dialog = ref(false)
const rules = ref([])
const mandatoryRule = [v => !!v || "The input is required"]

const headers = [
  { title: 'Name', key: 'Name', align: 'start', sortable: true },
  { title: 'Type', key: 'Type' },
  { title: 'Actions', key: 'actions', sortable: false },
];

const editedItem = ref({ id: '', Name: '', Type: '', RuleText: '', RuleFailureMessage: '' })
const editedIndex = ref(-1)

const formTitle = computed(() => (editedIndex.value === -1 ? 'New Rule' : 'Edit Rule'))

const initialize = () => {
  rules.value = [];
}

const editItem = (item) => {
  editedIndex.value = rules.value.findIndex((rule) => rule.id === item.id)
  editedItem.value = { ...item }
  dialog.value = true
}


function newItem() {
  dialog.value = true
  editedItem.value = { id: '', Name: '', Type: '', RuleText: '', RuleFailureMessage: '' }
};

const deleteItem = (item) => {
  rules.value = rules.value.filter((rule) => rule.id !== item.id)
}

const save = async() => {
  debugger
  const { valid } = await formRule.value.validate()
  // alert(valid)
  if (valid === true) {
  if (editedIndex.value > -1) {
    rules.value[editedIndex.value] = { ...editedItem.value }
  } else {
    editedItem.value.id = Date.now();
    rules.value.push({ ...editedItem.value });
  }
  dialog.value = false;
  // editedItem.value = { id: '', Name: '', Type: '', RuleText: '', RuleFailureMessage: '' }
  editedIndex.value = -1
  }
}
</script> -->


<template>
  <emcDTRuleManagement></emcDTRuleManagement>
</template>
