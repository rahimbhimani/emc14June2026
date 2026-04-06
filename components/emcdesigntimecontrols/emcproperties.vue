<script setup>
import { useScreenDesignStore } from '@/store/screenDesignStore'
import { ref, watch } from 'vue'

const props = defineProps({
  MasterId: {
    type: Number,
    default: 0,
  },
  ControlData: {
    type: Object,
  },
})

// const groupByProperty = computed(() => () => {

//   if (!props.SelectedControl?.controlProperties) return {}

//   let data = props.SelectedControl.controlProperties
//   let property = 'groupBy' 
//   return data?.reduce((acc, item) => {
//     // Get the value of the groupBy property
//     const key = item[property]
//     // Initialize the group if it doesn't exist
//     if (!acc[key])
//       acc[key] = []

//     if(item.ChangedBy === ''){
//       item.data = item.Defaultvalue
//       item.ChangedBy = 'system'
//       }

//     acc[key].push(item)
//     return acc
//   }, {})
// })
//
// groupByProperty(SelectedControl.controlProperties, 'groupBy')
const groupedData = computed(() => {
  return SelectedControl.controlProperties?.reduce((acc, item) => {
    const key = item['GroupBy']

    if (!acc[key]) acc[key] = []

    if (item.ChangedBy === '') {
      item.data = item.Defaultvalue
      item.ChangedBy = 'system'
    }

    acc[key].push(item)
    return acc
  }, {})
})

function groupByProperty(data, property) {
  return data?.reduce((acc, item) => {
    // Get the value of the groupBy property
    const key = item[property]
    // Initialize the group if it doesn't exist
    if (!acc[key])
      acc[key] = []

    if(item.ChangedBy === ''){
      item.data = item.Defaultvalue
      item.ChangedBy = 'system'
      }

    acc[key].push(item)
    return acc
  }, {})
}


const screenDesignStore = useScreenDesignStore()
// const treeData = ref(transformToTreeView(screenDesignStore.board))
// const PassToChildSelectedControl = defineModel('PassToChildSelectedControl')
// const SelectedControlLineage = defineModel('SelectedControlLineage')
let SelectedControl = ref('')
const panel = ref([])
const txtRef = ref([])

const customFilterFunction = (itemTitle, queryText, item) => {
  debugger

  return (item.raw.Name + item.raw.Title + item.raw.controlType).toLowerCase().includes(queryText.toLowerCase())
}

const headers = [
  { title: 'P', align: 'start', sortable: false, key: 'properties' },
]

function getRules(vItem) {
  if (vItem == null)
    return []

  return []
  debugger
  const rulez = []

  vItem.forEach(item => {
    // rulez.push(eval(item))
    // console.log(eval(item))
  })

  return rulez
}

function handleError1() {
  // Emit a custom event when an error occurs
  alert('error')
}

// watch(
//   props.ControlData,
//   async () => {
//     FlattenObject()
//   }, { deep: true },
// )

watch(
  SelectedControl,
  async () => {
    debugger

    // PassToChildSelectedControl.value = SelectedControl.value
    // screenDesignStore.HighLightControl(SelectedControl.value.id)
    // SelectedControlLineage.value = screenDesignStore.getLineage()
  },
)

const formId = ref()

const formValidate = async () => {
  // Create a promise to wait for the validation result
  debugger
  SelectedControl.IsFormvalid = ''

  return new Promise(async (resolve, reject) => {
    // Validate the form
    await formId.value.validate().then(valid => {
      // alert(valid)
      screenDesignStore.findObjectsWithElement(screenDesignStore.board, [{ id: SelectedControl.value.id }])[0].IsFormvalid = valid

      // props.ControlData.filter((e) => e.id === SelectedControl.value.id)[0].IsFormvalid =  valid
      return valid
    })
  })
}

const flattenedList = ref()

function FlattenObject() {
// debugger
  flattenedList.value = []
  props.ControlData.length === 0 || props.ControlData === undefined ? SelectedControl = ref() : ''
  props.ControlData.length > 0 || props.ControlData === undefined ? flattenJsonObject(Object.assign({}, props.ControlData[0])) : ''
}

function flattenJsonObject(jsonObject) {
  // debugger
  if (jsonObject.controlType === 'NoControl')
    return
  const lObjectToWorkOn = jsonObject.controlProperties.find(e => e.propertyTitle === 'Name')

  if (lObjectToWorkOn === undefined)
    return

  const lName = lObjectToWorkOn.ChangedBy === '' ? lObjectToWorkOn.data === '' ? lObjectToWorkOn.Defaultvalue : lObjectToWorkOn.data : lObjectToWorkOn.data

  const lObjectTitle = jsonObject.controlProperties.find(e => e.propertyTitle === 'Title') ? jsonObject.controlProperties.find(e => e.propertyTitle === 'Title').data : ''

  jsonObject.Name = lName
  jsonObject.Title = lObjectTitle === '' ? 'No Title' : lObjectTitle
  flattenedList.value.push(jsonObject)

  for (const key in jsonObject) {
    const value = jsonObject[key]

    if (Array.isArray(jsonObject[key])) {
      if (key != 'controlProperties') {
        for (const larr in jsonObject[key])
          flattenJsonObject(jsonObject[key][larr])
      }
    }
    else if (typeof value === 'object') {
      // flattenedList.push(value);
      // flattenJsonObject(value);
    }
    else {
      // flattenedList.push(`${key}: ${value}`);
    }
  }
}

