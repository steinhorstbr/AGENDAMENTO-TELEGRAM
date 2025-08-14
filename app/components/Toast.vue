<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto max-w-sm w-full bg-white shadow-lg rounded-lg overflow-hidden border-l-4',
            toast.type === 'success' ? 'border-green-500' :
            toast.type === 'error' ? 'border-red-500' :
            toast.type === 'warning' ? 'border-yellow-500' :
            'border-blue-500'
          ]"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <span :class="[
                  'inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm',
                  toast.type === 'success' ? 'bg-green-500' :
                  toast.type === 'error' ? 'bg-red-500' :
                  toast.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                ]">
                  {{ getIcon(toast.type) }}
                </span>
              </div>
              <div class="ml-3 w-0 flex-1">
                <p v-if="toast.title" class="text-sm font-medium text-gray-900">
                  {{ toast.title }}
                </p>
                <p :class="[
                  'text-sm text-gray-600',
                  toast.title ? 'mt-1' : ''
                ]">
                  {{ toast.message }}
                </p>
              </div>
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  @click="removeToast(toast.id)"
                  class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <span class="sr-only">Fechar</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Progress bar -->
            <div v-if="toast.duration" class="mt-2">
              <div class="bg-gray-200 rounded-full h-1 overflow-hidden">
                <div 
                  :class="[
                    'h-full transition-all duration-100 ease-linear',
                    toast.type === 'success' ? 'bg-green-500' :
                    toast.type === 'error' ? 'bg-red-500' :
                    toast.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  ]"
                  :style="{ width: `${(toast.remaining / toast.duration) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  remaining?: number
}

const toasts = ref<Toast[]>([])

function getIcon(type: string): string {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }
  return icons[type as keyof typeof icons] || 'ℹ'
}

function addToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substring(2)
  const newToast: Toast = {
    ...toast,
    id,
    duration: toast.duration || 5000,
    remaining: toast.duration || 5000
  }
  
  toasts.value.push(newToast)
  
  if (newToast.duration && newToast.duration > 0) {
    // Update progress bar
    const interval = setInterval(() => {
      if (newToast.remaining) {
        newToast.remaining -= 100
        
        if (newToast.remaining <= 0) {
          clearInterval(interval)
          removeToast(id)
        }
      }
    }, 100)
  }
}

function removeToast(id: string) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

// Expose methods to be used globally
if (process.client) {
  window.$toast = {
    success: (message: string, title?: string, duration?: number) => 
      addToast({ type: 'success', message, title, duration }),
    error: (message: string, title?: string, duration?: number) => 
      addToast({ type: 'error', message, title, duration }),
    warning: (message: string, title?: string, duration?: number) => 
      addToast({ type: 'warning', message, title, duration }),
    info: (message: string, title?: string, duration?: number) => 
      addToast({ type: 'info', message, title, duration })
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>