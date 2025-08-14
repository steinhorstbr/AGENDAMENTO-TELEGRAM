<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
        <div class="relative bg-white w-full max-w-md rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800">
              {{ isEdit ? 'Editar' : 'Nova' }} Categoria
            </h3>
            <button class="p-1 rounded hover:bg-gray-100" @click="close">✕</button>
          </div>
          
          <form class="p-6 space-y-4" @submit.prevent="handleSubmit">
            <div class="grid grid-cols-1 gap-4">
              <label class="flex flex-col gap-2">
                <span class="text-sm font-medium text-gray-700">Nome*</span>
                <input
                  v-model="form.name"
                  required
                  class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: BJJ Adulto"
                />
              </label>
              
              <div class="grid grid-cols-2 gap-4">
                <label class="flex flex-col gap-2">
                  <span class="text-sm font-medium text-gray-700">Cor*</span>
                  <div class="flex items-center gap-2">
                    <input
                      v-model="form.color"
                      type="color"
                      required
                      class="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      v-model="form.color"
                      type="text"
                      required
                      class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="#3B82F6"
                    />
                  </div>
                </label>
                
                <label class="flex flex-col gap-2">
                  <span class="text-sm font-medium text-gray-700">Ícone</span>
                  <div class="relative">
                    <input
                      v-model="form.icon"
                      class="rounded-md border border-gray-300 px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="🥋"
                    />
                    <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-lg">
                      {{ form.icon || '🏷️' }}
                    </div>
                  </div>
                </label>
              </div>
              
              <label class="flex flex-col gap-2">
                <span class="text-sm font-medium text-gray-700">Descrição</span>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Descrição da categoria (opcional)"
                />
              </label>
              
              <!-- Preview -->
              <div class="bg-gray-50 rounded-lg p-4">
                <span class="text-sm font-medium text-gray-700 block mb-2">Preview:</span>
                <div
                  class="inline-flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm font-medium"
                  :style="{ backgroundColor: form.color || '#6366F1' }"
                >
                  <span class="text-lg">{{ form.icon || '🏷️' }}</span>
                  {{ form.name || 'Nome da categoria' }}
                </div>
              </div>
              
              <label v-if="isEdit" class="flex items-center gap-2">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-700">Categoria ativa</span>
              </label>
            </div>
            
            <!-- Ícones sugeridos -->
            <div>
              <span class="text-sm font-medium text-gray-700 block mb-2">Ícones sugeridos:</span>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="suggestedIcon in suggestedIcons"
                  :key="suggestedIcon"
                  type="button"
                  class="p-2 border border-gray-200 rounded hover:bg-gray-50 text-lg"
                  @click="form.icon = suggestedIcon"
                >
                  {{ suggestedIcon }}
                </button>
              </div>
            </div>
            
            <div class="pt-4 flex justify-end gap-3">
              <button
                type="button"
                class="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                @click="close"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="isLoading"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ isLoading ? 'Salvando...' : (isEdit ? 'Salvar' : 'Criar') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch, computed, ref } from 'vue'

const props = defineProps<{
  modelValue: boolean
  editCategory?: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [categoryData: any]
}>()

const open = computed(() => props.modelValue)
const isEdit = computed(() => !!props.editCategory)
const isLoading = ref(false)

const form = reactive({
  name: '',
  color: '#6366F1',
  icon: '🏷️',
  description: '',
  is_active: true
})

const suggestedIcons = [
  '🥋', '🧒', '👤', '🥊', '🏆', '📚', '💪', '🎉',
  '⚡', '🔥', '🌟', '🎯', '🏃', '🤸', '🧘', '⏰'
]

watch(() => props.editCategory, (category) => {
  if (category) {
    Object.assign(form, {
      name: category.name,
      color: category.color,
      icon: category.icon || '🏷️',
      description: category.description || '',
      is_active: category.is_active
    })
  } else {
    Object.assign(form, {
      name: '',
      color: '#6366F1',
      icon: '🏷️',
      description: '',
      is_active: true
    })
  }
}, { immediate: true })

const close = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  isLoading.value = true
  
  try {
    await emit('save', { ...form })
    close()
  } catch (error) {
    console.error('Erro ao salvar categoria:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>