function testinfFunc(vItem, vdata){
  debugger
  vItem.data = vdata
  alert('function fired')
}

async function updateCustomFieldNew(item, vInput, vStoreDataOrObject, vref = '') {
  debugger
  // alert('Rahim bhimani')
  if (vStoreDataOrObject === 'object') {
    screenDesignStore.updateElementsWithId(screenDesignStore.board, 'id', SelectedControl.value.id, vInput, item)
  }
  else if (vStoreDataOrObject === 'array') {
    // alert('array')

    // screenDesignStore.updateElementsWithId(screenDesignStore.board, 'id', SelectedControl.value.id, vInput, item)
    if (screenDesignStore.updateElementsWithId(screenDesignStore.board, 'id', SelectedControl.value.id, vInput, item) === null)
      item.data = structuredClone(item) // vInput.map(item => ({ ...item })) //map(...structuredClone(item))
    
      

    // item.data = [...vInput]
    // item.data = vInput.map(item => item)
    // item.data = {...vInput}
  }
  else
    screenDesignStore.updateElementsWithId(screenDesignStore.board, 'id', SelectedControl.value.id, vInput.target.value, item)

  formValidate()
}

// const lstParentChild = computed({
//     formattedData(vObj) {
//       const processObject = (vObj, level = 0, parentKey = "") => {
//         let result = [];
//         for (const key in obj) {
//           const item = obj[key];
//           if (item.controlProperties) {
//             result.push({
//               key: `${parentKey}${key}`,
//               label: `${"-".repeat(level)} ${item.controlProperties.label}`,
//             });
//           }
//           if (typeof item === "object" && !item.controlProperties) {
//             result.push({
//               key: key,
//               label: `${"-".repeat(level)} ${key}`,
//             });
//             result = result.concat(processObject(item, level + 1, `${key}.`));
//           }
//         }
//         return result;
//       };
//       return processObject(this.nestedObject);
//     },
//   })



function extractControlsWithIdAndLevel(data, path = '', level = 0) {
  debugger
  const result = [];
  console.log('extract1234Start',data)
  // const data = vdata
  // Check if the current item is an object and contains an `id` property
  if (data && typeof data === 'object' && data.id && data.controlType !== 'NoControl') {
    console.log('extract1234',data.controlProperties)
    result.push({
      id: data.id,
      name: '-'.repeat(level) + data.ControlName + '(' + data.controlType +')' || data.propertyTitle || 'Unnamed',
      controlProperties: data.controlProperties,
      level,
    });
  }

  // Traverse arrays and objects
  if (Array.isArray(data)) {
    data.forEach((item) => {
      result.push(...extractControlsWithIdAndLevel(item, path, level));
    });
  } else if (data && typeof data === 'object') {
    Object.keys(data).forEach((key) => {
      // Skip processing `controlProperties`
      if (key === 'controlProperties') {
        // result[key] = (...Object.controlProperties)
        return
      };

      result.push(...extractControlsWithIdAndLevel(data[key], path ? `${path}-${key}` : key, level + 1));
    });
  }

  return result;
}
// Computed property to transform the data
const formattedData = computed(() => {
  if (!props.ControlData) return [];

  console.log("formattedData",props.ControlData)
  return extractControlsWithIdAndLevel(props.ControlData);
});

let lObj = ref('')
function UpdateControlData() {
  // lObj.value = SelectedControl.value
  debugger
  if (!SelectedControl) return [];
  screenDesignStore.mergeObjects(SelectedControl.value.id) 
  // lObj.value = screenDesignStore.mergeObjects(SelectedControl.value.id)

  // lObj.value = { rahim: 'is the greatest' }
}

</script>

<template density="compact">
<!-- {{formattedData}} -->
  <!-- {{lObj}} -->
  <VForm ref="formId">
    <!-- <VBtn @click="FlattenObject">
      Click here
    </VBtn>
    <VBtn @click="formValidate">
      validate
    </VBtn> -->
    
    <div
      v-if="formattedData.length>0"
      class="container"
      density="compact"
      style="margin-block: 8px;"
    >
      <VIcon
        v-if="SelectedControl.IsFormvalid?.valid === false"
        style="color: red;float: inline-end;"
        icon="emcAlert"
      >
      </VIcon>
      <VIcon
        v-if="SelectedControl.IsFormvalid?.valid !== false && SelectedControl.id !== undefined"
        style="color: green;float: inline-end;"
      >
        mdi:check
      </VIcon>
      <VIcon
        v-if="SelectedControl.id === undefined"
        style="color: lightblue;float: inline-end;"
      >
        mdi:clock
      </VIcon>
