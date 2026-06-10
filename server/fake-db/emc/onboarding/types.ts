export interface BusinessDomain {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

export interface Product {
  id: string
  domainId: string
  name: string
  description: string
  startingPrice: string
  icon: string
}

export interface StakeholderType {
  id: string
  domainId: string
  productIds: string[]
  name: string
  icon: string
  description: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: string
  priceValue: number
  priceSubtext: string
  description: string
  features: string[]
  badge?: string
}

export interface AdditionalService {
  id: string
  name: string
  description: string
  price: string
  priceValue: number
  icon: string
  category: string
}

export interface OnboardingStep {
  title: string
  desc: string
  icon: string
}

export interface OnboardingData {
  businessDomains: BusinessDomain[]
  allProducts: Product[]
  allStakeholders: StakeholderType[]
  subscriptionPlans: SubscriptionPlan[]
  serviceAddons: AdditionalService[]
  steps: OnboardingStep[]
  countries: string[]
  timezones: string[]
  organizationSizes: string[]
  industries: string[]
  operationalRegions: string[]
  ghaServicesList: string[]
}
