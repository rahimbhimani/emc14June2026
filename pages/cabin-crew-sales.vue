<script setup lang="ts">


interface ProductVariant {
  size: string
  sku: string
  barcode: string
  uom: string
  status: 'Active' | 'Inactive'
  price: number
  stock: number
}

interface Product {
  id: number
  name: string
  itemNumber: string
  barcode: string
  price: number
  category: string
  stock: number
  image: string
  description: string
  hasVariants?: boolean
  variants?: ProductVariant[]
}

interface CartItem extends Product {
  quantity: number
  selectedVariant?: ProductVariant
}

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

interface CardDetails {
  type: 'DEBIT' | 'CREDIT' | ''
  network: string
  last4: string
  expiry: string
}

interface AuthorizationDetails {
  method: string
  offlineCode: string
}

interface CrewDetails {
  employeeId: string
  name: string
  designation: string
}

interface EquipmentDetails {
  deviceId: string
  deviceType: string
  serialNumber: string
}

interface CashRegister {
  currencyCode: string
  amount: number
}

interface POSTerminalResponse {
  status: 'ACCEPTED' | 'DECLINED' | 'ERROR'
  transactionId: string
  timestamp: string
  cardDetails: {
    maskedPAN: string
    cardScheme: string
    cardType: 'DEBIT' | 'CREDIT'
    expiryDate: string
    cardholderName?: string
  }
  authorizationCode?: string
  responseCode: string
  responseMessage: string
}

// Adyen Android SDK Interfaces
interface AdyenPaymentRequest {
  SaleToPOIRequest: {
    MessageHeader: {
      MessageClass: 'Service'
      MessageCategory: 'Payment'
      MessageType: 'Request'
      ServiceID: string
      SaleID: string
      POIID: string
    }
    PaymentRequest: {
      SaleData: {
        SaleTransactionID: {
          TransactionID: string
          TimeStamp: string
        }
        SaleReferenceID?: string
        TokenRequestedType?: 'Customer' | 'Transaction'
      }
      PaymentTransaction: {
        AmountsReq: {
          Currency: string
          RequestedAmount: number
        }
      }
      PaymentData?: {
        PaymentType: 'Normal' | 'Refund'
      }
    }
  }
}

interface AdyenPaymentResponse {
  SaleToPOIResponse: {
    MessageHeader: {
      MessageClass: 'Service'
      MessageCategory: 'Payment'
      MessageType: 'Response'
      ServiceID: string
      SaleID: string
      POIID: string
    }
    PaymentResponse: {
      Response: {
        Result: 'Success' | 'Failure'
        ErrorCondition?: string
        AdditionalResponse?: string
      }
      SaleData: {
        SaleTransactionID: {
          TransactionID: string
          TimeStamp: string
        }
      }
      POIData?: {
        POITransactionID: {
          TransactionID: string
          TimeStamp: string
        }
      }
      PaymentResult?: {
        PaymentType: string
        PaymentInstrumentData?: {
          PaymentInstrumentType: 'Card'
          CardData?: {
            EntryMode: string
            PaymentBrand: string
            MaskedPan: string
            PaymentAccountRef?: string
          }
        }
        AmountsResp?: {
          Currency: string
          AuthorizedAmount: number
          TotalFeesAmount?: number
        }
        OnlineFlag?: boolean
        PaymentAcquirerData?: {
          AcquirerPOIID?: string
          ApprovalCode?: string
          MerchantID?: string
        }
      }
    }
  }
}

// Adyen Android SDK Interfaces
interface AdyenPaymentRequest {
  SaleToPOIRequest: {
    MessageHeader: {
      MessageClass: 'Service'
      MessageCategory: 'Payment'
      MessageType: 'Request'
      ServiceID: string
      SaleID: string
      POIID: string
    }
    PaymentRequest: {
      SaleData: {
        SaleTransactionID: {
          TransactionID: string
          TimeStamp: string
        }
        SaleReferenceID?: string
        TokenRequestedType?: 'Customer' | 'Transaction'
      }
      PaymentTransaction: {
        AmountsReq: {
          Currency: string
          RequestedAmount: number
        }
      }
      PaymentData?: {
        PaymentType: 'Normal' | 'Refund'
      }
    }
  }
}

interface AdyenPaymentResponse {
  SaleToPOIResponse: {
    MessageHeader: {
      MessageClass: 'Service'
      MessageCategory: 'Payment'
      MessageType: 'Response'
      ServiceID: string
      SaleID: string
      POIID: string
    }
    PaymentResponse: {
      Response: {
        Result: 'Success' | 'Failure'
        ErrorCondition?: string
        AdditionalResponse?: string
      }
      SaleData: {
        SaleTransactionID: {
          TransactionID: string
          TimeStamp: string
        }
      }
      POIData?: {
        POITransactionID: {
          TransactionID: string
          TimeStamp: string
        }
      }
      PaymentResult?: {
        PaymentType: string
        PaymentInstrumentData?: {
          PaymentInstrumentType: 'Card'
          CardData?: {
            EntryMode: string
            PaymentBrand: string
            MaskedPan: string
            PaymentAccountRef?: string
          }
        }
        AmountsResp?: {
          Currency: string
          AuthorizedAmount: number
          TotalFeesAmount?: number
        }
        OnlineFlag?: boolean
        PaymentAcquirerData?: {
          AcquirerPOIID?: string
          ApprovalCode?: string
          MerchantID?: string
        }
      }
    }
  }
}

// Flight and trolley information - fetched from API
const flightNumber = ref('')
const trolleyNumber = ref('')

// Cash Register - Starting float (fetched from API)
const cashRegister = ref<CashRegister[]>([])

const showCashRegister = ref(false)

// Product inventory data - fetched from API
const inventory = ref<Product[]>([])
const isLoadingInventory = ref(false)

// Infinite scrolling
const displayedProductsCount = ref(6) // Start with 6 products
const productsPerPage = 6
const isLoadingMore = ref(false)
const loadMoreTrigger = ref<HTMLElement | null>(null)

// Product variant selection
const selectedVariants = ref<Record<number, ProductVariant>>({})

// Snackbar states - defined before showSnackbar function
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Utility function - defined early
const showSnackbar = (text: string, color: string) => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// Fetch all reference data from API
const fetchReferenceData = async () => {
  isLoadingInventory.value = true
  try {
    // Fetch inventory and reference data
    const data = await $fetch<any>('/api/emcInventory')

    // Populate all reference data
    inventory.value = data.inventory || []
    flightNumber.value = data.flightInfo?.flightNumber || ''
    crewDetails.value = data.crewDetails || { employeeId: '', name: '', designation: '' }
    cashRegister.value = data.cashRegister || []
    // USD only - no multi-currency support
    cardNetworks.splice(0, cardNetworks.length, ...(data.cardNetworks || []))
    authMethods.splice(0, authMethods.length, ...(data.authMethods || []))
    paymentMethods.splice(0, paymentMethods.length, ...(data.paymentMethods || []))
    // Remove multi-currency support - keep only USD

    // Fetch trolley information from database
    try {
      const trolleyResponse = await $fetch<any>('/api/trolleys')
      if (trolleyResponse.success && trolleyResponse.data && trolleyResponse.data.length > 0) {
        // Get the first available trolley or filter by specific criteria
        const trolley = trolleyResponse.data.find((t: any) => t.status === 'Available' || t.status === 'READY') || trolleyResponse.data[0]
        trolleyNumber.value = trolley?.code || data.flightInfo?.trolleyNumber || ''
      } else {
        trolleyNumber.value = data.flightInfo?.trolleyNumber || ''
      }
    } catch (trolleyError) {
      console.error('Failed to fetch trolley:', trolleyError)
      trolleyNumber.value = data.flightInfo?.trolleyNumber || ''
    }
  } catch (error) {
    console.error('Failed to fetch reference data:', error)
    showSnackbar('Failed to load reference data', 'error')
  } finally {
    isLoadingInventory.value = false
  }
}

// Load all reference data on component mount
onMounted(() => {
  fetchReferenceData()
})

// USD is the only permitted currency

const searchQuery = ref('')
const searchType = ref<'all' | 'barcode' | 'itemNumber'>('all')
const stockFilter = ref<'all' | 'in-stock' | 'out-of-stock'>('all')
const cart = ref<CartItem[]>([])
const showCheckout = ref(false)
const paymentMethod = ref('credit-card')
const cardPaymentMode = ref<'manual' | 'sdk'>('sdk') // Manual entry or SDK (POS machine)
const customerName = ref('')
const seatNumber = ref('')

// POS Terminal Screen
const showPOSScreen = ref(false)
const posScreenState = ref<'idle' | 'ready' | 'swiping' | 'processing' | 'approved' | 'declined'>('idle')
const posScreenMessage = ref('')
const posTransactionData = ref<any>(null)
const isProcessingPayment = ref(false)

// Stripe Test Configuration
const STRIPE_TEST_KEY = 'pk_test_51234567890' // Use your Stripe test key
const STRIPE_API_URL = 'https://api.stripe.com/v1'

// Partial Payment States (USD Only)
const remainingBalance = ref(0)
const totalPaymentsMade = ref(0)
const cashAmountEntered = ref(0)
interface Payment {
  method: string
  amount: number
  timestamp: string
}
const paymentHistory = ref<Payment[]>([])

// Card payment states
const cardDetails = ref<CardDetails>({
  type: '',
  network: '',
  last4: '',
  expiry: '',
})

const authorizationDetails = ref<AuthorizationDetails>({
  method: '',
  offlineCode: '',
})

const cardNetworks = reactive<string[]>([])
const authMethods = reactive<string[]>([])
const paymentMethods = reactive<Array<{ value: string; title: string; icon: string }>>([])

// Crew and Equipment details (fetched from API)
const crewDetails = ref<CrewDetails>({
  employeeId: '',
  name: '',
  designation: '',
})

const equipmentDetails = ref<EquipmentDetails>({
  deviceId: '',
  deviceType: '',
  serialNumber: '',
})