<!-- {{ SelectedControl.controlProperties }} -->
      <VAutocomplete
        v-model="SelectedControl"
        :custom-filter="customFilterFunction"
        :items="formattedData"
        item-title="name"
        variant="filled"
        item-value="id"
        label="Select"
        density="comfortable"
        return-object
      >
        <!-- <template #item="{ props, item }">
          <div class="container">
            <VListItem
              style="float:inline-start"
              v-bind="props"
              :title="`${item.raw.controlType === &quot;Tab&quot; ? &quot;- &quot; : item.raw.controlType === &quot;GroupBox&quot; ? &quot;-- &quot; : item.raw.controlType === &quot;Form&quot; ? &quot;&quot; : &quot;--- &quot;}[${item.raw.Title.length > 18 ? `${item.raw.Title.substring(0, 18)}...` : item.raw.Title}] ${item.raw.Name}  (${item.raw.controlType})`"
            />
            <VIcon
              v-if="item.raw.IsFormvalid?.valid === false"
              style=" color:red;float:inline-end"
            >
              {{ $vuetify.icons.aliases.emcalert }}
            </VIcon>
          </div>
        </template>

        <template
          v-if="item"
          #selection="{ item }"
        >
          <VListItem :title="`${item.raw.Title.length > 18 ? `${item.raw.Title.substring(0, 18)}...` : item.raw.Title} [${item.raw.controlType}]`" />
        </template> -->
      </VAutocomplete>
    </div>
    <div style=" align-content: center;align-items: center;">
      <VRadioGroup
        v-model="inline"
        density="compact"
        inline
      >
        <v-btn size="x-small" dense @click="panel.splice(0, panel.length)">Collapse all</v-btn>
        <v-btn size="x-small" dense @click="UpdateControlData()">Refresh</v-btn>
      </VRadioGroup>
    </div>
    <div v-if="SelectedControl">
      <!-- {{SelectedControl.controlProperties}} -->
      <VExpansionPanels
        v-model="panel"
        multiple
      >
        <VExpansionPanel
          v-for="GroupItem in groupByProperty(SelectedControl.controlProperties, 'groupBy')"
          class="mb-1"
        >
          <VExpansionPanelTitle>
            <template #default="{ expanded }">
              <VRow dense="compact">
                <VCol
                  class="d-flex justify-start"
                  cols="12"
                >
                  {{ GroupItem[0].groupBy }}
                  <!-- {{ GroupItem }} -->
                </VCol>
              </VRow>
            </template>
          </VExpansionPanelTitle>
          <VExpansionPanelText>
            <VRow
              v-for="(item, index) in GroupItem"
              dense="compact"
            >
              <VCol v-if="item.controlType === 'TextBox'">
                <!-- {{item}} -->
                <VTextField
                  :key="`text-field-${index}`"
                  ref="txtRef"
                  v-model="item.data"
                  density="compact"
                  :label="item.propertyTitle"
                  :rules="item === undefined ? '' : getRules(item)"
                  :maxlength="item.size"
                  :type="item.type"
                  @input="updateCustomFieldNew(item, $event, 'data', index)"
                />
              </VCol>
              <VCol v-if="item.controlType === 'CheckBox'">
                <!-- {{item.data}} -->
                <VCheckbox
                  :key="`text-checkbox-${index}`"
                  v-model="item.data"
                  :label="item.propertyTitle"
                  value="true"
                  :rules="item === undefined ? '' : getRules(item)"
                  :maxlength="item.size"
                  :type="item.type"
                  @click:model-value="updateCustomFieldNew(item, $event, 'data', index)"
                />
              </VCol>
              <VCol v-if="item.controlType === 'DropDown' || item.controlType === 'Dropdown'">
                <!-- {{ item.data = item.ChangedBy === '' ? item.Defaultvalue : item.data }} -->
                  <!-- {{item.DropDownValues}} -->
                <VSelect
                  v-model="item.data"
                  :items="item.DropDownValues"
                  item-title="value"
                  item-value="id"
                  :label="item.propertyTitle"
                  return-object
                  @update:model-value="updateCustomFieldNew(item, $event, 'object')"
                />
              </VCol>
              <VCol
                v-if="item.controlType === 'ComponentDropDown'" >
                <!-- {{ item }} -->
                <EmcDTcomponentdropdown :componentobject="item.data" @updateObject="updateCustomFieldNew(item, $event, 'object')" />
                
              </VCol>
              <VCol v-if="item.controlType === 'RuleManagement'">
                <!-- {{ item.data  }} -->
                <!-- {{ item.data ? item.data = ref([])  : item.data = ref([]) }} -->
                <emcDTRuleManagement :inRules="item.data" @updateObject="updateCustomFieldNew(item, $event, 'array')" ></emcDTRuleManagement>
                <!-- <emcDTRuleManagement :inRules="item.data" ></emcDTRuleManagement> -->
              </VCol>
            </VRow>
          </VExpansionPanelText>
        </VExpansionPanel>
      </VExpansionPanels>
    </div>
  </VForm>
</template>

<style scoped>
.container {
  display: flex;
  align-items: center; /* Vertically center */
}

.centered-object {
  /* Optional: Additional styling for the centered object */
}

.ma22 {
  mar: 22;
}

.fixed-width-div {
  cursor: pointer;
}
</style>
