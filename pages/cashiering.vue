<script setup lang="ts">
definePage({
  meta: {
    layout: 'default',
  },
})

interface Denomination {
  value: number
  count: number
  type: 'bill' | 'coin'
}

interface Currency {
  code: string
  name: string
  symbol: string
  exchangeRate: number
  denominations: Denomination[]
}

interface CurrencyPayment {
  currencyCode: string
  amount: number
  amountInUSD: number
}

interface Transaction {
  id: string
  customerName: string
  seatNumber: string
  items: string[]
  total: number
  cashReceived: number
  currencyPayments: CurrencyPayment[]
  change: number
  timestamp: Date
  crewMember: string
}

// Permitted currencies with exchange rates (USD is base)
const currencies = ref<Currency[]>([
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    exchangeRate: 1.0,
    denominations: [
      { value: 100, count: 0, type: 'bill' },
      { value: 50, count: 0, type: 'bill' },
      { value: 20, count: 0, type: 'bill' },
      { value: 10, count: 0, type: 'bill' },
      { value: 5, count: 0, type: 'bill' },
      { value: 1, count: 0, type: 'bill' },
      { value: 0.25, count: 0, type: 'coin' },
      { value: 0.10, count: 0, type: 'coin' },
      { value: 0.05, count: 0, type: 'coin' },
      { value: 0.01, count: 0, type: 'coin' },
    ],
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    exchangeRate: 1.10,
    denominations: [
      { value: 500, count: 0, type: 'bill' },
      { value: 200, count: 0, type: 'bill' },
      { value: 100, count: 0, type: 'bill' },
      { value: 50, count: 0, type: 'bill' },
      { value: 20, count: 0, type: 'bill' },
      { value: 10, count: 0, type: 'bill' },
      { value: 5, count: 0, type: 'bill' },
      { value: 2, count: 0, type: 'coin' },
      { value: 1, count: 0, type: 'coin' },
      { value: 0.50, count: 0, type: 'coin' },
      { value: 0.20, count: 0, type: 'coin' },
      { value: 0.10, count: 0, type: 'coin' },
      { value: 0.05, count: 0, type: 'coin' },
      { value: 0.02, count: 0, type: 'coin' },
      { value: 0.01, count: 0, type: 'coin' },
    ],
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    exchangeRate: 1.27,
    denominations: [
      { value: 50, count: 0, type: 'bill' },
      { value: 20, count: 0, type: 'bill' },
      { value: 10, count: 0, type: 'bill' },
      { value: 5, count: 0, type: 'bill' },
      { value: 2, count: 0, type: 'coin' },
      { value: 1, count: 0, type: 'coin' },
      { value: 0.50, count: 0, type: 'coin' },
      { value: 0.20, count: 0, type: 'coin' },
      { value: 0.10, count: 0, type: 'coin' },
      { value: 0.05, count: 0, type: 'coin' },
      { value: 0.02, count: 0, type: 'coin' },
      { value: 0.01, count: 0, type: 'coin' },
    ],
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    exchangeRate: 0.0067,
    denominations: [
      { value: 10000, count: 0, type: 'bill' },
      { value: 5000, count: 0, type: 'bill' },
      { value: 2000, count: 0, type: 'bill' },
      { value: 1000, count: 0, type: 'bill' },
      { value: 500, count: 0, type: 'coin' },
      { value: 100, count: 0, type: 'coin' },
      { value: 50, count: 0, type: 'coin' },
      { value: 10, count: 0, type: 'coin' },
      { value: 5, count: 0, type: 'coin' },
      { value: 1, count: 0, type: 'coin' },
    ],
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    exchangeRate: 0.27,
    denominations: [
      { value: 1000, count: 0, type: 'bill' },
      { value: 500, count: 0, type: 'bill' },
      { value: 200, count: 0, type: 'bill' },
      { value: 100, count: 0, type: 'bill' },
      { value: 50, count: 0, type: 'bill' },
      { value: 20, count: 0, type: 'bill' },
      { value: 10, count: 0, type: 'bill' },
      { value: 5, count: 0, type: 'bill' },
      { value: 1, count: 0, type: 'coin' },
      { value: 0.50, count: 0, type: 'coin' },
      { value: 0.25, count: 0, type: 'coin' },
    ],
  },
])

