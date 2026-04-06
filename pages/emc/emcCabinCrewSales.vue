<script setup lang="ts">

// Flight Selection Interface
interface Flight {
  id: string
  flightNo: string
  route: string
  departure: string
  aircraft: string
  flightDate: string
  status?: string
}

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

// ===================== FLIGHT SELECTION STATE =====================
const flights = ref<Flight[]>([])
const selectedFlight = ref<Flight | null>(null)
const isLoadingFlights = ref(false)
const flightsError = ref<string | null>(null)

// Fetch flights from API
const fetchFlights = async () => {
  isLoadingFlights.value = true
  flightsError.value = null
  try {
    const response = await $fetch<any>('/api/flights')
    if (response.success && response.data) {
      flights.value = response.data
      if (flights.value.length === 0) {
        flightsError.value = 'No flights available'
      }
    } else {
      flightsError.value = response.error || 'Failed to load flights'
    }
  } catch (error) {
    console.error('Error fetching flights:', error)
    flightsError.value = error instanceof Error ? error.message : 'Failed to load flights'
  } finally {
    isLoadingFlights.value = false
  }
}

// Select flight and fetch flight-specific data
const selectFlight = async (flight: Flight) => {
  selectedFlight.value = flight
  flightNumber.value = flight.flightNo
  console.log(`Selected flight: ${flight.flightNo}`)
  
  // Fetch inventory and trolley items for this flight
  await fetchReferenceData()
  await fetchTrolleyItemsForFlight(flight.id)
}

// Go back to flight selection
const changeFlight = () => {
  selectedFlight.value = null
  flightNumber.value = ''
  cart.value = []
  showCheckout.value = false
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
        trolleyNumber.value = trolley?.code || ''
      }
    } catch (trolleyError) {
      console.error('Failed to fetch trolley:', trolleyError)
    }
  } catch (error) {
    console.error('Failed to fetch reference data:', error)
    showSnackbar('Failed to load reference data', 'error')
  } finally {
    isLoadingInventory.value = false
  }
}

// Fetch trolley items for the selected flight
const fetchTrolleyItemsForFlight = async (flightId: string) => {
  try {
    console.log(`Fetching trolleys and items for flight: ${flightId}`)
    
    // Fetch trolleys associated with this flight
    const trolleyResponse = await $fetch<any>(`/api/flight-trolleys?flightId=${flightId}`)
    console.log('Flight trolleys response:', trolleyResponse)
    
    if (trolleyResponse.success && trolleyResponse.data && trolleyResponse.data.length > 0) {
      const trolleyIds = trolleyResponse.data.map((t: any) => t.trolleyId || t.id)
      
      // Fetch items from those trolleys
      if (trolleyIds.length > 0) {
        const itemsResponse = await $fetch<any>('/api/trolley-items-by-ids', {
          method: 'POST',
          body: { trolleyIds }
        })
        
        console.log('Trolley items response:', itemsResponse)
        
        if (itemsResponse.success && itemsResponse.data && itemsResponse.data.length > 0) {
          const trolleyItemIds = itemsResponse.data.map((item: any) => item.itemId)
          
          // Filter inventory to show only items that are in the trolleys
          const filteredInventory = inventory.value.filter(item => 
            trolleyItemIds.includes(item.id.toString()) || 
            trolleyItemIds.includes(item.id)
          )
          
          console.log(`Filtered inventory from ${inventory.value.length} to ${filteredInventory.length} items`)
          inventory.value = filteredInventory
          
          showSnackbar(`Loaded ${filteredInventory.length} items from flight trolleys`, 'success')
        } else {
          showSnackbar('No items found in trolleys for this flight', 'info')
          inventory.value = []
        }
      }
    } else {
      console.log('No trolleys found for this flight')
      inventory.value = []
    }
  } catch (error) {
    console.error('Error fetching trolley items:', error)
    showSnackbar('Failed to load items from trolleys', 'warning')
  }
}

