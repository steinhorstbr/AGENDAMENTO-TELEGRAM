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