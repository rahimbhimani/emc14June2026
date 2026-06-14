// layers/onboarding/types/onboarding.ts

export interface TenantOnboardingDto {
  domainId: string
  productIds: string[]
  stakeholderIds: string[]

  organization: {
    organizationName: string
    legalName: string
    registrationNumber: string
    taxNumber: string
    website: string
    industry: string
    country: string
    timeZone: string
    organizationSize: string
  }

  administrator: {
    firstName: string
    lastName: string
    designation: string
    email: string
    mobile: string
  }

  addresses: {
    billing: Address
    communication: Address
    operational: Address
  }

  planId: string

  addonIds: string[]
}
