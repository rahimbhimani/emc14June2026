import { defineAsyncComponent, type Component } from 'vue'

console.log('🔥 ComponentRegistry file loaded')

// ✅ ROOT-BASED PATH (Nuxt 4, no app folder)
const modules = import.meta.glob('/components/**/*.vue')

console.log('🔍 Glob matched files:', Object.keys(modules))

export const componentRegistry: Record<string, Component> = {}

for (const path in modules) {
  const rawName = path.split('/').pop()?.replace('.vue', '')
  if (!rawName) continue

  const key = rawName
    .replace('.global', '')
    .toLowerCase()

  console.log('➕ Registering:', key)

  componentRegistry[key] = defineAsyncComponent({
    loader: modules[path] as () => Promise<any>,
  })
}

console.log(
  `[ComponentRegistry] ${Object.keys(componentRegistry).length} components registered`
)
