<!-- app/layouts/default.vue -->
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

<!-- app/layouts/auth.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
    <slot />
  </div>
</template>

<!-- app/components/MobileBottomNav.vue -->
<template>
  <nav class="mobile-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
    <div class="flex items-center justify-around px-2 py-1">
      <button
        v-for="item in navItems"
        :key="item.name"
        @click="handleNavClick(item)"
        :class="[
          'mobile-nav-item flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-0 flex-1',
          isActive(item) ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'
        ]"
      >
        <span class="text-lg leading-none">{{ item.icon }}</span>
        <span class="text-xs font-medium truncate">{{ item.label }}</span>
        
        <!-- Badge for notifications -->
        <div 
          v-if="item.badge && item.badge > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
        >
          {{ item.badge > 99 ? '99+' : item.badge }}
        </div>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()
const { user, isAdmin } = useAuth()
const { pendingTasks } = useSchedule()

interface NavItem {
  name: string
  label: string
  icon: string
  route?: string
  action?: () => void
  badge?: number
  adminOnly?: boolean
}

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    {
      name: 'dashboard',
      label: 'Agenda',
      icon: '📅',
      route: '/',
      badge: pendingTasks.value?.length || 0
    },
    {
      name: 'add',
      label: 'Nova',
      icon: '➕',
      action: () => showCreateModal()
    },
    {
      name: 'profile',
      label: 'Perfil',
      icon: '👤',
      action: () => showUserMenu()
    }
  ]
  
  // Add admin item if user is admin
  if (isAdmin.value) {
    items.splice(2, 0, {
      name: 'admin',
      label: 'Admin',
      icon: '⚙️',
      route: '/admin',
      adminOnly: true
    })
  }
  
  return items
})

function isActive(item: NavItem): boolean {
  if (item.route) {
    return route.path === item.route
  }
  return false
}

function handleNavClick(item: NavItem) {
  if (item.route) {
    router.push(item.route)
  } else if (item.action) {
    item.action()
  }
}

function showCreateModal() {
  // Emit event to parent to show create modal
  // This would be handled by the main page component
  window.dispatchEvent(new CustomEvent('show-create-modal'))
}

function showUserMenu() {
  // Emit event to show user menu
  window.dispatchEvent(new CustomEvent('show-user-menu'))
}
</script>

<style scoped>
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.mobile-nav-item {
  position: relative;
  max-width: 80px;
}

@media (max-width: 320px) {
  .mobile-nav-item {
    max-width: 60px;
  }
  
  .mobile-nav-item .text-xs {
    font-size: 0.65rem;
  }
}
</style>

<!-- app/components/LoadingPage.vue -->
<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="mb-8">
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
          <span class="text-white text-3xl">🥋</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Agenda BJJ</h1>
        <p class="text-gray-600">Carregando sistema...</p>
      </div>
      
      <div class="flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
      
      <div class="mt-8 text-sm text-gray-500">
        <p>Inicializando banco de dados...</p>
      </div>
    </div>
  </div>
</template>

<!-- app/components/ErrorBoundary.vue -->
<template>
  <div v-if="error" class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <div class="bg-red-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        <span class="text-red-600 text-3xl">⚠️</span>
      </div>
      
      <h1 class="text-2xl font-bold text-gray-800 mb-4">Oops! Algo deu errado</h1>
      <p class="text-gray-600 mb-6">
        Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
      </p>
      
      <div class="space-y-3">
        <button
          @click="retry"
          class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Tentar Novamente
        </button>
        
        <button
          @click="goHome"
          class="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Voltar ao Início
        </button>
      </div>
      
      <details class="mt-8 text-left">
        <summary class="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
          Detalhes técnicos
        </summary>
        <pre class="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto text-gray-700">{{ error }}</pre>
      </details>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<string | null>(null)

onErrorCaptured((err) => {
  console.error('Error captured:', err)
  error.value = err.toString()
  
  // Report to error tracking service (future implementation)
  // reportError(err)
  
  return false // Prevent error from bubbling up
})

function retry() {
  error.value = null
  // Reload the page or component
  window.location.reload()
}

function goHome() {
  error.value = null
  navigateTo('/')
}
</script>

<!-- app/components/OfflineBanner.vue -->
<template>
  <transition name="slide-down">
    <div
      v-if="!isOnline"
      class="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 z-50"
    >
      <div class="flex items-center justify-center gap-2">
        <span class="text-sm font-medium">📡 Você está offline</span>
        <button
          v-if="canRetry"
          @click="retry"
          class="text-xs bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded transition-colors"
        >
          Reconectar
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isOnline = ref(true)
const canRetry = ref(false)

function updateOnlineStatus() {
  isOnline.value = navigator.onLine
  if (!isOnline.value) {
    canRetry.value = true
  }
}

function retry() {
  updateOnlineStatus()
  if (isOnline.value) {
    canRetry.value = false
    useToast().success('Conexão restaurada!')
  }
}

onMounted(() => {
  updateOnlineStatus()
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>