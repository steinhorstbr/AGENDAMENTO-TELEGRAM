<template>
  <div class="bg-white border-b sticky top-0 z-10 shadow-sm">
    <!-- Nav / título -->
    <div class="flex items-center gap-2 px-4 py-2">
      <div class="flex items-center gap-1">
        <button class="p-1 rounded hover:bg-gray-100" @click="prevWeek" aria-label="Semana anterior">←</button>
        <button class="p-1 rounded hover:bg-gray-100" @click="today" aria-label="Hoje">Hoje</button>
        <button class="p-1 rounded hover:bg-gray-100" @click="nextWeek" aria-label="Próxima semana">→</button>
      </div>
      <h2 class="font-semibold text-gray-700 ml-2">Semana {{ formattedRange }}</h2>
      <button
        class="ml-auto inline-flex items-center gap-1 rounded-md bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 shadow hover:bg-indigo-500 active:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
        type="button"
        aria-label="Adicionar agendamento"
      >
        + <span class="hidden sm:inline">Agendar</span>
      </button>
    </div>
    <!-- Linha dos dias alinhada com o grid -->
    <div class="flex items-stretch border-t">
      <!-- Placeholder da régua de horas -->
      <div class="w-16 bg-gray-50 border-r" />
      <div class="flex-1 grid" :style="headerGridStyle">
        <div
          v-for="d in days"
          :key="d.date"
          class="h-16 flex flex-col items-center justify-center border-l first:border-l-0 select-none"
        >
          <span :class="['text-[11px] uppercase tracking-wide', isToday(d.date) ? 'text-indigo-600 font-semibold' : 'text-gray-500']">{{ d.weekday }}</span>
          <span :class="['mt-1 text-sm rounded-full w-8 h-8 flex items-center justify-center', isToday(d.date) ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-700']">{{ d.day }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const emit = defineEmits<{(e: 'change', value: Date): void}>()
const props = defineProps<{ baseDate: Date }>()

const startOfWeek = computed(() => {
  const d = new Date(props.baseDate)
  const day = d.getDay()
  const diff = day
  d.setDate(d.getDate() - diff)
  d.setHours(0,0,0,0)
  return d
})

const days = computed<{ date: string; day: number; weekday: string }[]>(() => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek.value)
    d.setDate(d.getDate() + i)
    const iso = d.toISOString()
    const date = iso.split('T')[0] as string
    return {
      date,
      day: d.getDate(),
      weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' })
    }
  })
})

const headerGridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${days.value.length}, minmax(0,1fr))`
}))

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
  return `de ${formatBR(first)} até ${formatBR(last)}`
})

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
