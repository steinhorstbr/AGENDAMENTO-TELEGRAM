<!-- app/pages/index.vue -->
<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header Mobile/Desktop -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-20">
      <div class="px-4 py-3 flex items-center justify-between">
        <!-- Menu mobile -->
        <button
          @click="showMobileMenu = !showMobileMenu"
          class="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Logo e título -->
        <div class="flex items-center gap-3">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg w-8 h-8 flex items-center justify-center">
            <span class="text-white text-lg">🥋</span>
          </div>
          <h1 class="font-bold text-gray-800 text-lg lg:text-xl">Agenda BJJ</h1>
        </div>

        <!-- User menu -->
        <div class="flex items-center gap-3">
          <!-- Notificações (mobile) -->
          <button
            v-if="pendingTasks.length > 0"
            @click="showNotifications = !showNotifications"
            class="lg:hidden relative p-2 rounded-lg hover:bg-gray-100"
          >
            <svg class="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {{ pendingTasks.length }}
            </span>
          </button>

          <!-- User avatar -->
          <div class="relative">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
            >
              <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span class="text-indigo-600 font-medium text-sm">
                  {{ currentUser?.name?.charAt(0)?.toUpperCase() }}
                </span>
              </div>
              <span class="hidden lg:inline text-sm font-medium text-gray-700">
                {{ currentUser?.name }}
              </span>
            </button>

            <!-- User dropdown -->
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-30"
            >
              <div class="px-4 py-2 border-b">
                <p class="text-sm font-medium text-gray-800">{{ currentUser?.name }}</p>
                <p class="text-xs text-gray-500">{{ getRoleLabel(currentUser?.role) }}</p>
              </div>
              
              <button
                v-if="isAdmin"
                @click="navigateTo('/admin')"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                👥 Administração
              </button>
              
              <button
                @click="logout"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                🚪 Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Week navigation -->
      <WeekHeaderMobile
        :base-date="currentDate"
        :current-user="currentUser"
        @change="setBase"
        @add="openNew()"
      />
    </header>

    <!-- Mobile sidebar -->
    <div
      v-if="showMobileMenu"
      class="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
      @click="showMobileMenu = false"
    >
      <div class="bg-white w-80 h-full shadow-lg p-4" @click.stop>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold">Menu</h2>
          <button @click="showMobileMenu = false" class="p-2 hover:bg-gray-100 rounded">
            ✕
          </button>
        </div>

        <!-- Filtros rápidos -->
        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Filtrar por categoria</h3>
            <div class="space-y-2">
              <button
                @click="selectedCategory = null; showMobileMenu = false"
                :class="[
                  'w-full text-left px-3 py-2 rounded-lg text-sm',
                  !selectedCategory ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                ]"
              >
                📋 Todas as categorias
              </button>
              <button
                v-for="category in categories"
                :key="category.id"
                @click="selectedCategory = category.id; showMobileMenu = false"
                :class="[
                  'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2',
                  selectedCategory === category.id ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                ]"
              >
                <span>{{ category.icon }}</span>
                {{ category.name }}
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-2">Minhas tarefas</h3>
            <div class="space-y-2">
              <button
                @click="showOnlyMyTasks = false; showMobileMenu = false"
                :class="[
                  'w-full text-left px-3 py-2 rounded-lg text-sm',
                  !showOnlyMyTasks ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                ]"
              >
                👥 Todas as tarefas
              </button>
              <button
                @click="showOnlyMyTasks = true; showMobileMenu = false"
                :class="[
                  'w-full text-left px-3 py-2 rounded-lg text-sm',
                  showOnlyMyTasks ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'
                ]"
              >
                👤 Apenas minhas tarefas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop sidebar -->
    <div class="flex flex-1 overflow-hidden">
      <aside class="hidden lg:block w-64 bg-white border-r">
        <div class="p-4 space-y-6">
          <!-- Ações rápidas -->
          <div>
            <h3 class="text-sm font-semibold text-gray-800 mb-3">Ações Rápidas</h3>
            <div class="space-y-2">
              <button
                @click="openNew()"
                class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                ➕ Nova Tarefa
              </button>
              
              <button
                v-if="isAdmin"
                @click="navigateTo('/admin')"
                class="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                👥 Administração
              </button>
            </div>
          </div>

          <!-- Notificações -->
          <div v-if="pendingTasks.length > 0">
            <h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              🔔 Pendências
              <span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {{ pendingTasks.length }}
              </span>
            </h3>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              <div
                v-for="task in pendingTasks.slice(0, 3)"
                :key="task.id"
                class="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm"
              >
                <p class="font-medium text-orange-800">{{ task.title }}</p>
                <p class="text-orange-600 text-xs">{{ task.start }} - {{ task.end }}</p>
              </div>
            </div>
          </div>

          <!-- Filtros -->
          <div>
            <h3 class="text-sm font-semibold text-gray-800 mb-3">Filtros</h3>
            
            <!-- Categoria -->
            <div class="mb-4">
              <label class="text-xs text-gray-600 mb-2 block">Categoria</label>
              <select
                v-model="selectedCategory"
                class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option :value="null">Todas as categorias</option>
                <option
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.icon }} {{ category.name }}
                </option>
              </select>
            </div>

            <!-- Minhas tarefas -->
            <label class="flex items-center gap-2 text-sm">
              <input
                v-model="showOnlyMyTasks"
                type="checkbox"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Apenas minhas tarefas
            </label>
          </div>

          <!-- Estatísticas rápidas -->
          <div>
            <h3 class="text-sm font-semibold text-gray-800 mb-3">Esta Semana</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Total:</span>
                <span class="font-medium">{{ filteredItems.length }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Concluídas:</span>
                <span class="font-medium text-green-600">{{ completedCount }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Pendentes:</span>
                <span class="font-medium text-orange-600">{{ pendingCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 overflow-auto">
        <div v-if="isLoading" class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            <p class="text-gray-600">Carregando agenda...</p>
          </div>
        </div>

        <!-- Grid da agenda -->
        <div v-else class="p-4">
          <ScheduleGridEnhanced
            :days="days"
            :items="filteredItems"
            :current-user="currentUser"
            :categories="categories"
            :start-hour="8"
            :end-hour="20"
            @edit="editItem"
            @delete="deleteItem"
            @complete="openCompleteModal"
            @assign="openAssignModal"
          />
        </div>
      </main>
    </div>

    <!-- Modais -->
    <ScheduleModalEnhanced
      v-model="showModal"
      :edit-item="editingItem"
      :default-date="selectedDate"
      :categories="categories"
      :users="users"
      :current-user="currentUser"
      @save="saveSchedule"
    />

    <CompleteTaskModal
      v-model="showCompleteModal"
      :task="completingTask"
      @save="saveTaskCompletion"
    />

    <AssignTaskModal
      v-model="showAssignModal"
      :task="assigningTask"
      :users="users"
      :current-user="currentUser"
      @save="saveTaskAssignment"
    />

    <!-- Telegram Status -->
    <div class="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 z-10">
      <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      📲 Telegram ativo
    </div>

    <!-- Loading overlay -->
    <div v-if="isSubmitting" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6 flex items-center gap-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        <span>Salvando...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Middleware de autenticação
definePageMeta({
  middleware: 'auth'
})

// Composables
const { user: currentUser, isAdmin, logout } = useAuth()
const { items, isLoading, loadItems, addItem, updateItem, removeItem } = useSchedule()

// State
const baseDate = ref(new Date())
const selectedCategory = ref<string | null>(null)
const showOnlyMyTasks = ref(false)
const showMobileMenu = ref(false)
const showUserMenu = ref(false)
const showNotifications = ref(false)
const isSubmitting = ref(false)

// Modals
const showModal = ref(false)
const editingItem = ref<any>(null)
const selectedDate = ref<string | undefined>(undefined)

const showCompleteModal = ref(false)
const completingTask = ref<any>(null)

const showAssignModal = ref(false)
const assigningTask = ref<any>(null)

// Data
const categories = ref<any[]>([])
const users = ref<any[]>([])

// Computed
const currentDate = computed(() => baseDate.value)

const days = computed(() => {
  const day0 = new Date(baseDate.value)
  const diff = day0.getDay()
  day0.setDate(day0.getDate() - diff)
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(day0)
    d.setDate(d.getDate() + i)
    const date = d.toISOString().split('T')[0] as string
    return { date }
  })
})

const filteredItems = computed(() => {
  let filtered = items.value

  // Filtrar por categoria
  if (selectedCategory.value) {
    filtered = filtered.filter(item => item.category_id === selectedCategory.value)
  }

  // Filtrar apenas minhas tarefas
  if (showOnlyMyTasks.value && currentUser.value) {
    filtered = filtered.filter(item => 
      item.assigned_to === currentUser.value?.id || 
      item.created_by === currentUser.value?.id
    )
  }

  return filtered
})

const pendingTasks = computed(() => {
  return filteredItems.value.filter(item => 
    !Boolean(item.is_completed) && 
    item.assigned_to === currentUser.value?.id
  )
})

const completedCount = computed(() => 
  filteredItems.value.filter(item => Boolean(item.is_completed)).length
)

const pendingCount = computed(() => 
  filteredItems.value.filter(item => !Boolean(item.is_completed)).length
)

// Methods
function setBase(d: Date) {
  baseDate.value = d
  loadWeekItems()
}

function openNew(date?: string) {
  editingItem.value = null
  selectedDate.value = date
  showModal.value = true
}

function editItem(item: any) {
  editingItem.value = item
  selectedDate.value = item.date
  showModal.value = true
}

function openCompleteModal(item: any) {
  completingTask.value = item
  showCompleteModal.value = true
}

function openAssignModal(item: any) {
  assigningTask.value = item
  showAssignModal.value = true
}

async function deleteItem(id: string) {
  if (!confirm('Tem certeza que deseja excluir este item?')) return
  
  try {
    await removeItem(id)
  } catch (error: any) {
    alert(error?.message || 'Erro ao excluir item')
  }
}

async function saveSchedule(itemData: any) {
  isSubmitting.value = true
  try {
    if (itemData.id && editingItem.value) {
      await updateItem(itemData.id, itemData)
    } else {
      await addItem({
        ...itemData,
        created_by: currentUser.value?.id
      })
    }
  } catch (error: any) {
    alert(error?.message || 'Erro ao salvar')
  } finally {
    isSubmitting.value = false
  }
}

async function saveTaskCompletion(completionData: any) {
  isSubmitting.value = true
  try {
    // Implementar API de finalização
    await $fetch('/api/task-completion', {
      method: 'POST',
      headers: useAuth().getAuthHeaders(),
      body: {
        task_id: completingTask.value?.id,
        completed_by: currentUser.value?.id,
        ...completionData
      }
    })
    
    // Marcar como finalizada
    await updateItem(completingTask.value?.id, {
      ...completingTask.value,
      is_completed: true
    })
    
    showCompleteModal.value = false
  } catch (error: any) {
    alert(error?.message || 'Erro ao finalizar tarefa')
  } finally {
    isSubmitting.value = false
  }
}

async function saveTaskAssignment(assignmentData: any) {
  isSubmitting.value = true
  try {
    // Implementar API de atribuição
    await $fetch('/api/task-assignment', {
      method: 'POST',
      headers: useAuth().getAuthHeaders(),
      body: {
        task_id: assigningTask.value?.id,
        assigned_by: currentUser.value?.id,
        ...assignmentData
      }
    })
    
    // Atualizar tarefa
    await updateItem(assigningTask.value?.id, {
      ...assigningTask.value,
      assigned_to: assignmentData.assigned_to
    })
    
    showAssignModal.value = false
  } catch (error: any) {
    alert(error?.message || 'Erro ao atribuir tarefa')
  } finally {
    isSubmitting.value = false
  }
}

async function loadWeekItems() {
  try {
    await loadItems()
  } catch (error) {
    console.error('Error loading items:', error)
  }
}

async function loadCategories() {
  try {
    categories.value = await $fetch('/api/categories')
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

async function loadUsers() {
  try {
    if (isAdmin.value || currentUser.value?.role === 'instructor') {
      users.value = await $fetch('/api/auth/users', {
        headers: useAuth().getAuthHeaders()
      })
    }
  } catch (error) {
    console.error('Error loading users:', error)
  }
}

function getRoleLabel(role?: string) {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    instructor: 'Instrutor',
    staff: 'Funcionário'
  }
  return labels[role || ''] || role
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadWeekItems(),
    loadCategories(),
    loadUsers()
  ])
})

// Close dropdowns when clicking outside
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target?.closest('.user-menu')) {
      showUserMenu.value = false
    }
  })
})

// SEO
useHead({
  title: 'Dashboard - Agenda BJJ',
  meta: [
    { name: 'description', content: 'Sistema de agendamento para academias de BJJ' }
  ]
})
</script>

<style scoped>
/* Scroll suave para mobile */
.overflow-auto {
  -webkit-overflow-scrolling: touch;
}

/* Animações */
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.slide-enter-active {
  animation: slideIn 0.3s ease-out;
}
</style>