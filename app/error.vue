<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <div :class="[
        'rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center',
        error.statusCode === 404 ? 'bg-blue-100' : 'bg-red-100'
      ]">
        <span :class="[
          'text-3xl',
          error.statusCode === 404 ? 'text-blue-600' : 'text-red-600'
        ]">
          {{ error.statusCode === 404 ? '🔍' : '⚠️' }}
        </span>
      </div>
      
      <h1 class="text-3xl font-bold text-gray-800 mb-4">
        {{ error.statusCode }}
      </h1>
      
      <h2 class="text-xl font-semibold text-gray-700 mb-4">
        {{ getErrorTitle() }}
      </h2>
      
      <p class="text-gray-600 mb-8">
        {{ getErrorMessage() }}
      </p>
      
      <div class="space-y-3">
        <button
          @click="handleError"
          class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          {{ getActionText() }}
        </button>
        
        <button
          @click="goHome"
          class="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Voltar ao Início
        </button>
      </div>
      
      <!-- Debug info in development -->
      <div v-if="isDev" class="mt-8 text-left bg-gray-100 p-4 rounded-lg">
        <details>
          <summary class="text-sm font-medium text-gray-700 cursor-pointer">
            Debug Info
          </summary>
          <pre class="mt-2 text-xs text-gray-600 overflow-auto">{{ error }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

interface Props {
  error: NuxtError
}

const props = defineProps<Props>()
const isDev = process.dev

function getErrorTitle(): string {
  switch (props.error.statusCode) {
    case 404:
      return 'Página não encontrada'
    case 403:
      return 'Acesso negado'
    case 401:
      return 'Não autorizado'
    case 500:
      return 'Erro interno do servidor'
    default:
      return 'Algo deu errado'
  }
}

function getErrorMessage(): string {
  switch (props.error.statusCode) {
    case 404:
      return 'A página que você está procurando não existe ou foi movida.'
    case 403:
      return 'Você não tem permissão para acessar este recurso.'
    case 401:
      return 'Você precisa fazer login para acessar esta página.'
    case 500:
      return 'Ocorreu um erro interno. Nossa equipe foi notificada.'
    default:
      return props.error.statusMessage || 'Ocorreu um erro inesperado.'
  }
}

function getActionText(): string {
  switch (props.error.statusCode) {
    case 404:
      return 'Tentar Novamente'
    case 403:
    case 401:
      return 'Fazer Login'
    default:
      return 'Recarregar Página'
  }
}

function handleError() {
  switch (props.error.statusCode) {
    case 403:
    case 401:
      navigateTo('/login')
      break
    case 404:
      window.history.back()
      break
    default:
      window.location.reload()
  }
}

function goHome() {
  navigateTo('/')
}

// SEO
useHead({
  title: `Erro ${props.error.statusCode} - Agenda BJJ`,
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>