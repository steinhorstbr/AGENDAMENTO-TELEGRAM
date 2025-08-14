<!-- app/pages/admin.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="px-4 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button @click="$router.back()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            ←
          </button>
          <h1 class="text-xl font-bold text-gray-800">Administração</h1>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-600">{{ currentUser?.name }}</span>
          <button @click="logout" class="text-sm text-red-600 hover:text-red-700">
            Sair
          </button>
        </div>
      </div>
    </header>

    <div class="p-4 max-w-7xl mx-auto">
      <!-- Tabs -->
      <div class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              {{ tab.icon }} {{ tab.name }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Usuários Tab -->
      <div v-if="activeTab === 'users'" class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">Gerenciar Usuários</h2>
          <button
            @click="openUserModal()"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            👤 Novo Usuário
          </button>
        </div>

        <!-- Lista de usuários -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-md font-medium text-gray-800">Usuários do Sistema</h3>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Perfil
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span class="text-indigo-600 font-medium text-sm">
                            {{ user.name.charAt(0).toUpperCase() }}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                        <div class="text-sm text-gray-500">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="[
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    ]">
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="[
                      'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    ]">
                      {{ user.is_active ? 'Ativo' : 'Inativo' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(user.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="openUserModal(user)"
                      class="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      v-if="user.id !== currentUser?.id"
                      @click="toggleUserStatus(user)"
                      :class="[
                        'hover:text-red-900',
                        user.is_active ? 'text-red-600' : 'text-green-600'
                      ]"
                    >
                      {{ user.is_active ? 'Desativar' : 'Ativar' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Categorias Tab -->
      <div v-if="activeTab === 'categories'" class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-800">Gerenciar Categorias</h2>
          <button
            @click="openCategoryModal()"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            🏷️ Nova Categoria
          </button>
        </div>

        <!-- Grid de categorias -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="category in categories"
            :key="category.id"
            class="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ category.icon || '🏷️' }}</span>
                <div>
                  <h3 class="font-medium text-gray-800">{{ category.name }}</h3>
                  <p class="text-xs text-gray-500">por {{ category.created_by_name }}</p>
                </div>
              </div>
              <div
                class="w-6 h-6 rounded-full border-2 border-gray-200"
                :style="{ backgroundColor: category.color }"
              ></div>
            </div>
            
            <p v-if="category.description" class="text-sm text-gray-600 mb-3">
              {{ category.description }}
            </p>
            
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="openCategoryModal(category)"
                class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
              >
                Editar
              </button>
              <button
                @click="toggleCategoryStatus(category)"
                class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
              >
                {{ category.is_active ? 'Desativar' : 'Ativar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de usuário -->
    <UserModal
      v-model="showUserModal"
      :edit-user="editingUser"
      @save="saveUser"
    />

    <!-- Modal de categoria -->
    <CategoryModal
      v-model="showCategoryModal"
      :edit-category="editingCategory"
      @save="saveCategory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Middleware de autenticação
definePageMeta({
  middleware: 'auth'
})

const currentUser = ref<any>(null)
const activeTab = ref('users')
const users = ref<any[]>([])
const categories = ref<any[]>([])

const showUserModal = ref(false)
const editingUser = ref<any>(null)

const showCategoryModal = ref(false)
const editingCategory = ref<any>(null)

const tabs = [
  { id: 'users', name: 'Usuários', icon: '👥' },
  { id: 'categories', name: 'Categorias', icon: '🏷️' }
]

onMounted(async () => {
  // Verificar se usuário é admin
  const userData = localStorage.getItem('user_data')
  if (userData) {
    currentUser.value = JSON.parse(userData)
    if (currentUser.value.role !== 'admin') {
      await navigateTo('/')
      return
    }
  }

  await loadUsers()
  await loadCategories()
})

const loadUsers = async () => {
  try {
    const token = localStorage.getItem('auth_token')
    users.value = await $fetch('/api/auth/users', {
      headers: { authorization: `Bearer ${token}` }
    })
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
  }
}

const loadCategories = async () => {
  try {
    categories.value = await $fetch('/api/categories')
  } catch (error) {
    console.error('Erro ao carregar categorias:', error)
  }
}

const openUserModal = (user?: any) => {
  editingUser.value = user || null
  showUserModal.value = true
}

const openCategoryModal = (category?: any) => {
  editingCategory.value = category || null
  showCategoryModal.value = true
}

const saveUser = async (userData: any) => {
  try {
    const token = localStorage.getItem('auth_token')
    
    if (editingUser.value) {
      await $fetch('/api/auth/users', {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}` },
        body: { ...userData, id: editingUser.value.id }
      })
    } else {
      await $fetch('/api/auth/users', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: userData
      })
    }
    
    await loadUsers()
    showUserModal.value = false
  } catch (error: any) {
    alert(error.data?.statusMessage || 'Erro ao salvar usuário')
  }
}

const saveCategory = async (categoryData: any) => {
  try {
    if (editingCategory.value) {
      await $fetch('/api/categories', {
        method: 'PUT',
        body: { ...categoryData, id: editingCategory.value.id }
      })
    } else {
      await $fetch('/api/categories', {
        method: 'POST',
        body: { ...categoryData, created_by: currentUser.value.id }
      })
    }
    
    await loadCategories()
    showCategoryModal.value = false
  } catch (error: any) {
    alert(error.data?.statusMessage || 'Erro ao salvar categoria')
  }
}

const toggleUserStatus = async (user: any) => {
  if (!confirm(`${user.is_active ? 'Desativar' : 'Ativar'} usuário ${user.name}?`)) return
  
  try {
    const token = localStorage.getItem('auth_token')
    await $fetch('/api/auth/users', {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}` },
      body: { ...user, is_active: !user.is_active }
    })
    await loadUsers()
  } catch (error: any) {
    alert(error.data?.statusMessage || 'Erro ao alterar status')
  }
}

const toggleCategoryStatus = async (category: any) => {
  if (!confirm(`${category.is_active ? 'Desativar' : 'Ativar'} categoria ${category.name}?`)) return
  
  try {
    await $fetch('/api/categories', {
      method: 'PUT',
      body: { ...category, is_active: !category.is_active }
    })
    await loadCategories()
  } catch (error: any) {
    alert(error.data?.statusMessage || 'Erro ao alterar status')
  }
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    instructor: 'Instrutor',
    staff: 'Funcionário'
  }
  return labels[role] || role
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const logout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_data')
  navigateTo('/login')
}
</script>