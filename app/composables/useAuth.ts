// app/composables/useAuth.ts
import { ref, computed } from 'vue'

interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'instructor' | 'staff'
  avatar?: string
}

const user = ref<User | null>(null)
const isLoading = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isInstructor = computed(() => user.value?.role === 'instructor')

  const login = async (username: string, password: string) => {
    isLoading.value = true
    
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })

      user.value = response.user
      
      // Salvar no localStorage
      if (process.client) {
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('user_data', JSON.stringify(response.user))
      }

      return response
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    
    if (process.client) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    }
    
    navigateTo('/login')
  }

  const checkAuth = async () => {
    if (process.client) {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      
      if (token && userData) {
        try {
          const response = await $fetch('/api/auth/verify', {
            headers: { authorization: `Bearer ${token}` }
          })
          
          user.value = response.user
          return true
        } catch (error) {
          // Token inválido, limpar dados
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          return false
        }
      }
    }
    
    return false
  }

  const getAuthHeaders = () => {
    if (process.client) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        return { authorization: `Bearer ${token}` }
      }
    }
    return {}
  }

  // Inicializar dados do usuário se existirem
  if (process.client) {
    const userData = localStorage.getItem('user_data')
    if (userData) {
      user.value = JSON.parse(userData)
    }
  }

  return {
    user: readonly(user),
    isAuthenticated,
    isAdmin,
    isInstructor,
    isLoading: readonly(isLoading),
    login,
    logout,
    checkAuth,
    getAuthHeaders
  }
}

// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { checkAuth } = useAuth()
  
  const isAuthenticated = await checkAuth()
  
  if (!isAuthenticated) {
    return navigateTo('/login')
  }
})

// app/middleware/admin.ts
export default defineNuxtRouteMiddleware(async (to) => {
  const { checkAuth, user } = useAuth()
  
  const isAuthenticated = await checkAuth()
  
  if (!isAuthenticated) {
    return navigateTo('/login')
  }
  
  if (user.value?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acesso negado. Apenas administradores.'
    })
  }
})

// app/plugins/auth.client.ts
export default defineNuxtPlugin(async () => {
  const { checkAuth } = useAuth()
  
  // Verificar autenticação na inicialização
  await checkAuth()
})