// Detect if running on browser or device
const isBrowser = computed(() => {
  if (typeof window === 'undefined') return true
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  // If it's a mobile device, return false (not browser)
  return !/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
})

// Computed for cash register total (USD only)
const totalCashRegisterUSD = computed(() => {
  return cashRegister.value.reduce((total, cash) => {
    return total + cash.amount
  }, 0)
})

// Computed for Partial Payment (USD Only)
const changeAmount = computed(() => {
  const change = totalPaymentsMade.value + cashAmountEntered.value - cartTotal.value
  return change >= 0 ? change : 0
})

const isCurrentPaymentSufficient = computed(() => {
  return (totalPaymentsMade.value + cashAmountEntered.value) >= cartTotal.value
})

const shouldShowRemainingBalance = computed(() => {
  return remainingBalance.value > 0
})

// Check if current payment method has valid input for processing
const isCurrentPaymentMethodValid = computed(() => {
  // All methods require an amount to be entered
  if (cashAmountEntered.value <= 0) {
    return false
  }

  // For card methods (credit/debit), validate payment mode requirements
  if (paymentMethod.value === 'credit-card' || paymentMethod.value === 'debit-card') {
    // In SDK mode, amount is enough (card will be read from terminal)
    if (cardPaymentMode.value === 'sdk') {
      return true
    }
    // In manual mode, need amount + card details
    return (
      cardDetails.value.type &&
      cardDetails.value.network &&
      cardDetails.value.last4 &&
      cardDetails.value.expiry &&
      authorizationDetails.value.method &&
      authorizationDetails.value.offlineCode
    )
  }

  // For all other payment methods, just need amount > 0
  return true
})

const allFilteredProducts = computed(() => {
  let filtered = inventory.value

  // Apply stock filter first
  if (stockFilter.value === 'in-stock') {
    filtered = filtered.filter(product => product.stock > 0)
  } else if (stockFilter.value === 'out-of-stock') {
    filtered = filtered.filter(product => product.stock === 0)
  }

  // Apply search filter
  if (!searchQuery.value) return filtered

  const query = searchQuery.value.toLowerCase().trim()

  return filtered.filter(product => {
    if (searchType.value === 'barcode') {
      return product.barcode.includes(query)
    }
    if (searchType.value === 'itemNumber') {
      return product.itemNumber.toLowerCase().includes(query)
    }
    // Search all fields
    return (
      product.name.toLowerCase().includes(query) ||
      product.itemNumber.toLowerCase().includes(query) ||
      product.barcode.includes(query) ||
      product.category.toLowerCase().includes(query)
    )
  })
})

// Products to display with infinite scroll
const filteredProducts = computed(() => {
  return allFilteredProducts.value.slice(0, displayedProductsCount.value)
})

const hasMoreProducts = computed(() => {
  return displayedProductsCount.value < allFilteredProducts.value.length
})

const cartTotal = computed(() => {
  return cart.value.reduce((total, item) => total + item.price * item.quantity, 0)
})

const cartItemCount = computed(() => {
  return cart.value.reduce((count, item) => count + item.quantity, 0)
})

// Helper function to get category icon
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, string> = {
    'Electronics': 'mdi:devices',
    'Comfort': 'mdi:pillow',
    'Fragrance': 'mdi:spray',
    'Food': 'mdi:food',
    'Accessories': 'mdi:glasses',
    'Beauty': 'mdi:face-woman-shimmer',
    'Beverages': 'mdi:cup',
    'Reading': 'mdi:book-open-variant',
    'Health': 'mdi:medical-bag',
    'Toys': 'mdi:teddy-bear',
  }
  return iconMap[category] || 'mdi:package-variant'
}

// Methods
const addToCart = (product: Product, variant?: ProductVariant) => {
  // If product has variants but no variant selected, show warning
  if (product.hasVariants && product.variants && product.variants.length > 0 && !variant) {
    showSnackbar('Please select a variant first', 'warning')
    return
  }

  // Determine the actual stock and price based on variant or base product
  const actualStock = variant ? variant.stock : product.stock
  const actualPrice = variant ? variant.price : product.price

  // For products with variants, match by variant SKU
  const existingItem = variant
    ? cart.value.find(item => item.selectedVariant?.sku === variant.sku)
    : cart.value.find(item => item.id === product.id && !item.selectedVariant)

  if (existingItem) {
    if (existingItem.quantity < actualStock) {
      existingItem.quantity++
      showSnackbar('Quantity updated in cart', 'success')
    } else {
      showSnackbar('Stock limit reached', 'warning')
    }
  } else {
    const cartItem: CartItem = {
      ...product,
      price: actualPrice,
      stock: actualStock,
      quantity: 1,
      selectedVariant: variant,
    }
    cart.value.push(cartItem)
    showSnackbar(`${variant ? variant.size + ' ' : ''}${product.name} added to cart`, 'success')
  }
}

const removeFromCart = (productId: number, variantSku?: string) => {
  const index = variantSku
    ? cart.value.findIndex(item => item.selectedVariant?.sku === variantSku)
    : cart.value.findIndex(item => item.id === productId && !item.selectedVariant)

  if (index > -1) {
    cart.value.splice(index, 1)
    showSnackbar('Item removed from cart', 'info')
  }
}

const updateQuantity = (productId: number, quantity: number, variantSku?: string) => {
  const item = variantSku
    ? cart.value.find(i => i.selectedVariant?.sku === variantSku)
    : cart.value.find(i => i.id === productId && !i.selectedVariant)

  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId, variantSku)
    } else if (quantity <= item.stock) {
      item.quantity = quantity
    } else {
      showSnackbar('Stock limit reached', 'warning')
    }
  }
}

const scanBarcode = () => {
  // Simulate barcode scanner - in real app, this would integrate with device scanner
  if (inventory.value.length === 0) return
  const randomProduct = inventory.value[Math.floor(Math.random() * inventory.value.length)]
  if (!randomProduct) return
  searchQuery.value = randomProduct.barcode
  searchType.value = 'barcode'
  showSnackbar(`Scanned: ${randomProduct.name}`, 'info')
}

const loadMoreProducts = () => {
  if (isLoadingMore.value || !hasMoreProducts.value) return

  isLoadingMore.value = true
  // Simulate network delay for smooth UX
  setTimeout(() => {
    displayedProductsCount.value += productsPerPage
    isLoadingMore.value = false
  }, 300)
}

let observer: IntersectionObserver | null = null

const setupInfiniteScroll = () => {
  // Clean up existing observer
  if (observer) {
    observer.disconnect()
  }

  // Wait for element to be available
  nextTick(() => {
    if (!loadMoreTrigger.value) return

    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMoreProducts.value && !isLoadingMore.value) {
          loadMoreProducts()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(loadMoreTrigger.value)
  })
}

// Setup infinite scroll when products are loaded
watch(() => filteredProducts.value.length, (newLength) => {
  if (newLength > 0 && hasMoreProducts.value) {
    setupInfiniteScroll()
  }
})

