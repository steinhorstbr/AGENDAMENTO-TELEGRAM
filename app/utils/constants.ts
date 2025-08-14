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