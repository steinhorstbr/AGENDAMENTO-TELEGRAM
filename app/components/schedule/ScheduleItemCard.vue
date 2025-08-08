<template>
  <div
    class="schedule-item shadow-sm text-white flex flex-col gap-0.5"
    :style="itemStyle"
    :title="item.title"
  >
    <strong class="block text-[11px] leading-3 truncate">{{ item.title }}</strong>
    <span class="opacity-80 text-[10px]">{{ item.start }} - {{ item.end }}</span>
    <p v-if="item.description" class="opacity-70 line-clamp-2 text-[10px]">{{ item.description }}</p>
  </div>
</template>

<script setup lang="ts">
import type { ScheduleItem } from '@/composables/useSchedule'
import { computed } from 'vue'

const props = defineProps<{ item: ScheduleItem, startHour: number, endHour: number }>()

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
</script>
