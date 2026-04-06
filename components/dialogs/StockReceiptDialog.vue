<template>
  <VDialog v-model="isOpen" max-width="600px" persistent>
    <VCard>
      <!-- HEADER -->
      <VCardTitle class="bg-primary text-white d-flex align-center gap-2">
        <VIcon>mdi-warehouse-in</VIcon>
        Stock Receipt
      </VCardTitle>

      <!-- CONTENT -->
      <VCardText class="pa-6">
        <div v-if="error" class="mb-4">
          <VAlert type="error" closable @click:close="error = ''" class="mb-4">
            {{ error }}
          </VAlert>
        </div>

        <!-- STEP 1: SELECT WAREHOUSE -->
        <div class="mb-4">
          <label class="text-subtitle2 font-weight-bold mb-2 d-block">
            1️⃣ Select Warehouse <span class="text-error">*</span>
          </label>
          <VAutocomplete v-model="formData.warehouseId" :items="warehousesList" item-title="label" item-value="id"
            label="Choose warehouse..." persistent-hint hint="Select the warehouse to receive stock" clearable
            :loading="loadingWarehouses" @update:modelValue="onWarehouseSelected" class="mb-2" />
          <div v-if="selectedWarehouse" class="text-caption text-grey pa-2 bg-grey-lighten-5 rounded">
            <strong>Status:</strong> {{ selectedWarehouse.lifecycle }}
          </div>
        </div>

        <!-- STEP 2: SELECT PRODUCT -->
        <div class="mb-4">
          <label class="text-subtitle2 font-weight-bold mb-2 d-block">
            2️⃣ Select Product <span class="text-error">*</span>
          </label>
          <VAutocomplete v-model="formData.itemId" :items="productsList" item-title="name" item-value="_id"
            label="Choose product..." persistent-hint hint="Select the product to receive" clearable
            :loading="loadingProducts" :disabled="!formData.warehouseId" class="mb-2" />
          <div v-if="selectedProduct" class="text-caption text-grey pa-2 bg-grey-lighten-5 rounded">
            <strong>SKU:</strong> {{ selectedProduct.sku }} | <strong>Status:</strong> {{
              selectedProduct.lifecycle }}
          </div>
        </div>

        <!-- STEP 3: QUANTITY & DETAILS -->
        <div class="mb-4">
          <label class="text-subtitle2 font-weight-bold mb-2 d-block">
            3️⃣ Quantity <span class="text-error">*</span>
          </label>
          <VTextField v-model.number="formData.quantity" type="number" label="Enter quantity" placeholder="e.g. 200"
            persistent-hint hint="Must be a positive integer"
            :rules="[v => v > 0 || 'Quantity must be greater than 0', v => Number.isInteger(v) || 'Must be a whole number']"
            min="1" step="1" />
        </div>

        <!-- STEP 4: OPTIONAL FIELDS -->
        <VExpansionPanels class="mb-4">
          <VExpansionPanel title="Additional Details (Optional)">
            <VExpansionPanelText class="pt-4">
              <div class="mb-4">
                <label class="text-subtitle2 font-weight-bold mb-2 d-block">Reference (e.g., PO
                  Number)</label>
                <VTextField v-model="formData.reference" label="e.g., PO-2026-001"
                  placeholder="Purchase order or receipt number" clearable />
              </div>
              <div class="mb-4">
                <label class="text-subtitle2 font-weight-bold mb-2 d-block">Remarks</label>
                <VTextarea v-model="formData.remarks" label="e.g., Initial stock from supplier XYZ"
                  placeholder="Add any notes about this receipt" rows="2" clearable />
              </div>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>

        <!-- PERFORMED BY -->
        <div class="mb-4">
          <label class="text-subtitle2 font-weight-bold mb-2 d-block">
            Performed By <span class="text-error">*</span>
          </label>
          <VTextField v-model="formData.performedBy" label="Your user ID or name" placeholder="e.g., WAREHOUSE_MGR_001"
            persistent-hint hint="Identification of person performing this action" />
        </div>
      </VCardText>

      <!-- FOOTER -->
      <VCardActions class="pa-4 d-flex gap-2 justify-end bg-grey-lighten-5">
        <VBtn variant="tonal" @click="closeDialog" :disabled="isSubmitting">
          Cancel
        </VBtn>
        <VBtn color="primary" @click="submitStockReceipt" :loading="isSubmitting" :disabled="!isFormValid">
          <VIcon start>mdi-check-circle</VIcon>
          Confirm Receipt
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

/* ================= TYPES ================= */
interface Warehouse {
  id: string
  label: string
  lifecycle: string
  organizationId: number
}

interface Product {
  _id: string
  sku: string
  name: string
  lifecycle: string
  organizationId: number
}

interface StockReceiptForm {
  organizationId: number
  warehouseId: string
  itemId: string
  quantity: number
  reference: string
  remarks: string
  performedBy: string
}

