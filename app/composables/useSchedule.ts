// app/composables/useSchedule.ts
import { ref, computed } from 'vue'

export interface ScheduleItem {
  id: string
  code: string // Código hexadecimal de 4 dígitos
  title: string
  description?: string
  date: string // ISO date (yyyy-mm-dd)
  start: string // HH:MM (24h)
  end: string   // HH:MM (24h)
  color?: string
  category_id?: string
  created_by?: string
  assigned_to?: string
  googleMapsLink?: string
  rescheduled_reason?: string // Motivo do reagendamento
  is_completed?: boolean | number // Se foi finalizada (boolean no frontend, integer no banco)
  created_at?: string
  updated_at?: string
}

const items = ref<ScheduleItem[]>([])
const isLoading = ref(false)

// Função para gerar código hexadecimal único de 4 dígitos
function generateUniqueCode(): string {
  const chars = '0123456789ABCDEF'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * 16)]
  }
  return code
}

export function useSchedule() {
  const { getAuthHeaders } = useAuth()

  const loadItems = async (filters?: {
    date?: string
    category_id?: string
    assigned_to?: string
    created_by?: string
    is_completed?: boolean
  }) => {
    isLoading.value = true
    try {
      const query: Record<string, string> = {}
      
      if (filters?.date) query.date = filters.date
      if (filters?.category_id) query.category_id = filters.category_id
      if (filters?.assigned_to) query.assigned_to = filters.assigned_to
      if (filters?.created_by) query.created_by = filters.created_by
      if (filters?.is_completed !== undefined) query.is_completed = filters.is_completed.toString()

      const data = await $fetch<ScheduleItem[]>('/api/schedule', {
        query,
        headers: getAuthHeaders()
      })
      
      items.value = data
    } catch (error) {
      console.error('Failed to load schedule items:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const addItem = async (item: Omit<ScheduleItem, 'id' | 'code'>) => {
    try {
      const newItem = await $fetch<ScheduleItem>('/api/schedule', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: {
          ...item,
          code: generateUniqueCode()
        }
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
        query: { id }
      })
      
      items.value = items.value.filter(item => item.id !== id)
    } catch (error) {
      console.error('Failed to remove item:', error)
      throw new Error('Erro ao remover item')
    }
  }

  const assignTask = async (taskId: string, assignedTo: string, notes?: string) => {
    try {
      await $fetch('/api/task-assignment', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: {
          task_id: taskId,
          assigned_to: assignedTo,
          assigned_by: useAuth().user.value?.id,
          notes: notes || ''
        }
      })
      
      // Atualizar o item local
      const item = items.value.find(i => i.id === taskId)
      if (item) {
        item.assigned_to = assignedTo
      }
    } catch (error: any) {
      throw new Error(error.data?.statusMessage || 'Erro ao atribuir tarefa')
    }
  }

  const completeTask = async (taskId: string, completionData: {
    notes?: string
    photos?: File[]
    location_lat?: number
    location_lng?: number
    location_address?: string
  }) => {
    try {
      // Upload de fotos se existirem
      let photoUrls: string[] = []
      if (completionData.photos && completionData.photos.length > 0) {
        for (const photo of completionData.photos) {
          const formData = new FormData()
          formData.append('file', photo)
          
          const uploadResponse = await $fetch<{ url: string }>('/api/upload', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
          })
          
          photoUrls.push(uploadResponse.url)
        }
      }

      await $fetch('/api/task-completion', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: {
          task_id: taskId,
          completed_by: useAuth().user.value?.id,
          notes: completionData.notes || '',
          photos: photoUrls,
          location_lat: completionData.location_lat,
          location_lng: completionData.location_lng,
          location_address: completionData.location_address || ''
        }
      })
      
      // Marcar como finalizada
      const item = items.value.find(i => i.id === taskId)
      if (item) {
        item.is_completed = true
      }
    } catch (error: any) {
      throw new Error(error.data?.statusMessage || 'Erro ao finalizar tarefa')
    }
  }

  const getTaskCompletions = async (taskId?: string) => {
    try {
      const query: Record<string, string> = {}
      if (taskId) query.task_id = taskId

      return await $fetch('/api/task-completion', {
        query,
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error('Failed to load task completions:', error)
      return []
    }
  }

  const getTaskAssignments = async (filters?: {
    task_id?: string
    assigned_to?: string
    status?: string
  }) => {
    try {
      const query: Record<string, string> = {}
      if (filters?.task_id) query.task_id = filters.task_id
      if (filters?.assigned_to) query.assigned_to = filters.assigned_to
      if (filters?.status) query.status = filters.status

      return await $fetch('/api/task-assignment', {
        query,
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error('Failed to load task assignments:', error)
      return []
    }
  }

  const getDashboardStats = async (period: 'today' | 'week' | 'month' = 'week', userId?: string) => {
    try {
      const query: Record<string, string> = { period }
      if (userId) query.user_id = userId

      return await $fetch('/api/dashboard-stats', {
        query,
        headers: getAuthHeaders()
      })
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
      return null
    }
  }

  const byDate = (date: string) => computed(() => 
    items.value.filter(item => item.date === date)
  )

  const byCategory = (categoryId: string) => computed(() =>
    items.value.filter(item => item.category_id === categoryId)
  )

  const byUser = (userId: string) => computed(() =>
    items.value.filter(item => 
      item.assigned_to === userId || item.created_by === userId
    )
  )

  const myTasks = computed(() => {
    const currentUserId = useAuth().user.value?.id
    if (!currentUserId) return []
    
    return items.value.filter(item => 
      item.assigned_to === currentUserId || item.created_by === currentUserId
    )
  })

  const pendingTasks = computed(() =>
    items.value.filter(item => !Boolean(item.is_completed))
  )

  const completedTasks = computed(() =>
    items.value.filter(item => Boolean(item.is_completed))
  )

  const upcomingTasks = computed(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    return items.value.filter(item => 
      !Boolean(item.is_completed) && 
      (item.date > today || (item.date === today && item.start > currentTime))
    ).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.start.localeCompare(b.start)
    })
  })

  const overdueTasks = computed(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    return items.value.filter(item => 
      !Boolean(item.is_completed) && 
      (item.date < today || (item.date === today && item.end < currentTime))
    )
  })

  return { 
    items: readonly(items), 
    isLoading: readonly(isLoading),
    
    // Basic CRUD
    loadItems,
    addItem, 
    updateItem, 
    removeItem,
    
    // Task management
    assignTask,
    completeTask,
    getTaskCompletions,
    getTaskAssignments,
    getDashboardStats,
    
    // Computed filters
    byDate,
    byCategory,
    byUser,
    myTasks,
    pendingTasks,
    completedTasks,
    upcomingTasks,
    overdueTasks
  }
}

// Utility functions (moved to utils/helpers.ts - using imports instead)

export function isTaskOverdue(item: ScheduleItem): boolean {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  return !Boolean(item.is_completed) && 
         (item.date < today || (item.date === today && item.end < currentTime))
}

export function getTaskDuration(item: ScheduleItem): number {
  const start = new Date(`2000-01-01T${item.start}:00`)
  const end = new Date(`2000-01-01T${item.end}:00`)
  return (end.getTime() - start.getTime()) / (1000 * 60) // minutes
}

export function getTimeUntilTask(item: ScheduleItem): string {
  const now = new Date()
  const taskDateTime = new Date(`${item.date}T${item.start}:00`)
  const diff = taskDateTime.getTime() - now.getTime()
  
  if (diff < 0) return 'Vencida'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}