<!-- app/components/schedule/ScheduleGridEnhanced.vue -->
<template>
  <div class="flex flex-1 overflow-hidden bg-white border rounded-lg shadow-sm">
    <!-- Time ruler -->
    <div class="w-12 lg:w-16 border-r bg-gray-50 text-[10px] lg:text-[11px] text-gray-500 relative select-none">
      <div v-for="h in hours" :key="h" class="h-12 lg:h-16 -mt-px flex justify-end pr-1 border-t first:border-t-0">
        <span class="block pt-1">{{ formatHour(h) }}</span>
      </div>
    </div>
    
    <!-- Days columns -->
    <div class="flex-1 grid" :style="gridStyle">
      <div v-for="col in days" :key="col.date" class="relative border-l first:border-l-0 min-h-0">
        <!-- Hour lines -->
        <div 
          v-for="h in hours" 
          :key="h" 
          class="absolute left-0 right-0 h-0.5 border-t border-gray-100" 
          :style="{ top: ((h - startHour) * hourHeight)+'rem' }"
        ></div>
        
        <!-- Items -->
        <ScheduleItemCardEnhanced
          v-for="item in itemsByDate(col.date)"
          :key="item.id"
          :item="item"
          :start-hour="startHour"
          :end-hour="endHour"
          :current-user="currentUser"
          :categories="categories"
          :hour-height="hourHeight"
          @click="$emit('edit', item)"
          @delete="$emit('delete', item.id)"
          @complete="$emit('complete', item)"
          @assign="$emit('assign', item)"
        />
        
        <!-- Add task button (mobile) -->
        <button
          v-if="col.date && currentUser"
          @click="$emit('edit', { date: col.date, start: '09:00', end: '10:00' })"
          class="lg:hidden absolute top-2 right-2 w-6 h-6 bg-indigo-600 text-white rounded-full text-xs flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
        >
          +
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  days: { date: string }[]
  items: any[]
  currentUser?: any
  categories: any[]
  startHour?: number
  endHour?: number
}>()

defineEmits<{
  edit: [item: any]
  delete: [id: string]
  complete: [item: any]
  assign: [item: any]
}>()

const startHour = computed(() => props.startHour ?? 8)
const endHour = computed(() => props.endHour ?? 20)
const hourHeight = computed(() => process.client && window.innerWidth < 1024 ? 3 : 4) // 3rem no mobile, 4rem no desktop

