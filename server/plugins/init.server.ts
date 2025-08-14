// server/plugins/init.server.ts
import fs from 'fs'
import path from 'path'

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🚀 Initializing Agenda BJJ Application...')
  
  // Criar diretórios necessários
  const dataDir = path.join(process.cwd(), 'data')
  const backupsDir = path.join(process.cwd(), 'backups')
  const logsDir = path.join(process.cwd(), 'logs')
  const uploadsDir = path.join(process.cwd(), 'uploads')
  
  for (const dir of [dataDir, backupsDir, logsDir, uploadsDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`📁 Created directory: ${path.basename(dir)}`)
    }
  }
  
  // Inicializar banco de dados principal
  try {
    const { initializeDatabase, cleanOldData } = await import('../database/init')
    initializeDatabase()
    
    // Limpar dados antigos uma vez por dia em produção
    if (process.env.NODE_ENV === 'production') {
      cleanOldData()
    }
    
    console.log('✅ Main database initialized')
  } catch (error) {
    console.error('❌ Failed to initialize main database:', error)
  }
  
  // Inicializar sistema de autenticação
  try {
    const { initializeAuthDatabase } = await import('../database/authInit')
    initializeAuthDatabase()
    
    console.log('✅ Authentication system initialized')
  } catch (error) {
    console.error('❌ Failed to initialize authentication system:', error)
  }
  
  // Importar o serviço do Telegram
  try {
    const { telegramService } = await import('../services/telegramService')
    console.log('✅ Telegram Bot Service initialized')
    
    // Verificar se o bot está funcionando (apenas em produção)
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        telegramService.sendTestMessage()
      }, 5000) // Aguardar 5 segundos para garantir que tudo está carregado
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize Telegram Service:', error)
  }
  
  // Log de inicialização completa
  console.log('🎉 Agenda BJJ Application initialized successfully')
  console.log('📊 System Information:')
  console.log(`   - Node.js: ${process.version}`)
  console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   - Timezone: ${process.env.TZ || 'America/Sao_Paulo'}`)
  console.log(`   - Data Directory: ${dataDir}`)
  console.log('🌐 Application ready to serve requests')
})

// server/utils/auth.ts
import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'
import { join } from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-forte-aqui'

export interface AuthUser {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'instructor' | 'staff'
  avatar?: string
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded
  } catch (error) {
    return null
  }
}

export function requireAuth(event: any): AuthUser {
  const authHeader = getHeader(event, 'authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token de acesso requerido'
    })
  }

  const token = authHeader.substring(7)
  const user = verifyToken(token)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido'
    })
  }
  
  return user
}

export function requireRole(event: any, allowedRoles: string[]): AuthUser {
  const user = requireAuth(event)
  
  if (!allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permissões insuficientes'
    })
  }
  
  return user
}

export function getUserFromDb(userId: string): any {
  const dbPath = join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)
  
  try {
    return db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(userId)
  } finally {
    db.close()
  }
}

// server/utils/file-upload.ts
import fs from 'fs'
import path from 'path'

export function saveUploadedFile(fileData: any, filename: string): string {
  const uploadsDir = path.join(process.cwd(), 'uploads')
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2)
  const extension = path.extname(filename)
  const newFilename = `${timestamp}_${randomId}${extension}`
  const filePath = path.join(uploadsDir, newFilename)
  
  // Salvar arquivo
  fs.writeFileSync(filePath, fileData)
  
  // Retornar URL relativa
  return `/uploads/${newFilename}`
}

export function deleteFile(filePath: string): boolean {
  try {
    const fullPath = path.join(process.cwd(), filePath.replace('/uploads/', 'uploads/'))
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

// server/api/uploads/[...path].ts
export default defineEventHandler(async (event) => {
  const filePath = getRouterParam(event, 'path')
  
  if (!filePath) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Arquivo não encontrado'
    })
  }
  
  const fullPath = path.join(process.cwd(), 'uploads', filePath)
  
  if (!fs.existsSync(fullPath)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Arquivo não encontrado'
    })
  }
  
  // Verificar se o arquivo está dentro do diretório de uploads (segurança)
  const uploadsDir = path.join(process.cwd(), 'uploads')
  if (!fullPath.startsWith(uploadsDir)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Acesso negado'
    })
  }
  
  // Determinar content-type baseado na extensão
  const ext = path.extname(fullPath).toLowerCase()
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.json': 'application/json'
  }
  
  const contentType = contentTypes[ext] || 'application/octet-stream'
  
  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'public, max-age=86400') // 24 horas
  
  return sendStream(event, fs.createReadStream(fullPath))
})