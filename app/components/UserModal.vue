<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
        <div class="relative bg-white w-full max-w-md rounded-lg shadow-lg">
          <div class="px-6 py-4 border-b flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800">
              {{ isEdit ? 'Editar' : 'Novo' }} Usuário
            </h3>
            <button class="p-1 rounded hover:bg-gray-100" @click="close">✕</button>
          </div>
          
          <form class="p-6 space-y-4" @submit.prevent="handleSubmit">
            <div class="grid grid-cols-1 gap-4">
              <label class="flex flex-col gap-2">
                <span class="text-sm font-medium text-gray-700">Nome completo*</span>
                <input
                  v-model="form.name"
                  required
                  class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: João Silva"
                />
              </label>
              
              <label class="flex flex-col gap-2">
                <span class="text-sm font-medium text-gray-700">Nome de usuário*</span>
                <input
                  v-model="form.username"
                  required
                  class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: joao.silva"
                />
              </label>
              
              <label class="flex flex-col gap-2">
                <span class="text-sm font-medium text-gray-700">Email*</span>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: joao@exemplo.com"
                />
              </label>
              
              <label class="flex flex-col gap-2">
                <span class="text-sm font-medium text-gray-700">
                  {{ isEdit ? 'Nova senha (deixe vazio para manter)' : 'Senha*' }}
                </span>
                <input
                  v-model="form.password"
                  type="password"
                  :required="!isEdit"
                  class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </label>
              
              <label class="flex flex-col gap-2">
                <span class="text-sm font-medium text-gray-700">Perfil*</span>
                <select
                  v-model="form.role"
                  required
                  class="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="staff">Funcionário</option>
                  <option value="instructor">Instrutor</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
              
              <label v-if="isEdit" class="flex items-center gap-2">
                <input
                  v-model="form.is_active"
                  type="checkbox"
                  class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span class="text-sm text-gray-700">Usuário ativo</span>
              </label>
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
  editUser?: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [userData: any]
}>()

const open = computed(() => props.modelValue)
const isEdit = computed(() => !!props.editUser)
const isLoading = ref(false)

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'staff',
  is_active: true
})

watch(() => props.editUser, (user) => {
  if (user) {
    Object.assign(form, {
      name: user.name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      is_active: user.is_active
    })
  } else {
    Object.assign(form, {
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'staff',
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
    console.error('Erro ao salvar usuário:', error)
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