const hours = computed(() => 
  Array.from({ length: endHour.value - startHour.value + 1 })
    .map((_, i) => startHour.value + i)
)

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.days.length}, minmax(0, 1fr))`,
  position: 'relative'
}) as any)

function formatHour(h: number) {
  return `${h.toString().padStart(2,'0')}:00`
}

function itemsByDate(date: string) {
  return props.items.filter(i => i.date === date)
}
</script>

<!-- app/components/schedule/ScheduleItemCardEnhanced.vue -->
<template>
  <div
    class="schedule-item shadow-sm text-white flex flex-col gap-0.5 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
    :style="itemStyle"
    :title="itemTooltip"
    @click="$emit('click')"
  >
    <!-- Status badges -->
    <div class="absolute -top-1 -right-1 flex gap-1 z-10">
      <span v-if="isCompleted" class="bg-green-500 text-white text-[8px] px-1 rounded-full font-bold">
        ✓
      </span>
      <span v-if="item.rescheduled_reason" class="bg-orange-500 text-white text-[8px] px-1 rounded-full font-bold">
        ⚠
      </span>
      <span v-if="isAssigned && !isMyTask" class="bg-blue-500 text-white text-[8px] px-1 rounded-full font-bold">
        👤
      </span>
    </div>
    
    <!-- Main content -->
    <div class="flex items-start justify-between relative z-10">
      <div class="flex-1 min-w-0">
        <!-- Category icon -->
        <div class="flex items-center gap-1 mb-1">
          <span class="text-sm">{{ categoryIcon }}</span>
          <strong class="block text-[10px] lg:text-[11px] leading-3 truncate">{{ item.title }}</strong>
        </div>
        
        <!-- Code and status -->
        <div class="flex items-center gap-1 mb-1">
          <span class="opacity-60 text-[8px] lg:text-[9px] font-mono bg-black/20 px-1 rounded">{{ item.code }}</span>
          <span v-if="isCompleted" class="opacity-80 text-[7px] lg:text-[8px]">✅</span>
          <span v-if="isAssigned && !isMyTask" class="opacity-80 text-[7px] lg:text-[8px]">👤 {{ assignedToName }}</span>
        </div>
      </div>
      
      <!-- Actions menu -->
      <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          v-if="canComplete"
          @click.stop="$emit('complete')"
          class="text-green-300 hover:text-green-100 text-xs"
          title="Finalizar tarefa"
        >
          ✓
        </button>
        
        <button
          v-if="canAssign"
          @click.stop="$emit('assign')"
          class="text-blue-300 hover:text-blue-100 text-xs"
          title="Atribuir tarefa"
        >
          👤
        </button>
        
        <button
          @click.stop="$emit('delete')"
          class="text-red-300 hover:text-red-100 text-xs"
          title="Excluir"
        >
          ✕
        </button>
      </div>
    </div>
    
    <!-- Time -->
    <span class="opacity-80 text-[9px] lg:text-[10px] font-mono">{{ item.start }} - {{ item.end }}</span>
    
    <!-- Description -->
    <p v-if="item.description && !isMobile" class="opacity-70 line-clamp-2 text-[9px] lg:text-[10px] mt-1">
      {{ item.description }}
    </p>
    
    <!-- Reschedule reason -->
    <div v-if="item.rescheduled_reason" class="bg-orange-500/20 border border-orange-300/30 rounded px-1 py-0.5 mt-1">
      <p class="text-[8px] lg:text-[9px] opacity-90">
        🔄 {{ item.rescheduled_reason }}
      </p>
    </div>
    
    <!-- Location and assigned info -->
    <div class="flex items-center justify-between mt-1 opacity-80">
      <div v-if="item.googleMapsLink" class="flex items-center gap-1 text-[8px] lg:text-[9px]">
        <span>📍</span>
        <span class="truncate">Maps</span>
      </div>
      
      <div v-if="isMyTask && !isCompleted" class="text-[8px] lg:text-[9px] bg-blue-500/20 px-1 rounded">
        Minha
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ 
  item: any
  startHour: number
  endHour: number
  currentUser?: any
  categories: any[]
  hourHeight: number
}>()

defineEmits<{
  click: []
  delete: []
  complete: []
  assign: []
}>()

// Computed properties
const isCompleted = computed(() => Boolean(props.item.is_completed))
const isAssigned = computed(() => !!props.item.assigned_to)
const isMyTask = computed(() => props.item.assigned_to === props.currentUser?.id)
const isMobile = computed(() => process.client && window.innerWidth < 1024)

const canComplete = computed(() => 
  !isCompleted.value && 
  (isMyTask.value || props.currentUser?.role === 'admin' || props.currentUser?.role === 'instructor')
)

const canAssign = computed(() => 
  !isCompleted.value && 
  (props.currentUser?.role === 'admin' || props.currentUser?.role === 'instructor')
)

const assignedToName = computed(() => {
  // Em uma implementação real, você buscaria o nome do usuário
  return 'Atribuída'
})

const categoryIcon = computed(() => {
  const category = props.categories.find(c => c.id === props.item.category_id)
  return category?.icon || '🏷️'
})

// Style calculations
function parseTime(t: string) {
  const [hStr, mStr] = t.split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h + (m/60)
}

const itemStyle = computed(() => {
  const start = parseTime(props.item.start)
  const end = parseTime(props.item.end)
  const topRem = (start - props.startHour) * props.hourHeight
  const heightRem = (end - start) * props.hourHeight
  
  // Get category color or default
  const category = props.categories.find(c => c.id === props.item.category_id)
  let background = category?.color || props.item.color || '#6366F1'
  
  // Apply visual effects
  if (isCompleted.value) {
    background = '#6B7280' // Gray for completed
  } else if (isMyTask.value) {
    // Add a subtle border for my tasks
    background = `linear-gradient(135deg, ${background}, ${background}dd)`
  }
  
  return {
    top: topRem + 'rem',
    height: Math.max(heightRem, 1.5) + 'rem', // Minimum height
    background,
    opacity: isCompleted.value ? '0.7' : '1',
    position: 'absolute',
    left: '0.25rem',
    right: '0.25rem',
    borderRadius: '0.5rem',
    padding: isMobile.value ? '0.25rem 0.5rem' : '0.25rem 0.5rem',
    fontSize: isMobile.value ? '0.6rem' : '0.65rem',
    lineHeight: isMobile.value ? '0.7rem' : '0.75rem',
    overflow: 'hidden',
    zIndex: isMyTask.value ? 2 : 1
  } as any
})

const itemTooltip = computed(() => {
  let tooltip = `${props.item.title}\n${props.item.start} - ${props.item.end}\nCódigo: ${props.item.code}`
  
  const category = props.categories.find(c => c.id === props.item.category_id)
  if (category) {
    tooltip += `\nCategoria: ${category.name}`
  }
  
  if (props.item.description) {
    tooltip += `\n\n${props.item.description}`
  }
  
  if (isAssigned.value) {
    tooltip += `\n\n👤 Atribuída para: ${assignedToName.value}`
  }
  
  if (props.item.rescheduled_reason) {
    tooltip += `\n\n⚠️ ${props.item.rescheduled_reason}`
  }
  
  if (isCompleted.value) {
    tooltip += '\n\n✅ Tarefa finalizada'
  }
  
  if (props.item.googleMapsLink) {
    tooltip += '\n\n📍 Localização disponível'
  }
  
  if (!isCompleted.value) {
    tooltip += `\n\nComandos Telegram:\n/reagendar ${props.item.code} +1h\n/finalizar ${props.item.code}`
  }
  
  tooltip += '\n\nClique para editar'
  
  return tooltip
})
</script>

<!-- app/components/schedule/ScheduleModalEnhanced.vue -->
<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />
        <div class="relative bg-white w-full max-w-lg rounded-lg shadow-lg ring-1 ring-black/10 flex flex-col overflow-hidden max-h-[90vh]">
          <div class="px-5 py-4 border-b flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-800">{{ isEdit ? 'Editar' : 'Nova' }} Tarefa</h3>
            <button class="p-1 rounded hover:bg-gray-100" @click="close" aria-label="Fechar">✕</button>
          </div>
          
          <form class="p-5 space-y-4 overflow-y-auto flex-1" @submit.prevent="handleSubmit">
            <!-- Código da tarefa (somente visualização para edição) -->
            <div v-if="isEdit && form.code" class="bg-gray-50 rounded-md p-3 border">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                🔢 Código da Tarefa
              </label>
              <div class="flex items-center gap-2">
                <span class="font-mono bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-semibold">{{ form.code }}</span>
                <span class="text-xs text-gray-500">Para comandos do Telegram</span>
              </div>
            </div>

            <!-- Categoria -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                🏷️ Categoria*
              </label>
              <select
                v-model="form.category_id"
                required
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              >
                <option value="">Selecione uma categoria</option>
                <option
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.icon }} {{ category.name }}
                </option>
              </select>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Título*
                <input 
                  v-model="form.title" 
                  required 
                  class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" 
                  type="text" 
                  placeholder="Ex: Aula BJJ Kids" 
                />
              </label>
              
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Descrição
                <textarea 
                  v-model="form.description" 
                  rows="2" 
                  class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition resize-none" 
                  placeholder="Detalhes da tarefa (opcional)" 
                />
              </label>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Data*
                <input 
                  v-model="form.date" 
                  required 
                  class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" 
                  type="date" 
                />
              </label>
              
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Cor da Categoria
                <div class="flex items-center gap-2">
                  <div 
                    class="w-10 h-10 rounded border border-gray-300"
                    :style="{ backgroundColor: selectedCategoryColor }"
                  ></div>
                  <span class="text-xs text-gray-500">{{ selectedCategoryName }}</span>
                </div>
              </label>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Início*
                <input 
                  v-model="form.start" 
                  required 
                  class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" 
                  type="time" 
                />
              </label>
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                Fim*
                <input 
                  v-model="form.end" 
                  required 
                  class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" 
                  type="time" 
                />
              </label>
            </div>
            
            <!-- Atribuição de usuário -->
            <div v-if="canAssignUsers">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                👤 Atribuir para
              </label>
              <select
                v-model="form.assigned_to"
                class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              >
                <option value="">Não atribuir (livre)</option>
                <option
                  v-for="user in users"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }} ({{ getRoleLabel(user.role) }})
                </option>
              </select>
            </div>
            
            <div class="grid grid-cols-1 gap-4">
              <label class="flex flex-col gap-1 text-sm font-medium text-gray-700">
                📍 Link do Google Maps
                <input 
                  v-model="form.googleMapsLink" 
                  class="rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition" 
                  type="url" 
                  placeholder="https://maps.google.com/..." 
                />
                <span class="text-xs text-gray-500">Será enviado no Telegram para localização</span>
              </label>
            </div>

            <!-- Status da tarefa (somente para edição) -->
            <div v-if="isEdit" class="grid grid-cols-1 gap-4">
              <div class="bg-gray-50 rounded-md p-3 border">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  ✅ Status da Tarefa
                </label>
                <label class="flex items-center gap-2 text-sm">
                  <input 
                    v-model="form.is_completed" 
                    type="checkbox" 
                    class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                  />
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
              <button 
                type="button" 
                class="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium px-3 py-2 shadow-sm hover:bg-gray-50 active:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/40" 
                @click="close"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                :disabled="isLoading" 
                class="inline-flex items-center gap-1 rounded-md bg-indigo-600 text-white text-sm font-medium px-3 py-2 shadow hover:bg-indigo-500 active:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isLoading">Salvando...</span>
                <span v-else>{{ isEdit ? 'Salvar' : 'Criar' }}</span>
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
  editItem?: any
  defaultDate?: string
  categories: any[]
  users: any[]
  currentUser?: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [item: any]
}>()

const open = computed(() => props.modelValue)
const isEdit = computed(() => !!props.editItem)
const isLoading = ref(false)

const canAssignUsers = computed(() => 
  props.currentUser?.role === 'admin' || props.currentUser?.role === 'instructor'
)

const emptyDate = () => (props.defaultDate || new Date().toISOString().split('T')[0]) as string

const form = reactive<any>({
  id: undefined,
  code: undefined,
  title: '',
  description: '',
  date: emptyDate(),
  start: '08:00',
  end: '09:00',
  category_id: '',
  assigned_to: '',
  googleMapsLink: '',
  rescheduled_reason: undefined,
  is_completed: false
})

const selectedCategoryColor = computed(() => {
  const category = props.categories.find(c => c.id === form.category_id)
  return category?.color || '#6366F1'
})

const selectedCategoryName = computed(() => {
  const category = props.categories.find(c => c.id === form.category_id)
  return category?.name || 'Cor da categoria'
})

watch(() => props.editItem, (val) => {
  if (val) {
    Object.assign(form, {
      ...val,
      googleMapsLink: val.googleMapsLink || '',
      rescheduled_reason: val.rescheduled_reason || undefined,
      is_completed: Boolean(val.is_completed) || false,
      category_id: val.category_id || '',
      assigned_to: val.assigned_to || ''
    })
  } else {
    Object.assign(form, {
      id: undefined,
      code: undefined,
      title: '',
      description: '',
      date: emptyDate(),
      start: '08:00',
      end: '09:00',
      category_id: '',
      assigned_to: '',
      googleMapsLink: '',
      rescheduled_reason: undefined,
      is_completed: false
    })
  }
}, { immediate: true })

function close() {
  emit('update:modelValue', false)
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: 'Admin',
    instructor: 'Instrutor',
    staff: 'Funcionário'
  }
  return labels[role] || role
}

async function handleSubmit() {
  if (form.end <= form.start) {
    alert('Horário final deve ser após o inicial')
    return
  }
  
  if (!form.category_id) {
    alert('Por favor, selecione uma categoria')
    return
  }
  
  // Validar URL do Google Maps se fornecida
  if (form.googleMapsLink && !isValidGoogleMapsUrl(form.googleMapsLink)) {
    alert('Por favor, insira um link válido do Google Maps')
    return
  }
  
  isLoading.value = true
  
  try {
    // Adicionar cor da categoria selecionada
    const selectedCategory = props.categories.find(c => c.id === form.category_id)
    emit('save', { 
      ...form, 
      color: selectedCategory?.color || '#6366F1'
    })
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

<!-- app/components/schedule/WeekHeaderMobile.vue -->
<template>
  <div class="border-t bg-white">
    <!-- Navigation controls -->
    <div class="flex items-center justify-between px-4 py-2 border-b">
      <div class="flex items-center gap-2">
        <button 
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors" 
          @click="prevWeek" 
          aria-label="Semana anterior"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors" 
          @click="today" 
        >
          Hoje
        </button>
        
        <button 
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors" 
          @click="nextWeek" 
          aria-label="Próxima semana"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <button
        @click="$emit('add')"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span class="hidden sm:inline">Nova</span>
      </button>
    </div>

    <!-- Week period display -->
    <div class="px-4 py-2 bg-gray-50 border-b">
      <p class="text-sm text-gray-600 text-center">
        {{ formattedRange }}
      </p>
    </div>
    
    <!-- Days header - horizontal scroll for mobile -->
    <div class="overflow-x-auto">
      <div class="flex min-w-max">
        <!-- Spacer for time column -->
        <div class="w-12 lg:w-16 flex-shrink-0"></div>
        
        <!-- Days -->
        <div class="flex flex-1">
          <div
            v-for="day in days"
            :key="day.date"
            class="flex-1 min-w-20 sm:min-w-24 p-3 text-center border-l first:border-l-0"
          >
            <div class="space-y-1">
              <p :class="[
                'text-xs font-medium uppercase tracking-wide',
                isToday(day.date) ? 'text-indigo-600' : 'text-gray-500'
              ]">
                {{ day.weekday }}
              </p>
              <div :class="[
                'w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium',
                isToday(day.date) 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              ]">
                {{ day.day }}
              </div>
              
              <!-- Task count indicator -->
              <div v-if="getTaskCount(day.date) > 0" class="flex justify-center">
                <span :class="[
                  'inline-flex items-center justify-center w-5 h-5 text-xs rounded-full',
                  isToday(day.date)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600'
                ]">
                  {{ getTaskCount(day.date) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ 
  baseDate: Date
  currentUser?: any
}>()

const emit = defineEmits<{
  change: [value: Date]
  add: []
}>()

const startOfWeek = computed(() => {
  const d = new Date(props.baseDate)
  const day = d.getDay()
  const diff = day
  d.setDate(d.getDate() - diff)
  d.setHours(0,0,0,0)
  return d
})

const days = computed(() => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek.value)
    d.setDate(d.getDate() + i)
    const iso = d.toISOString()
    const date = iso.split('T')[0] as string
    return {
      date,
      day: d.getDate(),
      weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
    }
  })
})

function isToday(dateStr?: string) {
  if (!dateStr) return false
  const today = new Date().toISOString().split('T')[0]
  return today === dateStr
}

function formatBR(dateStr?: string) {
  if (!dateStr) return ''
  const [y,m,d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const formattedRange = computed(() => {
  if (!days.value.length) return ''
  const first = days.value[0]?.date
  const last = days.value[6]?.date
  return `${formatBR(first)} - ${formatBR(last)}`
})

function getTaskCount(date: string) {
  // Esta função deveria receber as tarefas como prop e contar
  // Por simplicidade, retornando 0
  return 0
}

function prevWeek() {
  const d = new Date(startOfWeek.value)
  d.setDate(d.getDate() - 7)
  emit('change', d)
}

function nextWeek() {
  const d = new Date(startOfWeek.value)
  d.setDate(d.getDate() + 7)
  emit('change', d)
}

function today() {
  emit('change', new Date())
}
</script>

<style scoped>
/* Smooth scrolling for mobile */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.overflow-x-auto::-webkit-scrollbar {
  display: none;
}
</style>