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