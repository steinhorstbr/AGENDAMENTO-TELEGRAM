import TelegramBot from 'node-telegram-bot-api'
import cron from 'node-cron'
import Database from 'better-sqlite3'
import path from 'path'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "6307490274:AAGx5q-tQAP-HeAUGbAOo4XVJSlbtLCkpEA"
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "-4505537919"

class TelegramService {
  private bot: TelegramBot
  private db: Database.Database
  private notificationsSent: Set<string> = new Set()

  constructor() {
    this.bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false })
    
    // Inicializar banco de dados
    const dbPath = path.join(process.cwd(), 'data', 'schedule.db')
    this.db = new Database(dbPath)
    
    this.setupCronJobs()
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

    console.log('📅 Telegram notifications scheduled')
  }

  private async sendDailySchedule() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const tasks = this.db.prepare('SELECT * FROM schedule_items WHERE date = ? ORDER BY start').all(today)

      if (tasks.length === 0) {
        await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
          `🌅 *Bom dia!* \n\n📅 Hoje (${this.formatDate(today)}) não há tarefas agendadas.\n\nTenha um ótimo dia! ✨`, 
          { parse_mode: 'Markdown' }
        )
        return
      }

      let message = `🌅 *Bom dia!* \n\n📅 *Agenda de hoje (${this.formatDate(today)}):*\n\n`
      
      tasks.forEach((task: any, index: number) => {
        message += `${index + 1}. 🕐 *${task.start} - ${task.end}*\n`
        message += `   📋 ${task.title}\n`
        
        if (task.description) {
          message += `   📝 ${task.description}\n`
        }
        
        if (task.googleMapsLink) {
          message += `   📍 [Ver localização](${task.googleMapsLink})\n`
        }
        
        message += '\n'
      })

      message += '💪 Tenha um dia produtivo!'

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
      
      const tasks = this.db.prepare('SELECT * FROM schedule_items WHERE date = ?').all(today)

      for (const task of tasks as any[]) {
        const taskStart = this.parseTime(task.start)
        const currentTimeMinutes = this.parseTime(currentTime)
        
        // Enviar notificação 15 minutos antes
        const timeDiffMinutes = taskStart - currentTimeMinutes
        
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
      
      // Limpar notificações antigas (mais de 1 dia)
      this.cleanOldNotifications()
      
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
      message += `📋 *${task.title}*\n`
      
      if (task.description) {
        message += `📝 ${task.description}\n`
      }
      
      if (task.googleMapsLink) {
        message += `\n📍 [Ver localização no Maps](${task.googleMapsLink})\n`
      }
      
      if (minutesBefore === 0) {
        message += '\n🚀 Vamos lá!'
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
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    // Remove notificações antigas
    for (const key of this.notificationsSent) {
      if (key.includes(yesterdayStr)) {
        this.notificationsSent.delete(key)
      }
    }
  }

  async sendTestMessage() {
    try {
      await this.bot.sendMessage(TELEGRAM_CHAT_ID, 
        '🔧 *Teste de conexão*\n\nBot configurado com sucesso! ✅', 
        { parse_mode: 'Markdown' }
      )
      console.log('✅ Test message sent successfully')
    } catch (error) {
      console.error('❌ Error sending test message:', error)
    }
  }
}

export const telegramService = new TelegramService()

// Enviar mensagem de teste na inicialização
if (process.env.NODE_ENV !== 'development') {
  telegramService.sendTestMessage()
}