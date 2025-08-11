<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <WeekHeader :base-date="currentDate" @change="setBase" @add="openNew()" />
    
    <div class="flex-1 overflow-auto mt-2">
      <div v-if="isLoading" class="flex items-center justify-center h-64">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p class="text-gray-600">Carregando agenda...</p>
        </div>
      </div>
      
      <ScheduleGrid 
        v-else
        :days="days" 
        :items="items" 
        :start-hour="8" 
        :end-hour="20"
      >
        <template #day="{ date, items: dayItems }">
          <ScheduleItemCard
            v-for="item in dayItems"
            :key="item.id"
            :item="item"
            :start-hour="8"
            :end-hour="20"
            @click="editItem(item)"
            @delete="deleteItem(item.id)"
          />
        </template>
      </ScheduleGrid>
    </div>
    
    <ScheduleModal 
      v-model="showModal" 
      :edit-item="editingItem"
      :default-date="selectedDate" 
      @save="saveSchedule" 
    />

    <!-- Telegram Status -->
    <div class="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
      <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      📲 Telegram conectado
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import WeekHeader from '@/components/schedule/WeekHeader.vue'
import ScheduleGrid from '@/components/schedule/ScheduleGrid.vue'
import ScheduleModal from '@/components/schedule/ScheduleModal.vue'
import ScheduleItemCard from '@/components/schedule/ScheduleItemCard.vue'
import { useSchedule, type ScheduleItem } from '@/composables/useSchedule'

const baseDate = ref(new Date())
function setBase(d: Date) { 
  baseDate.value = d 
  loadWeekItems()
}
const currentDate = computed(() => baseDate.value)

const { items, isLoading, loadItems, addItem, updateItem, removeItem } = useSchedule()

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
const editingItem = ref<ScheduleItem | null>(null)

function openNew(date?: string) {
  editingItem.value = null
  selectedDate.value = date
  showModal.value = true
}

function editItem(item: ScheduleItem) {
  editingItem.value = item
  selectedDate.value = item.date
  showModal.value = true
}

async function deleteItem(id: string) {
  if (!confirm('Tem certeza que deseja excluir este item?')) {
    return
  }
  
  try {
    await removeItem(id)
  } catch (error: any) {
    alert(error?.message || 'Erro ao excluir item')
  }
}

async function saveSchedule(itemData: any) {
  try {
    if (itemData.id && editingItem.value) {
      // Editar item existente
      await updateItem(itemData.id, {
        title: itemData.title,
        description: itemData.description,
        date: itemData.date,
        start: itemData.start,
        end: itemData.end,
        color: itemData.color,
        googleMapsLink: itemData.googleMapsLink
      })
    } else {
      // Adicionar novo item
      await addItem({
        title: itemData.title,
        description: itemData.description,
        date: itemData.date,
        start: itemData.start,
        end: itemData.end,
        color: itemData.color,
        googleMapsLink: itemData.googleMapsLink
      })
    }
  } catch (error: any) {
    alert(error?.message || 'Erro ao salvar')
  }
}

async function loadWeekItems() {
  try {
    await loadItems()
  } catch (error) {
    console.error('Error loading items:', error)
  }
}

onMounted(async () => {
  await loadWeekItems()
  
  // Adicionar item de exemplo se não houver nenhum
  if (items.value.length === 0) {
    const today = new Date().toISOString().split('T')[0] as string
    try {
      await addItem({
        title: 'Treino Kids BJJ',
        description: 'Aula introdutória de Brazilian Jiu-Jitsu para crianças',
        date: today,
        start: '10:00',
        end: '11:00',
        color: '#F59E0B',
        googleMapsLink: 'https://maps.google.com/?q=academia+bjj'
      })
    } catch {}
  }
})

// SEO e Meta
useHead({
  title: 'Agenda BJJ - Sistema de Agendamento',
  meta: [
    {
      name: 'description',
      content: 'Sistema de agendamento com notificações do Telegram para academias de BJJ'
    }
  ]
})
</script>