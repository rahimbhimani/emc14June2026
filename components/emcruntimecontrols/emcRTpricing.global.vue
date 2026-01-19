<script setup lang="ts">
import { useEMCPerformMatching } from '@/composables/useEMCMatching'
import { userDataStore } from '@/store/userDataStore'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  vbind1: {
    type: Object,
  },
  FormParameters: {
    type: Object,
  },
  inputdata: {
    type: Object,
  },
})
// Route for dynamic ID
const route = useRoute()

let mPricing = ref()
async function performPricing() {
  debugger
  mPricing.value = await useEMCPerformMatching('AWBPricing', muserDataStore.data.FormData.UserEntryObjects.FormName)
  // mPricing.value = mPricing?.value.data
  mPricing.value = mPricing?.value.data?.data
}

const groupObject = defineModel('groupObject')
const inputdata = defineModel('inputdata')
const muserDataStore = props.vbind1.isthisfordialog ? inputdata.value : userDataStore()

// Dialogs
const isDeleteDialogVisible = ref(false)
const isEditDialogVisible = ref(false)

// Headers for rate breakdown table
const rateHeaders = [
  { title: 'Ref. No.', key: 'referenceNo', width: '15%' },
  { title: 'Type', key: 'DuePartyRateType', width: '20%' },
  { title: 'Chrg. CD.', key: 'ChargeCode', width: '15%' },
  { title: 'Basis', key: 'rateType', width: '15%' },
  { title: 'Rate', key: 'rate', width: '15%' },
  { title: 'Amount', key: 'Charge', width: '15%' }
]

// Example Rate Data
// const rateData = [
//   { chargeType: 'Freight Charge (Due Carrier)', basis: 'Per Kg', amount: 1.25, currency: 'USD' },
//   { chargeType: 'Other Charges (Due Carrier)', basis: '%', amount: 0, currency: 'USD' },
//   { chargeType: 'Other Charges (Due Agent)', basis: 'Per Shipment', amount: 0, currency: 'USD' }
// ]

// Example meta
const metaInfo = {
  carrier: 'Emirates SkyCargo',
  origin: 'Mumbai (BOM)',
  destination: 'London (LHR)',
  mode: 'Air Freight',
  validity: 'Nov 1, 2025 – Mar 31, 2026',
  createdBy: 'Rahim Bhimani',
  currency: 'USD',
}
</script>

