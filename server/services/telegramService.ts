// server/services/telegramService.ts - UPDATED VERSION
import TelegramBot from 'node-telegram-bot-api'
import cron from 'node-cron'
import Database from 'better-sqlite3'
import { join } from 'path'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "6307490274:AAGx5q-tQAP-HeAUGbAOo4XVJSlbtLCkpEA"
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-4505537919"

class TelegramService {
  private bot: TelegramBot
  private db: Database.Database
  private notificationsSent: Set<string> = new Set()

  constructor() {
    this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
    
    // Inicializar banco de dados
    const dbPath = join(process.cwd(), 'data', 'schedule.db')
    this.db = new Database(dbPath)
    
    this.setupCronJobs()
    this.setupBotCommands()
  }

  private setupBotCommands() {
    // Comando de ajuda expandido
    this.bot.onText(/\/help/, async (msg) => {
      if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return
      
      const helpText = `🤖 *Comandos disponíveis:*

📅 *Reagendar tarefa:*
/reagendar <código> +1h - Reagendar +1 hora
/reagendar <código> +2h - Reagendar +2 horas

✅ *Finalizar tarefa:*
/finalizar <código> - Marcar como concluída

📋 *Consultas:*
/tarefa <código> - Detalhes da tarefa
/minhas - Minhas tarefas de hoje
/hoje - Todas as tarefas de hoje
/amanha - Tarefas de amanhã

📊 *Relatórios:*
/stats - Estatísticas da semana
/pendentes - Tarefas pendentes

⚙️ *Sistema:*
/status - Status do sistema
/help - Esta ajuda

*Exemplo:*
/reagendar A1B2 +1h
/finalizar A1B2
/tarefa A1B2`

      await this.bot.sendMessage(TELEGRAM_CHAT_ID, helpText, { parse_mode: 'Markdown' })
    })

    // Reagendar tarefa
    this.bot.onText(/\/reagendar (\w{4}) \+(\d+)h?/, async (msg, match) => {
      if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return
      
      const code = match![1].toUpperCase()
      const hours = parseInt(match![2])
      
      if (hours !== 1 && hours !== 2) {
        await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
          `❌ Apenas +1h ou +2h são permitidos.\n\nUso: /reagendar ${code} +1h ou /reagendar ${code} +2h`
        )
        return
      }
      
      await this.rescheduleTask(code, hours)
    })

    // Finalizar tarefa
    this.bot.onText(/\/finalizar (\w{4})/, async (msg, match) => {
      if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return
      
      const code = match![1].toUpperCase()
      await this.completeTask(code)
    })

    // Detalhes da tarefa
    this.bot.onText(/\/tarefa (\w{4})/, async (msg, match) => {
      if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return
      
      const code = match![1].toUpperCase()
      await this.getTaskDetails(code)
    })

    // Minhas tarefas
    this.bot.onText(/\/minhas/, async (msg) => {
      if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return
      await this.getMyTasks()
    })

    // Tarefas de hoje
    this.bot.onText(/\/hoje/, async (msg) => {
      if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return
      await this.getTodayTasks()
    })

    // Tarefas de amanhã
    this.bot.onText(/\/amanha/, async (msg) => {
      if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return
      await this.getTomorrowTasks()
    })

    // Estatísticas
    this.bot.onText(/\/stats/, async (msg) => {
      if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return
      await this.getWeeklyStats()
    })

    // Tarefas pendentes
    this.bot.onText(/\/pendentes/, async (msg) => {
      if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return
      await this.getPendingTasks()
    })

