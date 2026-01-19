<script setup>
import { useScreenDesignStore } from '../../store/screenDesignStore'

const screenDesignStore = useScreenDesignStore()
const router = useRouter()
const formdetails = reactive({ formname: '', database: '' })
const formTab = ref(0)
const SelectedControl = ref('')
const SelectedControlLineage = ref('')

provide('SelectedControlLineage', SelectedControlLineage)

function addColumn() {
  debugger

  screenDesignStore.addTabControl()

  // newColumnName.value = ''
}

function saveForm() {
  screenDesignStore.saveForm(formdetails)
}

watch(
  SelectedControl,
  async () => {
    debugger

    // formTab.value = screenDesignStore.board[0].TabControls.findIndex(e=>e.id== 'e7d10444-e91e-40c1-9ee2-46957b4eec2e')
    formTab.value = screenDesignStore.board[0].TabControls.findIndex(e => e.id == SelectedControlLineage.value.filter(e => e.controlType == 'Tab')[0].id)
  },
)

function getTabNumber() {
  // if(highlightControls.TabControls){
  //   screenDesignStore.getLineage().findindex(e=)
  // }
  debugger
  const larr = screenDesignStore.getLineage()
  if (larr !== undefined) {
  // larr.forEach(element => {

  // });
  }
}

function clearScreen() {
  screenDesignStore.clearScreen()
}

function addControl(v1, v2, v3) {
  debugger

  // boardStore.addColumn(newColumnName.value)
  // alert(v1)
  screenDesignStore.addControl(v1, v2, v3)

  // newColumnName.value = ''
}

function deleteControl(v1, v2, v3) {
  debugger

  // boardStore.addColumn(newColumnName.value)
  // alert(v1)
  screenDesignStore.deleteControl(v1, v2, v3)

  // newColumnName.value = ''
}

function closeModal() {
  router.push('/')
}
</script>

<template>
  <!-- {{ screenDesignStore.returnData() }} -->
  <!-- <Emcdesigntimetextbox /> -->

  <VToolbar
    density="compact"
    style="background-color:transparent"
  >
    <VTextField
      v-model="formdetails.formname"
      label="Master Name"
    />
    <VTextField
      v-model="formdetails.database"
      label="Database Name"
    />
    <VBtn
      text="Retreive Master"
      @click="saveForm"
    />
    <VBtn
      text="Save Master"
      @click="saveForm"
    />
  </VToolbar>
  <VContainer
    width="100%"
    fluid
  >
    <VRow>
      <VCol
        cols="9"
        color="transperant"
      />
      <VCol cols="9">
        <VRow>
          <VToolbar
            style="background-color: lightslategray;color:white;"
            density="compact"
            title="Manage Screen Layout"
          >
            <EmcAddMenuToAddToForm
              AdditionalPropertiesForControl="Form"
              :parent-obj="screenDesignStore.board[0]?.id ? screenDesignStore.board[0]?.id : undefined"
            />
          </VToolbar>
        </VRow>
        <VRow>
          <!-- FormData.Controls[0].Controls -->

          <!-- {{ screenDesignStore.board }} -->
          <Emcdesigncreatecomponent
            v-if="screenDesignStore.board.length !== 0"
            :group-object="screenDesignStore.board[0].Controls"
            class="ma-0 pa-0"
          />
        </VRow>
      </VCol>
      <VCol cols="3">
        <Properties
          v-model:PassToChildSelectedControl="SelectedControl"
          v-model:SelectedControlLineage="SelectedControlLineage"
          :ControlData="screenDesignStore.board"
        />
      </VCol>
    </VRow>
    <!-- {{ screenDesignStore.board }} -->
  </VContainer>
</template>

<style>
/* Helper classes */
.bg-basil {
  background-color: #fffbe6 !important;
}

.text-basil {
  color: #356859 !important;
}

.container {
  display: flex;
  align-items:middle;
}

.mydiv {
  inline-size: 80px;
}
</style>
