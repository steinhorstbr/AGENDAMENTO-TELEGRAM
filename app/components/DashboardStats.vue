<!-- app/components/DashboardStats.vue -->
<template>
  <div class="space-y-6">
    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white rounded-lg p-4 shadow-sm border"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
            <p v-if="stat.change" :class="[
              'text-xs',
              stat.change.type === 'increase' ? 'text-green-600' : 'text-red-600'
            ]">
              {{ stat.change.type === 'increase' ? '↗' : '↘' }} {{ stat.change.value }}
            </p>
          </div>
          <div :class="[
            'w-12 h-12 rounded-lg flex items-center justify-center text-2xl',
            stat.bgColor
          ]">
            {{ stat.icon }}
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Tasks by Category Chart -->
      <div class="bg-white rounded-lg p-6 shadow-sm border">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Tarefas por Categoria</h3>
        
        <div v-if="categoryStats.length === 0" class="text-center py-8 text-gray-500">
          <p>📊 Nenhum dado disponível</p>
        </div>
        
        <div v-else class="space-y-3">
          <div
            v-for="category in categoryStats"
            :key="category.name"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-4 h-4 rounded"
                :style="{ backgroundColor: category.color }"
              ></div>
              <span class="text-sm font-medium text-gray-700">
                {{ category.icon }} {{ category.name }}
              </span>
            </div>
            <span class="text-sm text-gray-600">{{ category.count }}</span>
          </div>
        </div>
      </div>

      <!-- Weekly Progress Chart -->
      <div class="bg-white rounded-lg p-6 shadow-sm border">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Progresso Semanal</h3>
        
        <div v-if="dailyStats.length === 0" class="text-center py-8 text-gray-500">
          <p>📈 Nenhum dado disponível</p>
        </div>
        
        <div v-else class="space-y-2">
          <div
            v-for="day in dailyStats"
            :key="day.date"
            class="flex items-center gap-3"
          >
            <div class="w-16 text-xs text-gray-600">
              {{ formatDayShort(day.date) }}
            </div>
            <div class="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
              <div class="h-full flex">
                <div
                  class="bg-green-500 h-full"
                  :style="{ width: `${(day.completed / day.total) * 100}%` }"
                  :title="`${day.completed} concluídas`"
                ></div>
                <div
                  class="bg-orange-500 h-full"
                  :style="{ width: `${(day.pending / day.total) * 100}%` }"
                  :title="`${day.pending} pendentes`"
                ></div>
              </div>
            </div>
            <div class="text-xs text-gray-600 w-8 text-right">
              {{ day.total }}
            </div>
          </div>
          
          <!-- Legend -->
          <div class="flex justify-center gap-4 mt-4 text-xs">
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-green-500 rounded"></div>
              <span>Concluídas</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-3 h-3 bg-orange-500 rounded"></div>
              <span>Pendentes</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg p-6 shadow-sm border">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Atividade Recente</h3>
        <button
          @click="refreshData"
          :disabled="isRefreshing"
          class="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
        >
          {{ isRefreshing ? '🔄' : '↻' }} Atualizar
        </button>
      </div>
      
      <div v-if="recentActivity.length === 0" class="text-center py-8 text-gray-500">
        <p>📋 Nenhuma atividade recente</p>
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="activity in recentActivity"
          :key="activity.id"
          class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
        >
          <div :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
            activity.type === 'completed' ? 'bg-green-500' :
            activity.type === 'assigned' ? 'bg-blue-500' :
            activity.type === 'created' ? 'bg-indigo-500' :
            'bg-gray-500'
          ]">
            {{ getActivityIcon(activity.type) }}
          </div>
          
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">
              {{ activity.title }}
            </p>
            <p class="text-xs text-gray-600">
              {{ activity.description }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ formatRelativeTime(activity.timestamp) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Performers (Admin/Instructor only) -->
    <div
      v-if="showTopPerformers && topUsers.length > 0"
      class="bg-white rounded-lg p-6 shadow-sm border"
    >
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Top Performers</h3>
      
      <div class="space-y-3">
        <div
          v-for="(user, index) in topUsers"
          :key="user.id"
          class="flex items-center gap-3"
        >
          <div :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
            index === 0 ? 'bg-yellow-500' :
            index === 1 ? 'bg-gray-400' :
            index === 2 ? 'bg-orange-600' :
            'bg-gray-300'
          ]">
            {{ index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1 }}
          </div>
          
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
              <span class="text-xs text-gray-500">{{ getRoleLabel(user.role) }}</span>
            </div>
            <p class="text-xs text-gray-600">
              {{ user.completed_count }} concluídas de {{ user.task_count }} tarefas
            </p>
          </div>
          
          <div class="text-right">
            <p class="text-sm font-bold text-green-600">
              {{ Math.round((user.completed_count / user.task_count) * 100) }}%
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface Props {
  period?: 'today' | 'week' | 'month'
  userId?: string
  refreshTrigger?: number
}

