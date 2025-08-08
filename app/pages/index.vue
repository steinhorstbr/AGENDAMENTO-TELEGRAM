<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <WeekHeader :base-date="currentDate" @change="setBase" @add="openNew()" />
    <div class="flex-1 overflow-auto mt-2">
      <ScheduleGrid :days="days" :items="items" :start-hour="8" :end-hour="20" />
    </div>
    <ScheduleModal v-model="showModal" :default-date="selectedDate" @save="saveSchedule" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import WeekHeader from '@/components/schedule/WeekHeader.vue'
import ScheduleGrid from '@/components/schedule/ScheduleGrid.vue'
import ScheduleModal from '@/components/schedule/ScheduleModal.vue'
import { useSchedule } from '@/composables/useSchedule'

const baseDate = ref(new Date())
function setBase(d: Date) { baseDate.value = d }
const currentDate = computed(() => baseDate.value)

const { items, addItem } = useSchedule()

const days = computed(() => {
  const day0 = new Date(baseDate.value)
  const diff = day0.getDay()
  day0.setDate(day0.getDate() - diff)
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(day0)
    d.setDate(d.getDate() + i)
    const date = d.toISOString().split('T')[0] as string
    return { date }
  })
})

const showModal = ref(false)
const selectedDate = ref<string | undefined>(undefined)

function openNew(date?: string) {
  selectedDate.value = date
  showModal.value = true
}

function saveSchedule(item: any) {
  try {
    if (item.id) {
      // edição futura
    } else {
      addItem({
        title: item.title,
        description: item.description,
        date: item.date,
        start: item.start,
        end: item.end,
        color: item.color
      })
    }
  } catch (e: any) {
    alert(e?.message || 'Erro ao salvar')
  }
}

onMounted(() => {
  if (!items.value.length) {
    const today = new Date().toISOString().split('T')[0] as string
    try {
      addItem({
        title: 'Treino Kids BJJ',
        description: 'Aula introdutória',
        date: today,
        start: '10:00',
        end: '11:00',
        color: 'linear-gradient(135deg,#F59E0B,#F97316)'
      })
    } catch {}
  }
})
</script>