// State
const totalAmount = ref(125.50) // Example total from sales page (in USD)
const customerName = ref('John Doe')
const seatNumber = ref('12A')
const crewMember = ref('Jane Smith')
const items = ref([
  'Wireless Headphones Premium x1',
  'Swiss Chocolate Box x2',
])

const selectedCurrency = ref('USD')
const currencyPayments = ref<CurrencyPayment[]>([])

const transactionHistory = ref<Transaction[]>([])
const showReceipt = ref(false)
const currentReceipt = ref<Transaction | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Computed
const currentCurrency = computed(() => {
  return currencies.value.find(c => c.code === selectedCurrency.value)!
})

const currentDenominations = computed(() => {
  return currentCurrency.value.denominations
})

const cashReceivedInCurrentCurrency = computed(() => {
  return currentDenominations.value.reduce((total, denom) => {
    return total + (denom.value * denom.count)
  }, 0)
})

const cashReceivedInUSD = computed(() => {
  return cashReceivedInCurrentCurrency.value * currentCurrency.value.exchangeRate
})

const totalCashReceivedAllCurrencies = computed(() => {
  const currentAmount = cashReceivedInUSD.value
  const previousPayments = currencyPayments.value.reduce((sum, payment) => sum + payment.amountInUSD, 0)
  return currentAmount + previousPayments
})

const changeAmount = computed(() => {
  const change = totalCashReceivedAllCurrencies.value - totalAmount.value
  return change >= 0 ? change : 0
})

const isPaymentSufficient = computed(() => {
  return totalCashReceivedAllCurrencies.value >= totalAmount.value
})

const suggestedChange = computed(() => {
  if (!isPaymentSufficient.value) return []
  
  const change = changeAmount.value
  const suggestions: Array<{ value: number; count: number; type: string }> = []
  let remaining = Math.round(change * 100) / 100
  
  // Calculate optimal change denominations
  const denoms = [100, 50, 20, 10, 5, 1, 0.25, 0.10, 0.05, 0.01]
  
  for (const denom of denoms) {
    if (remaining >= denom) {
      const count = Math.floor(remaining / denom)
      if (count > 0) {
        suggestions.push({
          value: denom,
          count,
          type: denom >= 1 ? 'bill' : 'coin',
        })
        remaining = Math.round((remaining - (denom * count)) * 100) / 100
      }
    }
  }
  
  return suggestions
})

// Methods
const updateDenomination = (index: number, increment: boolean) => {
  if (increment) {
    currentDenominations.value[index].count++
  } else if (currentDenominations.value[index].count > 0) {
    currentDenominations.value[index].count--
  }
}

const quickAdd = (index: number, amount: number) => {
  currentDenominations.value[index].count += amount
}

const resetDenominations = () => {
  currentDenominations.value.forEach(denom => {
    denom.count = 0
  })
}

const addCurrencyToPayment = () => {
  if (cashReceivedInCurrentCurrency.value === 0) {
    showSnackbar('Please add cash amount first', 'warning')
    return
  }

  const payment: CurrencyPayment = {
    currencyCode: selectedCurrency.value,
    amount: cashReceivedInCurrentCurrency.value,
    amountInUSD: cashReceivedInUSD.value,
  }

  currencyPayments.value.push(payment)
  showSnackbar(`${currentCurrency.value.symbol}${cashReceivedInCurrentCurrency.value.toFixed(2)} added to payment`, 'success')
  
  // Reset current denominations
  resetDenominations()
}

const removeCurrencyPayment = (index: number) => {
  const payment = currencyPayments.value[index]
  currencyPayments.value.splice(index, 1)
  showSnackbar(`${payment.currencyCode} ${payment.amount.toFixed(2)} removed`, 'info')
}

const changeCurrency = (currencyCode: string) => {
  if (cashReceivedInCurrentCurrency.value > 0) {
    showSnackbar('Please add current amount to payment or reset before changing currency', 'warning')
    return
  }
  selectedCurrency.value = currencyCode
}

