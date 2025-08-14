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