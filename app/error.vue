<!-- app/error.vue -->
<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full text-center">
      <div :class="[
        'rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center',
        error.statusCode === 404 ? 'bg-blue-100' : 'bg-red-100'
      ]">
        <span :class="[
          'text-3xl',
          error.statusCode === 404 ? 'text-blue-600' : 'text-red-600'
        ]">
          {{ error.statusCode === 404 ? '🔍' : '⚠️' }}
        </span>
      </div>
      
      <h1 class="text-3xl font-bold text-gray-800 mb-4">
        {{ error.statusCode }}
      </h1>
      
      <h2 class="text-xl font-semibold text-gray-700 mb-4">
        {{ getErrorTitle() }}
      </h2>
      
      <p class="text-gray-600 mb-8">
        {{ getErrorMessage() }}
      </p>
      
      <div class="space-y-3">
        <button
          @click="handleError"
          class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          {{ getActionText() }}
        </button>
        
        <button
          @click="goHome"
          class="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Voltar ao Início
        </button>
      </div>
      
      <!-- Debug info in development -->
      <div v-if="isDev" class="mt-8 text-left bg-gray-100 p-4 rounded-lg">
        <details>
          <summary class="text-sm font-medium text-gray-700 cursor-pointer">
            Debug Info
          </summary>
          <pre class="mt-2 text-xs text-gray-600 overflow-auto">{{ error }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

interface Props {
  error: NuxtError
}

const props = defineProps<Props>()
const isDev = process.dev

function getErrorTitle(): string {
  switch (props.error.statusCode) {
    case 404:
      return 'Página não encontrada'
    case 403:
      return 'Acesso negado'
    case 401:
      return 'Não autorizado'
    case 500:
      return 'Erro interno do servidor'
    default:
      return 'Algo deu errado'
  }
}

function getErrorMessage(): string {
  switch (props.error.statusCode) {
    case 404:
      return 'A página que você está procurando não existe ou foi movida.'
    case 403:
      return 'Você não tem permissão para acessar este recurso.'
    case 401:
      return 'Você precisa fazer login para acessar esta página.'
    case 500:
      return 'Ocorreu um erro interno. Nossa equipe foi notificada.'
    default:
      return props.error.statusMessage || 'Ocorreu um erro inesperado.'
  }
}

function getActionText(): string {
  switch (props.error.statusCode) {
    case 404:
      return 'Tentar Novamente'
    case 403:
    case 401:
      return 'Fazer Login'
    default:
      return 'Recarregar Página'
  }
}

function handleError() {
  switch (props.error.statusCode) {
    case 403:
    case 401:
      navigateTo('/login')
      break
    case 404:
      window.history.back()
      break
    default:
      window.location.reload()
  }
}

function goHome() {
  navigateTo('/')
}

// SEO
useHead({
  title: `Erro ${props.error.statusCode} - Agenda BJJ`,
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>

<!-- app/plugins/global-components.client.ts -->
<script setup lang="ts">
export default defineNuxtPlugin(() => {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    // Don't show toast for script loading errors
    if (!event.filename || !event.filename.includes('.js')) {
      useToast().error('Ocorreu um erro inesperado')
    }
  })

  // Global promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // Only show toast for actual application errors
    if (event.reason?.message && !event.reason.message.includes('Loading')) {
      useToast().error('Erro na aplicação')
    }
  })

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search (future feature)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.target?.closest('input, textarea')) {
      e.preventDefault()
      // TODO: Open global search
      useToast().info('Busca global em desenvolvimento', 'Em breve!')
    }
    
    // Ctrl/Cmd + N for new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.target?.closest('input, textarea')) {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('show-create-modal'))
    }
  })

  // Service worker registration (future PWA feature)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silently fail - SW not ready yet
    })
  }

  // Install prompt for PWA
  let deferredPrompt: any
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    
    // Show install banner after 30 seconds
    setTimeout(() => {
      if (deferredPrompt) {
        useToast().info(
          'Instale o Agenda BJJ como app no seu dispositivo!',
          'App Disponível',
          10000
        )
      }
    }, 30000)
  })
})
</script>

<!-- app/plugins/toast.client.ts -->
<script setup lang="ts">
export default defineNuxtPlugin(() => {
  // Initialize toast system on client
  return {
    provide: {
      toast: {
        success: (message: string, title?: string, duration?: number) => {
          if (typeof window !== 'undefined' && window.$toast) {
            window.$toast.success(message, title, duration)
          }
        },
        error: (message: string, title?: string, duration?: number) => {
          if (typeof window !== 'undefined' && window.$toast) {
            window.$toast.error(message, title, duration)
          }
        },
        warning: (message: string, title?: string, duration?: number) => {
          if (typeof window !== 'undefined' && window.$toast) {
            window.$toast.warning(message, title, duration)
          }
        },
        info: (message: string, title?: string, duration?: number) => {
          if (typeof window !== 'undefined' && window.$toast) {
            window.$toast.info(message, title, duration)
          }
        }
      }
    }
  }
})
</script>

