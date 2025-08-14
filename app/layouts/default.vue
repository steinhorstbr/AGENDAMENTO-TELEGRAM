<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Toast notifications -->
    <Toast />
    
    <!-- Main content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Mobile bottom navigation -->
    <MobileBottomNav v-if="showMobileNav" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const { isAuthenticated } = useAuth()

// Show mobile nav only on authenticated pages (not login)
const showMobileNav = computed(() => 
  process.client && 
  window.innerWidth < 1024 && 
  isAuthenticated.value &&
  route.name !== 'login'
)

// Global error handling
if (process.client) {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    useToast().error('Ocorreu um erro inesperado')
  })
}

// Set up global keyboard shortcuts
onMounted(() => {
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to open search (future feature)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      // TODO: Open search modal
    }
    
    // Escape to close modals (handled by individual components)
    if (e.key === 'Escape') {
      // Let components handle this
    }
  })
})
</script>