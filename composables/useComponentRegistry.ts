import type { Component } from 'vue'

export function useComponentRegistry() {
  const { $componentRegistry } = useNuxtApp()

  function resolveComponent(vtype?: string, isThisForDesign : boolean = false): Component | null {
    if (!vtype) return null

    // const key = `emcrt${vtype.toLowerCase()}`
    const key = `emc${isThisForDesign === false ? 'rt' : 'dt'}${vtype.toLowerCase()}`
    return $componentRegistry[key] ?? null
  }

  return {
    resolveComponent,
    registry: $componentRegistry,
  }
}
