export default [
  { heading: 'Sales on board', action: 'read',
    icon: { icon: 'ri-settings-line' },
    subject: 'emcSubAdmin', },
  {
    title: 'Masters',
    icon: { icon: 'ri-settings-line' },
    action: 'read',
    subject: 'emcSubAdmin',
    children: [
      {
        title: 'Currency Mgmt.',
        icon: { icon: 'ri-wallet-line' },
        action: 'read',
        subject: 'emcSubAdmin',
        children: [
          {
            title: 'Currency',
            icon: { icon: 'ri-money-dollar-circle-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcCurrency' } },
          },
        ],
      },
    ],
  },
  {
    title: 'Screen Designs',
    icon: { icon: 'ri-settings-line' },
    action: 'read',
    subject: 'emcSubAdmin',
          children: [
          {
            title: 'Screen Configuration',
            icon: { icon: 'ri-money-dollar-circle-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'ScreenConfigure' } },
          },
        ],
  },
    {
    title: 'Inventory',
    icon: { icon: 'ri-settings-line' },
    action: 'read',
    subject: 'emcSubAdmin',
          children: [
          {
            title: 'Sales',
            icon: { icon: 'ri-money-dollar-circle-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'cabin-crew-sales', params: { vmaster: 'ScreenConfigure' } },
          },
          {
            title: 'Container Planning',
            icon: { icon: 'ri-money-dollar-circle-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'ContainerPlanning', params: { vmaster: 'ScreenConfigure' } },
          },
        ],
  },
      {
    title: 'Misc',
    icon: { icon: 'ri-settings-line' },
    action: 'read',
    subject: 'emcSubAdmin',
          children: [
          {
            title: 'Special Handling',
            icon: { icon: 'ri-money-dollar-circle-line' },
            action: 'read',
            subject: 'emcSubAdmin',
            to: { name: 'emc-emclist-vmaster', params: { vmaster: 'emcSHC' } },
          },
        ],
  }
]