const completeCashTransaction = () => {
  if (!isPaymentSufficient.value) {
    showSnackbar('Insufficient cash received', 'error')
    return
  }

  // Add current currency amount if any
  if (cashReceivedInCurrentCurrency.value > 0) {
    addCurrencyToPayment()
  }

  const transaction: Transaction = {
    id: `TXN-${Date.now()}`,
    customerName: customerName.value,
    seatNumber: seatNumber.value,
    items: [...items.value],
    total: totalAmount.value,
    cashReceived: totalCashReceivedAllCurrencies.value,
    currencyPayments: [...currencyPayments.value],
    change: changeAmount.value,
    timestamp: new Date(),
    crewMember: crewMember.value,
  }

  transactionHistory.value.unshift(transaction)
  currentReceipt.value = transaction
  showReceipt.value = true
  
  showSnackbar('Transaction completed successfully', 'success')
  
  // Reset for next transaction
  setTimeout(() => {
    resetDenominations()
    currencyPayments.value = []
    selectedCurrency.value = 'USD'
  }, 500)
}

const printReceipt = () => {
  showSnackbar('Printing receipt...', 'info')
  // In real app, this would trigger actual printer
  setTimeout(() => {
    showSnackbar('Receipt printed', 'success')
  }, 1500)
}

const emailReceipt = () => {
  showSnackbar('Receipt sent via email', 'success')
  // In real app, this would send email
}

const showSnackbar = (text: string, color: string) => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const formatCurrency = (amount: number, currencyCode = 'USD') => {
  const currency = currencies.value.find(c => c.code === currencyCode)
  return `${currency?.symbol || '$'}${amount.toFixed(2)}`
}

