
export default [

  {
    heading: 'Planning Functions',
    action: 'read',
    icon: { icon: 'ri-settings-line' },
    subject: 'emcSubAdmin',
  },
  {
    title: 'Admin Functions',
    icon: { icon: 'ri-settings-line' },
    action: 'read',
    subject: 'emcCurrencyMgmt',
    children: [
      {
        title: 'Planning',
        icon: { icon: 'ri-wallet-line' },
        action: 'read',
        subject: 'emcCurrencyMgmt',
        children: [
          {
            title: 'Planning (admin)',
            icon: { icon: 'ri-planning-line' },
            action: 'read',
            subject: 'emcCurrencyMgmt',
            to: { name: 'emc-emcContainer' }
          },
          {
            title: 'Product (admin)',
            icon: { icon: 'ri-planning-line' },
            action: 'read',
            subject: 'emcCurrencyMgmt',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcInvItem' } },
          }
        ],
      },
    ],
  },

  //pppp
  {
    heading: 'Crew Functions',
    action: 'read',
    icon: { icon: 'ri-settings-line' },
    subject: 'emcSubAdmin',
  },
  {
    title: 'Crew Functions',
    icon: { icon: 'ri-settings-line' },
    action: 'read',
    subject: 'emcCurrencyMgmt',
    children: [
      {
        title: 'Sales on Board',
        icon: { icon: 'ri-wallet-line' },
        action: 'read',
        subject: 'emcCurrencyMgmt',
        children: [
          {
            title: 'Sales',
            icon: { icon: 'ri-money-dollar-circle-line' },
            action: 'read',
            subject: 'emcCurrencyMgmt',
            to: { name: 'cabin-crew-sales' }
          }
        ],
      },
    ],
  },
  {
    heading: 'Sales on board',
    action: 'read',
    icon: { icon: 'ri-settings-line' },
    subject: 'emcSubAdmin',
  },
  {
    title: 'Masters',
    icon: { icon: 'ri-settings-line' },
    action: 'read',
    subject: 'emcCurrencyMgmt',
    children: [
      {
        title: 'Currency Mgmt.',
        icon: { icon: 'ri-wallet-line' },
        action: 'read',
        subject: 'emcCurrencyMgmt',
        children: [
          {
            title: 'Currency',
            icon: { icon: 'ri-money-dollar-circle-line' },
            action: 'read',
            subject: 'emcCurrencyMgmt',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcCurrency' } },
          },
          {
            title: 'Rate',
            icon: { icon: 'ri-money-dollar-circle-line' },
            action: 'read',
            subject: 'emcCurrencyMgmt',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcRate' } },
          },
          {
            title: 'ExchangeRate',
            icon: { icon: 'ri-money-dollar-circle-line' },
            action: 'read',
            subject: 'emcCurrencyMgmt',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcExchangeRate' } },
          },
        ],
      },
      {
        title: 'Geography',
        icon: { icon: 'ri-map-pin-line' },
        action: 'read',
        subject: 'emcSubAdmin',
        children: [
          {
            title: 'Country',
            icon: { icon: 'ri-flag-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcCountryMaster' } },
          },
          {
            title: 'City',
            icon: { icon: 'ri-building-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcCityMaster' } },
          },
        ],
      },
      {
        title: 'Flight Master',
        icon: { icon: 'ri-map-pin-line' },
        action: 'read',
        subject: 'emcSubAdmin',
        children: [
          {
            title: 'AirportMaster',
            icon: { icon: 'ri-flag-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcAirportMaster' } },
          },
          {
            title: 'Trolley Master',
            icon: { icon: 'ri-building-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcTrolley' } },
          },
        ],
      },
      {
        title: 'Customer Master',
        icon: { icon: 'ri-map-pin-line' },
        action: 'read',
        subject: 'emcSubAdmin',
        children: [
          {
            title: 'CustomerType',
            icon: { icon: 'ri-flag-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcCustomerTypesMaster' } },
          },
          {
            title: 'Customers',
            icon: { icon: 'ri-building-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcCustomers' } },
          },
        ],
      },
      {
        title: 'Miscellaneous Master',
        icon: { icon: 'ri-map-pin-line' },
        action: 'read',
        subject: 'emcSubAdmin',
        children: [
          {
            title: 'Group Data',
            icon: { icon: 'ri-flag-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcGroupData' } },
          },
          {
            title: 'Invoice Item',
            icon: { icon: 'ri-building-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcinvItem' } },
          },
          {
            title: 'SHC',
            icon: { icon: 'ri-building-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcSHC' } },
          },
          {
            title: 'Status',
            icon: { icon: 'ri-building-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcStatus' } },
          },
          {
            title: 'Reservation',
            icon: { icon: 'ri-building-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcReservation' } },
          },
        ],
      },
    ],
  },
  {
    title: 'Screen Designs',
    icon: { icon: 'ri-settings-line' },
    action: 'read',
    subject: 'emcScreenDesign',
    children: [
      {
        title: 'Screen Configuration',
        icon: { icon: 'ri-money-dollar-circle-line' },
        action: 'read',
        subject: 'emcScreenDesign',
        to: { name: 'emc-emclist-vmaster', params: { vmaster: 'ScreenConfigure' } },
      },
    ],
  },
  {
    title: 'Misc',
    icon: { icon: 'ri-settings-line' },
    action: 'read',
    subject: 'emcMisc',
    children: [
      {
        title: 'Special Handling',
        icon: { icon: 'ri-money-dollar-circle-line' },
        action: 'read',
        subject: 'emcMisc',
        to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcSHC' } },
      },
    ],
  },
]
