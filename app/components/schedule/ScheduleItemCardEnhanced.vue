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