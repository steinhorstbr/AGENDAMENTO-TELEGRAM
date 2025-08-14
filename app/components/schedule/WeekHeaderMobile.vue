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