<!-- app/utils/constants.ts -->
<script setup lang="ts">
export const APP_CONFIG = {
  name: 'Agenda BJJ',
  version: '2.0.0',
  author: 'Agenda BJJ Team',
  description: 'Sistema de Agendamento com Telegram Bot',
  
  // API Endpoints
  api: {
    base: '/api',
    auth: '/api/auth',
    schedule: '/api/schedule',
    categories: '/api/categories',
    upload: '/api/upload'
  },
  
  // File upload limits
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  
  // Time constants
  time: {
    workDayStart: 8,
    workDayEnd: 20,
    reminderIntervals: [15, 5, 0], // minutes before task
    dailyReportTime: '07:00'
  },
  
  // UI Constants
  ui: {
    mobileBreakpoint: 1024,
    touchTargetSize: 44,
    animationDuration: 200,
    toastDuration: 5000
  },
  
  // Default colors for categories
  defaultColors: [
    '#6366F1', // Indigo
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#F97316', // Orange
    '#059669', // Green
    '#DC2626', // Red
    '#7C2D12', // Brown
    '#BE185D', // Pink
    '#4338CA'  // Indigo
  ],
  
  // User roles
  roles: {
    admin: {
      label: 'Administrador',
      permissions: ['all']
    },
    instructor: {
      label: 'Instrutor',
      permissions: ['manage_tasks', 'assign_tasks', 'view_all']
    },
    staff: {
      label: 'Funcionário',
      permissions: ['manage_own_tasks', 'view_assigned']
    }
  }
} as const

export const TELEGRAM_COMMANDS = {
  help: '/help',
  today: '/hoje',
  tomorrow: '/amanha',
  myTasks: '/minhas',
  taskDetails: '/tarefa',
  reschedule: '/reagendar',
  complete: '/finalizar',
  stats: '/stats',
  pending: '/pendentes',
  status: '/status'
} as const

export const ERROR_MESSAGES = {
  auth: {
    invalidCredentials: 'Credenciais inválidas',
    sessionExpired: 'Sessão expirada. Faça login novamente',
    accessDenied: 'Acesso negado',
    unauthorized: 'Não autorizado'
  },
  validation: {
    required: 'Este campo é obrigatório',
    invalidEmail: 'Email inválido',
    passwordTooShort: 'Senha deve ter pelo menos 6 caracteres',
    invalidDate: 'Data inválida',
    invalidTime: 'Horário inválido',
    timeConflict: 'Conflito de horário',
    fileTooLarge: 'Arquivo muito grande (máximo 5MB)',
    invalidFileType: 'Tipo de arquivo não permitido'
  },
  system: {
    networkError: 'Erro de conexão. Verifique sua internet',
    serverError: 'Erro interno do servidor',
    notFound: 'Recurso não encontrado',
    unknownError: 'Erro desconhecido'
  }
} as const

export const SUCCESS_MESSAGES = {
  auth: {
    loginSuccess: 'Login realizado com sucesso',
    logoutSuccess: 'Logout realizado com sucesso'
  },
  schedule: {
    taskCreated: 'Tarefa criada com sucesso',
    taskUpdated: 'Tarefa atualizada com sucesso',
    taskDeleted: 'Tarefa excluída com sucesso',
    taskCompleted: 'Tarefa finalizada com sucesso',
    taskAssigned: 'Tarefa atribuída com sucesso'
  },
  system: {
    dataBackup: 'Backup realizado com sucesso',
    dataExport: 'Dados exportados com sucesso',
    settingsSaved: 'Configurações salvas com sucesso'
  }
} as const
</script>

<!-- app/utils/helpers.ts -->
<script setup lang="ts">
import { APP_CONFIG } from './constants'

/**
 * Format date to Brazilian format
 */
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr + 'T12:00:00')
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return date.toLocaleDateString('pt-BR', { ...defaultOptions, ...options })
}

/**
 * Format time to HH:MM format
 */
export function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5)
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > APP_CONFIG.upload.maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo ${formatFileSize(APP_CONFIG.upload.maxSize)}`
    }
  }
  
  // Check file type
  if (!APP_CONFIG.upload.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Use apenas imagens (JPEG, PNG, GIF, WebP)'
    }
  }
  
  return { valid: true }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Check if time is within work hours
 */
export function isWorkingHours(timeStr: string): boolean {
  const [hours] = timeStr.split(':').map(Number)
  return hours >= APP_CONFIG.time.workDayStart && hours <= APP_CONFIG.time.workDayEnd
}

/**
 * Calculate duration between two times
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}:00`)
  const end = new Date(`2000-01-01T${endTime}:00`)
  return (end.getTime() - start.getTime()) / (1000 * 60) // minutes
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d atrás`
  if (hours > 0) return `${hours}h atrás`
  if (minutes > 0) return `${minutes}m atrás`
  return 'Agora'
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < APP_CONFIG.ui.mobileBreakpoint
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Download data as file
 */
export function downloadFile(data: string, filename: string, type: string = 'text/plain'): void {
  const blob = new Blob([data], { type })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Get user initials from name
 */
export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

/**
 * Validate Google Maps URL
 */
export function isValidGoogleMapsUrl(url: string): boolean {
  if (!url) return true // Empty URL is valid
  
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('google.com') || 
           urlObj.hostname.includes('maps.app.goo.gl') ||
           urlObj.hostname.includes('goo.gl')
  } catch {
    return false
  }
}

/**
 * Generate color from string (for consistent user avatars)
 */
export function getColorFromString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % APP_CONFIG.defaultColors.length
  return APP_CONFIG.defaultColors[index]
}
</script>