    // Status do sistema
    this.bot.onText(/\/status/, async (msg) => {
      if (msg.chat.id.toString() !== TELEGRAM_CHAT_ID) return
      await this.getSystemStatus()
    })
  }

  private async rescheduleTask(code: string, hoursToAdd: number) {
    try {
      const task = this.db.prepare(`
        SELECT si.*, c.name as category_name, c.icon as category_icon,
               u.name as assigned_to_name
        FROM schedule_items si
        LEFT JOIN categories c ON si.category_id = c.id
        LEFT JOIN users u ON si.assigned_to = u.id
        WHERE si.code = ? AND si.is_completed = 0
      `).get(code)
      
      if (!task) {
        await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
          `❌ Tarefa *${code}* não encontrada ou já finalizada.`, 
          { parse_mode: 'Markdown' }
        )
        return
      }

      const taskData = task as any

      // Calcular novo horário
      const [startHour, startMin] = taskData.start.split(':').map(Number)
      const [endHour, endMin] = taskData.end.split(':').map(Number)
      
      const newStartHour = startHour + hoursToAdd
      const newEndHour = endHour + hoursToAdd
      
      // Validar se não passou da meia-noite
      if (newStartHour >= 24 || newEndHour >= 24) {
        await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
          `❌ Não é possível reagendar *${code}* - horário passaria da meia-noite.`,
          { parse_mode: 'Markdown' }
        )
        return
      }

      const newStart = `${newStartHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`
      const newEnd = `${newEndHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
      
      // Verificar conflitos
      const conflicts = this.db.prepare(`
        SELECT * FROM schedule_items 
        WHERE date = ? AND id != ? AND is_completed = 0
        AND (
          (start < ? AND end > ?) OR
          (start < ? AND end > ?) OR
          (start >= ? AND end <= ?)
        )
      `).all(taskData.date, taskData.id, newEnd, newStart, newStart, newEnd, newStart, newEnd)
      
      if (conflicts.length > 0) {
        await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
          `❌ Conflito de horário ao reagendar *${code}*. Verifique a agenda.`,
          { parse_mode: 'Markdown' }
        )
        return
      }

      // Atualizar no banco
      const rescheduledReason = `Reagendado via Telegram: +${hoursToAdd}h`
      this.db.prepare(`
        UPDATE schedule_items 
        SET start = ?, end = ?, rescheduled_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE code = ?
      `).run(newStart, newEnd, rescheduledReason, code)

      let message = `✅ *Tarefa reagendada com sucesso!*

