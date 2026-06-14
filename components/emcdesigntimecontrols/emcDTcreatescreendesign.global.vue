<script setup>
import { useScreenDesignStore } from '../../store/screenDesignStore'
import Emcproperties from './emcproperties.vue'

const screenDesignStore = ref(useScreenDesignStore())
const dataObject = defineModel('dataObject')
const loading = defineModel('loading')
const SelectedControl = ref('')
const SelectedControlLineage = ref('')
const formObj = ref('')

provide('SelectedControlLineage', SelectedControlLineage)

function addColumn() {
  debugger

  formObj.value = screenDesignStore.addTabControl()

  // newColumnName.value = ''
}

watch(screenDesignStore, async (newQuestion, oldQuestion) => {
  // dataObject.value = screenDesignStore.board
})

onMounted(() => {
  loading.value = false
})

watch(
  SelectedControl,
  async () => {
    debugger

    // formTab.value = screenDesignStore.board[0].TabControls.findIndex(e=>e.id== 'e7d10444-e91e-40c1-9ee2-46957b4eec2e')
    // formTab.value = screenDesignStore.board[0].TabControls.findIndex(e => e.id === SelectedControlLineage.value.filter(e1 => e1.controlType === 'Tab')[0].id)
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
</script>

<template>
  <!-- {{ screenDesignStore.board }} -->
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
            style="background-color: lightslategray;color: white;"
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
          <!-- {{ screenDesignStore }} -->

          <Emcdesigncreatecomponent
            v-if="screenDesignStore.board.length !== 0"
            :group-object="screenDesignStore.board[0].Controls"
            :parent-id="screenDesignStore.board[0]?.id"
            :is-this-run-time="false"
            class="ma-0 pa-0"
          />
        </VRow>
      </VCol>
      <VCol cols="3" style="overflow: auto; block-size: 420px;">
        <!-- {{screenDesignStore.board[0]}} -->
        <Emcproperties
          v-model:PassToChildSelectedControl="SelectedControl"
          v-model:SelectedControlLineage="SelectedControlLineage"
          :Control-data = "screenDesignStore.board[0]"
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
  align-items: middle;
}

.mydiv {
  inline-size: 80px;
}
</style>
