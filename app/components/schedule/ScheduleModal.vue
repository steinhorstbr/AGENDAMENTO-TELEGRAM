<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
        <div class="relative bg-white w-full max-w-md rounded-lg shadow-lg ring-1 ring-black/10 flex flex-col overflow-hidden">
          <div class="px-5 py-4 border-b flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800">{{ isEdit ? 'Editar' : 'Novo' }} Agendamento</h3>
            <button class="p-1 rounded hover:bg-gray-100" @click="close" aria-label="Fechar">✕</button>
          </div>
          <form class="p-5 space-y-4" @submit.prevent="handleSubmit">
            <!-- Código da tarefa (somente visualização para edição) -->
            <div v-if="isEdit && form.code" class="bg-gray-50 rounded-md p-3 border">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                🔢 Código da Tarefa
              </label>
              <div class="flex items-center gap-2">
                <span class="font-mono bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-semibold">{{ form.code }}</span>
                <span class="text-xs text-gray-500">Código para comandos do Telegram</span>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Título*
                <input v-model="form.title" required class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" type="text" placeholder="Ex: Aula BJJ" />
              </label>
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Descrição
                <textarea v-model="form.description" rows="2" class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition resize-none" placeholder="Detalhes (opcional)" />
              </label>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Data*
                <input v-model="form.date" required class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" type="date" />
              </label>
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Cor
                <input v-model="form.color" class="rounded-md border border-gray-300 bg-white h-[38px] p-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" type="color" />
              </label>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Início*
                <input v-model="form.start" required class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" type="time" />
              </label>
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Fim*
                <input v-model="form.end" required class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" type="time" />
              </label>
            </div>
            
            <div class="grid grid-cols-1 gap-4">
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                📍 Link do Google Maps
                <input v-model="form.googleMapsLink" class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" type="url" placeholder="https://maps.google.com/..." />
                <span class="text-xs text-gray-500">Será enviado no Telegram para localização da tarefa</span>
              </label>
            </div>

            <!-- Status da tarefa (somente para edição) -->
            <div v-if="isEdit" class="grid grid-cols-1 gap-4">
              <div class="bg-gray-50 rounded-md p-3 border">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  ✅ Status da Tarefa
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input v-model="form.is_completed" type="checkbox" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <span>Marcar como finalizada</span>
                </label>
              </div>
            </div>

            <!-- Reagendamento (somente visualização) -->
            <div v-if="isEdit && form.rescheduled_reason" class="bg-orange-50 rounded-md p-3 border border-orange-200">
              <label class="block text-sm font-medium text-orange-800 mb-1">
                🔄 Histórico de Reagendamento
              </label>
              <p class="text-sm text-orange-700">{{ form.rescheduled_reason }}</p>
              <span class="text-xs text-orange-600">Use /reagendar no Telegram para reagendar novamente</span>
            </div>
            
            <div class="pt-2 flex justify-end gap-2">
              <button type="button" class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium px-3 py-2 shadow-sm hover:bg-gray-50 active:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/40" @click="close">Cancelar</button>
              <button type="submit" :disabled="isLoading" class="inline-flex items-center gap-1 rounded-md bg-indigo-600 text-white text-sm font-medium px-3 py-2 shadow hover:bg-indigo-500 active:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed">
                <span v-if="isLoading">Salvando...</span>
                <span v-else>{{ isEdit ? 'Salvar' : 'Adicionar' }}</span>
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
import type { ScheduleItem } from '@/composables/useSchedule'

const props = defineProps<{ modelValue: boolean; editItem?: ScheduleItem | null; defaultDate?: string }>()
const emit = defineEmits<{(e:'update:modelValue',v:boolean):void; (e:'save', item: Omit<ScheduleItem,'id'> & { id?: string }):void}>()

const open = computed(() => props.modelValue)
const isEdit = computed(() => !!props.editItem)
const isLoading = ref(false)

const emptyDate = () => (props.defaultDate || new Date().toISOString().split('T')[0]) as string

const form = reactive<{ 
  id?: string
  code?: string
  title: string
  description: string
  date: string
  start: string
  end: string
  color: string
  googleMapsLink: string
  rescheduled_reason?: string
  is_completed: boolean | number
}>({
  id: undefined,
  code: undefined,
  title: '',
  description: '',
  date: emptyDate(),
  start: '08:00',
  end: '09:00',
  color: '#6366F1',
  googleMapsLink: '',
  rescheduled_reason: undefined,
  is_completed: false
})

watch(() => props.editItem, (val) => {
  if (val) {
    Object.assign(form, {
      ...val,
      googleMapsLink: val.googleMapsLink || '',
      rescheduled_reason: val.rescheduled_reason || undefined,
      is_completed: Boolean(val.is_completed) || false
    })
  } else {
    form.id = undefined
    form.code = undefined
    form.title = ''
    form.description = ''
    form.date = emptyDate()
    form.start = '08:00'
    form.end = '09:00'
    form.color = '#6366F1'
    form.googleMapsLink = ''
    form.rescheduled_reason = undefined
    form.is_completed = false
  }
}, { immediate: true })

function close() {
  emit('update:modelValue', false)
}

async function handleSubmit() {
  if (form.end <= form.start) {
    alert('Horário final deve ser após o inicial')
    return
  }
  
  // Validar URL do Google Maps se fornecida
  if (form.googleMapsLink && !isValidGoogleMapsUrl(form.googleMapsLink)) {
    alert('Por favor, insira um link válido do Google Maps')
    return
  }
  
  isLoading.value = true
  
  try {
    emit('save', { ...form })
    close()
  } catch (e: any) {
    alert(e?.message || 'Erro ao salvar')
  } finally {
    isLoading.value = false
  }
}

function isValidGoogleMapsUrl(url: string): boolean {
  if (!url) return true // URL vazia é válida
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('google.com') || urlObj.hostname.includes('maps.app.goo.gl')
  } catch {
    return false
  }
}
</script>

<style scoped>
.fade-enter-active,.fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from,.fade-leave-to { opacity: 0; }
</style>