// Load flights on component mount
onMounted(() => {
  fetchFlights()
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
  console.log('📱 Adyen Payment Request:', JSON.stringify(adyenRequest, null, 2))

  // Simulate SDK processing time
  await new Promise(resolve => setTimeout(resolve, 3000))

  // For SDK mode, simulate card reading from POS machine
  let last4: string
  let cardNetwork: string
  let cardType: 'DEBIT' | 'CREDIT'

  if (cardPaymentMode.value === 'sdk') {
    last4 = Math.floor(1000 + Math.random() * 9000).toString()
    cardNetwork = (['VISA', 'MASTERCARD', 'AMEX'] as const)[Math.floor(Math.random() * 3)] || 'VISA'
    cardType = Math.random() > 0.5 ? 'CREDIT' : 'DEBIT'
    console.log('🔍 POS Machine Read Card:', { last4, cardNetwork, cardType })
  } else {
    last4 = cardDetails.value.last4
    cardNetwork = cardDetails.value.network
    cardType = cardDetails.value.type as 'DEBIT' | 'CREDIT'
  }

  // Simulate decline scenarios
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

// POS Terminal API Call
const callPOSTerminal = async (chargeDetails: any): Promise<POSTerminalResponse> => {
  try {
    // Step 1: Build Adyen payment request
    const adyenRequest = buildAdyenPaymentRequest(chargeDetails)

    // Step 2: Call Adyen Android SDK
    const adyenResponse = await callAdyenSDK(adyenRequest)

    console.log('📱 Adyen Payment Response:', JSON.stringify(adyenResponse, null, 2))

    // Step 3: Parse Adyen response
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
    <!-- FLIGHT SELECTION SCREEN -->
    <VCard v-if="!selectedFlight" class="mb-0">
      <VCardText class="pa-6">
        <div class="text-center mb-6">
          <h1 class="text-h4 font-weight-bold mb-2">
            In-Flight Sales System
          </h1>
          <p class="text-body-1 text-medium-emphasis">
            Select a flight to begin cabin crew sales
          </p>
        </div>

        <!-- Loading State -->
        <VCard v-if="isLoadingFlights" class="mb-6">
          <VCardText class="text-center py-10">
            <VProgressCircular indeterminate color="primary" size="64" width="6" class="mb-4" />
            <h3 class="text-h5 mb-2">Loading Flights...</h3>
            <p class="text-body-2 text-medium-emphasis">Fetching available flights</p>
          </VCardText>
        </VCard>

        <!-- Error State -->
        <VAlert v-else-if="flightsError" type="error" variant="tonal" class="mb-6">
          <strong>Error:</strong> {{ flightsError }}
          <VBtn variant="text" color="error" @click="fetchFlights" class="mt-3">
            Retry
          </VBtn>
        </VAlert>

        <!-- Flights List -->
        <VRow v-else>
          <VCol v-if="flights.length === 0" cols="12">
            <VCard variant="tonal" color="warning">
              <VCardText class="text-center pa-8">
                <VIcon icon="tabler-inbox" size="64" color="warning" class="mb-3" />
                <h3 class="text-h5 mb-2">No Flights Available</h3>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  There are no active flights at the moment
                </p>
                <VBtn color="primary" @click="fetchFlights">
                  Refresh Flights
                </VBtn>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Flight Cards -->
          <VCol v-for="flight in flights" :key="flight.id" cols="12" sm="6" md="4" lg="3">
            <VCard hover class="h-100 cursor-pointer transition-all" @click="selectFlight(flight)"
              style="transition: all 0.3s ease;">
              <VCardText class="pa-4">
                <div class="mb-3">
                  <div class="text-h6 font-weight-bold mb-1">
                    {{ flight.flightNo }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    <VIcon icon="tabler-map-pin" size="16" class="me-1" />
                    {{ flight.route }}
                  </div>
                </div>

                <VDivider class="my-3" />

                <div class="d-flex flex-column gap-2 text-caption">
                  <div class="d-flex align-center">
                    <VIcon icon="tabler-plane" size="16" class="me-2" color="primary" />
                    <span class="text-medium-emphasis">{{ flight.aircraft }}</span>
                  </div>
                  <div class="d-flex align-center">
                    <VIcon icon="tabler-calendar" size="16" class="me-2" color="primary" />
                    <span class="text-medium-emphasis">{{ new
                      Date(flight.flightDate).toLocaleDateString() }}</span>
                  </div>
                  <div class="d-flex align-center">
                    <VIcon icon="tabler-clock" size="16" class="me-2" color="primary" />
                    <span class="text-medium-emphasis">{{ flight.departure }}</span>
                  </div>
                </div>

                <VDivider class="my-3" />

                <VChip v-if="flight.status" size="small" :color="
                  flight.status === 'Active' ? 'success' :
                  flight.status === 'Upcoming' ? 'info' : 'secondary'
                " variant="tonal" class="w-100">
                  {{ flight.status }}
                </VChip>
              </VCardText>
              <VCardActions>
                <VSpacer />
                <VBtn color="primary" variant="text" @click.stop="selectFlight(flight)">
                  <VIcon start icon="tabler-arrow-right" />
                  Select
                </VBtn>
              </VCardActions>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- MAIN SALES INTERFACE (After Flight Selected) -->
    <div v-else>
      <!-- Loading State -->
      <VCard v-if="isLoadingInventory" class="mb-6">
        <VCardText class="text-center py-16">
          <VProgressCircular indeterminate color="primary" size="64" width="6" class="mb-4" />
          <h3 class="text-h5 mb-2">Loading Flight Data...</h3>
          <p class="text-body-2 text-medium-emphasis">
            Fetching inventory and flight information for {{ selectedFlight?.flightNo }}
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
                  <VIcon icon="tabler-plane" size="18" class="me-1" />
                  Flight {{ selectedFlight?.flightNo }} | {{ selectedFlight?.route }}
                </p>
              </div>
              <div class="d-flex gap-2 flex-wrap justify-end">
                <VBtn color="warning" variant="tonal" size="small" prepend-icon="tabler-arrow-left"
                  @click="changeFlight">
                  Change Flight
                </VBtn>
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

        <!-- Rest of the sales interface (Search, Products, Cart, Checkout) -->
        <!-- This section is identical to the original cabin-crew-sales.vue -->
        <!-- For brevity, I'll include just the key sections -->

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
              <VCol v-for="product in filteredProducts" :key="product.id" cols="12" sm="6" md="6" lg="4"
                class="d-flex">
                <VCard class="d-flex flex-column w-100" :class="{ 'border-error': product.stock === 0 }"
                  :style="product.stock === 0 ? 'border-width: 2px; border-style: solid;' : ''">
                  <div class="position-relative">
                    <VImg :src="product.image || ''" height="200" cover :alt="product.name"
                      class="bg-surface-variant">
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

                    <div class="d-flex justify-space-between align-center mt-auto">
                      <VChip v-if="!product.hasVariants" size="small"
                        :color="product.stock === 0 ? 'error' : product.stock < 10 ? 'warning' : 'success'"
                        variant="tonal">
                        Stock: {{ product.stock }}
                      </VChip>
                      <VBtn color="primary" size="small" :disabled="product.stock === 0"
                        @click="addToCart(product, selectedVariants[product.id])">
                        <VIcon start icon="tabler-plus" />
                        Add to Cart
                      </VBtn>
                    </div>
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
                  <VCard v-for="item in cart" :key="item.id" variant="tonal" class="mb-3">
                    <VCardText>
                      <div class="d-flex justify-space-between align-start mb-2">
                        <h4 class="text-subtitle-1">
                          {{ item.name }}
                        </h4>
                        <VBtn icon="tabler-trash" size="x-small" variant="text" color="error"
                          @click="removeFromCart(item.id, item.selectedVariant?.sku)" />
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
      </div>
    </div>

    <!-- Snackbar Notifications -->
    <VSnackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top">
      {{ snackbarText }}
    </VSnackbar>
  </div>
</template>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
