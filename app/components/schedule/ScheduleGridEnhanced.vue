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