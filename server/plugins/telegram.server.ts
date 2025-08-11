import fs from 'fs'
import path from 'path'

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🚀 Initializing Application Services...')
  
  // Criar diretório data se não existir
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
    console.log('📁 Created data directory')
  }
  
  // Inicializar banco de dados
  try {
    const { initializeDatabase, cleanOldData } = await import('../database/init')
    initializeDatabase()
    
    // Limpar dados antigos uma vez por dia
    if (process.env.NODE_ENV === 'production') {
      cleanOldData()
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
  }
  
  // Importar o serviço do Telegram
  try {
    const { telegramService } = await import('../services/telegramService')
    console.log('✅ Telegram Bot Service initialized')
    
    // Verificar se o bot está funcionando
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        telegramService.sendTestMessage()
      }, 5000) // Aguardar 5 segundos para garantir que tudo está carregado
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize Telegram Service:', error)
  }
  
  console.log('🎉 Application services initialized successfully')
})