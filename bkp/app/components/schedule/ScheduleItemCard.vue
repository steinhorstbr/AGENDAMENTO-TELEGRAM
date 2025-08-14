<template>
  <div
    class="schedule-item shadow-sm text-white flex flex-col gap-0.5 cursor-pointer hover:shadow-md transition-shadow group relative"
    :style="itemStyle"
    :title="itemTooltip"
    @click="$emit('click')"
  >
    <!-- Badge de status -->
    <div v-if="isCompleted || item.rescheduled_reason" class="absolute -top-1 -right-1 flex gap-1">
      <span v-if="isCompleted" class="bg-green-500 text-white text-[8px] px-1 rounded-full font-bold">
        ✓
      </span>
      <span v-if="item.rescheduled_reason" class="bg-orange-500 text-white text-[8px] px-1 rounded-full font-bold">
        ⚠
      </span>
    </div>
    
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <strong class="block text-[11px] leading-3 truncate">{{ item.title }}</strong>
        <div class="flex items-center gap-1 mt-0.5">
          <span class="opacity-60 text-[9px] font-mono bg-black/20 px-1 rounded">{{ item.code }}</span>
          <span v-if="isCompleted" class="opacity-80 text-[8px]">✅ Finalizada</span>
        </div>
      </div>
      <button
        class="opacity-0 group-hover:opacity-100 ml-1 text-white/80 hover:text-white text-xs leading-none transition-opacity flex-shrink-0"
        @click.stop="$emit('delete')"
        title="Excluir"
      >
        ✕
      </button>
    </div>
    
    <span class="opacity-80 text-[10px]">{{ item.start }} - {{ item.end }}</span>
    
    <p v-if="item.description" class="opacity-70 line-clamp-2 text-[10px]">
      {{ item.description }}
    </p>
    
    <!-- Motivo do reagendamento -->
    <div v-if="item.rescheduled_reason" class="bg-orange-500/20 border border-orange-300/30 rounded px-1 py-0.5 mt-1">
      <p class="text-[9px] opacity-90">
        🔄 {{ item.rescheduled_reason }}
      </p>
    </div>
    
    <div v-if="item.googleMapsLink" class="flex items-center gap-1 opacity-80 text-[9px] mt-0.5">
      <span>📍</span>
      <span class="truncate">Maps</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScheduleItem } from '@/composables/useSchedule'
import { computed } from 'vue'

const props = defineProps<{ 
  item: ScheduleItem, 
  startHour: number, 
  endHour: number 
}>()

defineEmits<{
  click: []
  delete: []
}>()

// Converter integer do SQLite para boolean
const isCompleted = computed(() => Boolean(props.item.is_completed))

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
  const topRem = (start - props.startHour) * 4
  const heightRem = (end - start) * 4
  
  let background = props.item.color || 'linear-gradient(135deg,#6366F1,#8B5CF6)'
  
  // Aplicar efeito visual se finalizada
  if (isCompleted.value) {
    background = '#6B7280' // Cinza para indicar finalizada
  }
  
  return {
    top: topRem + 'rem',
    height: heightRem + 'rem',
    background,
    opacity: isCompleted.value ? '0.7' : '1'
  } as any
})

const itemTooltip = computed(() => {
  let tooltip = `${props.item.title}\n${props.item.start} - ${props.item.end}\nCódigo: ${props.item.code}`
  
  if (props.item.description) {
    tooltip += `\n\n${props.item.description}`
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