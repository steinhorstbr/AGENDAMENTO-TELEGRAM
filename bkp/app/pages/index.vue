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
      
      <!-- Alert de reagendamentos -->
      <div v-if="rescheduledItems.length > 0" class="mx-4 mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div class="flex items-start gap-2">
          <span class="text-orange-600 mt-0.5">⚠️</span>
          <div class="flex-1">
            <h4 class="text-sm font-medium text-orange-800 mb-1">Reagendamentos via Telegram</h4>
            <div class="space-y-1">
              <div v-for="item in rescheduledItems" :key="item.id" class="text-sm text-orange-700">
                <strong>{{ item.code }}</strong> - {{ item.title }}: {{ item.rescheduled_reason }}
              </div>
            </div>
          </div>
          <button @click="dismissRescheduledAlert" class="text-orange-600 hover:text-orange-800 text-sm">
            ✕
          </button>
        </div>
      </div>
      
      <ScheduleGrid 
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

    <!-- Toast de comandos (se houver itens selecionados) -->
    <div v-if="selectedItem" class="fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs">
      <div class="flex items-start gap-2">
        <span>💡</span>
        <div>
          <p class="font-medium">Comandos Telegram para {{ selectedItem.code }}:</p>
          <p class="text-xs opacity-90 mt-1">
            /reagendar {{ selectedItem.code }} +1h<br>
            /finalizar {{ selectedItem.code }}
          </p>
        </div>
        <button @click="selectedItem = null" class="text-white/80 hover:text-white ml-1">✕</button>
      </div>
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

// Itens reagendados (convertendo is_completed para boolean)
const rescheduledItems = computed(() => 
  items.value.filter(item => item.rescheduled_reason && !Boolean(item.is_completed))
)

const showModal = ref(false)
const selectedDate = ref<string | undefined>(undefined)
const editingItem = ref<ScheduleItem | null>(null)
const selectedItem = ref<ScheduleItem | null>(null)

function openNew(date?: string) {
  editingItem.value = null
  selectedDate.value = date
  showModal.value = true
}

function editItem(item: ScheduleItem) {
  editingItem.value = item
  selectedDate.value = item.date
  showModal.value = true
  
  // Mostrar comandos do Telegram se o item não estiver finalizado
  if (!Boolean(item.is_completed)) {
    selectedItem.value = item
    // Auto-hide após 5 segundos
    setTimeout(() => {
      if (selectedItem.value?.id === item.id) {
        selectedItem.value = null
      }
    }, 5000)
  }
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

function dismissRescheduledAlert() {
  // Marcar como lido removendo o rescheduled_reason ou implementar lógica de dismiss
  // Por simplicidade, vamos apenas ocultar
  rescheduledItems.value.forEach(async (item) => {
    try {
      await updateItem(item.id, {
        ...item,
        rescheduled_reason: '' // Limpar o motivo para não mostrar mais
      })
    } catch (error) {
      console.error('Error dismissing rescheduled alert:', error)
    }
  })
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
        googleMapsLink: itemData.googleMapsLink,
        rescheduled_reason: itemData.rescheduled_reason,
        is_completed: itemData.is_completed
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
        googleMapsLink: itemData.googleMapsLink,
        rescheduled_reason: itemData.rescheduled_reason,
        is_completed: itemData.is_completed || false
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
        googleMapsLink: 'https://maps.google.com/?q=academia+bjj',
        is_completed: false
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