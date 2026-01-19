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

  // boardStore.addColumn(newColumnName.value)
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
  {{ screenDesignStore.returnData() }}
  <VToolbar>
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
            style="background-color:#779777; color:white;"
            density="compact"
            title="Manage Screen Layout"
          >
            <EmcAddMenuToAddToForm />
          </VToolbar>
        </VRow>
        <VRow>
          {{ screenDesignStore.board }}
          <div
            v-for="(form, i) in screenDesignStore.board"
            :key="i"
            style="inline-size:100%"
          >
            <VCard
              color="#dee2d0"
              width="100%"
              style="block-size:100%"
              density="compact"
            >
              <VCardTitle class="text-start justify-center py-6">
                <div class="font-weight-bold text-basil">
                  {{ form.controlProperties.find(e => e.propertyTitle === 'Title').data }}
                </div>
              </VCardTitle>
              <!-- v-for="(tabs, j) in form.TabControls" :key="j" :style="tabs.id==props.highlightControl?'border-color:yellow':''" -->
              <VTabs
                v-model="formTab"
                width="100%"
                bg-color="transparent"
                color="basil"
              >
                <VTab
                  v-for="(tabs, j) in form.TabControls"
                  :key="j"
                >
                  <div style="float: inline-start;inline-size:100%;">
                    {{ tabs.controlProperties.filter(e => e.propertyTitle === "Title")[0].data }}
                  </div>
                  <div style="float: inline-end; margin-inline-start:100px">
                    <VIcon @click="addControl([{ TabControls: `${tabs.id}` }], 'GroupBox', 'GroupBoxes')">
                      {{ $vuetify.icons.aliases.emcadd }}
                    </VIcon>

                    <VIcon
                      style="margin-inline-start:10px"
                      @click="deleteControl([{ TabControls: `${tabs.id}` }], 'Tabs', 'Tabs')"
                    >
                      {{ $vuetify.icons.aliases.emcdelete }}
                    </VIcon>
                  </div>
                </VTab>
              </VTabs>
              <VWindow v-model="formTab">
                <VWindowItem
                  v-for="(tabCnts, k) in form.TabControls"
                  :key="k"
                >
                  <!-- {{tabCnts.id}} -->
                  <EmcTabBackground
                    style="inline-size:100%"
                    :tab-object="tabCnts"
                  />
                </VWindowItem>
              </VWindow>
            </VCard>
          </div>
        </VRow>
      </VCol>
      <VCol cols="3">
        <!-- <Properties /> -->

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