// Initialize remaining balance when checkout dialog opens
watch(() => showCheckout.value, (isOpen) => {
  if (isOpen && remainingBalance.value === 0) {
    remainingBalance.value = cartTotal.value
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// Reset displayed count when search changes
watch([searchQuery, searchType], () => {
  displayedProductsCount.value = productsPerPage
  // Re-setup observer after search
  if (hasMoreProducts.value) {
    setupInfiniteScroll()
  }
})

// USD-only partial payment methods
const applyPartialPayment = (method: string, amount: number) => {
  if (amount <= 0) {
    showSnackbar('Please enter a valid amount', 'warning')
    return
  }

  const payment: Payment = {
    method,
    amount,
    timestamp: new Date().toISOString(),
  }

  paymentHistory.value.push(payment)
  totalPaymentsMade.value += amount
  remainingBalance.value = Math.max(0, cartTotal.value - totalPaymentsMade.value)

  showSnackbar(`$${amount.toFixed(2)} applied via ${method}. Remaining: $${remainingBalance.value.toFixed(2)}`, 'success')

  // Reset cash input
  cashAmountEntered.value = 0
}

const resetCashInput = () => {
  cashAmountEntered.value = 0
}

const formatCurrency = (amount: number) => {
  return `$${amount.toFixed(2)}`
}

const validateCardDetails = () => {
  // Skip validation if using SDK mode (POS will capture details)
  if (cardPaymentMode.value === 'sdk') {
    return true
  }

  // Validate manual entry
  if (!cardDetails.value.type) {
    showSnackbar('Please select card type', 'error')
    return false
  }
  if (!cardDetails.value.network) {
    showSnackbar('Please select card network', 'error')
    return false
  }
  if (!cardDetails.value.last4 || cardDetails.value.last4.length !== 4) {
    showSnackbar('Please enter last 4 digits of card', 'error')
    return false
  }
  if (!cardDetails.value.expiry || !/^\d{2}\/\d{2}$/.test(cardDetails.value.expiry)) {
    showSnackbar('Please enter valid expiry (MM/YY)', 'error')
    return false
  }
  if (!authorizationDetails.value.method) {
    showSnackbar('Please select authorization method', 'error')
    return false
  }
  if (!authorizationDetails.value.offlineCode) {
    showSnackbar('Please enter offline code', 'error')
    return false
  }
  return true
}

const resetCardDetails = () => {
  cardDetails.value = {
    type: '',
    network: '',
    last4: '',
    expiry: '',
  }
  authorizationDetails.value = {
    method: '',
    offlineCode: '',
  }
}

const validateCrewDetails = () => {
  if (!crewDetails.value.employeeId) {
    showSnackbar('Please enter employee ID', 'error')
    return false
  }
  if (!crewDetails.value.name) {
    showSnackbar('Please enter crew member name', 'error')
    return false
  }
  if (!crewDetails.value.designation) {
    showSnackbar('Please enter designation', 'error')
    return false
  }
  return true
}

const validateEquipmentDetails = () => {
  if (!isBrowser.value) {
    if (!equipmentDetails.value.deviceId) {
      showSnackbar('Please enter device ID', 'error')
      return false
    }
    if (!equipmentDetails.value.deviceType) {
      showSnackbar('Please select device type', 'error')
      return false
    }
    if (!equipmentDetails.value.serialNumber) {
      showSnackbar('Please enter serial number', 'error')
      return false
    }
  }
  return true
}

const resetCrewAndEquipment = () => {
  crewDetails.value = {
    employeeId: '',
    name: '',
    designation: '',
  }
  equipmentDetails.value = {
    deviceId: '',
    deviceType: '',
    serialNumber: '',
  }
}

const completeAndCloseCheckout = () => {
  // Clear cart and reset form data
  cart.value = []
  customerName.value = ''
  seatNumber.value = ''
  paymentHistory.value = []
  totalPaymentsMade.value = 0
  remainingBalance.value = 0
  resetCashInput()
  resetCardDetails()
  resetCrewAndEquipment()
  // Close checkout dialog
  showCheckout.value = false
}

const processCheckout = async () => {
  // Initialize or update remaining balance on first checkout
  if (remainingBalance.value === 0) {
    remainingBalance.value = cartTotal.value
  }

  // Validate equipment details (only for devices)
  if (!validateEquipmentDetails()) {
    return
  }

  if (!customerName.value || !seatNumber.value) {
    showSnackbar('Please enter passenger name and seat number', 'error')
    return
  }

  if (cart.value.length === 0) {
    showSnackbar('Cart is empty', 'error')
    return
  }

  // For card payment, validate card details
  if (paymentMethod.value === 'credit-card' || paymentMethod.value === 'debit-card') {
    if (cashAmountEntered.value <= 0) {
      showSnackbar('Please enter a card payment amount', 'warning')
      return
    }
    if (!validateCardDetails()) {
      return
    }

    // Show POS terminal screen
    showPOSScreen.value = true
    posScreenState.value = 'ready'
    posScreenMessage.value = 'Insert, swipe or tap card'

    // Simulate card insert/ready delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Show swipe animation (only if SDK mode or if manual has card details)
    if (cardPaymentMode.value === 'sdk' || cardDetails.value.last4) {
      posScreenState.value = 'swiping'
      posScreenMessage.value = 'Card detected - Reading...'

      // Simulate card swipe/read time
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // Process card payment through Stripe
    posScreenState.value = 'processing'
    posScreenMessage.value = 'Processing payment...'
    isProcessingPayment.value = true

    const paymentResult = await processStripePayment()

    if (!paymentResult.success) {
      posScreenState.value = 'declined'
      posScreenMessage.value = paymentResult.error || 'Transaction declined'
      posTransactionData.value = paymentResult

      showSnackbar(`Payment ${paymentResult.responseCode || 'DECLINED'}: ${paymentResult.error}`, 'error')
      isProcessingPayment.value = false

      // Close POS screen after showing error
      setTimeout(() => {
        showPOSScreen.value = false
        posScreenState.value = 'idle'
      }, 4000)
      return
    }

    // Payment successful - apply partial payment
    const cardAmount = cashAmountEntered.value > 0 ? cashAmountEntered.value : (remainingBalance.value > 0 ? remainingBalance.value : cartTotal.value)
    applyPartialPayment('Card', cardAmount)

    posScreenState.value = 'approved'
    posScreenMessage.value = 'Payment approved'
    posTransactionData.value = paymentResult

    const cardInfo = paymentResult.cardDetails
    showSnackbar(
      `✓ Card payment applied: $${cardAmount.toFixed(2)}\n` +
      `Transaction ID: ${paymentResult.transactionId}\n` +
      `Remaining Balance: $${remainingBalance.value.toFixed(2)}`,
      'success'
    )

    // Reset form and card details for next payment or close if done
    setTimeout(() => {
      resetCardDetails()
      resetCashInput()
      isProcessingPayment.value = false
      showPOSScreen.value = false
      posScreenState.value = 'idle'

      // If fully paid, show success message but keep dialog open
      if (remainingBalance.value === 0) {
        showSnackbar('✓ Full payment received! Transaction complete.', 'success')
        // Dialog stays open for payment review - user can close manually
      } else {
        // Show message that more payment is needed
        showSnackbar(`Partial payment applied. Remaining: $${remainingBalance.value.toFixed(2)}`, 'info')
      }
    }, 4000)

    return
  }

  // For cash payment
  if (paymentMethod.value === 'cash') {
    if (cashAmountEntered.value <= 0) {
      showSnackbar('Please enter a cash amount', 'warning')
      return
    }

    // Validate we're not overpaying if this is the final payment
    const totalAfterPayment = totalPaymentsMade.value + cashAmountEntered.value
    if (totalAfterPayment > cartTotal.value) {
      // Check if user confirmed overpayment
      const change = totalAfterPayment - cartTotal.value
      showSnackbar(`Processing $${cashAmountEntered.value.toFixed(2)} cash. Change: $${change.toFixed(2)}`, 'success')
    }

    // Apply cash payment
    applyPartialPayment('Cash', cashAmountEntered.value)

    // Reset cash input for potential next payment
    resetCashInput()

    // If fully paid, show success message but keep dialog open
    if (remainingBalance.value === 0) {
      showSnackbar('✓ Full payment received! Transaction complete.', 'success')
      // Dialog stays open for payment review - user can close manually
    } else {
      showSnackbar(`Partial payment applied. Remaining: $${remainingBalance.value.toFixed(2)}`, 'info')
    }

    return
  }

  // Digital wallet or other payment methods
  if (cashAmountEntered.value <= 0) {
    showSnackbar('Please enter a payment amount', 'warning')
    return
  }

  applyPartialPayment(paymentMethod.value, cashAmountEntered.value)
  resetCashInput()

  if (remainingBalance.value === 0) {
    showSnackbar('✓ Full payment received! Transaction complete.', 'success')
    // Dialog stays open for payment review - user can close manually
  } else {
    showSnackbar(`Partial payment applied. Remaining: $${remainingBalance.value.toFixed(2)}`, 'info')
  }
}

// Stripe Payment Processing
const processStripePayment = async () => {
  isProcessingPayment.value = true

  try {
    // Prepare charge details - USD only, use cashAmountEntered or remaining balance
    const amount = cashAmountEntered.value > 0 ? cashAmountEntered.value : remainingBalance.value
    const chargeDetails = {
      amount: Math.round(amount * 100), // Amount in cents
      currency: 'usd',
      currencySymbol: '$',
      currencyName: 'US Dollar',
      payment_method_types: ['card'],
      description: `In-flight purchase - Flight ${flightNumber.value}`,
      metadata: {
        flight: flightNumber.value,
        trolley: trolleyNumber.value,
        crew_id: crewDetails.value.employeeId,
        crew_name: crewDetails.value.name,
        seat: seatNumber.value,
        passenger: customerName.value,
        device_id: equipmentDetails.value.deviceId,
        device_type: equipmentDetails.value.deviceType,
      },
      cardInfo: {
        type: cardDetails.value.type,
        network: cardDetails.value.network,
        last4: cardDetails.value.last4,
        expiry: cardDetails.value.expiry,
      },
    }

    // Call POS terminal API (mock implementation)
    const posResponse = await callPOSTerminal(chargeDetails)

    if (posResponse.status === 'ACCEPTED') {
      return {
        success: true,
        transactionId: posResponse.transactionId,
        cardDetails: posResponse.cardDetails,
        authorizationCode: posResponse.authorizationCode,
        responseMessage: posResponse.responseMessage,
      }
    } else {
      return {
        success: false,
        error: posResponse.responseMessage || 'Payment declined',
        responseCode: posResponse.responseCode,
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Payment processing error' }
  } finally {
    isProcessingPayment.value = false
  }
}

// Adyen SDK Adapter - Converts our data to Adyen format
const buildAdyenPaymentRequest = (chargeDetails: any): AdyenPaymentRequest => {
  const transactionId = `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  const timestamp = new Date().toISOString()

  return {
    SaleToPOIRequest: {
      MessageHeader: {
        MessageClass: 'Service',
        MessageCategory: 'Payment',
        MessageType: 'Request',
        ServiceID: transactionId,
        SaleID: `${chargeDetails.metadata.flight}-${chargeDetails.metadata.crew_id}`, // Flight + Crew ID
        POIID: chargeDetails.metadata.device_id || 'ADYEN-POS-001', // Terminal ID
      },
      PaymentRequest: {
        SaleData: {
          SaleTransactionID: {
            TransactionID: transactionId,
            TimeStamp: timestamp,
          },
          SaleReferenceID: `${chargeDetails.metadata.flight}-${chargeDetails.metadata.seat}`, // Flight + Seat
          TokenRequestedType: 'Transaction',
        },
        PaymentTransaction: {
          AmountsReq: {
            Currency: chargeDetails.currency.toUpperCase(),
            RequestedAmount: chargeDetails.amount / 100, // Adyen uses decimal amounts
          },
        },
        PaymentData: {
          PaymentType: 'Normal',
        },
      },
    },
  }
}

// Call Adyen Android SDK
const callAdyenSDK = async (adyenRequest: AdyenPaymentRequest): Promise<AdyenPaymentResponse> => {
  // In production, this would call the actual Adyen Android SDK:
  // const response = await window.AdyenPaymentSDK.initiatePayment(JSON.stringify(adyenRequest))

  console.log('📱 Adyen Payment Request:', JSON.stringify(adyenRequest, null, 2))

  // Simulate SDK processing time (user inserting card, entering PIN, etc.)
  // This is where the Adyen terminal waits for user input
  await new Promise(resolve => setTimeout(resolve, 3000))

  // For SDK mode, simulate card reading from POS machine
  let last4: string
  let cardNetwork: string
  let cardType: 'DEBIT' | 'CREDIT'

  if (cardPaymentMode.value === 'sdk') {
    // Simulate POS reading card details
    // In production, these would come from the actual card swipe/insert
    last4 = Math.floor(1000 + Math.random() * 9000).toString() // Random 4 digits
    cardNetwork = (['VISA', 'MASTERCARD', 'AMEX'] as const)[Math.floor(Math.random() * 3)] || 'VISA'
    cardType = Math.random() > 0.5 ? 'CREDIT' : 'DEBIT'

    console.log('🔍 POS Machine Read Card:', { last4, cardNetwork, cardType })
  } else {
    // Use manually entered details
    last4 = cardDetails.value.last4
    cardNetwork = cardDetails.value.network
    cardType = cardDetails.value.type as 'DEBIT' | 'CREDIT'
  }

  // Simulate decline scenarios (only for specific test cards)
  if (last4 === '0000') {
    return {
      SaleToPOIResponse: {
        MessageHeader: {
          MessageClass: 'Service',
          MessageCategory: 'Payment',
          MessageType: 'Response',
          ServiceID: adyenRequest.SaleToPOIRequest.MessageHeader.ServiceID,
          SaleID: adyenRequest.SaleToPOIRequest.MessageHeader.SaleID,
          POIID: adyenRequest.SaleToPOIRequest.MessageHeader.POIID,
        },
        PaymentResponse: {
          Response: {
            Result: 'Failure',
            ErrorCondition: 'NotAllowed',
            AdditionalResponse: 'Insufficient funds',
          },
          SaleData: adyenRequest.SaleToPOIRequest.PaymentRequest.SaleData,
        },
      },
    }
  }

  if (last4 === '0002') {
    return {
      SaleToPOIResponse: {
        MessageHeader: {
          MessageClass: 'Service',
          MessageCategory: 'Payment',
          MessageType: 'Response',
          ServiceID: adyenRequest.SaleToPOIRequest.MessageHeader.ServiceID,
          SaleID: adyenRequest.SaleToPOIRequest.MessageHeader.SaleID,
          POIID: adyenRequest.SaleToPOIRequest.MessageHeader.POIID,
        },
        PaymentResponse: {
          Response: {
            Result: 'Failure',
            ErrorCondition: 'Refusal',
            AdditionalResponse: 'Transaction declined by issuer',
          },
          SaleData: adyenRequest.SaleToPOIRequest.PaymentRequest.SaleData,
        },
      },
    }
  }

  // Success response
  const poiTransactionId = `POI-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  return {
    SaleToPOIResponse: {
      MessageHeader: {
        MessageClass: 'Service',
        MessageCategory: 'Payment',
        MessageType: 'Response',
        ServiceID: adyenRequest.SaleToPOIRequest.MessageHeader.ServiceID,
        SaleID: adyenRequest.SaleToPOIRequest.MessageHeader.SaleID,
        POIID: adyenRequest.SaleToPOIRequest.MessageHeader.POIID,
      },
      PaymentResponse: {
        Response: {
          Result: 'Success',
          AdditionalResponse: `authCode=${Math.random().toString(36).substr(2, 6).toUpperCase()}&pspReference=${poiTransactionId}`,
        },
        SaleData: adyenRequest.SaleToPOIRequest.PaymentRequest.SaleData,
        POIData: {
          POITransactionID: {
            TransactionID: poiTransactionId,
            TimeStamp: new Date().toISOString(),
          },
        },
        PaymentResult: {
          PaymentType: 'Normal',
          PaymentInstrumentData: {
            PaymentInstrumentType: 'Card',
            CardData: {
              EntryMode: cardType === 'CREDIT' ? 'MagStripe' : 'ICC',
              PaymentBrand: cardNetwork,
              MaskedPan: `****-****-****-${last4}`,
              PaymentAccountRef: `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            },
          },
          AmountsResp: {
            Currency: adyenRequest.SaleToPOIRequest.PaymentRequest.PaymentTransaction.AmountsReq.Currency,
            AuthorizedAmount: adyenRequest.SaleToPOIRequest.PaymentRequest.PaymentTransaction.AmountsReq.RequestedAmount,
            TotalFeesAmount: 0,
          },
          OnlineFlag: true,
          PaymentAcquirerData: {
            AcquirerPOIID: adyenRequest.SaleToPOIRequest.MessageHeader.POIID,
            ApprovalCode: `${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            MerchantID: 'SKYAIR-INFLIGHT',
          },
        },
      },
    },
  }
}

// Convert Adyen response to our standard format
const parseAdyenResponse = (adyenResponse: AdyenPaymentResponse, chargeDetails: any): POSTerminalResponse => {
  const paymentResponse = adyenResponse.SaleToPOIResponse.PaymentResponse

  if (paymentResponse.Response.Result === 'Success') {
    const paymentResult = paymentResponse.PaymentResult!
    const cardData = paymentResult.PaymentInstrumentData?.CardData

    // Extract auth code from AdditionalResponse
    const additionalResponse = paymentResponse.Response.AdditionalResponse || ''
    const authCodeMatch = additionalResponse.match(/authCode=([^&]+)/)
    const authCode = authCodeMatch ? authCodeMatch[1] : 'N/A'

    return {
      status: 'ACCEPTED',
      transactionId: paymentResponse.POIData?.POITransactionID.TransactionID || 'UNKNOWN',
      timestamp: paymentResponse.POIData?.POITransactionID.TimeStamp || new Date().toISOString(),
      cardDetails: {
        maskedPAN: cardData?.MaskedPan || '****-****-****-0000',
        cardScheme: cardData?.PaymentBrand || 'Unknown',
        cardType: cardDetails.value.type as 'DEBIT' | 'CREDIT',
        expiryDate: cardDetails.value.expiry,
        cardholderName: customerName.value.toUpperCase(),
      },
      authorizationCode: authCode,
      responseCode: 'APPROVED',
      responseMessage: `Payment of ${chargeDetails.currencySymbol}${(chargeDetails.amount / 100).toFixed(2)} ${chargeDetails.currency.toUpperCase()} approved`,
    }
  } else {
    return {
      status: 'DECLINED',
      transactionId: paymentResponse.SaleData.SaleTransactionID.TransactionID,
      timestamp: new Date().toISOString(),
      cardDetails: {
        maskedPAN: '****-****-****-' + cardDetails.value.last4,
        cardScheme: cardDetails.value.network,
        cardType: cardDetails.value.type as 'DEBIT' | 'CREDIT',
        expiryDate: cardDetails.value.expiry,
      },
      responseCode: paymentResponse.Response.ErrorCondition || 'DECLINED',
      responseMessage: paymentResponse.Response.AdditionalResponse || 'Transaction declined',
    }
  }
}

// POS Terminal API Call - Now uses Adyen SDK
const callPOSTerminal = async (chargeDetails: any): Promise<POSTerminalResponse> => {
  try {
    // Step 1: Build Adyen payment request
    const adyenRequest = buildAdyenPaymentRequest(chargeDetails)

    // Step 2: Call Adyen Android SDK and wait for user input on terminal
    // This is where the customer interacts with the physical POS device:
    // - Insert/swipe/tap card
    // - Enter PIN if required
    // - Confirm amount
    const adyenResponse = await callAdyenSDK(adyenRequest)

    console.log('📱 Adyen Payment Response:', JSON.stringify(adyenResponse, null, 2))

    // Step 3: Parse Adyen response to our standard format
    const standardResponse = parseAdyenResponse(adyenResponse, chargeDetails)

    return standardResponse
  } catch (error: any) {
    console.error('❌ Adyen SDK Error:', error)
    return {
      status: 'ERROR',
      transactionId: `ERROR-${Date.now()}`,
      timestamp: new Date().toISOString(),
      cardDetails: {
        maskedPAN: '****-****-****-0000',
        cardScheme: 'Unknown',
        cardType: 'CREDIT',
        expiryDate: '00/00',
      },
      responseCode: 'SDK_ERROR',
      responseMessage: error.message || 'SDK communication error',
    }
  }
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <VCard v-if="isLoadingInventory" class="mb-6">
      <VCardText class="text-center py-16">
        <VProgressCircular indeterminate color="primary" size="64" width="6" class="mb-4" />
        <h3 class="text-h5 mb-2">Loading In-Flight Sales System...</h3>
        <p class="text-body-2 text-medium-emphasis">
          Fetching inventory, currencies, and flight information
        </p>
      </VCardText>
    </VCard>

    <!-- Main Content -->
    <div v-else>
      <!-- Page Header -->
      <VCard class="mb-6">
        <VCardText>
          <div class="d-flex align-center justify-space-between flex-wrap gap-3">
            <div class="flex-grow-1">
              <h1 class="text-h5 text-sm-h4 font-weight-bold mb-1">
                In-Flight Sales
              </h1>
              <p class="text-body-2 text-sm-body-1 mb-0">
                Cabin Crew Shopping Assistant - Flight {{ flightNumber }}
              </p>
            </div>
            <div class="d-flex gap-2 flex-wrap justify-end">
              <VBtn color="success" variant="tonal" size="small"
                :prepend-icon="$vuetify.display.smAndUp ? 'tabler-cash-register' : undefined"
                :icon="$vuetify.display.xs ? 'tabler-cash-register' : undefined"
                @click="showCashRegister = !showCashRegister">
                <span v-if="$vuetify.display.smAndUp">Cash Register</span>
                <VChip v-if="$vuetify.display.smAndUp" size="small" color="success" class="ms-2">
                  ${{ totalCashRegisterUSD.toFixed(2) }}
                </VChip>
              </VBtn>
              <VChip color="primary" :size="$vuetify.display.xs ? 'small' : 'default'" class="px-2">
                <VIcon start icon="tabler-shopping-cart" :size="$vuetify.display.xs ? '18' : '20'" />
                <span class="text-caption text-sm-body-2">
                  {{ cartItemCount }} - ${{ cartTotal.toFixed(2) }}
                </span>
              </VChip>
            </div>
          </div>

          <!-- Crew Details Section -->
          <VDivider class="my-3 my-sm-4" />
          <div class="d-flex gap-3 gap-sm-6 flex-wrap">
            <div class="d-flex align-center gap-2">
              <VIcon icon="tabler-id" color="primary" :size="$vuetify.display.xs ? '20' : '24'" />
              <div>
                <div class="text-caption text-medium-emphasis">Employee ID</div>
                <div class="text-body-2 text-sm-body-1 font-weight-medium">{{ crewDetails.employeeId }}</div>
              </div>
            </div>
            <div class="d-flex align-center gap-2">
              <VIcon icon="tabler-user" color="primary" :size="$vuetify.display.xs ? '20' : '24'" />
              <div>
                <div class="text-caption text-medium-emphasis">Crew Member</div>
                <div class="text-body-2 text-sm-body-1 font-weight-medium">{{ crewDetails.name }}</div>
              </div>
            </div>
            <div class="d-flex align-center gap-2">
              <VIcon icon="tabler-briefcase" color="primary" :size="$vuetify.display.xs ? '20' : '24'" />
              <div>
                <div class="text-caption text-medium-emphasis">Designation</div>
                <div class="text-body-2 text-sm-body-1 font-weight-medium">{{ crewDetails.designation }}</div>
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Cash Register Section -->
      <VExpandTransition>
        <VCard v-if="showCashRegister" class="mb-6">
          <VCardText>
            <div class="d-flex justify-space-between align-center mb-4">
              <h2 class="text-h5">
                <VIcon icon="tabler-cash-register" class="me-2" />
                Cash Register
              </h2>
              <VBtn icon="tabler-x" variant="text" size="small" @click="showCashRegister = false" />
            </div>

            <VRow>
              <VCol v-for="cash in cashRegister" :key="cash.currencyCode" cols="12" sm="6" md="4">
                <VCard variant="tonal" color="success">
                  <VCardText>
                    <div class="d-flex justify-space-between align-center">
                      <div>
                        <div class="text-caption text-medium-emphasis mb-1">
                          {{currencies.find(c => c.code === cash.currencyCode)?.name}}
                        </div>
                        <div class="text-h6 font-weight-bold">
                          {{currencies.find(c => c.code === cash.currencyCode)?.symbol}}{{ cash.amount.toFixed(2) }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          ≈ ${{(cash.amount * (currencies.find(c => c.code === cash.currencyCode)?.exchangeRate ||
                            1)).toFixed(2)}}
                        </div>
                      </div>
                      <VChip size="large" color="success">
                        {{ cash.currencyCode }}
                      </VChip>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <VCard variant="tonal" color="primary">
              <VCardText>
                <div class="d-flex justify-space-between align-center">
                  <span class="text-h6">Total Cash on Hand (USD):</span>
                  <span class="text-h5 font-weight-bold text-primary">
                    ${{ totalCashRegisterUSD.toFixed(2) }}
                  </span>
                </div>
              </VCardText>
            </VCard>
          </VCardText>
        </VCard>
      </VExpandTransition>

      <VRow>
        <!-- Left Column - Product Search & Catalog -->
        <VCol cols="12" md="8">
          <!-- Search Section -->
          <VCard class="mb-6">
            <VCardText>
              <VRow>
                <VCol cols="12" sm="8">
                  <VTextField v-model="searchQuery" placeholder="Search by name, item number, or barcode..."
                    prepend-inner-icon="tabler-search" clearable variant="outlined" hide-details />
                </VCol>
                <VCol cols="12" sm="4">
                  <VBtn block color="primary" variant="tonal" prepend-icon="tabler-barcode" @click="scanBarcode">
                    Scan Barcode
                  </VBtn>
                </VCol>
              </VRow>

              <VRow class="mt-4">
                <VCol cols="12" sm="6">
                  <VSelect v-model="searchType" label="Search Type" :items="[
                    { value: 'all', title: 'All Fields' },
                    { value: 'barcode', title: 'Barcode Only' },
                    { value: 'itemNumber', title: 'Item Number Only' }
                  ]" variant="outlined" density="compact" hide-details prepend-inner-icon="tabler-filter" />
                </VCol>
                <VCol cols="12" sm="6">
                  <VSelect v-model="stockFilter" label="Inventory Filter" :items="[
                    { value: 'all', title: 'All Items', props: { prependIcon: 'tabler-list' } },
                    { value: 'in-stock', title: 'In Stock Only', props: { prependIcon: 'tabler-check' } },
                    { value: 'out-of-stock', title: 'Out of Stock', props: { prependIcon: 'tabler-alert-circle' } }
                  ]" variant="outlined" density="compact" hide-details prepend-inner-icon="tabler-package" />
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Products Grid -->
          <VRow>
            <VCol v-for="product in filteredProducts" :key="product.id" cols="12" sm="6" md="6" lg="4" class="d-flex">
              <VCard class="d-flex flex-column w-100" :class="{ 'border-error': product.stock === 0 }"
                :style="product.stock === 0 ? 'border-width: 2px; border-style: solid;' : ''">
                <div class="position-relative">
                  <VImg :src="product.image || ''" height="200" cover :alt="product.name" class="bg-surface-variant">
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                        <VProgressCircular indeterminate color="primary" />
                      </div>
                    </template>
                    <template #error>
                      <div class="d-flex align-center justify-center fill-height"
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <div class="text-center pa-4">
                          <VIcon :icon="getCategoryIcon(product.category)" size="64" color="white" />
                          <div class="text-caption text-white mt-2">{{ product.category }}</div>
                        </div>
                      </div>
                    </template>
                  </VImg>

                  <!-- Out of Stock Badge -->
                  <div v-if="product.stock === 0"
                    class="position-absolute w-100 h-100 d-flex align-center justify-center"
                    style=" background: rgba(244, 67, 54, 85%);inset-block-start: 0; inset-inline-start: 0;">
                    <div class="text-center">
                      <VIcon icon="tabler-alert-circle" size="48" color="white" />
                      <div class="text-h6 text-white font-weight-bold mt-2">OUT OF STOCK</div>
                    </div>
                  </div>
                </div>

                <VCardText class="d-flex flex-column flex-grow-1">
                  <div class="d-flex justify-space-between align-start mb-2">
                    <h3 class="text-h6" style="min-block-size: 56px;">
                      {{ product.name }}
                    </h3>
                    <VChip size="small" color="primary" class="flex-shrink-0 ms-2">
                      ${{ product.price }}
                    </VChip>
                  </div>

                  <p class="text-body-2 text-medium-emphasis mb-2 flex-grow-1">
                    {{ product.description }}
                  </p>

                  <div class="d-flex flex-wrap gap-2 mb-2">
                    <VChip size="small" variant="tonal">
                      {{ product.itemNumber }}
                    </VChip>
                    <VChip size="small" variant="tonal" color="secondary">
                      {{ product.category }}
                    </VChip>
                    <VChip v-if="trolleyNumber" size="small" variant="tonal" color="info">
                      <VIcon start size="small">mdi:cart-outline</VIcon>
                      {{ trolleyNumber }}
                    </VChip>
                  </div>

                  <!-- Variant Selection -->
                  <div v-if="product.hasVariants && product.variants && product.variants.length > 0" class="mt-3">
                    <div class="text-caption text-medium-emphasis mb-2">Select Size/Variant:</div>
                    <VSelect v-model="selectedVariants[product.id]" :items="product.variants" item-title="size"
                      item-value="sku" return-object density="compact" variant="outlined" hide-details>
                      <template #selection="{ item }">
                        <div class="d-flex align-center justify-space-between w-100">
                          <span class="text-body-2">{{ item.raw.size }} ({{ item.raw.uom }})</span>
                          <span class="text-caption text-primary font-weight-bold ms-2">${{ item.raw.price }}</span>
                        </div>
                      </template>
                      <template #item="{ item, props: itemProps }">
                        <VListItem v-bind="itemProps">
                          <template #title>
                            <div class="d-flex align-center justify-space-between">
                              <div>
                                <div class="text-body-2 font-weight-medium">{{ item.raw.size }}</div>
                                <div class="text-caption text-medium-emphasis">
                                  SKU: {{ item.raw.sku }} | {{ item.raw.uom }}
                                </div>
                              </div>
                              <div class="text-end">
                                <div class="text-body-2 text-primary font-weight-bold">${{ item.raw.price }}</div>
                                <VChip size="x-small"
                                  :color="item.raw.stock === 0 ? 'error' : item.raw.stock < 5 ? 'warning' : 'success'">
                                  Stock: {{ item.raw.stock }}
                                </VChip>
                              </div>
                            </div>
                          </template>
                        </VListItem>
                      </template>
                    </VSelect>
                  </div>

                  <div class="d-flex align-center justify-space-between mt-auto"
                    :class="{ 'mt-3': product.hasVariants }">
                    <VChip v-if="!product.hasVariants" size="small"
                      :color="product.stock === 0 ? 'error' : product.stock < 10 ? 'warning' : 'success'"
                      variant="tonal">
                      <VIcon start :icon="product.stock === 0 ? 'tabler-alert-circle' : 'tabler-package'" />
                      Stock: {{ product.stock }}
                    </VChip>
                    <VChip v-else-if="selectedVariants[product.id]" size="small"
                      :color="selectedVariants[product.id].stock === 0 ? 'error' : selectedVariants[product.id].stock < 5 ? 'warning' : 'success'"
                      variant="tonal">
                      <VIcon start
                        :icon="selectedVariants[product.id].stock === 0 ? 'tabler-alert-circle' : 'tabler-package'" />
                      Stock: {{ selectedVariants[product.id].stock }}
                    </VChip>
                    <VSpacer v-else />
                    <VBtn
                      :color="product.hasVariants && selectedVariants[product.id] ? (selectedVariants[product.id].stock === 0 ? 'error' : 'primary') : (product.stock === 0 ? 'error' : 'primary')"
                      size="small"
                      :disabled="product.hasVariants ? (!selectedVariants[product.id] || selectedVariants[product.id].stock === 0) : product.stock === 0"
                      @click="addToCart(product, selectedVariants[product.id])">
                      <VIcon start
                        :icon="(product.hasVariants && selectedVariants[product.id] && selectedVariants[product.id].stock === 0) || (!product.hasVariants && product.stock === 0) ? 'tabler-ban' : 'tabler-plus'" />
                      {{ (product.hasVariants && selectedVariants[product.id] && selectedVariants[product.id].stock ===
                        0) ||
                        (!product.hasVariants && product.stock === 0) ? 'Out of Stock' : 'Add to Cart' }}
                    </VBtn>
                  </div>
                </VCardText>
              </VCard>
            </VCol>

            <VCol v-if="filteredProducts.length === 0 && !isLoadingInventory" cols="12">
              <VCard>
                <VCardText class="text-center py-10">
                  <VIcon icon="tabler-search-off" size="64" color="secondary" class="mb-4" />
                  <h3 class="text-h5 mb-2">
                    No products found
                  </h3>
                  <p class="text-body-1">
                    Try adjusting your search criteria
                  </p>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Load More Trigger -->
            <VCol v-if="hasMoreProducts" cols="12">
              <div ref="loadMoreTrigger">
                <VCard variant="tonal" class="text-center py-4">
                  <VCardText>
                    <VProgressCircular v-if="isLoadingMore" indeterminate color="primary" size="32" width="3"
                      class="mb-2" />
                    <div v-else>
                      <div class="text-body-2 text-medium-emphasis mb-3">
                        <VIcon icon="tabler-arrow-down" class="me-1" />
                        {{ allFilteredProducts.length - displayedProductsCount }} more products available
                      </div>
                      <VBtn color="primary" variant="outlined" @click="loadMoreProducts">
                        Load More Products
                      </VBtn>
                    </div>
                  </VCardText>
                </VCard>
              </div>
            </VCol>

            <!-- All Products Loaded -->
            <VCol v-if="!hasMoreProducts && filteredProducts.length > 0" cols="12">
              <VCard variant="tonal" color="success" class="text-center py-3">
                <VCardText>
                  <VIcon icon="tabler-check" class="me-2" />
                  All {{ allFilteredProducts.length }} products loaded
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCol>

        <!-- Right Column - Shopping Cart -->
        <VCol cols="12" md="4">
          <VCard>
            <VCardText>
              <h2 class="text-h5 mb-4">
                <VIcon icon="tabler-shopping-cart" class="me-2" />
                Shopping Cart
              </h2>

              <VDivider class="mb-4" />

              <!-- Cart Items -->
              <div v-if="cart.length > 0" class="mb-4">
                <VCard v-for="item in cart" :key="item.selectedVariant ? item.selectedVariant.sku : item.id"
                  variant="tonal" class="mb-3">
                  <VCardText>
                    <div class="d-flex justify-space-between align-start mb-2">
                      <div>
                        <h4 class="text-subtitle-1">
                          {{ item.name }}
                        </h4>
                        <VChip v-if="item.selectedVariant" size="x-small" color="primary" variant="tonal" class="mt-1">
                          {{ item.selectedVariant.size }} ({{ item.selectedVariant.uom }})
                        </VChip>
                      </div>
                      <VBtn icon="tabler-trash" size="x-small" variant="text" color="error"
                        @click="removeFromCart(item.id, item.selectedVariant?.sku)" />
                    </div>

                    <div class="d-flex gap-2 mb-2">
                      <p class="text-caption text-medium-emphasis">
                        {{ item.itemNumber }}
                      </p>
                      <p v-if="item.selectedVariant" class="text-caption text-medium-emphasis">
                        | SKU: {{ item.selectedVariant.sku }}
                      </p>
                    </div>

                    <div class="d-flex align-center justify-space-between">
                      <div class="d-flex align-center gap-2">
                        <VBtn icon="tabler-minus" size="x-small" variant="tonal"
                          @click="updateQuantity(item.id, item.quantity - 1, item.selectedVariant?.sku)" />
                        <span class="text-body-1 font-weight-medium px-2">
                          {{ item.quantity }}
                        </span>
                        <VBtn icon="tabler-plus" size="x-small" variant="tonal"
                          @click="updateQuantity(item.id, item.quantity + 1, item.selectedVariant?.sku)" />
                      </div>

                      <span class="text-h6 font-weight-bold">
                        ${{ (item.price * item.quantity).toFixed(2) }}
                      </span>
                    </div>
                  </VCardText>
                </VCard>
              </div>

              <!-- Empty Cart State -->
              <div v-else class="text-center py-8">
                <VIcon icon="tabler-shopping-cart-off" size="48" color="secondary" class="mb-3" />
                <p class="text-body-2 text-medium-emphasis">
                  Cart is empty
                </p>
              </div>

              <!-- Cart Summary -->
              <VDivider class="mb-4" />

              <div class="d-flex justify-space-between align-center mb-4">
                <span class="text-h6">Total:</span>
                <span class="text-h5 font-weight-bold text-primary">
                  ${{ cartTotal.toFixed(2) }}
                </span>
              </div>

              <VBtn block color="success" size="large" :disabled="cart.length === 0" @click="showCheckout = true">
                <VIcon start icon="tabler-credit-card" />
                Proceed to Checkout
              </VBtn>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Checkout Dialog -->
      <VDialog v-model="showCheckout" max-width="800" persistent scrollable>
        <VCard>
          <VCardText class="pa-6">
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h5">
                Checkout
              </h2>
              <VBtn icon="tabler-x" variant="text" @click="showCheckout = false" />
            </div>

            <!-- Equipment Details (Only for devices) -->
            <div v-if="!isBrowser">
              <h3 class="text-h6 mb-3">
                Equipment Details
              </h3>

              <VRow class="mb-4">
                <VCol cols="12" sm="4">
                  <VTextField v-model="equipmentDetails.deviceId" label="Device ID"
                    prepend-inner-icon="tabler-device-mobile" variant="outlined" required />
                </VCol>
                <VCol cols="12" sm="4">
                  <VSelect v-model="equipmentDetails.deviceType"
                    :items="['Tablet', 'Mobile', 'POS Terminal', 'Handheld Scanner']" label="Device Type"
                    prepend-inner-icon="tabler-devices" variant="outlined" required />
                </VCol>
                <VCol cols="12" sm="4">
                  <VTextField v-model="equipmentDetails.serialNumber" label="Serial Number"
                    prepend-inner-icon="tabler-barcode" variant="outlined" required />
                </VCol>
              </VRow>
            </div>

            <!-- Passenger Details -->
            <h3 class="text-h6 mb-3">
              Passenger Details
            </h3>

            <VRow class="mb-4">
              <VCol cols="12" sm="6">
                <VTextField v-model="seatNumber" label="Seat Number" prepend-inner-icon="tabler-armchair"
                  variant="outlined" required />
              </VCol>
              <VCol cols="12" sm="6">
                <VTextField v-model="customerName" label="Passenger Name" prepend-inner-icon="tabler-user"
                  variant="outlined" required />
              </VCol>
            </VRow>

            <!-- Order Summary -->
            <h3 class="text-h6 mb-3">
              Order Summary
            </h3>

            <VCard variant="tonal" class="mb-4">
              <VCardText>
                <div v-for="item in cart" :key="item.selectedVariant ? item.selectedVariant.sku : item.id"
                  class="d-flex justify-space-between mb-2">
                  <div class="d-flex flex-column">
                    <span>{{ item.name }} x{{ item.quantity }}</span>
                    <span v-if="item.selectedVariant" class="text-caption text-medium-emphasis">
                      {{ item.selectedVariant.size }} ({{ item.selectedVariant.sku }})
                    </span>
                  </div>
                  <span class="font-weight-medium">${{ (item.price * item.quantity).toFixed(2) }}</span>
                </div>

                <VDivider class="my-3" />

                <div class="d-flex justify-space-between mb-1">
                  <span class="text-body-2">Total Amount:</span>
                  <span class="text-h6 text-primary font-weight-bold">
                    {{ formatCurrency(cartTotal) }}
                  </span>
                </div>

                <div v-if="shouldShowRemainingBalance" class="d-flex justify-space-between">
                  <span class="text-body-2">Remaining Balance:</span>
                  <span class="text-h6 text-warning font-weight-bold">
                    {{ formatCurrency(remainingBalance) }}
                  </span>
                </div>
              </VCardText>
            </VCard>

            <!-- Payment History - Always Visible at Top -->
            <VCard v-if="paymentHistory.length > 0" variant="tonal" color="success" class="mb-4">
              <VCardText class="pa-4">
                <div class="text-h6 mb-3 font-weight-bold d-flex align-center gap-2">
                  <VIcon icon="tabler-receipt-2" color="success" />
                  Payment History - Transactions Applied
                </div>
                <div class="d-flex flex-column gap-2">
                  <div v-for="(payment, index) in paymentHistory" :key="index"
                    class="d-flex justify-space-between align-center pa-2 bg-white rounded">
                    <div class="d-flex align-center gap-3">
                      <VIcon
                        :icon="payment.method === 'Cash' ? 'tabler-cash' : payment.method.toLowerCase().includes('debit') ? 'tabler-card-off' : 'tabler-credit-card'"
                        :color="payment.method === 'Cash' ? 'success' : payment.method.toLowerCase().includes('debit') ? 'warning' : 'info'"
                        size="24" />
                      <div>
                        <div class="text-body-2 font-weight-bold">{{ payment.method }}</div>
                        <div class="text-caption text-medium-emphasis">{{ new
                          Date(payment.timestamp).toLocaleTimeString() }}
                        </div>
                      </div>
                    </div>
                    <div class="text-h6 font-weight-bold text-success">{{ formatCurrency(payment.amount) }}</div>
                  </div>
                </div>
                <VDivider class="my-3" />
                <div class="d-flex justify-space-between">
                  <span class="text-h6 font-weight-bold">Total Paid:</span>
                  <span class="text-h6 font-weight-bold text-success">{{ formatCurrency(totalPaymentsMade) }}</span>
                </div>
              </VCardText>
            </VCard>

            <!-- Payment Method -->
            <h3 class="text-h6 mb-3">
              Payment Method
            </h3>

            <VRadioGroup v-model="paymentMethod">
              <VRow>
                <VCol v-for="method in paymentMethods" :key="method.value" cols="6" sm="3">
                  <VCard :variant="paymentMethod === method.value ? 'elevated' : 'outlined'"
                    :color="paymentMethod === method.value ? 'primary' : ''" class="cursor-pointer"
                    @click="paymentMethod = method.value">
                    <VCardText class="pa-3 text-center">
                      <VRadio :value="method.value" class="justify-center">
                        <template #label>
                          <div class="d-flex flex-column align-center">
                            <VIcon :icon="method.icon" size="32" class="mb-2"
                              :color="paymentMethod === method.value ? 'primary' : ''" />
                            <span class="text-caption">{{ method.title }}</span>
                          </div>
                        </template>
                      </VRadio>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </VRadioGroup>

            <!-- Card Payment Mode Selection -->
            <div v-if="paymentMethod === 'credit-card' || paymentMethod === 'debit-card'">
              <VDivider class="my-4" />

              <!-- Card Payment Amount (for partial payments) -->
              <h3 class="text-h6 mb-3">
                Payment Amount
              </h3>

              <VCard variant="tonal" color="primary" class="mb-4">
                <VCardText class="pa-3">
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-caption">Remaining Balance:</span>
                    <span class="text-h6 font-weight-bold">{{ formatCurrency(remainingBalance) }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-2">
                    Enter the amount to pay with this card (up to {{ formatCurrency(remainingBalance) }})
                  </div>
                </VCardText>
              </VCard>

              <VRow class="mb-4">
                <VCol cols="12" sm="8">
                  <VTextField v-model.number="cashAmountEntered" label="Card Payment Amount (USD)" type="number"
                    step="0.01" min="0" :max="remainingBalance" prepend-inner-icon="tabler-cash" variant="outlined"
                    placeholder="0.00">
                    <template #append>
                      <span class="text-subtitle-2 font-weight-bold">USD</span>
                    </template>
                  </VTextField>
                </VCol>
                <VCol cols="12" sm="4">
                  <VBtn block variant="tonal" @click="cashAmountEntered = remainingBalance">
                    Full Amount
                  </VBtn>
                </VCol>
              </VRow>

              <h3 class="text-h6 mb-3">
                <VIcon icon="tabler-settings" class="me-2" />
                Card Payment Mode
              </h3>

              <VRadioGroup v-model="cardPaymentMode" inline class="mb-4">
                <VRadio value="sdk" color="primary">
                  <template #label>
                    <div class="d-flex flex-column">
                      <span class="font-weight-bold">Get Payment (SDK)</span>
                      <span class="text-caption text-medium-emphasis">Card details from POS machine</span>
                    </div>
                  </template>
                </VRadio>
                <VRadio value="manual" color="secondary">
                  <template #label>
                    <div class="d-flex flex-column">
                      <span class="font-weight-bold">Capture Manually</span>
                      <span class="text-caption text-medium-emphasis">Enter card details manually</span>
                    </div>
                  </template>
                </VRadio>
              </VRadioGroup>
            </div>

            <!-- Card Payment Details -->
            <div
              v-if="(paymentMethod === 'credit-card' || paymentMethod === 'debit-card') && cardPaymentMode === 'manual'">
              <VDivider class="my-4" />

              <h3 class="text-h6 mb-3">
                Card Details
              </h3>

              <VRow>
                <VCol cols="12" sm="6">
                  <VSelect v-model="cardDetails.type"
                    :items="[{ title: 'Credit Card', value: 'CREDIT' }, { title: 'Debit Card', value: 'DEBIT' }]"
                    label="Card Type" prepend-inner-icon="tabler-credit-card" variant="outlined" required />
                </VCol>
                <VCol cols="12" sm="6">
                  <VSelect v-model="cardDetails.network" :items="cardNetworks" label="Card Network"
                    prepend-inner-icon="tabler-building-bank" variant="outlined" required />
                </VCol>
              </VRow>

              <VRow>
                <VCol cols="12" sm="6">
                  <VTextField v-model="cardDetails.last4" label="Last 4 Digits" prepend-inner-icon="tabler-hash"
                    variant="outlined" maxlength="4" placeholder="9012" required />
                </VCol>
                <VCol cols="12" sm="6">
                  <VTextField v-model="cardDetails.expiry" label="Expiry (MM/YY)" prepend-inner-icon="tabler-calendar"
                    variant="outlined" placeholder="09/27" maxlength="5" required />
                </VCol>
              </VRow>

              <h3 class="text-h6 mb-3 mt-4">
                Authorization
              </h3>

              <VRow>
                <VCol cols="12" sm="6">
                  <VSelect v-model="authorizationDetails.method" :items="authMethods" label="Authorization Method"
                    prepend-inner-icon="tabler-lock" variant="outlined" required />
                </VCol>
                <VCol cols="12" sm="6">
                  <VTextField v-model="authorizationDetails.offlineCode" label="Offline Code"
                    prepend-inner-icon="tabler-key" variant="outlined" placeholder="OFL789" required />
                </VCol>
              </VRow>

              <!-- Card Summary -->
              <VCard variant="tonal" color="info" class="mt-3">
                <VCardText class="pa-3">
                  <div class="text-caption mb-2 font-weight-bold">
                    Card Information Summary
                  </div>
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span>Card:</span>
                    <span class="font-weight-medium">
                      {{ cardDetails.type || '-' }} | {{ cardDetails.network || '-' }} | •••• {{ cardDetails.last4 ||
                        '----'
                      }}
                    </span>
                  </div>
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span>Expiry:</span>
                    <span class="font-weight-medium">{{ cardDetails.expiry || '--/--' }}</span>
                  </div>
                  <div class="d-flex justify-space-between text-caption">
                    <span>Auth:</span>
                    <span class="font-weight-medium">{{ authorizationDetails.method || '-' }}</span>
                  </div>
                </VCardText>
              </VCard>
            </div>

            <!-- Cash Payment Details -->
            <div v-if="paymentMethod === 'cash'">
              <VDivider class="my-4" />

              <h3 class="text-h6 mb-3">
                Cash Payment (USD Only)
              </h3>

              <!-- Cart Total and Remaining Balance -->
              <VCard variant="tonal" color="primary" class="mb-4">
                <VCardText class="pa-3">
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-caption">Total Order Amount:</span>
                    <span class="text-subtitle-1 font-weight-bold">{{ formatCurrency(cartTotal) }}</span>
                  </div>
                  <VDivider class="my-2" />
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-caption">Already Paid:</span>
                    <span class="text-subtitle-1">{{ formatCurrency(totalPaymentsMade) }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-h6 font-weight-bold">Remaining Balance:</span>
                    <span class="text-h5 font-weight-bold text-warning">{{ formatCurrency(remainingBalance) }}</span>
                  </div>
                </VCardText>
              </VCard>


              <!-- Cash Input -->
              <VRow class="mb-4">
                <VCol cols="12" sm="8">
                  <VTextField v-model.number="cashAmountEntered" label="Enter Cash Amount (USD)" type="number"
                    step="0.01" min="0" prepend-inner-icon="tabler-cash" variant="outlined" placeholder="0.00"
                    @keyup.enter="processCheckout">
                    <template #append>
                      <span class="text-subtitle-2 font-weight-bold">USD</span>
                    </template>
                  </VTextField>
                </VCol>
                <VCol cols="12" sm="4">
                  <VBtn block color="primary" variant="tonal" @click="processCheckout">
                    Apply Payment
                  </VBtn>
                </VCol>
              </VRow>

              <!-- Quick Amount Buttons -->
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-2">Quick Input:</div>
                <div class="d-flex flex-wrap gap-2">
                  <VBtn v-for="amount in [10, 20, 50, 100]" :key="amount" variant="outlined" size="small"
                    @click="cashAmountEntered = amount">
                    ${{ amount }}
                  </VBtn>
                </div>
              </div>
            </div>

            <!-- Universal Payment Amount for Other Methods -->
            <div v-if="paymentMethod !== 'cash' && paymentMethod !== 'credit-card' && paymentMethod !== 'debit-card'">
              <VDivider class="my-4" />

              <h3 class="text-h6 mb-3">
                {{ paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1) }} Payment
              </h3>

              <!-- Payment Amount -->
              <VCard variant="tonal" color="primary" class="mb-4">
                <VCardText class="pa-3">
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-caption">Remaining Balance:</span>
                    <span class="text-h6 font-weight-bold">{{ formatCurrency(remainingBalance) }}</span>
                  </div>
                  <div class="text-caption text-medium-emphasis mt-2">
                    Enter the amount to pay with {{ paymentMethod }} (up to {{ formatCurrency(remainingBalance) }})
                  </div>
                </VCardText>
              </VCard>

              <VRow class="mb-4">
                <VCol cols="12" sm="8">
                  <VTextField v-model.number="cashAmountEntered"
                    :label="`${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} Payment Amount (USD)`"
                    type="number" step="0.01" min="0" :max="remainingBalance" prepend-inner-icon="tabler-cash"
                    variant="outlined" placeholder="0.00" @keyup.enter="processCheckout">
                    <template #append>
                      <span class="text-subtitle-2 font-weight-bold">USD</span>
                    </template>
                  </VTextField>
                </VCol>
                <VCol cols="12" sm="4">
                  <VBtn block variant="tonal" @click="cashAmountEntered = remainingBalance">
                    Full Amount
                  </VBtn>
                </VCol>
              </VRow>

              <!-- Quick Amount Buttons -->
              <div class="mb-4">
                <div class="text-caption text-medium-emphasis mb-2">Quick Input:</div>
                <div class="d-flex flex-wrap gap-2">
                  <VBtn v-for="amount in [10, 20, 50, 100]" :key="amount" variant="outlined" size="small"
                    @click="cashAmountEntered = amount">
                    ${{ amount }}
                  </VBtn>
                </div>
              </div>
            </div>

            <!-- Partial Payment Status (All Methods) -->
            <VCard v-if="remainingBalance > 0" variant="tonal" color="warning" class="mb-4">
              <VCardText class="pa-3">
                <div class="d-flex gap-3 align-start">
                  <VIcon icon="tabler-alert-circle" class="mt-1" />
                  <div>
                    <div class="text-subtitle-2 font-weight-bold mb-1">Partial Payment Mode</div>
                    <div class="text-caption mb-2">
                      {{ formatCurrency(remainingBalance) }} remaining
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      💡 You can pay the rest using a different payment method. Select another method below and apply
                      payment.
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <!-- Action Buttons -->
            <div class="d-flex gap-3 mt-6">
              <VBtn variant="outlined" :disabled="isProcessingPayment" @click="showCheckout = false">
                Cancel
              </VBtn>
              <VBtn v-if="remainingBalance === 0" color="success" size="large" class="flex-grow-1"
                :disabled="isProcessingPayment" :loading="isProcessingPayment" @click="completeAndCloseCheckout">
                <VIcon start icon="tabler-check" />
                Complete Transaction
              </VBtn>
              <VBtn v-else color="info" size="large" class="flex-grow-1"
                :disabled="!isCurrentPaymentMethodValid || isProcessingPayment" :loading="isProcessingPayment"
                @click="processCheckout">
                <VIcon start icon="tabler-credit-card" />
                {{ isProcessingPayment ? 'Processing...' : 'Apply Payment' }}
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Snackbar Notifications -->
      <VSnackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top">
        {{ snackbarText }}
      </VSnackbar>

      <!-- POS Terminal Screen -->
      <VDialog v-model="showPOSScreen" max-width="500" persistent>
        <VCard class="pos-terminal" color="#1a1a1a">
          <VCardText class="pa-0">
            <!-- POS Terminal Header -->
            <div class="pos-header text-center pa-4"
              style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); border-block-end: 2px solid #3498db;">
              <div class="text-h6 font-weight-bold" style="color: #3498db; letter-spacing: 1px;">
                <VIcon icon="tabler-credit-card" size="20" class="me-2" />
                POS TERMINAL
              </div>
              <div class="text-caption" style="color: #95a5a6;">
                {{ equipmentDetails.deviceId || 'DEVICE-001' }} | {{ equipmentDetails.deviceType || 'PAX A920' }}
              </div>
            </div>

            <!-- POS Terminal Display -->
            <div class="pos-display pa-6" style="background: #0a0a0a; min-block-size: 350px;">
              <!-- Ready State -->
              <div v-if="posScreenState === 'ready'" class="text-center">
                <VIcon icon="tabler-credit-card" size="80" color="success" class="mb-4 pulse-animation" />
                <div class="text-h5 font-weight-bold mb-3" style="color: #2ecc71;">
                  {{ posScreenMessage }}
                </div>
                <div class="text-body-2 mb-4" style="color: #95a5a6;">
                  Amount: {{ formatCurrency(cartTotal, selectedCurrency) }}
                </div>
                <div class="d-flex justify-center gap-3">
                  <VChip color="primary" variant="tonal">
                    <VIcon icon="tabler-credit-card" start />
                    Insert
                  </VChip>
                  <VChip color="info" variant="tonal">
                    <VIcon icon="tabler-arrows-horizontal" start />
                    Swipe
                  </VChip>
                  <VChip color="success" variant="tonal">
                    <VIcon icon="tabler-wifi" start />
                    Tap
                  </VChip>
                </div>
              </div>

              <!-- Swiping State -->
              <div v-if="posScreenState === 'swiping'" class="text-center">
                <div class="card-swipe-container mb-4">
                  <div class="card-reader">
                    <div class="reader-slot">
                      <div class="slot-line"></div>
                      <div class="slot-line"></div>
                      <div class="slot-line"></div>
                    </div>
                    <div class="card-animation">
                      <div class="credit-card">
                        <div class="card-chip"></div>
                        <div class="card-stripe"></div>
                        <div class="card-number">**** **** **** {{ cardDetails.last4 }}</div>
                        <div class="card-network">{{ cardDetails.network }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-h6 font-weight-bold mb-3" style="color: #f39c12;">
                  {{ posScreenMessage }}
                </div>
                <div class="text-body-2" style="color: #95a5a6;">
                  Reading card data...
                </div>
                <div class="mt-4">
                  <VProgressLinear color="warning" indeterminate height="4" class="mx-auto"
                    style="max-inline-size: 250px;" />
                </div>
              </div>

              <!-- Processing State -->
              <div v-if="posScreenState === 'processing'" class="text-center">
                <VProgressCircular :size="100" :width="8" color="primary" indeterminate class="mb-4" />
                <div class="text-h5 font-weight-bold mb-3" style="color: #3498db;">
                  {{ posScreenMessage }}
                </div>
                <div class="text-body-2 mb-2" style="color: #95a5a6;">
                  Connecting to payment network...
                </div>
                <div class="text-caption" style="color: #7f8c8d;">
                  Please do not remove card
                </div>
                <div class="mt-4">
                  <VIcon icon="tabler-lock" size="20" color="warning" class="me-1" />
                  <span class="text-caption" style="color: #f39c12;">Secure Connection</span>
                </div>
              </div>

              <!-- Approved State -->
              <div v-if="posScreenState === 'approved'" class="text-center">
                <div class="success-checkmark mb-4">
                  <VIcon icon="tabler-circle-check" size="100" color="success" />
                </div>
                <div class="text-h4 font-weight-bold mb-3" style="color: #2ecc71;">
                  APPROVED
                </div>
                <VDivider class="my-3" style="border-color: #2c3e50;" />
                <div class="text-left" style="color: #ecf0f1;">
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2" style="color: #95a5a6;">Amount:</span>
                    <span class="text-body-1 font-weight-bold">{{ formatCurrency(cartTotal, selectedCurrency) }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2" style="color: #95a5a6;">Card:</span>
                    <span class="text-body-2">{{ posTransactionData?.cardDetails?.maskedPAN }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2" style="color: #95a5a6;">Type:</span>
                    <span class="text-body-2">{{ posTransactionData?.cardDetails?.cardType }} - {{
                      posTransactionData?.cardDetails?.cardScheme }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2" style="color: #95a5a6;">Auth Code:</span>
                    <span class="text-body-2 font-weight-bold" style="color: #3498db;">{{
                      posTransactionData?.authorizationCode }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-body-2" style="color: #95a5a6;">Transaction ID:</span>
                    <span class="text-caption" style="color: #7f8c8d;">{{
                      posTransactionData?.transactionId?.substring(0, 20)
                    }}...</span>
                  </div>
                </div>
                <div class="mt-4 text-caption" style="color: #27ae60;">
                  ✓ Customer copy printed
                </div>
              </div>

              <!-- Declined State -->
              <div v-if="posScreenState === 'declined'" class="text-center">
                <VIcon icon="tabler-circle-x" size="100" color="error" class="mb-4" />
                <div class="text-h4 font-weight-bold mb-3" style="color: #e74c3c;">
                  DECLINED
                </div>
                <VDivider class="my-3" style="border-color: #2c3e50;" />
                <div class="text-body-1 mb-3" style="color: #ecf0f1;">
                  {{ posScreenMessage }}
                </div>
                <div class="text-body-2" style="color: #95a5a6;">
                  Response Code: {{ posTransactionData?.responseCode || 'DECLINED' }}
                </div>
                <div class="mt-4">
                  <VChip color="error" size="small">
                    Please try another payment method
                  </VChip>
                </div>
              </div>
            </div>

            <!-- POS Terminal Footer -->
            <div class="pos-footer text-center pa-3"
              style="background: #2c3e50; border-block-start: 1px solid #34495e;">
              <div class="text-caption" style="color: #7f8c8d;">
                Powered by SkyAir Payment Systems | Flight {{ flightNumber }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VDialog>
    </div>
  </div>
</template>

<style scoped>
.pos-terminal {
  font-family: "Courier New", monospace;
}

.pulse-animation {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

.success-checkmark {
  animation: checkmark 0.5s ease-in-out;
}

@keyframes checkmark {
  0% {
    opacity: 0;
    transform: scale(0);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Card Swipe Animation */
.card-swipe-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  block-size: 200px;
}

.card-reader {
  position: relative;
  overflow: hidden;
  border: 3px solid #3498db;
  border-radius: 12px;
  background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
  block-size: 150px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 40%);
  inline-size: 300px;
}

.reader-slot {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  background: #1a1a1a;
  block-size: 50px;
  border-block-end: 2px solid #3498db;
  border-block-start: 2px solid #3498db;
  inset-block-start: 50%;
  inset-inline: 0;
  padding-block: 8px;
  padding-inline: 0;
  transform: translateY(-50%);
}

.slot-line {
  background: linear-gradient(90deg, transparent 0%, #3498db 50%, transparent 100%);
  block-size: 2px;
  margin-block: 0;
  margin-inline: 20px;
  opacity: 0.5;
}

.card-animation {
  position: absolute;
  animation: swipe-card 2s ease-in-out infinite;
  inset-block-start: 50%;
  inset-inline-start: -100%;
  transform: translateY(-50%);
}

@keyframes swipe-card {
  0% {
    inset-inline-start: -100%;
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  50% {
    inset-inline-start: 50%;
    transform: translate(-50%, -50%);
  }

  90% {
    opacity: 1;
  }

  100% {
    inset-inline-start: 100%;
    opacity: 0;
  }
}

.credit-card {
  position: relative;
  padding: 15px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  block-size: 120px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 60%);
  color: white;
  inline-size: 200px;
}

.card-chip {
  position: absolute;
  border-radius: 6px;
  background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
  block-size: 30px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 30%);
  inline-size: 40px;
  inset-block-start: 20px;
  inset-inline-start: 20px;
}

.card-chip::before {
  position: absolute;
  border: 1px solid rgba(0, 0, 0, 20%);
  border-radius: 3px;
  content: "";
  inset: 5px;
}

.card-stripe {
  position: absolute;
  background: #1a1a1a;
  block-size: 35px;
  inset-block-start: 50px;
  inset-inline: 0;
}

.card-number {
  position: absolute;
  font-family: "Courier New", monospace;
  font-size: 14px;
  font-weight: bold;
  inset-block-end: 35px;
  inset-inline-start: 20px;
  letter-spacing: 2px;
}

.card-network {
  position: absolute;
  font-size: 12px;
  font-weight: bold;
  inset-block-end: 12px;
  inset-inline-end: 20px;
  opacity: 0.9;
  text-transform: uppercase;
}
</style>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
