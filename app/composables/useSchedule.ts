import { ref, computed } from 'vue'

export interface ScheduleItem {
  id: string
  title: string
  description?: string
  date: string // ISO date (yyyy-mm-dd)
  start: string // HH:MM (24h)
  end: string   // HH:MM (24h)
  color?: string
  googleMapsLink?: string
}

const items = ref<ScheduleItem[]>([])
const isLoading = ref(false)

export function useSchedule() {
  const loadItems = async () => {
    isLoading.value = true
    try {
      const data = await $fetch<ScheduleItem[]>('/api/schedule')
      items.value = data
    } catch (error) {
      console.error('Failed to load schedule items:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const addItem = async (item: Omit<ScheduleItem, 'id'>) => {
    try {
      const newItem = await $fetch<ScheduleItem>('/api/schedule', {
        method: 'POST',
        body: item
      })
      items.value.push(newItem)
      return newItem
    } catch (error: any) {
      if (error.data?.statusMessage) {
        throw new Error(error.data.statusMessage)
      }
      throw new Error('Erro ao adicionar item')
    }
  }

  const updateItem = async (id: string, patch: Partial<ScheduleItem>) => {
    try {
      const updatedItem = await $fetch<ScheduleItem>('/api/schedule', {
        method: 'PUT',
        body: { id, ...patch }
      })
      
      const index = items.value.findIndex(item => item.id === id)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      return updatedItem
    } catch (error: any) {
      if (error.data?.statusMessage) {
        throw new Error(error.data.statusMessage)
      }
      throw new Error('Erro ao atualizar item')
    }
  }

  const removeItem = async (id: string) => {
    try {
      await $fetch('/api/schedule', {
        method: 'DELETE',
        query: { id }
      })
      
      items.value = items.value.filter(item => item.id !== id)
    } catch (error) {
      console.error('Failed to remove item:', error)
      throw new Error('Erro ao remover item')
    }
  }

  const byDate = (date: string) => computed(() => 
    items.value.filter(item => item.date === date)
  )

  const loadItemsByDate = async (date: string) => {
    try {
      const data = await $fetch<ScheduleItem[]>('/api/schedule', {
        query: { date }
      })
      return data
    } catch (error) {
      console.error('Failed to load items by date:', error)
      return []
    }
  }

  return { 
    items: readonly(items), 
    isLoading: readonly(isLoading),
    loadItems,
    addItem, 
    updateItem, 
    removeItem, 
    byDate,
    loadItemsByDate
  }
}