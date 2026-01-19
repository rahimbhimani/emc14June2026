<script setup lang="ts">


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
}

interface CartItem extends Product {
  quantity: number
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

// Flight and trolley information
const flightNumber = ref('AA1234')
const trolleyNumber = ref('T-05')

// Cash Register - Starting float
const cashRegister = ref<CashRegister[]>([
  { currencyCode: 'USD', amount: 500.00 },
  { currencyCode: 'EUR', amount: 300.00 },
  { currencyCode: 'GBP', amount: 200.00 },
  { currencyCode: 'JPY', amount: 50000.00 },
  { currencyCode: 'AED', amount: 1000.00 },
])

const showCashRegister = ref(false)

// Mock product inventory data
const inventory = ref<Product[]>([
  {
    id: 1,
    name: 'Wireless Headphones Premium',
    itemNumber: 'ITM-001',
    barcode: '1234567890123',
    price: 89.99,
    category: 'Electronics',
    stock: 15,
    image: 'https://via.placeholder.com/150/0066CC/FFFFFF?text=Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
  },
  {
    id: 2,
    name: 'Travel Pillow Deluxe',
    itemNumber: 'ITM-002',
    barcode: '2345678901234',
    price: 24.99,
    category: 'Comfort',
    stock: 30,
    image: 'https://via.placeholder.com/150/00AA66/FFFFFF?text=Pillow',
    description: 'Memory foam travel pillow for maximum comfort',
  },
  {
    id: 3,
    name: 'Luxury Perfume 50ml',
    itemNumber: 'ITM-003',
    barcode: '3456789012345',
    price: 125.00,
    category: 'Fragrance',
    stock: 20,
    image: 'https://via.placeholder.com/150/CC0066/FFFFFF?text=Perfume',
    description: 'Designer fragrance for men and women',
  },
  {
    id: 4,
    name: 'Swiss Chocolate Box',
    itemNumber: 'ITM-004',
    barcode: '4567890123456',
    price: 18.50,
    category: 'Food',
    stock: 40,
    image: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=Chocolate',
    description: 'Premium Swiss chocolate assortment',
  },
  {
    id: 5,
    name: 'Designer Sunglasses',
    itemNumber: 'ITM-005',
    barcode: '5678901234567',
    price: 149.99,
    category: 'Accessories',
    stock: 12,
    image: 'https://via.placeholder.com/150/FFD700/000000?text=Sunglasses',
    description: 'UV protection designer sunglasses',
  },
  {
    id: 6,
    name: 'Portable Charger 20000mAh',
    itemNumber: 'ITM-006',
    barcode: '6789012345678',
    price: 45.00,
    category: 'Electronics',
    stock: 25,
    image: 'https://via.placeholder.com/150/4169E1/FFFFFF?text=Charger',
    description: 'Fast charging portable power bank',
  },
  {
    id: 7,
    name: 'Cashmere Scarf',
    itemNumber: 'ITM-007',
    barcode: '7890123456789',
    price: 79.99,
    category: 'Accessories',
    stock: 18,
    image: 'https://via.placeholder.com/150/DC143C/FFFFFF?text=Scarf',
    description: 'Soft cashmere scarf in various colors',
  },
  {
    id: 8,
    name: 'Travel Size Skincare Set',
    itemNumber: 'ITM-008',
    barcode: '8901234567890',
    price: 34.99,
    category: 'Beauty',
    stock: 22,
    image: 'https://via.placeholder.com/150/FF69B4/FFFFFF?text=Skincare',
    description: 'Complete travel skincare routine',
  },
])

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

const searchQuery = ref('')
const searchType = ref<'all' | 'barcode' | 'itemNumber'>('all')
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
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const isProcessingPayment = ref(false)

// Stripe Test Configuration
const STRIPE_TEST_KEY = 'pk_test_51234567890' // Use your Stripe test key
const STRIPE_API_URL = 'https://api.stripe.com/v1'

// Cash payment states
const selectedCurrency = ref('USD')
const currencyPayments = ref<CurrencyPayment[]>([])

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

const cardNetworks = ['VISA', 'MASTERCARD', 'RUPAY', 'AMEX', 'DISCOVER', 'UNIONPAY']
const authMethods = ['NO_CVM', 'PIN', 'SIGNATURE', 'BIOMETRIC']

// Crew and Equipment details
const crewDetails = ref<CrewDetails>({
  employeeId: 'CR-1234',
  name: 'Sarah Johnson',
  designation: 'Senior Flight Attendant',
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

// Computed for cash register total
const totalCashRegisterUSD = computed(() => {
  return cashRegister.value.reduce((total, cash) => {
    const currency = currencies.value.find(c => c.code === cash.currencyCode)
    if (currency) {
      return total + (cash.amount * currency.exchangeRate)
    }
    return total
  }, 0)
})

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
  const change = totalCashReceivedAllCurrencies.value - cartTotal.value
  return change >= 0 ? change : 0
})

const isPaymentSufficient = computed(() => {
  return totalCashReceivedAllCurrencies.value >= cartTotal.value
})

const filteredProducts = computed(() => {
  if (!searchQuery.value) return inventory.value

  const query = searchQuery.value.toLowerCase().trim()

  return inventory.value.filter(product => {
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

const cartTotal = computed(() => {
  return cart.value.reduce((total, item) => total + item.price * item.quantity, 0)
})

const cartItemCount = computed(() => {
  return cart.value.reduce((count, item) => count + item.quantity, 0)
})

// Methods
const addToCart = (product: Product) => {
  const existingItem = cart.value.find(item => item.id === product.id)

  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++
      showSnackbar('Quantity updated in cart', 'success')
    } else {
      showSnackbar('Stock limit reached', 'warning')
    }
  } else {
    cart.value.push({ ...product, quantity: 1 })
    showSnackbar('Item added to cart', 'success')
  }
}

const removeFromCart = (productId: number) => {
  const index = cart.value.findIndex(item => item.id === productId)
  if (index > -1) {
    cart.value.splice(index, 1)
    showSnackbar('Item removed from cart', 'info')
  }
}

const updateQuantity = (productId: number, quantity: number) => {
  const item = cart.value.find(i => i.id === productId)
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else if (quantity <= item.stock) {
      item.quantity = quantity
    } else {
      showSnackbar('Stock limit reached', 'warning')
    }
  }
}

const scanBarcode = () => {
  // Simulate barcode scanner - in real app, this would integrate with device scanner
  const randomProduct = inventory.value[Math.floor(Math.random() * inventory.value.length)]
  searchQuery.value = randomProduct.barcode
  searchType.value = 'barcode'
  showSnackbar(`Scanned: ${randomProduct.name}`, 'info')
}

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

const formatCurrency = (amount: number, currencyCode = 'USD') => {
  const currency = currencies.value.find(c => c.code === currencyCode)
  return `${currency?.symbol || '$'}${amount.toFixed(2)}`
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

const processCheckout = async () => {
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
    
    // Payment successful - show on POS screen
    posScreenState.value = 'approved'
    posScreenMessage.value = 'Payment approved'
    posTransactionData.value = paymentResult
    
    const cardInfo = paymentResult.cardDetails
    showSnackbar(
      `✓ ${paymentResult.responseMessage}\n` +
      `Transaction ID: ${paymentResult.transactionId}\n` +
      `Auth Code: ${paymentResult.authorizationCode}\n` +
      `Card: ${cardInfo?.maskedPAN} (${cardInfo?.cardScheme})`,
      'success'
    )
    
    // Reset form
    setTimeout(() => {
      cart.value = []
      customerName.value = ''
      seatNumber.value = ''
      showCheckout.value = false
      showPOSScreen.value = false
      posScreenState.value = 'idle'
      resetCardDetails()
      resetCrewAndEquipment()
      isProcessingPayment.value = false
    }, 4000)
    
    return
  }

  // For cash payment, validate sufficient funds
  if (paymentMethod.value === 'cash') {
    if (!isPaymentSufficient.value) {
      showSnackbar('Insufficient cash received', 'error')
      return
    }
    
    // Add current currency amount if any
    if (cashReceivedInCurrentCurrency.value > 0) {
      addCurrencyToPayment()
    }
    
    // Process cash payment
    showSnackbar(`Payment successful! Change: $${changeAmount.value.toFixed(2)}`, 'success')
    
    // Reset form
    setTimeout(() => {
      cart.value = []
      customerName.value = ''
      seatNumber.value = ''
      showCheckout.value = false
      currencyPayments.value = []
      resetDenominations()
      selectedCurrency.value = 'USD'
      resetCrewAndEquipment()
    }, 1000)
    
    return
  }
  
  // Digital wallet or other payment methods
  showSnackbar(`Payment successful! Total: $${cartTotal.value.toFixed(2)}`, 'success')
  
  setTimeout(() => {
    cart.value = []
    customerName.value = ''
    seatNumber.value = ''
    showCheckout.value = false
    resetCrewAndEquipment()
  }, 1000)
}

const showSnackbar = (text: string, color: string) => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// Stripe Payment Processing
const processStripePayment = async () => {
  isProcessingPayment.value = true
  
  try {
    // Get selected currency (default to USD)
    const selectedCurrencyObj = currencies.value.find(c => c.code === selectedCurrency.value) || currencies.value[0]
    
    // Prepare charge details with currency
    const chargeDetails = {
      amount: Math.round(cartTotal.value * 100), // Amount in cents
      currency: selectedCurrency.value.toLowerCase(),
      currencySymbol: selectedCurrencyObj.symbol,
      currencyName: selectedCurrencyObj.name,
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
    cardNetwork = ['VISA', 'MASTERCARD', 'AMEX'][Math.floor(Math.random() * 3)]
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

const paymentMethods = [
  { value: 'credit-card', title: 'Credit Card', icon: 'tabler-credit-card' },
  { value: 'debit-card', title: 'Debit Card', icon: 'tabler-credit-card' },
  { value: 'cash', title: 'Cash', icon: 'tabler-cash' },
  { value: 'digital-wallet', title: 'Digital Wallet', icon: 'tabler-wallet' },
]
</script>

<template>
  <div>
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
            <VBtn
              color="success"
              variant="tonal"
              size="small"
              :prepend-icon="$vuetify.display.smAndUp ? 'tabler-cash-register' : undefined"
              :icon="$vuetify.display.xs ? 'tabler-cash-register' : undefined"
              @click="showCashRegister = !showCashRegister"
            >
              <span v-if="$vuetify.display.smAndUp">Cash Register</span>
              <VChip
                v-if="$vuetify.display.smAndUp"
                size="small"
                color="success"
                class="ms-2"
              >
                ${{ totalCashRegisterUSD.toFixed(2) }}
              </VChip>
            </VBtn>
            <VChip
              color="primary"
              :size="$vuetify.display.xs ? 'small' : 'default'"
              class="px-2"
            >
              <VIcon
                start
                icon="tabler-shopping-cart"
                :size="$vuetify.display.xs ? '18' : '20'"
              />
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
            <VBtn
              icon="tabler-x"
              variant="text"
              size="small"
              @click="showCashRegister = false"
            />
          </div>

          <VRow>
            <VCol
              v-for="cash in cashRegister"
              :key="cash.currencyCode"
              cols="12"
              sm="6"
              md="4"
            >
              <VCard variant="tonal" color="success">
                <VCardText>
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1">
                        {{ currencies.find(c => c.code === cash.currencyCode)?.name }}
                      </div>
                      <div class="text-h6 font-weight-bold">
                        {{ currencies.find(c => c.code === cash.currencyCode)?.symbol }}{{ cash.amount.toFixed(2) }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        ≈ ${{ (cash.amount * (currencies.find(c => c.code === cash.currencyCode)?.exchangeRate || 1)).toFixed(2) }}
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
      <VCol
        cols="12"
        md="8"
      >
        <!-- Search Section -->
        <VCard class="mb-6">
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                sm="8"
              >
                <VTextField
                  v-model="searchQuery"
                  placeholder="Search by name, item number, or barcode..."
                  prepend-inner-icon="tabler-search"
                  clearable
                  variant="outlined"
                  hide-details
                />
              </VCol>
              <VCol
                cols="12"
                sm="4"
              >
                <VBtn
                  block
                  color="primary"
                  variant="tonal"
                  prepend-icon="tabler-barcode"
                  @click="scanBarcode"
                >
                  Scan Barcode
                </VBtn>
              </VCol>
            </VRow>

            <div class="mt-4">
              <VChipGroup
                v-model="searchType"
                selected-class="text-primary"
                mandatory
              >
                <VChip value="all">
                  All Fields
                </VChip>
                <VChip value="barcode">
                  Barcode Only
                </VChip>
                <VChip value="itemNumber">
                  Item Number Only
                </VChip>
              </VChipGroup>
            </div>
          </VCardText>
        </VCard>

        <!-- Products Grid -->
        <VRow>
          <VCol
            v-for="product in filteredProducts"
            :key="product.id"
            cols="12"
            sm="6"
            md="6"
            lg="4"
            class="d-flex"
          >
            <VCard class="d-flex flex-column w-100">
              <VImg
                :src="product.image"
                height="200"
                cover
              />

              <VCardText class="d-flex flex-column flex-grow-1">
                <div class="d-flex justify-space-between align-start mb-2">
                  <h3 class="text-h6" style="min-block-size: 56px;">
                    {{ product.name }}
                  </h3>
                  <VChip
                    size="small"
                    color="primary"
                    class="flex-shrink-0 ms-2"
                  >
                    ${{ product.price }}
                  </VChip>
                </div>

                <p class="text-body-2 text-medium-emphasis mb-2 flex-grow-1">
                  {{ product.description }}
                </p>

                <div class="d-flex gap-2 mb-2">
                  <VChip
                    size="small"
                    variant="tonal"
                  >
                    {{ product.itemNumber }}
                  </VChip>
                  <VChip
                    size="small"
                    variant="tonal"
                    color="secondary"
                  >
                    {{ product.category }}
                  </VChip>
                  <VChip
                    size="small"
                    variant="tonal"
                    color="info"
                  >
                    {{ trolleyNumber }}
                  </VChip>
                </div>

                <div class="d-flex align-center justify-space-between mt-auto">
                  <span class="text-caption">
                    Stock: {{ product.stock }}
                  </span>
                  <VBtn
                    color="primary"
                    size="small"
                    @click="addToCart(product)"
                  >
                    <VIcon
                      start
                      icon="tabler-plus"
                    />
                    Add to Cart
                  </VBtn>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol
            v-if="filteredProducts.length === 0"
            cols="12"
          >
            <VCard>
              <VCardText class="text-center py-10">
                <VIcon
                  icon="tabler-search-off"
                  size="64"
                  color="secondary"
                  class="mb-4"
                />
                <h3 class="text-h5 mb-2">
                  No products found
                </h3>
                <p class="text-body-1">
                  Try adjusting your search criteria
                </p>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCol>

      <!-- Right Column - Shopping Cart -->
      <VCol
        cols="12"
        md="4"
      >
        <VCard>
          <VCardText>
            <h2 class="text-h5 mb-4">
              <VIcon
                icon="tabler-shopping-cart"
                class="me-2"
              />
              Shopping Cart
            </h2>

            <VDivider class="mb-4" />

            <!-- Cart Items -->
            <div
              v-if="cart.length > 0"
              class="mb-4"
            >
              <VCard
                v-for="item in cart"
                :key="item.id"
                variant="tonal"
                class="mb-3"
              >
                <VCardText>
                  <div class="d-flex justify-space-between align-start mb-2">
                    <h4 class="text-subtitle-1">
                      {{ item.name }}
                    </h4>
                    <VBtn
                      icon="tabler-trash"
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="removeFromCart(item.id)"
                    />
                  </div>

                  <p class="text-caption mb-2">
                    {{ item.itemNumber }}
                  </p>

                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center gap-2">
                      <VBtn
                        icon="tabler-minus"
                        size="x-small"
                        variant="tonal"
                        @click="updateQuantity(item.id, item.quantity - 1)"
                      />
                      <span class="text-body-1 font-weight-medium px-2">
                        {{ item.quantity }}
                      </span>
                      <VBtn
                        icon="tabler-plus"
                        size="x-small"
                        variant="tonal"
                        @click="updateQuantity(item.id, item.quantity + 1)"
                      />
                    </div>

                    <span class="text-h6 font-weight-bold">
                      ${{ (item.price * item.quantity).toFixed(2) }}
                    </span>
                  </div>
                </VCardText>
              </VCard>
            </div>

            <!-- Empty Cart State -->
            <div
              v-else
              class="text-center py-8"
            >
              <VIcon
                icon="tabler-shopping-cart-off"
                size="48"
                color="secondary"
                class="mb-3"
              />
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

            <VBtn
              block
              color="success"
              size="large"
              :disabled="cart.length === 0"
              @click="showCheckout = true"
            >
              <VIcon
                start
                icon="tabler-credit-card"
              />
              Proceed to Checkout
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Checkout Dialog -->
    <VDialog
      v-model="showCheckout"
      max-width="800"
      persistent
      scrollable
    >
      <VCard>
        <VCardText class="pa-6">
          <div class="d-flex justify-space-between align-center mb-6">
            <h2 class="text-h5">
              Checkout
            </h2>
            <VBtn
              icon="tabler-x"
              variant="text"
              @click="showCheckout = false"
            />
          </div>

          <!-- Equipment Details (Only for devices) -->
          <div v-if="!isBrowser">
            <h3 class="text-h6 mb-3">
              Equipment Details
            </h3>

            <VRow class="mb-4">
              <VCol
                cols="12"
                sm="4"
              >
                <VTextField
                  v-model="equipmentDetails.deviceId"
                  label="Device ID"
                  prepend-inner-icon="tabler-device-mobile"
                  variant="outlined"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                sm="4"
              >
                <VSelect
                  v-model="equipmentDetails.deviceType"
                  :items="['Tablet', 'Mobile', 'POS Terminal', 'Handheld Scanner']"
                  label="Device Type"
                  prepend-inner-icon="tabler-devices"
                  variant="outlined"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                sm="4"
              >
                <VTextField
                  v-model="equipmentDetails.serialNumber"
                  label="Serial Number"
                  prepend-inner-icon="tabler-barcode"
                  variant="outlined"
                  required
                />
              </VCol>
            </VRow>
          </div>

          <!-- Passenger Details -->
          <h3 class="text-h6 mb-3">
            Passenger Details
          </h3>

          <VRow class="mb-4">
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="seatNumber"
                label="Seat Number"
                prepend-inner-icon="tabler-armchair"
                variant="outlined"
                required
              />
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <VTextField
                v-model="customerName"
                label="Passenger Name"
                prepend-inner-icon="tabler-user"
                variant="outlined"
                required
              />
            </VCol>
          </VRow>

          <!-- Order Summary -->
          <h3 class="text-h6 mb-3">
            Order Summary
          </h3>

          <VCard
            variant="tonal"
            class="mb-4"
          >
            <VCardText>
              <div
                v-for="item in cart"
                :key="item.id"
                class="d-flex justify-space-between mb-2"
              >
                <span>{{ item.name }} x{{ item.quantity }}</span>
                <span class="font-weight-medium">${{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>

              <VDivider class="my-3" />

              <div class="d-flex justify-space-between">
                <span class="text-h6">Total:</span>
                <span class="text-h6 text-primary font-weight-bold">
                  ${{ cartTotal.toFixed(2) }}
                </span>
              </div>
            </VCardText>
          </VCard>

          <!-- Payment Method -->
          <h3 class="text-h6 mb-3">
            Payment Method
          </h3>

          <VRadioGroup v-model="paymentMethod">
            <VRow>
              <VCol
                v-for="method in paymentMethods"
                :key="method.value"
                cols="6"
                sm="3"
              >
                <VCard
                  :variant="paymentMethod === method.value ? 'elevated' : 'outlined'"
                  :color="paymentMethod === method.value ? 'primary' : ''"
                  class="cursor-pointer"
                  @click="paymentMethod = method.value"
                >
                  <VCardText class="pa-3 text-center">
                    <VRadio
                      :value="method.value"
                      class="justify-center"
                    >
                      <template #label>
                        <div class="d-flex flex-column align-center">
                          <VIcon
                            :icon="method.icon"
                            size="32"
                            class="mb-2"
                            :color="paymentMethod === method.value ? 'primary' : ''"
                          />
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

            <h3 class="text-h6 mb-3">
              <VIcon icon="tabler-settings" class="me-2" />
              Card Payment Mode
            </h3>

            <VRadioGroup
              v-model="cardPaymentMode"
              inline
              class="mb-4"
            >
              <VRadio
                value="sdk"
                color="primary"
              >
                <template #label>
                  <div class="d-flex flex-column">
                    <span class="font-weight-bold">Get Payment (SDK)</span>
                    <span class="text-caption text-medium-emphasis">Card details from POS machine</span>
                  </div>
                </template>
              </VRadio>
              <VRadio
                value="manual"
                color="secondary"
              >
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
          <div v-if="(paymentMethod === 'credit-card' || paymentMethod === 'debit-card') && cardPaymentMode === 'manual'">
            <VDivider class="my-4" />

            <h3 class="text-h6 mb-3">
              Card Details
            </h3>

            <VRow>
              <VCol
                cols="12"
                sm="6"
              >
                <VSelect
                  v-model="cardDetails.type"
                  :items="[{ title: 'Credit Card', value: 'CREDIT' }, { title: 'Debit Card', value: 'DEBIT' }]"
                  label="Card Type"
                  prepend-inner-icon="tabler-credit-card"
                  variant="outlined"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                sm="6"
              >
                <VSelect
                  v-model="cardDetails.network"
                  :items="cardNetworks"
                  label="Card Network"
                  prepend-inner-icon="tabler-building-bank"
                  variant="outlined"
                  required
                />
              </VCol>
            </VRow>

            <VRow>
              <VCol
                cols="12"
                sm="6"
              >
                <VTextField
                  v-model="cardDetails.last4"
                  label="Last 4 Digits"
                  prepend-inner-icon="tabler-hash"
                  variant="outlined"
                  maxlength="4"
                  placeholder="9012"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                sm="6"
              >
                <VTextField
                  v-model="cardDetails.expiry"
                  label="Expiry (MM/YY)"
                  prepend-inner-icon="tabler-calendar"
                  variant="outlined"
                  placeholder="09/27"
                  maxlength="5"
                  required
                />
              </VCol>
            </VRow>

            <h3 class="text-h6 mb-3 mt-4">
              Authorization
            </h3>

            <VRow>
              <VCol
                cols="12"
                sm="6"
              >
                <VSelect
                  v-model="authorizationDetails.method"
                  :items="authMethods"
                  label="Authorization Method"
                  prepend-inner-icon="tabler-lock"
                  variant="outlined"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                sm="6"
              >
                <VTextField
                  v-model="authorizationDetails.offlineCode"
                  label="Offline Code"
                  prepend-inner-icon="tabler-key"
                  variant="outlined"
                  placeholder="OFL789"
                  required
                />
              </VCol>
            </VRow>

            <!-- Card Summary -->
            <VCard
              variant="tonal"
              color="info"
              class="mt-3"
            >
              <VCardText class="pa-3">
                <div class="text-caption mb-2 font-weight-bold">
                  Card Information Summary
                </div>
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span>Card:</span>
                  <span class="font-weight-medium">
                    {{ cardDetails.type || '-' }} | {{ cardDetails.network || '-' }} | •••• {{ cardDetails.last4 || '----' }}
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
              Cash Payment
            </h3>

            <!-- Permitted Currencies -->
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

            <!-- Current Currency Info -->
            <VCard
              variant="tonal"
              color="primary"
              class="mb-3"
            >
              <VCardText class="pa-3">
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-caption">Selected Currency</div>
                    <div class="text-subtitle-1 font-weight-bold">
                      {{ currentCurrency.name }} ({{ currentCurrency.code }})
                    </div>
                    <div class="text-caption">
                      Rate: 1 {{ currentCurrency.code }} = ${{ currentCurrency.exchangeRate.toFixed(4) }}
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="text-caption">Current Amount</div>
                    <div class="text-h6 font-weight-bold">
                      {{ formatCurrency(cashReceivedInCurrentCurrency, currentCurrency.code) }}
                    </div>
                    <div class="text-caption">
                      ≈ {{ formatCurrency(cashReceivedInUSD) }}
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>

            <!-- Denominations Input (Compact) -->
            <div class="mb-3">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-subtitle-2">Denominations</span>
                <div class="d-flex gap-2">
                  <VBtn
                    size="x-small"
                    variant="outlined"
                    color="primary"
                    :disabled="cashReceivedInCurrentCurrency === 0"
                    @click="addCurrencyToPayment"
                  >
                    Add to Payment
                  </VBtn>
                  <VBtn
                    size="x-small"
                    variant="outlined"
                    @click="resetDenominations"
                  >
                    Reset
                  </VBtn>
                </div>
              </div>

              <VRow dense>
                <VCol
                  v-for="(denom, index) in currentDenominations.slice(0, 8)"
                  :key="index"
                  cols="6"
                  sm="3"
                >
                  <VCard
                    variant="tonal"
                    :color="denom.count > 0 ? 'success' : 'default'"
                    class="text-center"
                  >
                    <VCardText class="pa-2">
                      <div class="text-caption font-weight-bold mb-1">
                        {{ formatCurrency(denom.value, currentCurrency.code) }}
                      </div>
                      <div class="d-flex justify-center gap-1 mb-1">
                        <VBtn
                          size="x-small"
                          icon="tabler-minus"
                          variant="text"
                          density="compact"
                          :disabled="denom.count === 0"
                          @click="updateDenomination(index, false)"
                        />
                        <span class="text-caption align-self-center px-1">{{ denom.count }}</span>
                        <VBtn
                          size="x-small"
                          icon="tabler-plus"
                          variant="text"
                          density="compact"
                          @click="updateDenomination(index, true)"
                        />
                      </div>
                    </VCardText>
                  </VCard>
                </VCol>
              </VRow>
            </div>

            <!-- Currency Payments List -->
            <VCard
              v-if="currencyPayments.length > 0"
              variant="tonal"
              color="success"
              class="mb-3"
            >
              <VCardText class="pa-3">
                <div class="text-caption mb-2 font-weight-bold">
                  Payments Received
                </div>
                <div
                  v-for="(payment, index) in currencyPayments"
                  :key="index"
                  class="d-flex justify-space-between align-center mb-1"
                >
                  <div>
                    <VChip
                      size="x-small"
                      color="primary"
                      class="me-1"
                    >
                      {{ payment.currencyCode }}
                    </VChip>
                    <span class="text-caption">{{ formatCurrency(payment.amount, payment.currencyCode) }}</span>
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

            <!-- Payment Summary -->
            <VCard
              variant="tonal"
              :color="isPaymentSufficient ? 'success' : 'warning'"
              class="mb-3"
            >
              <VCardText class="pa-3">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-caption">Total Due:</span>
                  <span class="text-caption font-weight-bold">{{ formatCurrency(cartTotal) }}</span>
                </div>
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-caption">Cash Received:</span>
                  <span class="text-caption font-weight-bold">{{ formatCurrency(totalCashReceivedAllCurrencies) }}</span>
                </div>
                <div class="d-flex justify-space-between">
                  <span class="text-caption font-weight-bold">Change:</span>
                  <span class="text-caption font-weight-bold">{{ formatCurrency(changeAmount) }}</span>
                </div>
              </VCardText>
            </VCard>

            <VAlert
              v-if="!isPaymentSufficient"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              <span class="text-caption">
                Need {{ formatCurrency(cartTotal - totalCashReceivedAllCurrencies) }} more
              </span>
            </VAlert>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex gap-3 mt-6">
            <VBtn
              variant="outlined"
              :disabled="isProcessingPayment"
              @click="showCheckout = false"
            >
              Cancel
            </VBtn>
            <VBtn
              color="success"
              size="large"
              class="flex-grow-1"
              :disabled="(paymentMethod === 'cash' && !isPaymentSufficient) || isProcessingPayment"
              :loading="isProcessingPayment"
              @click="processCheckout"
            >
              <VIcon
                start
                icon="tabler-check"
              />
              {{ isProcessingPayment ? 'Processing...' : 'Complete Payment' }}
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Snackbar Notifications -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
    </VSnackbar>

    <!-- POS Terminal Screen -->
    <VDialog
      v-model="showPOSScreen"
      max-width="500"
      persistent
    >
      <VCard
        class="pos-terminal"
        color="#1a1a1a"
      >
        <VCardText class="pa-0">
          <!-- POS Terminal Header -->
          <div class="pos-header text-center pa-4" style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); border-block-end: 2px solid #3498db;">
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
              <VIcon
                icon="tabler-credit-card"
                size="80"
                color="success"
                class="mb-4 pulse-animation"
              />
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
                <VProgressLinear
                  color="warning"
                  indeterminate
                  height="4"
                  class="mx-auto"
                  style="max-inline-size: 250px;"
                />
              </div>
            </div>

            <!-- Processing State -->
            <div v-if="posScreenState === 'processing'" class="text-center">
              <VProgressCircular
                :size="100"
                :width="8"
                color="primary"
                indeterminate
                class="mb-4"
              />
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
                <VIcon
                  icon="tabler-circle-check"
                  size="100"
                  color="success"
                />
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
                  <span class="text-body-2">{{ posTransactionData?.cardDetails?.cardType }} - {{ posTransactionData?.cardDetails?.cardScheme }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-2" style="color: #95a5a6;">Auth Code:</span>
                  <span class="text-body-2 font-weight-bold" style="color: #3498db;">{{ posTransactionData?.authorizationCode }}</span>
                </div>
                <div class="d-flex justify-space-between">
                  <span class="text-body-2" style="color: #95a5a6;">Transaction ID:</span>
                  <span class="text-caption" style="color: #7f8c8d;">{{ posTransactionData?.transactionId?.substring(0, 20) }}...</span>
                </div>
              </div>
              <div class="mt-4 text-caption" style="color: #27ae60;">
                ✓ Customer copy printed
              </div>
            </div>

            <!-- Declined State -->
            <div v-if="posScreenState === 'declined'" class="text-center">
              <VIcon
                icon="tabler-circle-x"
                size="100"
                color="error"
                class="mb-4"
              />
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
          <div class="pos-footer text-center pa-3" style="background: #2c3e50; border-block-start: 1px solid #34495e;">
            <div class="text-caption" style="color: #7f8c8d;">
              Powered by SkyAir Payment Systems | Flight {{ flightNumber }}
            </div>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
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
  animation: swipeCard 2s ease-in-out infinite;
  inset-block-start: 50%;
  inset-inline-start: -100%;
  transform: translateY(-50%);
}

@keyframes swipeCard {
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
