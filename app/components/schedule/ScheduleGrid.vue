<template>
  <div class="flex flex-1 overflow-hidden bg-white border rounded-lg shadow-sm">
    <!-- Time ruler -->
    <div class="w-16 border-r bg-gray-50 text-[11px] text-gray-500 relative select-none">
      <div v-for="h in hours" :key="h" class="h-16 -mt-px flex justify-end pr-1 border-t first:border-t-0">
        <span class="block pt-1">{{ formatHour(h) }}</span>
      </div>
    </div>
    <!-- Days columns -->
    <div class="flex-1 grid" :style="gridStyle">
      <div v-for="col in days" :key="col.date" class="relative border-l first:border-l-0">
        <!-- Hour lines -->
        <div v-for="h in hours" :key="h" class="absolute left-0 right-0 h-0.5 border-t border-gray-100" :style="{ top: ((h - startHour) * 4)+'rem' }"></div>
        <!-- Items -->
        <slot name="day" :date="col.date" :items="itemsByDate(col.date)">
          <ScheduleItemCard
            v-for="item in itemsByDate(col.date)"
            :key="item.id"
            :item="item"
            :start-hour="startHour"
            :end-hour="endHour"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ScheduleItem } from '~/composables/useSchedule'
import ScheduleItemCard from '~/components/schedule/ScheduleItemCard.vue'

const props = defineProps<{days: { date: string }[], items: ScheduleItem[], startHour?: number, endHour?: number}>()

const startHour = computed(() => props.startHour ?? 8)
const endHour = computed(() => props.endHour ?? 20)

const hours = computed(() => Array.from({ length: endHour.value - startHour.value + 1 }).map((_, i) => startHour.value + i))

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

<style scoped>
/***** Each hour row height = 4rem (64px) *****/
:deep(.schedule-item) {
  position: absolute;
  left: .25rem;
  right: .25rem;
  border-radius: .5rem;
  padding: .25rem .5rem;
  font-size: .65rem;
  line-height: .75rem;
  overflow: hidden;
}
</style>
