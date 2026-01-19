import { componentRegistry } from '@/utils/componentRegistry.client'

export default defineNuxtPlugin(() => {
  console.log('🚀 ComponentRegistry plugin initialized')

  return {
    provide: {
      componentRegistry,
    },
  }
})