const formatDateTime = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <VCard class="mb-6">
      <VCardText>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">
              Cash Payment Processing
            </h1>
            <p class="text-body-1 mb-0">
              Cashiering System
            </p>
          </div>
          <VChip
            color="primary"
            size="large"
          >
            <VIcon
              start
              icon="tabler-user"
            />
            {{ crewMember }}
          </VChip>
        </div>
      </VCardText>
    </VCard>

    <VRow>
      <!-- Left Column - Transaction Details & Cash Input -->
      <VCol
        cols="12"
        md="8"
      >
        <!-- Transaction Summary -->
        <VCard class="mb-6">
          <VCardText>
            <h2 class="text-h5 mb-4">
              <VIcon
                icon="tabler-receipt"
                class="me-2"
              />
              Transaction Details
            </h2>

            <VRow>
              <VCol
                cols="12"
                sm="6"
              >
                <VTextField
                  v-model="customerName"
                  label="Customer Name"
                  prepend-inner-icon="tabler-user"
                  variant="outlined"
                  readonly
                />
              </VCol>
              <VCol
                cols="12"
                sm="6"
              >
                <VTextField
                  v-model="seatNumber"
                  label="Seat Number"
                  prepend-inner-icon="tabler-armchair"
                  variant="outlined"
                  readonly
                />
              </VCol>
            </VRow>

            <VCard
              variant="tonal"
              class="mt-4"
            >
              <VCardText>
                <h3 class="text-subtitle-1 mb-3">
                  Items Purchased
                </h3>
                <div
                  v-for="(item, index) in items"
                  :key="index"
                  class="d-flex align-center mb-2"
                >
                  <VIcon
                    icon="tabler-shopping-bag"
                    size="small"
                    class="me-2"
                  />
                  <span>{{ item }}</span>
                </div>

                <VDivider class="my-3" />

                <div class="d-flex justify-space-between align-center">
                  <span class="text-h6">Total Amount Due:</span>
                  <span class="text-h4 text-primary font-weight-bold">
                    {{ formatCurrency(totalAmount) }}
                  </span>
                </div>
              </VCardText>
            </VCard>
          </VCardText>
        </VCard>

        <!-- Cash Denomination Input -->
        <VCard>
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-3">
              <h2 class="text-h5">
                <VIcon
                  icon="tabler-cash"
                  class="me-2"
                />
                Cash Received
              </h2>
              <div class="d-flex gap-2">
                <VBtn
                  variant="outlined"
                  color="primary"
                  size="small"
                  :disabled="cashReceivedInCurrentCurrency === 0"
                  @click="addCurrencyToPayment"
                >
                  <VIcon
                    start
                    icon="tabler-plus"
                  />
                  Add to Payment
                </VBtn>
                <VBtn
                  variant="outlined"
                  color="secondary"
                  size="small"
                  @click="resetDenominations"
                >
                  <VIcon
                    start
                    icon="tabler-refresh"
                  />
                  Reset
                </VBtn>
              </div>
            </div>

            <!-- Permitted Currencies Info -->
            <VAlert
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <div class="text-subtitle-2 mb-2">
                <VIcon
                  icon="tabler-world"
                  size="small"
                  class="me-1"
                />
                Permitted Currencies
              </div>
              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="currency in currencies"
                  :key="currency.code"
                  size="small"
                  :color="currency.code === selectedCurrency ? 'primary' : 'default'"
                  @click="changeCurrency(currency.code)"
                >
                  {{ currency.code }} ({{ currency.symbol }})
                </VChip>
              </div>
            </VAlert>

            <!-- Currency Selector -->
            <VCard
              variant="tonal"
              color="primary"
              class="mb-4"
            >
              <VCardText>
                <div class="d-flex justify-space-between align-center flex-wrap gap-3">
                  <div>
                    <div class="text-caption text-medium-emphasis mb-1">
                      Selected Currency
                    </div>
                    <div class="text-h6 font-weight-bold">
                      {{ currentCurrency.name }} ({{ currentCurrency.code }})
                    </div>
                    <div class="text-caption">
                      Exchange Rate: 1 {{ currentCurrency.code }} = ${{ currentCurrency.exchangeRate.toFixed(4) }} USD
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="text-caption text-medium-emphasis mb-1">
                      Current Amount
                    </div>
                    <div class="text-h5 font-weight-bold">
                      {{ formatCurrency(cashReceivedInCurrentCurrency, currentCurrency.code) }}
                    </div>
                    <div class="text-caption">
                      ≈ {{ formatCurrency(cashReceivedInUSD) }} USD
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <!-- Bills -->
            <h3 class="text-subtitle-1 mb-3">
              Bills
            </h3>
            <VRow class="mb-4">
              <VCol
                v-for="(denom, index) in currentDenominations.filter(d => d.type === 'bill')"
                :key="index"
                cols="6"
                sm="4"
                md="3"
              >
                <VCard
                  variant="tonal"
                  :color="denom.count > 0 ? 'success' : 'default'"
                >
                  <VCardText class="pa-3">
                    <div class="text-center mb-2">
                      <div class="text-h6 font-weight-bold">
                        {{ formatCurrency(denom.value, currentCurrency.code) }}
                      </div>
                      <div class="text-caption">
                        × {{ denom.count }}
                      </div>
                    </div>

                    <div class="d-flex gap-1 mb-2">
                      <VBtn
                        size="x-small"
                        icon="tabler-minus"
                        variant="text"
                        :disabled="denom.count === 0"
                        @click="updateDenomination(currentDenominations.indexOf(denom), false)"
                      />
                      <VBtn
                        size="x-small"
                        icon="tabler-plus"
                        variant="text"
                        @click="updateDenomination(currentDenominations.indexOf(denom), true)"
                      />
                    </div>

                    <div class="d-flex gap-1">
                      <VBtn
                        size="x-small"
                        variant="tonal"
                        block
                        @click="quickAdd(currentDenominations.indexOf(denom), 5)"
                      >
                        +5
                      </VBtn>
                      <VBtn
                        size="x-small"
                        variant="tonal"
                        block
                        @click="quickAdd(currentDenominations.indexOf(denom), 10)"
                      >
                        +10
                      </VBtn>
                    </div>

                    <div
                      v-if="denom.count > 0"
                      class="text-center mt-2 text-caption font-weight-bold"
                    >
                      {{ formatCurrency(denom.value * denom.count, currentCurrency.code) }}
                      {{ formatCurrency(denom.value * denom.count) }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>

            <!-- Coins -->
            <h3 class="text-subtitle-1 mb-3">
              Coins
            </h3>
            <VRow>
              <VCol
                v-for="(denom, index) in currentDenominations.filter(d => d.type === 'coin')"
                :key="index"
                cols="6"
                sm="4"
                md="3"
              >
                <VCard
                  variant="tonal"
                  :color="denom.count > 0 ? 'success' : 'default'"
                >
                  <VCardText class="pa-3">
                    <div class="text-center mb-2">
                      <div class="text-h6 font-weight-bold">
                        {{ formatCurrency(denom.value, currentCurrency.code) }}
                      </div>
                      <div class="text-caption">
                        × {{ denom.count }}
                      </div>
                    </div>

                    <div class="d-flex gap-1 justify-center">
                      <VBtn
                        size="x-small"
                        icon="tabler-minus"
                        variant="text"
                        :disabled="denom.count === 0"
                        @click="updateDenomination(currentDenominations.indexOf(denom), false)"
                      />
                      <VBtn
                        size="x-small"
                        icon="tabler-plus"
                        variant="text"
                        @click="updateDenomination(currentDenominations.indexOf(denom), true)"
                      />
                    </div>

                    <div
                      v-if="denom.count > 0"
                      class="text-center mt-2 text-caption font-weight-bold"
                    >
                      {{ formatCurrency(denom.value * denom.count, currentCurrency.code) }}
                      {{ formatCurrency(denom.value * denom.count) }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Right Column - Payment Summary & Actions -->
      <VCol
        cols="12"
        md="4"
      >
        <!-- Payment Summary -->
        <VCard class="mb-6">
          <VCardText>
            <h2 class="text-h5 mb-4">
              Payment Summary
            </h2>

            <!-- Multi-Currency Payments -->
            <VCard
              v-if="currencyPayments.length > 0"
              variant="tonal"
              color="success"
              class="mb-4"
            >
              <VCardText>
                <h3 class="text-subtitle-2 mb-3">
                  <VIcon
                    icon="tabler-coins"
                    size="small"
                    class="me-1"
                  />
                  Payments Received
                </h3>
                <div
                  v-for="(payment, index) in currencyPayments"
                  :key="index"
                  class="d-flex justify-space-between align-center mb-2"
                >
                  <div>
                    <VChip
                      size="small"
                      color="primary"
                      class="me-2"
                    >
                      {{ payment.currencyCode }}
                    </VChip>
                    <span class="text-body-2">{{ formatCurrency(payment.amount, payment.currencyCode) }}</span>
                    <span class="text-caption text-medium-emphasis ms-1">
                      ({{ formatCurrency(payment.amountInUSD) }})
                    </span>
                  </div>
                  <VBtn
                    icon="tabler-x"
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="removeCurrencyPayment(index)"
                  />
                </div>
              </VCardText>
            </VCard>

            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-1">Total Due:</span>
                <span class="text-h6 font-weight-bold">
                  {{ formatCurrency(totalAmount) }}
                </span>
              </div>

              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-1">Total Received (USD):</span>
                <span
                  class="text-h6 font-weight-bold"
                  :class="isPaymentSufficient ? 'text-success' : 'text-warning'"
                >
                  {{ formatCurrency(totalCashReceivedAllCurrencies) }}
                </span>
              </div>

              <VDivider class="my-3" />

              <div class="d-flex justify-space-between">
                <span class="text-h6">Change:</span>
                <span
                  class="text-h5 font-weight-bold"
                  :class="changeAmount > 0 ? 'text-info' : 'text-grey'"
                >
                  {{ formatCurrency(changeAmount) }}
                </span>
              </div>
            </div>

            <!-- Change Suggestion -->
            <VCard
              v-if="isPaymentSufficient && changeAmount > 0"
              variant="tonal"
              color="info"
              class="mb-4"
            >
              <VCardText>
                <h3 class="text-subtitle-2 mb-3">
                  <VIcon
                    icon="tabler-bulb"
                    size="small"
                    class="me-1"
                  />
                  Suggested Change (USD)
                </h3>
                <div
                  v-for="(suggestion, index) in suggestedChange"
                  :key="index"
                  class="d-flex justify-space-between mb-1 text-caption"
                >
                  <span>{{ formatCurrency(suggestion.value) }} × {{ suggestion.count }}</span>
                  <span class="font-weight-bold">
                    {{ formatCurrency(suggestion.value * suggestion.count) }}
                  </span>
                </div>
              </VCardText>
            </VCard>

            <!-- Status Alert -->
            <VAlert
              v-if="!isPaymentSufficient"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              <div class="text-caption">
                Need {{ formatCurrency(totalAmount - totalCashReceivedAllCurrencies) }} more
              </div>
            </VAlert>

            <VAlert
              v-else
              type="success"
              variant="tonal"
              class="mb-4"
            >
              <div class="text-caption">
                Payment sufficient
              </div>
            </VAlert>

            <!-- Action Button -->
            <VBtn
              block
              color="success"
              size="large"
              :disabled="!isPaymentSufficient"
              @click="completeCashTransaction"
            >
              <VIcon
                start
                icon="tabler-check"
              />
              Complete Transaction
            </VBtn>
          </VCardText>
        </VCard>

        <!-- Transaction History -->
        <VCard>
          <VCardText>
            <h2 class="text-h6 mb-3">
              <VIcon
                icon="tabler-history"
                class="me-2"
              />
              Recent Transactions
            </h2>

            <div
              v-if="transactionHistory.length === 0"
              class="text-center text-body-2 text-medium-emphasis py-4"
            >
              No transactions yet
            </div>

            <VCard
              v-for="txn in transactionHistory.slice(0, 5)"
              :key="txn.id"
              variant="tonal"
              class="mb-2"
            >
              <VCardText class="pa-3">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-caption font-weight-bold">{{ txn.id }}</span>
                  <VChip
                    size="x-small"
                    color="success"
                  >
                    {{ formatCurrency(txn.total) }}
                  </VChip>
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ txn.customerName }} - {{ txn.seatNumber }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ formatDateTime(txn.timestamp) }}
                </div>
              </VCardText>
            </VCard>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Receipt Dialog -->
    <VDialog
      v-model="showReceipt"
      max-width="500"
    >
      <VCard v-if="currentReceipt">
        <VCardText class="pa-6">
          <div class="text-center mb-6">
            <h2 class="text-h5 mb-2">
              Transaction Receipt
            </h2>
            <VChip
              color="success"
              size="large"
            >
              <VIcon
                start
                icon="tabler-check"
              />
              Payment Successful
            </VChip>
          </div>

          <VDivider class="mb-4" />

          <div class="receipt-content">
            <div class="mb-4">
              <div class="text-caption text-medium-emphasis">
                Transaction ID
              </div>
              <div class="font-weight-bold">
                {{ currentReceipt.id }}
              </div>
            </div>

            <div class="mb-4">
              <div class="text-caption text-medium-emphasis">
                Date & Time
              </div>
              <div class="font-weight-bold">
                {{ formatDateTime(currentReceipt.timestamp) }}
              </div>
            </div>

            <div class="mb-4">
              <div class="text-caption text-medium-emphasis">
                Customer
              </div>
              <div class="font-weight-bold">
                {{ currentReceipt.customerName }} - Seat {{ currentReceipt.seatNumber }}
              </div>
            </div>

            <div class="mb-4">
              <div class="text-caption text-medium-emphasis mb-2">
                Items
              </div>
              <div
                v-for="(item, index) in currentReceipt.items"
                :key="index"
                class="text-body-2 mb-1"
              >
                • {{ item }}
              </div>
            </div>

            <VDivider class="my-4" />

            <div class="d-flex justify-space-between mb-2">
              <span>Total:</span>
              <span class="font-weight-bold">{{ formatCurrency(currentReceipt.total) }}</span>
            </div>

            <!-- Multi-Currency Payments in Receipt -->
            <div
              v-if="currentReceipt.currencyPayments && currentReceipt.currencyPayments.length > 0"
              class="mb-3"
            >
              <div class="text-caption text-medium-emphasis mb-2">
                Payments Received:
              </div>
              <div
                v-for="(payment, index) in currentReceipt.currencyPayments"
                :key="index"
                class="d-flex justify-space-between text-caption mb-1 ms-3"
              >
                <span>{{ payment.currencyCode }}: {{ formatCurrency(payment.amount, payment.currencyCode) }}</span>
                <span>({{ formatCurrency(payment.amountInUSD) }})</span>
              </div>
            </div>

            <div class="d-flex justify-space-between mb-2">
              <span>Total Cash Received:</span>
              <span class="font-weight-bold">{{ formatCurrency(currentReceipt.cashReceived) }}</span>
            </div>

            <div class="d-flex justify-space-between mb-2">
              <span>Change:</span>
              <span class="font-weight-bold text-success">
                {{ formatCurrency(currentReceipt.change) }}
              </span>
            </div>

            <VDivider class="my-4" />

            <div class="text-caption text-medium-emphasis text-center">
              Served by: {{ currentReceipt.crewMember }}
            </div>
          </div>

          <div class="d-flex gap-3 mt-6">
            <VBtn
              variant="outlined"
              block
              @click="printReceipt"
            >
              <VIcon
                start
                icon="tabler-printer"
              />
              Print
            </VBtn>
            <VBtn
              variant="outlined"
              block
              @click="emailReceipt"
            >
              <VIcon
                start
                icon="tabler-mail"
              />
              Email
            </VBtn>
          </div>

          <VBtn
            block
            color="primary"
            class="mt-3"
            @click="showReceipt = false"
          >
            Close
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Snackbar Notifications -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
    >
      {{ snackbarText }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.receipt-content {
  font-family: monospace;
}
</style>
