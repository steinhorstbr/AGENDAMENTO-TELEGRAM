<!-- app/pages/login.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <!-- Logo e título -->
      <div class="text-center mb-8">
        <div class="bg-white rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
          <span class="text-3xl">🥋</span>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Agenda BJJ</h1>
        <p class="text-indigo-100">Sistema de Agendamento</p>
      </div>

      <!-- Formulário de login -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
              Usuário
            </label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              placeholder="Digite seu usuário"
              :disabled="isLoading"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                placeholder="Digite sua senha"
                :disabled="isLoading"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <!-- Mensagem de erro -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center">
              <span class="text-red-600 mr-2">⚠️</span>
              <span class="text-red-700 text-sm">{{ errorMessage }}</span>
            </div>
          </div>

          <!-- Botão de login -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Entrando...
            </span>
            <span v-else>Entrar</span>
          </button>
        </form>

        <!-- Informações padrão -->
        <div class="mt-6 pt-6 border-t border-gray-200">
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="text-sm font-medium text-blue-800 mb-2">📋 Acesso Padrão</h3>
            <div class="text-sm text-blue-700 space-y-1">
              <div><strong>Usuário:</strong> admin</div>
              <div><strong>Senha:</strong> admin123</div>
              <div class="text-xs text-blue-600 mt-2">
                ⚠️ Altere a senha após o primeiro acesso!
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-8 text-indigo-100 text-sm">
        <p>Sistema de Agendamento com Telegram Bot</p>
        <p class="mt-1">© 2025 Agenda BJJ</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Meta tags
useHead({
  title: 'Login - Agenda BJJ',
  meta: [
    { name: 'description', content: 'Sistema de login para Agenda BJJ' }
  ]
})

// Reactive data
const form = ref({
  username: '',
  password: ''
})

const isLoading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

// Verificar se usuário já está logado
onMounted(async () => {
  try {
    const token = localStorage.getItem('auth_token')
    if (token) {
      const response = await $fetch('/api/auth/verify', {
        headers: { authorization: `Bearer ${token}` }
      })
      if (response.user) {
        await navigateTo('/')
      }
    }
  } catch (error) {
    // Token inválido, continuar com o login
    localStorage.removeItem('auth_token')
  }
})

// Função de login
const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    errorMessage.value = 'Por favor, preencha todos os campos'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: form.value.username,
        password: form.value.password
      }
    })

    // Salvar token e dados do usuário
    localStorage.setItem('auth_token', response.token)
    localStorage.setItem('user_data', JSON.stringify(response.user))

    // Redirect para página principal
    await navigateTo('/')
    
  } catch (error: any) {
    console.error('Erro no login:', error)
    errorMessage.value = error.data?.statusMessage || 'Erro no login. Verifique suas credenciais.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Animações customizadas */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.min-h-screen > div {
  animation: fadeIn 0.6s ease-out;
}

/* Efeito glassmorphism para o formulário */
.bg-white {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}
</style>