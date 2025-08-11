<template>
  <div
    class="schedule-item shadow-sm text-white flex flex-col gap-0.5 cursor-pointer hover:shadow-md transition-shadow group"
    :style="itemStyle"
    :title="itemTooltip"
    @click="$emit('click')"
  >
    <div class="flex items-start justify-between">
      <strong class="block text-[11px] leading-3 truncate flex-1">{{ item.title }}</strong>
      <button
        class="opacity-0 group-hover:opacity-100 ml-1 text-white/80 hover:text-white text-xs leading-none transition-opacity"
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
  
  return {
    top: topRem + 'rem',
    height: heightRem + 'rem',
    background: props.item.color || 'linear-gradient(135deg,#6366F1,#8B5CF6)'
  } as any
})

const itemTooltip = computed(() => {
  let tooltip = `${props.item.title}\n${props.item.start} - ${props.item.end}`
  
  if (props.item.description) {
    tooltip += `\n\n${props.item.description}`
  }
  
  if (props.item.googleMapsLink) {
    tooltip += '\n\n📍 Localização disponível'
  }
  
  tooltip += '\n\nClique para editar'
  
  return tooltip
})
</script>