<template>
  <div>
    <!-- ✅ HEADER SECTION -->
    <div  v-if="mPricing?.RatingLines" class="d-flex justify-space-between align-center flex-wrap gap-y-4 mb-6">
      <div>
        <div class="d-flex gap-2 align-center mb-2 flex-wrap">
          <h5 class="text-h5">Rate Sheet #{{ mPricing?.RatingBasicDetails.ReferenceNo || 'Reference Number' }}</h5>
          <VChip color="success" variant="tonal" size="small">{{mPricing?.RatingBasicDetails.status}}</VChip>
          <VChip color="primary" variant="tonal" size="small">{{mPricing?.RatingBasicDetails.distributionStatus}}</VChip>
        </div>
        <div class="text-body-1 text-medium-emphasis">
          {{ metaInfo.origin }} → {{ metaInfo.destination }} • {{ mPricing?.RatingBasicDetails.Type }}
        </div>
        <div class="text-body-2">{{ mPricing?.RatingBasicDetails.effectiveDate }} - {{ mPricing?.RatingBasicDetails.expiryDate }} </div>
      </div>

      <div class="d-flex gap-x-2">

        <VBtn color="primary" variant="tonal" @click="performPricing">
          Perform Pricing
        </VBtn>
      </div>
    </div>

    <div  v-if="!mPricing?.RatingLines" class="d-flex">
        <h5 class="text-h5">No rating data avaliable</h5>
      <VSpacer></VSpacer>
        <VBtn color="primary" variant="tonal" @click="performPricing">
          Perform Pricing
        </VBtn>
    </div>

    <!-- ✅ MAIN CONTENT -->
    <VRow v-if="mPricing?.RatingLines">
      <!-- LEFT SIDE: Rate & Criteria -->
      <VCol cols="12" md="8">
        <!-- 👉 Rate Details -->
        <VCard class="mb-6">
          <VCardItem>
            <template #title>
              <h5 class="text-h5">Rate Breakdown</h5>
            </template>
          </VCardItem>
          <VDataTable
            :headers="rateHeaders"
            :items="mPricing?.RatingLines"
            density="compact"
            class="text-no-wrap"
          >
            <template #bottom />
          </VDataTable>

          <VDivider />

          <VCardText>
            <div class="d-flex justify-end">
              <table class="text-high-emphasis">
                <tbody>
                <tr>
                  <td width="200px">Total Revenue</td>
                  <td class="font-weight-medium">{{mPricing?.RevenueDetails.RevenueEarned}}</td>
                </tr>
                <tr>
                  <td width="200px">Total Cost</td>
                  <td class="font-weight-medium">{{mPricing?.RevenueDetails.CostIncurred}}</td>
                </tr>                
                <tr>
                  <td width="200px">Total Tax</td>
                  <td class="font-weight-medium">{{mPricing?.RevenueDetails.CostIncurred}}</td>
                </tr>
                <tr>
                  <td width="200px">Profit</td>
                  <td class="font-weight-medium">{{mPricing?.RevenueDetails.Profit}} ({{ mPricing?.RevenueDetails.ProfitPercentage }}%)</td>
                </tr>
                </tbody>                                    
              </table>
            </div>
          </VCardText>
        </VCard>

        <!-- 👉 Collapsible Rate Criteria -->
        <VExpansionPanels multiple>
          <VExpansionPanel>
            <VExpansionPanelTitle>
              <span class="text-h6">Special Conditions</span>
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <ul class="list-disc ms-4 text-body-2">
                <li>Valid for General Cargo only</li>
                <li>Fuel Surcharge subject to IATA index adjustment</li>
                <li>Minimum chargeable weight: 45 kg</li>
              </ul>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>

        <!-- 👉 Timeline -->
        <VCard title="Rate Activity">
          <VCardText>
            <VTimeline align="start" side="end" line-color="primary" density="compact">
              <VTimelineItem dot-color="primary" size="x-small">
                <div class="d-flex justify-space-between">
                  <span>Created</span>
                  <span>Oct 15, 2025</span>
                </div>
                <p>Initial rate published by {{ metaInfo.createdBy }}</p>
              </VTimelineItem>

              <VTimelineItem dot-color="primary" size="x-small">
                <div class="d-flex justify-space-between">
                  <span>Rate Revised</span>
                  <span>Oct 30, 2025</span>
                </div>
                <p>Added Fuel Surcharge and SSC</p>
              </VTimelineItem>
            </VTimeline>
          </VCardText>
        </VCard>
      </VCol>

      <!-- RIGHT SIDE: Meta Info -->
      <VCol cols="12" md="4">
        <VCard class="mb-6">
          <VCardText>
            <h5 class="text-h5 mb-4">Meta Information</h5>
            <table class="text-body-2">
              <tbody>
              <tr><td><strong>Carrier:</strong></td><td>{{ metaInfo.carrier }}</td></tr>
              <tr><td><strong>Mode:</strong></td><td>{{ metaInfo.mode }}</td></tr>
              <tr><td><strong>Currency:</strong></td><td>{{ metaInfo.currency }}</td></tr>
              <tr><td><strong>Created By:</strong></td><td>{{ metaInfo.createdBy }}</td></tr>
              <tr><td><strong>Validity:</strong></td><td>{{ metaInfo.validity }}</td></tr>
              </tbody>
            </table>
          </VCardText>
        </VCard>
        <VCard>
          <VCardText>
            <h5 class="text-h6 mb-2">Rate Notes</h5>
            <p class="text-body-2">
              {{ mPricing }}
            </p>
          </VCardText>
        </VCard>
        <VCard>
          <VCardText>
            <h5 class="text-h6 mb-2">Rate Notes</h5>
            <p class="text-body-2">
              This rate applies for export shipments ex-Mumbai to London.
              Subject to space confirmation and IATA rules.
            </p>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
