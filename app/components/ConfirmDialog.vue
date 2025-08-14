<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="cancel" />
        <div class="relative bg-white rounded-lg shadow-lg max-w-md w-full">
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div :class="[
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
              ]">
                <span :class="[
                  'text-lg',
                  type === 'danger' ? 'text-red-600' : 'text-yellow-600'
                ]">
                  {{ type === 'danger' ? '⚠️' : '❓' }}
                </span>
              </div>
              
              <div class="flex-1">
                <h3 class="text-lg font-medium text-gray-900 mb-2">
                  {{ title }}
                </h3>
                <p class="text-sm text-gray-600">
                  {{ message }}
                </p>
              </div>
            </div>
            
            <div class="flex gap-3 mt-6 justify-end">
              <button
                @click="cancel"
                class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {{ cancelText }}
              </button>
              <button
                @click="confirm"
                :class="[
                  'px-4 py-2 rounded-md font-medium transition-colors',
                  type === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                ]"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  open: boolean
  title: string
  message: string
  type?: 'confirm' | 'danger'
  confirmText?: string
  cancelText?: string
}

withDefaults(defineProps<Props>(), {
  type: 'confirm',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar'
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('cancel')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>