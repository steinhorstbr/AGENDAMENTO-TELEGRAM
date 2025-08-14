<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
        <div class="relative bg-white w-full max-w-md rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800">Atribuir Tarefa</h3>
            <button class="p-1 rounded hover:bg-gray-100" @click="close">✕</button>
          </div>
          
          <form class="p-6 space-y-6" @submit.prevent="handleSubmit">
            <!-- Informações da tarefa -->
            <div v-if="task" class="bg-gray-50 rounded-lg p-4">
              <h4 class="font-medium text-gray-800 mb-2">{{ task.title }}</h4>
              <div class="text-sm text-gray-600 space-y-1">
                <p>📅 {{ formatDate(task.date) }}</p>
                <p>🕐 {{ task.start }} - {{ task.end }}</p>
                <p v-if="task.description">📝 {{ task.description }}</p>
              </div>
            </div>

            <!-- Seleção de usuário -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">
                👤 Atribuir para
              </label>
              
              <div class="space-y-3">
                <div
                  v-for="user in availableUsers"
                  :key="user.id"
                  :class="[
                    'border rounded-lg p-4 cursor-pointer transition-all',
                    form.assigned_to === user.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  ]"
                  @click="form.assigned_to = user.id"
                >
                  <div class="flex items-center gap-3">
                    <input
                      type="radio"
                      :value="user.id"
                      v-model="form.assigned_to"
                      class="text-indigo-600 focus:ring-indigo-500"
                    />
                    <div class="flex-1">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span class="text-indigo-600 font-medium text-sm">
                            {{ user.name.charAt(0).toUpperCase() }}
                          </span>
                        </div>
                        <div>
                          <p class="font-medium text-gray-800">{{ user.name }}</p>
                          <p class="text-sm text-gray-500">{{ getRoleLabel(user.role) }}</p>
                        </div>
                      </div>
                    </div>
                    <span :class="[
                      'px-2 py-1 text-xs rounded-full font-medium',
                      user.role === 'admin' ? 'bg-red-100 text-red-700' :
                      user.role === 'instructor' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    ]">
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Observações da atribuição -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                📝 Observações para o Responsável
              </label>
              <textarea
                v-model="form.notes"
                rows="3"
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="Instruções especiais, observações importantes, etc."
              />
            </div>

            <!-- Prioridade -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ⚡ Prioridade
              </label>
              <select
                v-model="form.priority"
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="normal">🟢 Normal</option>
                <option value="high">🟡 Alta</option>
                <option value="urgent">🔴 Urgente</option>
              </select>
            </div>
            
            <!-- Botões de ação -->
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
                :disabled="isLoading || !form.assigned_to"
                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <span v-if="isLoading">Atribuindo...</span>
                <span v-else">👥 Atribuir Tarefa</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  task?: any
  users: any[]
  currentUser?: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [assignmentData: any]
}>()

const open = computed(() => props.modelValue)
const isLoading = ref(false)

const form = reactive({
  assigned_to: '',
  notes: '',
  priority: 'normal'
})

// Filtrar usuários disponíveis (excluir o usuário atual)
const availableUsers = computed(() => {
  return props.users.filter(user => 
    user.id !== props.currentUser?.id && 
    user.is_active
  )
})

watch(() => props.task, () => {
  // Reset form quando trocar tarefa
  form.assigned_to = props.task?.assigned_to || ''
  form.notes = ''
  form.priority = 'normal'
})

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: 'Admin',
    instructor: 'Instrutor',
    staff: 'Funcionário'
  }
  return labels[role] || role
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const close = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!form.assigned_to) return
  
  isLoading.value = true
  
  try {
    await emit('save', { ...form })
  } catch (error) {
    console.error('Erro ao atribuir tarefa:', error)
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