const props = withDefaults(defineProps<Props>(), {
  period: 'week'
})

const { user, isAdmin, isInstructor } = useAuth()
const isRefreshing = ref(false)
const statsData = ref<any>(null)

const showTopPerformers = computed(() => 
  isAdmin.value || isInstructor.value
)

const stats = computed(() => {
  if (!statsData.value) return []
  
  const data = statsData.value.stats
  
  return [
    {
      label: 'Total',
      value: data.total_tasks || 0,
      icon: '📋',
      bgColor: 'bg-blue-100',
      change: null
    },
    {
      label: 'Concluídas',
      value: data.completed_tasks || 0,
      icon: '✅',
      bgColor: 'bg-green-100',
      change: null
    },
    {
      label: 'Pendentes',
      value: data.pending_tasks || 0,
      icon: '⏰',
      bgColor: 'bg-orange-100',
      change: null
    },
    {
      label: 'Taxa de Conclusão',
      value: `${data.completion_rate || 0}%`,
      icon: '📊',
      bgColor: 'bg-purple-100',
      change: null
    }
  ]
})

const categoryStats = computed(() => 
  statsData.value?.tasks_by_category || []
)

const dailyStats = computed(() => 
  statsData.value?.tasks_by_day || []
)

const topUsers = computed(() => 
  statsData.value?.top_users || []
)

const recentActivity = computed(() => {
  // Em uma implementação real, isso viria da API
  // Por agora, criar dados mock baseados nas tarefas
  return []
})

async function loadData() {
  try {
    const { getDashboardStats } = useSchedule()
    statsData.value = await getDashboardStats(props.period, props.userId)
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error)
    useToast().error('Erro ao carregar estatísticas')
  }
}

async function refreshData() {
  isRefreshing.value = true
  try {
    await loadData()
    useToast().success('Dados atualizados!')
  } catch (error) {
    useToast().error('Erro ao atualizar dados')
  } finally {
    isRefreshing.value = false
  }
}

function getActivityIcon(type: string): string {
  const icons = {
    completed: '✓',
    assigned: '👤',
    created: '+',
    rescheduled: '🔄'
  }
  return icons[type as keyof typeof icons] || '•'
}

function getRoleLabel(role: string): string {
  const labels = {
    admin: 'Admin',
    instructor: 'Instrutor',
    staff: 'Funcionário'
  }
  return labels[role as keyof typeof labels] || role
}

function formatDayShort(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR', { weekday: 'short' })
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days > 0) return `${days}d atrás`
  if (hours > 0) return `${hours}h atrás`
  if (minutes > 0) return `${minutes}m atrás`
  return 'Agora'
}

// Watchers
watch(() => props.period, loadData)
watch(() => props.userId, loadData)
watch(() => props.refreshTrigger, loadData)

// Lifecycle
onMounted(loadData)
</script>

<!-- app/components/QuickActions.vue -->
<template>
  <div class="bg-white rounded-lg p-6 shadow-sm border">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
    
    <div class="grid grid-cols-2 lg:grid-cols-1 gap-3">
      <button
        @click="$emit('create-task')"
        class="flex items-center gap-3 p-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        <span class="text-lg">➕</span>
        <span class="font-medium">Nova Tarefa</span>
      </button>
      
      <button
        v-if="isAdmin || isInstructor"
        @click="$emit('manage-users')"
        class="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <span class="text-lg">👥</span>
        <span class="font-medium">Gerenciar Usuários</span>
      </button>
      
      <button
        v-if="isAdmin"
        @click="$emit('manage-categories')"
        class="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
      >
        <span class="text-lg">🏷️</span>
        <span class="font-medium">Categorias</span>
      </button>
      
      <button
        @click="$emit('export-data')"
        class="flex items-center gap-3 p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span class="text-lg">📊</span>
        <span class="font-medium">Exportar</span>
      </button>
      
      <button
        @click="$emit('backup-data')"
        class="flex items-center gap-3 p-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
      >
        <span class="text-lg">💾</span>
        <span class="font-medium">Backup</span>
      </button>
      
      <button
        @click="openTelegramHelp"
        class="flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
      >
        <span class="text-lg">🤖</span>
        <span class="font-medium">Telegram</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAdmin, isInstructor } = useAuth()

defineEmits<{
  'create-task': []
  'manage-users': []
  'manage-categories': []
  'export-data': []
  'backup-data': []
}>()

function openTelegramHelp() {
  useToast().info(`
Comandos Telegram disponíveis:
• /reagendar <código> +1h
• /finalizar <código>
• /help - Ver todos os comandos
  `, 'Ajuda do Telegram', 10000)
}
</script>