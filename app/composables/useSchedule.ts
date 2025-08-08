import { ref, computed, watch } from 'vue'

export interface ScheduleItem {
  id: string
  title: string
  description?: string
  date: string // ISO date (yyyy-mm-dd)
  start: string // HH:MM (24h)
  end: string   // HH:MM (24h)
  color?: string
}

const STORAGE_KEY = 'local-schedule-items'

function loadFromStorage(): ScheduleItem[] {
  if (process.server) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to parse schedule storage', e)
    return []
  }
}

function persist(list: ScheduleItem[]) {
  if (process.server) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const items = ref<ScheduleItem[]>(loadFromStorage())

watch(items, (val) => persist(val), { deep: true })

export function useSchedule() {
  function hasOverlap(candidate: Omit<ScheduleItem,'id'>, ignoreId?: string) {
    const cStart = candidate.start
    const cEnd = candidate.end
    return items.value.some(ev => ev.date === candidate.date && ev.id !== ignoreId && !(cEnd <= ev.start || cStart >= ev.end))
  }
  const addItem = (item: Omit<ScheduleItem, 'id'>) => {
    if (hasOverlap(item)) throw new Error('Conflito de horário')
    items.value.push({ ...item, id: crypto.randomUUID() })
  }
  const updateItem = (id: string, patch: Partial<ScheduleItem>) => {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) {
      const current = items.value[idx] as ScheduleItem
      const next: ScheduleItem = {
        id: current.id,
        title: patch.title ?? current.title,
        description: patch.description ?? current.description,
        date: patch.date ?? current.date,
        start: patch.start ?? current.start,
        end: patch.end ?? current.end,
        color: patch.color ?? current.color
      }
      if (hasOverlap(next, id)) throw new Error('Conflito de horário')
      items.value[idx] = next
    }
  }
  const removeItem = (id: string) => {
    items.value = items.value.filter(i => i.id !== id)
  }
  const byDate = (date: string) => computed(() => items.value.filter(i => i.date === date))

  return { items, addItem, updateItem, removeItem, byDate }
}