${taskData.category_icon || '📋'} *${taskData.title}*
🔢 Código: \`${code}\`
🕐 Novo horário: *${newStart} - ${newEnd}*
📅 Data: ${this.formatDate(taskData.date)}
🔄 Reagendado: +${hoursToAdd}h`

      if (taskData.assigned_to_name) {
        message += `\n👤 Responsável: ${taskData.assigned_to_name}`
      }

      if (taskData.googleMapsLink) {
        message += `\n\n📍 [Ver localização](${taskData.googleMapsLink})`
      }

      message += `\n\n💡 Verifique o dashboard para confirmar.`

      await this.bot.sendMessage(TELEGRAM_CHAT_ID, message, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      })

    } catch (error) {
      console.error('Error rescheduling task:', error)
      await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
        `❌ Erro ao reagendar tarefa *${code}*. Tente novamente.`,
        { parse_mode: 'Markdown' }
      )
    }
  }

  private async completeTask(code: string) {
    try {
      const task = this.db.prepare(`
        SELECT si.*, c.name as category_name, c.icon as category_icon,
               u.name as assigned_to_name
        FROM schedule_items si
        LEFT JOIN categories c ON si.category_id = c.id
        LEFT JOIN users u ON si.assigned_to = u.id
        WHERE si.code = ? AND si.is_completed = 0
      `).get(code)
      
      if (!task) {
        await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
          `❌ Tarefa *${code}* não encontrada ou já finalizada.`,
          { parse_mode: 'Markdown' }
        )
        return
      }

      const taskData = task as any

      // Marcar como finalizada
      this.db.prepare(`
        UPDATE schedule_items 
        SET is_completed = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE code = ?
      `).run(code)

      let message = `✅ *Tarefa finalizada!*

${taskData.category_icon || '📋'} *${taskData.title}*
🔢 Código: \`${code}\`
🕐 ${taskData.start} - ${taskData.end}
📅 ${this.formatDate(taskData.date)}`

      if (taskData.assigned_to_name) {
        message += `\n👤 Responsável: ${taskData.assigned_to_name}`
      }

      if (taskData.description) {
        message += `\n📝 ${taskData.description}`
      }

      message += `\n\n🎉 Parabéns! Tarefa concluída com sucesso.`

      await this.bot.sendMessage(TELEGRAM_CHAT_ID, message, { 
        parse_mode: 'Markdown' 
      })

    } catch (error) {
      console.error('Error completing task:', error)
      await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
        `❌ Erro ao finalizar tarefa *${code}*. Tente novamente.`,
        { parse_mode: 'Markdown' }
      )
    }
  }

  private async getTaskDetails(code: string) {
    try {
      const task = this.db.prepare(`
        SELECT si.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
               u1.name as created_by_name, u2.name as assigned_to_name
        FROM schedule_items si
        LEFT JOIN categories c ON si.category_id = c.id
        LEFT JOIN users u1 ON si.created_by = u1.id
        LEFT JOIN users u2 ON si.assigned_to = u2.id
        WHERE si.code = ?
      `).get(code)

      if (!task) {
        await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
          `❌ Tarefa *${code}* não encontrada.`,
          { parse_mode: 'Markdown' }
        )
        return
      }

      const taskData = task as any
      const isCompleted = Boolean(taskData.is_completed)

      let message = `📋 *Detalhes da Tarefa*

${taskData.category_icon || '📋'} *${taskData.title}*
🔢 Código: \`${code}\`
🏷️ Categoria: ${taskData.category_name || 'Sem categoria'}
🕐 Horário: *${taskData.start} - ${taskData.end}*
📅 Data: ${this.formatDate(taskData.date)}
${isCompleted ? '✅' : '⏰'} Status: ${isCompleted ? 'Finalizada' : 'Pendente'}`

      if (taskData.description) {
        message += `\n📝 Descrição: ${taskData.description}`
      }

      if (taskData.created_by_name) {
        message += `\n👨‍💼 Criado por: ${taskData.created_by_name}`
      }

      if (taskData.assigned_to_name) {
        message += `\n👤 Responsável: ${taskData.assigned_to_name}`
      }

      if (taskData.rescheduled_reason) {
        message += `\n🔄 ${taskData.rescheduled_reason}`
      }

      if (taskData.googleMapsLink) {
        message += `\n\n📍 [Ver localização no Maps](${taskData.googleMapsLink})`
      }

      if (!isCompleted) {
        message += `\n\n💡 *Comandos disponíveis:*
/reagendar ${code} +1h
/finalizar ${code}`
      }

      await this.bot.sendMessage(TELEGRAM_CHAT_ID, message, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      })

    } catch (error) {
      console.error('Error getting task details:', error)
      await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
        `❌ Erro ao buscar detalhes da tarefa *${code}*.`,
        { parse_mode: 'Markdown' }
      )
    }
  }

  private async getTodayTasks() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const tasks = this.db.prepare(`
        SELECT si.*, c.icon as category_icon
        FROM schedule_items si
        LEFT JOIN categories c ON si.category_id = c.id
        WHERE si.date = ? 
        ORDER BY si.start ASC
      `).all(today)

      if (tasks.length === 0) {
        await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
          `📅 *Tarefas de hoje (${this.formatDate(today)})*\n\nNenhuma tarefa agendada para hoje! 🎉`,
          { parse_mode: 'Markdown' }
        )
        return
      }

      let message = `📅 *Tarefas de hoje (${this.formatDate(today)}):*\n\n`
      
      tasks.forEach((task: any, index: number) => {
        const status = Boolean(task.is_completed) ? '✅' : '⏰'
        message += `${index + 1}. ${status} *${task.start} - ${task.end}*\n`
        message += `   ${task.category_icon || '📋'} ${task.title}\n`
        message += `   🔢 \`${task.code}\`\n\n`
      })

      message += `📊 Total: ${tasks.length} tarefas\n`
      message += `✅ Concluídas: ${tasks.filter((t: any) => Boolean(t.is_completed)).length}\n`
      message += `⏰ Pendentes: ${tasks.filter((t: any) => !Boolean(t.is_completed)).length}`

      await this.bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' })

    } catch (error) {
      console.error('Error getting today tasks:', error)
      await this.bot.sendMessage(TELEGRAM_CHAT_ID, '❌ Erro ao buscar tarefas de hoje.')
    }
  }

  private async getWeeklyStats() {
    try {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const startDate = startOfWeek.toISOString().split('T')[0]
      const endDate = endOfWeek.toISOString().split('T')[0]

      const stats = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(is_completed) as completed,
          COUNT(*) - SUM(is_completed) as pending
        FROM schedule_items 
        WHERE date >= ? AND date <= ?
      `).get(startDate, endDate) as any

      const categoryStats = this.db.prepare(`
        SELECT c.name, c.icon, COUNT(si.id) as count
        FROM schedule_items si
        LEFT JOIN categories c ON si.category_id = c.id
        WHERE si.date >= ? AND si.date <= ?
        GROUP BY c.id, c.name, c.icon
        ORDER BY count DESC
        LIMIT 5
      `).all(startDate, endDate)

      let message = `📊 *Estatísticas da Semana*\n\n`
      message += `📋 Total: ${stats.total}\n`
      message += `✅ Concluídas: ${stats.completed}\n`
      message += `⏰ Pendentes: ${stats.pending}\n`
      
      if (stats.total > 0) {
        const completionRate = Math.round((stats.completed / stats.total) * 100)
        message += `📈 Taxa de conclusão: ${completionRate}%\n\n`
      }

      if (categoryStats.length > 0) {
        message += `🏷️ *Por categoria:*\n`
        categoryStats.forEach((cat: any) => {
          message += `${cat.icon || '📋'} ${cat.name}: ${cat.count}\n`
        })
      }

      await this.bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' })

    } catch (error) {
      console.error('Error getting weekly stats:', error)
      await this.bot.sendMessage(TELEGRAM_CHAT_ID, '❌ Erro ao buscar estatísticas.')
    }
  }

  private async getSystemStatus() {
    try {
      const taskCount = this.db.prepare('SELECT COUNT(*) as count FROM schedule_items').get() as any
      const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get() as any
      const categoryCount = this.db.prepare('SELECT COUNT(*) as count FROM categories WHERE is_active = 1').get() as any

      const message = `🏥 *Status do Sistema*

📊 Estatísticas:
• 📋 Tarefas: ${taskCount.count}
• 👥 Usuários ativos: ${userCount.count}
• 🏷️ Categorias: ${categoryCount.count}

🤖 Bot: Funcionando ✅
🗄️ Banco de dados: Conectado ✅
🔔 Notificações: Ativas ✅

⏰ Última verificação: ${new Date().toLocaleString('pt-BR')}`

      await this.bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' })

    } catch (error) {
      console.error('Error getting system status:', error)
      await this.bot.sendMessage(TELEGRAM_CHAT_ID, '❌ Erro ao verificar status do sistema.')
    }
  }

  private setupCronJobs() {
    // Alerta diário às 7h da manhã (segunda a sexta)
    cron.schedule('0 7 * * 1-5', () => {
      this.sendDailySchedule()
    }, {
      timezone: "America/Sao_Paulo"
    })

    // Verificar notificações próximas a cada 5 minutos
    cron.schedule('*/5 * * * *', () => {
      this.checkUpcomingTasks()
    }, {
      timezone: "America/Sao_Paulo"
    })

    // Limpeza de notificações antigas (diário às 2h)
    cron.schedule('0 2 * * *', () => {
      this.cleanOldNotifications()
    }, {
      timezone: "America/Sao_Paulo"
    })

    console.log('📅 Telegram cron jobs scheduled')
  }

  private async sendDailySchedule() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const tasks = this.db.prepare(`
        SELECT si.*, c.icon as category_icon, u.name as assigned_to_name
        FROM schedule_items si
        LEFT JOIN categories c ON si.category_id = c.id
        LEFT JOIN users u ON si.assigned_to = u.id
        WHERE si.date = ? AND si.is_completed = 0 
        ORDER BY si.start ASC
      `).all(today)

      if (tasks.length === 0) {
        await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
          `🌅 *Bom dia!* \n\n📅 Hoje (${this.formatDate(today)}) não há tarefas pendentes.\n\nTenha um ótimo dia! ✨`, 
          { parse_mode: 'Markdown' }
        )
        return
      }

      let message = `🌅 *Bom dia!* \n\n📅 *Agenda de hoje (${this.formatDate(today)}):*\n\n`
      
      tasks.forEach((task: any, index: number) => {
        message += `${index + 1}. 🕐 *${task.start} - ${task.end}*\n`
        message += `   ${task.category_icon || '📋'} ${task.title}\n`
        message += `   🔢 \`${task.code}\`\n`
        
        if (task.assigned_to_name) {
          message += `   👤 ${task.assigned_to_name}\n`
        }
        
        if (task.description) {
          message += `   📝 ${task.description}\n`
        }
        
        if (task.googleMapsLink) {
          message += `   📍 [Ver localização](${task.googleMapsLink})\n`
        }
        
        message += '\n'
      })

      message += `💡 *Comandos disponíveis:*
/reagendar <código> +1h
/finalizar <código>
/help - Ver todos os comandos

💪 Tenha um dia produtivo!`

      await this.bot.sendMessage(TELEGRAM_CHAT_ID, message, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      })

      console.log(`✅ Daily schedule sent for ${today}`)
    } catch (error) {
      console.error('❌ Error sending daily schedule:', error)
    }
  }

  private async checkUpcomingTasks() {
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      const tasks = this.db.prepare(`
        SELECT si.*, c.icon as category_icon, u.name as assigned_to_name
        FROM schedule_items si
        LEFT JOIN categories c ON si.category_id = c.id
        LEFT JOIN users u ON si.assigned_to = u.id
        WHERE si.date = ? AND si.is_completed = 0
      `).all(today)

      for (const task of tasks as any[]) {
        const taskStart = this.parseTime(task.start)
        const currentTimeMinutes = this.parseTime(currentTime)
        
        const timeDiffMinutes = taskStart - currentTimeMinutes
        
        // Enviar notificação 15 minutos antes
        if (timeDiffMinutes <= 15 && timeDiffMinutes > 10) {
          const notificationKey = `${task.id}-15min`
          
          if (!this.notificationsSent.has(notificationKey)) {
            await this.sendTaskReminder(task, 15)
            this.notificationsSent.add(notificationKey)
          }
        }
        
        // Enviar notificação 5 minutos antes
        if (timeDiffMinutes <= 5 && timeDiffMinutes > 0) {
          const notificationKey = `${task.id}-5min`
          
          if (!this.notificationsSent.has(notificationKey)) {
            await this.sendTaskReminder(task, 5)
            this.notificationsSent.add(notificationKey)
          }
        }
        
        // Enviar notificação no horário
        if (timeDiffMinutes <= 0 && timeDiffMinutes > -5) {
          const notificationKey = `${task.id}-now`
          
          if (!this.notificationsSent.has(notificationKey)) {
            await this.sendTaskReminder(task, 0)
            this.notificationsSent.add(notificationKey)
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error checking upcoming tasks:', error)
    }
  }

  private async sendTaskReminder(task: any, minutesBefore: number) {
    try {
      let message = ''
      
      if (minutesBefore === 15) {
        message = `⏰ *Lembrete: Tarefa em 15 minutos!*\n\n`
      } else if (minutesBefore === 5) {
        message = `🚨 *Atenção: Tarefa em 5 minutos!*\n\n`
      } else {
        message = `🔔 *AGORA: Hora da tarefa!*\n\n`
      }
      
      message += `🕐 *${task.start} - ${task.end}*\n`
      message += `${task.category_icon || '📋'} *${task.title}*\n`
      message += `🔢 Código: \`${task.code}\`\n`
      
      if (task.assigned_to_name) {
        message += `👤 Responsável: ${task.assigned_to_name}\n`
      }
      
      if (task.description) {
        message += `📝 ${task.description}\n`
      }
      
      if (task.googleMapsLink) {
        message += `\n📍 [Ver localização no Maps](${task.googleMapsLink})\n`
      }
      
      message += `\n💡 *Comandos:*
/reagendar ${task.code} +1h
/finalizar ${task.code}`
      
      if (minutesBefore === 0) {
        message += '\n\n🚀 Vamos lá!'
      }

      await this.bot.sendMessage(TELEGRAM_CHAT_ID, message, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: true 
      })

      console.log(`✅ Task reminder sent: ${task.title} (${minutesBefore} min before)`)
    } catch (error) {
      console.error('❌ Error sending task reminder:', error)
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  private cleanOldNotifications() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Remove notificações antigas
    const keysToRemove = Array.from(this.notificationsSent).filter(key => {
      // Remove keys que não são do dia atual
      return !key.includes(new Date().toISOString().split('T')[0])
    })
    
    keysToRemove.forEach(key => {
      this.notificationsSent.delete(key)
    })
    
    console.log(`🧹 Cleaned ${keysToRemove.length} old notifications`)
  }

  async sendTestMessage() {
    try {
      await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
        `🔧 *Sistema Agenda BJJ v2.0*

Bot configurado e funcionando! ✅

🆕 *Novidades:*
• Sistema de autenticação
• Categorias personalizadas
• Atribuição de tarefas
• Finalização com fotos e GPS
• Interface mobile aprimorada

💡 *Comandos principais:*
/help - Ver todos os comandos
/hoje - Tarefas de hoje
/stats - Estatísticas
/status - Status do sistema

*Exemplo:*
/reagendar A1B2 +1h
/finalizar A1B2
/tarefa A1B2`, 
        { parse_mode: 'Markdown' }
      )
      console.log('✅ Test message sent successfully')
    } catch (error) {
      console.error('❌ Error sending test message:', error)
    }
  }
}

export const telegramService = new TelegramService()

// Enviar mensagem de teste na inicialização (apenas em produção)
if (process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    telegramService.sendTestMessage()
  }, 3000)
}