/* ================= PROPS & EMITS ================= */
const props = defineProps({
  modelValue: Boolean,
  organizationId: {
    type: Number,
    default: 12313
  }
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [data: any]
}>()

/* ================= STATE ================= */
const isOpen = ref(props.modelValue)

const warehousesList = ref<Warehouse[]>([])
const productsList = ref<Product[]>([])
const loadingWarehouses = ref(false)
const loadingProducts = ref(false)
const isSubmitting = ref(false)
const error = ref('')

const formData = ref<StockReceiptForm>({
  organizationId: props.organizationId,
  warehouseId: '',
  itemId: '',
  quantity: 0,
  reference: '',
  remarks: '',
  performedBy: ''
})

/* ================= COMPUTED ================= */
const selectedWarehouse = computed(() => {
  return warehousesList.value.find(w => w.id === formData.value.warehouseId)
})

const selectedProduct = computed(() => {
  return productsList.value.find(p => p._id === formData.value.itemId)
})

const isFormValid = computed(() => {
  return (
    formData.value.warehouseId &&
    formData.value.itemId &&
    formData.value.quantity > 0 &&
    Number.isInteger(formData.value.quantity) &&
    formData.value.performedBy.trim() !== ''
  )
})

/* ================= WATCHERS ================= */
watch(
  () => props.modelValue,
  (newVal) => {
    isOpen.value = newVal
    if (newVal) {
      fetchWarehouses()
    } else {
      resetForm()
    }
  }
)

watch(
  () => props.organizationId,
  (newVal) => {
    formData.value.organizationId = newVal
  }
)

watch(
  () => isOpen.value,
  (newVal) => {
    if (newVal !== props.modelValue) {
      emit('update:modelValue', newVal)
    }
  }
)

/* ================= LIFECYCLE ================= */
onMounted(() => {
  // Component is ready
})

/* ================= METHODS ================= */

/**
 * Fetch warehouses from API
 */
async function fetchWarehouses() {
  loadingWarehouses.value = true
  error.value = ''

  try {
    const response = await $fetch<{ success: boolean; data?: Warehouse[] }>('/api/emc/container-management/warehouses', {
      method: 'GET',
      query: {
        organizationId: formData.value.organizationId
      }
    })

    if (response.success && Array.isArray(response.data)) {
      warehousesList.value = response.data
    } else {
      error.value = 'Failed to load warehouses'
    }
  } catch (err: any) {
    console.error('Error fetching warehouses:', err)
    error.value = err.message || 'Error loading warehouses'
  } finally {
    loadingWarehouses.value = false
  }
}

/**
 * Fetch products when warehouse is selected
 */
async function onWarehouseSelected(warehouseId: string) {
  if (!warehouseId) {
    productsList.value = []
    formData.value.itemId = ''
    return
  }

  loadingProducts.value = true
  error.value = ''

  try {
    const response = await $fetch<{ success: boolean; data?: { associated: Product[]; allProducts: Product[] } }>('/api/emc/warehouse-items', {
      method: 'GET',
      query: {
        organizationId: formData.value.organizationId,
        status: 'active',
        parentContainerId: warehouseId
      }
    })

    if (response.success && response.data) {
      // Use all products, not just associated ones
      productsList.value = response.data.allProducts || []
      console.log(`✅ Loaded ${productsList.value.length} products for warehouse ${warehouseId}`)
      console.log(`   - ${response.data.associated?.length || 0} already associated`)
    } else {
      error.value = 'Failed to load products'
    }
  } catch (err: any) {
    console.error('Error fetching products:', err)
    error.value = err.message || 'Error loading products'
  } finally {
    loadingProducts.value = false
  }
}

/**
 * Submit stock receipt
 */
async function submitStockReceipt() {
  if (!isFormValid.value) {
    error.value = 'Please fill all required fields'
    return
  }

  isSubmitting.value = true
  error.value = ''

  try {
    const response = await $fetch<{ success: boolean; message: string; data?: any; error?: string }>('/api/emc/inventory/stock-receipt', {
      method: 'POST',
      body: {
        organizationId: formData.value.organizationId,
        warehouseId: formData.value.warehouseId,
        itemId: formData.value.itemId,
        quantity: formData.value.quantity,
        reference: formData.value.reference || undefined,
        remarks: formData.value.remarks || undefined,
        performedBy: formData.value.performedBy
      }
    })

    if (response.success) {
      // Emit success event and close
      emit('success', (response as any).data || response)
      closeDialog()
    } else {
      error.value = response.error || response.message || 'Stock receipt failed'
    }
  } catch (err: any) {
    console.error('Error submitting stock receipt:', err)
    error.value = err.message || 'Error submitting stock receipt'
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Close dialog
 */
function closeDialog() {
  isOpen.value = false
}

/**
 * Reset form
 */
function resetForm() {
  formData.value = {
    organizationId: props.organizationId,
    warehouseId: '',
    itemId: '',
    quantity: 0,
    reference: '',
    remarks: '',
    performedBy: ''
  }
  productsList.value = []
  error.value = ''
}

/* ================= EXPOSE ================= */
defineExpose({
  open: () => {
    isOpen.value = true
  },
  close: closeDialog
})
</script>

<style scoped>
.text-error {
  color: #d32f2f;
}
</style>
