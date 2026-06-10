import type { OnboardingData } from './types'

export const db: OnboardingData = {
  businessDomains: [
    { id: 'air-cargo',  name: 'Air Cargo',                   icon: 'ri-plane-line',           description: 'Cargo management for airlines, ground handlers, and freight forwarders.', color: 'primary' },
    { id: 'shipping',   name: 'Shipping & Maritime',         icon: 'ri-ship-line',            description: 'Port, vessel, and maritime logistics operations management.',              color: 'info'    },
    { id: 'logistics',  name: 'Logistics & Warehousing',     icon: 'ri-truck-line',           description: 'Warehouse and ground transport operations platform.',                      color: 'warning' },
    { id: 'pharma',     name: 'Pharmaceutical Supply Chain', icon: 'ri-medicine-bottle-line', description: 'Temperature-controlled logistics and pharma distribution.',              color: 'error'   },
    { id: 'enterprise', name: 'General Enterprise',          icon: 'ri-building-2-line',      description: 'Flexible business process management for any enterprise.',                color: 'success' },
  ],

  allProducts: [
    { id: 'cms',          domainId: 'air-cargo',  name: 'Cargo Management System',      description: 'End-to-end cargo operations for airlines and handlers.',         startingPrice: '$299/mo', icon: 'ri-box-3-line'               },
    { id: 'ghs',          domainId: 'air-cargo',  name: 'Ground Handling System',       description: 'Terminal and cargo handling operations management.',              startingPrice: '$199/mo', icon: 'ri-tools-line'               },
    { id: 'wms-cargo',    domainId: 'air-cargo',  name: 'Warehouse Management',         description: 'Inventory and warehouse management for cargo terminals.',         startingPrice: '$149/mo', icon: 'ri-store-3-line'             },
    { id: 'rev-acc',      domainId: 'air-cargo',  name: 'Revenue Accounting',           description: 'Automated revenue accounting, proration, and settlement.',        startingPrice: '$399/mo', icon: 'ri-money-dollar-circle-line' },
    { id: 'cargo-portal', domainId: 'air-cargo',  name: 'Cargo Portal',                 description: 'Self-service booking and tracking for shippers and forwarders.',  startingPrice: '$99/mo',  icon: 'ri-global-line'              },
    { id: 'ccs',          domainId: 'air-cargo',  name: 'Cargo Community System',       description: 'Multi-party cargo community collaboration and messaging.',        startingPrice: '$499/mo', icon: 'ri-team-line'                },
    { id: 'pms',          domainId: 'shipping',   name: 'Port Management System',       description: 'Complete port operations and vessel management.',                  startingPrice: '$599/mo', icon: 'ri-anchor-line'              },
    { id: 'vts',          domainId: 'shipping',   name: 'Vessel Tracking System',       description: 'Real-time vessel tracking with AIS data integration.',            startingPrice: '$249/mo', icon: 'ri-radar-line'               },
    { id: 'wms-log',      domainId: 'logistics',  name: 'Warehouse Management',         description: 'Advanced WMS with barcode scanning and RFID support.',            startingPrice: '$199/mo', icon: 'ri-store-3-line'             },
    { id: 'tms',          domainId: 'logistics',  name: 'Transport Management',         description: 'Route optimisation and fleet management solution.',                startingPrice: '$299/mo', icon: 'ri-truck-line'               },
    { id: 'cold-chain',   domainId: 'pharma',     name: 'Cold Chain Management',        description: 'Temperature-controlled logistics with IoT integration.',          startingPrice: '$449/mo', icon: 'ri-temp-cold-line'           },
    { id: 'pharma-track', domainId: 'pharma',     name: 'Track & Trace',                description: 'End-to-end pharmaceutical traceability and compliance.',          startingPrice: '$349/mo', icon: 'ri-qr-code-line'             },
    { id: 'erp',          domainId: 'enterprise', name: 'Enterprise Resource Planning', description: 'Comprehensive ERP for general business operations.',              startingPrice: '$199/mo', icon: 'ri-layout-grid-line'         },
    { id: 'crm',          domainId: 'enterprise', name: 'Customer Relationship Mgmt',  description: 'CRM for managing customer interactions and sales.',                startingPrice: '$99/mo',  icon: 'ri-user-heart-line'          },
  ],

  allStakeholders: [
    { id: 'airline',           domainId: 'air-cargo',  productIds: ['cms','ghs','rev-acc','ccs','cargo-portal'],  name: 'Airline',                    icon: 'ri-plane-line',        description: 'Operate cargo flights, manage capacity and terminal operations.'    },
    { id: 'gha',               domainId: 'air-cargo',  productIds: ['ghs','cms','ccs'],                           name: 'Ground Handling Agent',      icon: 'ri-building-line',     description: 'Provide cargo acceptance, delivery and ramp handling services.'     },
    { id: 'freight-forwarder', domainId: 'air-cargo',  productIds: ['cargo-portal','ccs','wms-cargo'],            name: 'Freight Forwarder',          icon: 'ri-exchange-box-line', description: 'Book and consolidate cargo shipments on behalf of shippers.'       },
    { id: 'shipper',           domainId: 'air-cargo',  productIds: ['cargo-portal','ccs'],                        name: 'Shipper',                    icon: 'ri-box-3-line',        description: 'Ship goods via air freight and track shipment status.'             },
    { id: 'consignee',         domainId: 'air-cargo',  productIds: ['cargo-portal','ccs'],                        name: 'Consignee',                  icon: 'ri-archive-line',      description: 'Receive cargo shipments and manage last-mile delivery.'            },
    { id: 'trucking',          domainId: 'air-cargo',  productIds: ['cms','cargo-portal'],                        name: 'Trucking Company',           icon: 'ri-truck-line',        description: 'Provide ground transportation for cargo pickup and delivery.'       },
    { id: 'customs-broker',    domainId: 'air-cargo',  productIds: ['cargo-portal','ccs'],                        name: 'Customs Broker',             icon: 'ri-file-text-line',    description: 'Handle customs clearance and compliance for import/export cargo.'   },
    { id: 'port-operator',     domainId: 'shipping',   productIds: ['pms','vts'],                                 name: 'Port Operator',              icon: 'ri-anchor-line',       description: 'Manage port operations, berth allocation, and vessel handling.'     },
    { id: 'shipping-line',     domainId: 'shipping',   productIds: ['pms','vts'],                                 name: 'Shipping Line',              icon: 'ri-ship-line',         description: 'Operate vessel fleets and manage maritime cargo operations.'        },
    { id: 'warehouse-op',      domainId: 'logistics',  productIds: ['wms-log'],                                   name: 'Warehouse Operator',         icon: 'ri-store-3-line',      description: 'Manage warehouse facilities, inventory, and fulfilment.'           },
    { id: 'lsp',               domainId: 'logistics',  productIds: ['tms','wms-log'],                             name: 'Logistics Service Provider', icon: 'ri-truck-line',        description: 'Offer end-to-end logistics and supply chain services.'             },
    { id: 'pharma-mfg',        domainId: 'pharma',     productIds: ['cold-chain','pharma-track'],                 name: 'Pharmaceutical Manufacturer',icon: 'ri-flask-line',        description: 'Manufacture and distribute pharmaceutical products with compliance.'},
    { id: 'enterprise-user',   domainId: 'enterprise', productIds: ['erp','crm'],                                 name: 'Enterprise Organisation',    icon: 'ri-building-2-line',   description: 'General enterprise business operations and process management.'      },
  ],

  subscriptionPlans: [
    { id: 'starter',      name: 'Starter',      price: 'Free',          priceValue: 0,   priceSubtext: 'Forever free',   description: 'Perfect for small teams getting started.',               features: ['Up to 5 Users','Basic Features','Email Support','5 GB Storage','Standard Reports'] },
    { id: 'professional', name: 'Professional', price: '$499',          priceValue: 499, priceSubtext: 'per month',      description: 'For growing businesses with full operational needs.',     features: ['Unlimited Users','Full Operations Suite','Advanced Reporting','REST APIs','Priority Support','100 GB Storage','Custom Workflows'], badge: 'Most Popular' },
    { id: 'enterprise',   name: 'Enterprise',   price: 'Contact Sales', priceValue: 0,   priceSubtext: 'Custom pricing', description: 'Unlimited scale with dedicated support and SLAs.',        features: ['Everything in Professional','Multi-Organisation','Dedicated SLA','Account Manager','On-premise Option','Custom Integrations'] },
  ],

  serviceAddons: [
    { id: 'cargo-imp', name: 'Cargo-IMP Messaging',  description: 'IATA airline messaging: FWB, FHL, FSU, AWB.',    price: '$99/mo',  priceValue: 99,  icon: 'ri-mail-send-line',      category: 'Messaging'    },
    { id: 'edi',       name: 'EDI Gateway',           description: 'Electronic Data Interchange for partners.',       price: '$129/mo', priceValue: 129, icon: 'ri-exchange-2-line',     category: 'Integration'  },
    { id: 'mobile',    name: 'Mobile Application',    description: 'Native iOS and Android apps for field teams.',    price: '$79/mo',  priceValue: 79,  icon: 'ri-smartphone-line',     category: 'Productivity' },
    { id: 'bi',        name: 'Business Intelligence', description: 'Analytics dashboards and custom report builder.', price: '$149/mo', priceValue: 149, icon: 'ri-bar-chart-2-line',    category: 'Analytics'    },
    { id: 'ai',        name: 'AI Assistant',          description: 'AI-powered assistant for process automation.',    price: '$199/mo', priceValue: 199, icon: 'ri-robot-line',          category: 'AI'           },
    { id: 'iot',       name: 'IoT Tracking',          description: 'Real-time IoT sensor integration for tracking.',  price: '$149/mo', priceValue: 149, icon: 'ri-radar-line',          category: 'Tracking'     },
    { id: 'api',       name: 'API Access',            description: 'Full REST API for custom integrations.',          price: '$99/mo',  priceValue: 99,  icon: 'ri-code-box-line',       category: 'Developer'    },
    { id: 'training',  name: 'Training & Onboarding', description: 'Dedicated onboarding sessions for your team.',   price: '$299/mo', priceValue: 299, icon: 'ri-graduation-cap-line', category: 'Support'      },
  ],

  steps: [
    { title: 'Domain',        desc: 'Choose your industry domain',                icon: 'ri-global-line'          },
    { title: 'Products',      desc: 'Select the products you need',               icon: 'ri-apps-line'            },
    { title: 'Stakeholder',   desc: 'Define your role in the supply chain',       icon: 'ri-user-star-line'       },
    { title: 'Organisation',  desc: 'Your organisation and administrator details', icon: 'ri-building-2-line'      },
    { title: 'Plan & Address',desc: 'Subscription plan and billing address',      icon: 'ri-price-tag-3-line'     },
    { title: 'Review',        desc: 'Add services and confirm your setup',        icon: 'ri-checkbox-circle-line' },
  ],

  countries:          ['India','United States','United Kingdom','United Arab Emirates','Singapore','Germany','France','Japan','Australia','Canada'],
  timezones:          ['Asia/Kolkata (IST +5:30)','America/New_York (EST -5:00)','Europe/London (GMT +0:00)','Asia/Dubai (GST +4:00)','Asia/Singapore (SGT +8:00)','Europe/Berlin (CET +1:00)'],
  organizationSizes:  ['1–10','11–50','51–200','201–500','501–1000','1000+'],
  industries:         ['Air Cargo','Shipping & Maritime','Logistics & Warehousing','Pharmaceutical Supply Chain','Retail','Manufacturing','Finance','General Enterprise'],
  operationalRegions: ['Asia Pacific','Europe','North America','Middle East & Africa','South America','Global'],
  ghaServicesList:    ['Cargo Acceptance','Cargo Delivery','Ramp Handling','ULD Management','Dangerous Goods Handling','Live Animals','Temperature-Sensitive Cargo'],
}
