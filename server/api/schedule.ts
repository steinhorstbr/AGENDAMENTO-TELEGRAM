import Database from 'better-sqlite3'
import { join } from 'path'

export interface ScheduleItem {
  id: string
  code: string // Código hexadecimal de 4 dígitos
  title: string
  description?: string
  date: string // ISO date (yyyy-mm-dd)
  start: string // HH:MM (24h)
  end: string   // HH:MM (24h)
  color?: string
  googleMapsLink?: string
  rescheduled_reason?: string // Motivo do reagendamento
  is_completed?: boolean // Se foi finalizada
}

// Inicializar banco de dados
const dbPath = join(process.cwd(), 'data', 'schedule.db')
const db = new Database(dbPath)

// Criar tabela se não existir (com novos campos)
db.exec(`
  CREATE TABLE IF NOT EXISTS schedule_items (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    color TEXT,
    googleMapsLink TEXT,
    rescheduled_reason TEXT,
    is_completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Verificar e adicionar colunas se necessário
const addColumnSafe = (columnName: string, columnDef: string) => {
  try {
    const tableInfo = db.pragma('table_info(schedule_items)')
    const columnExists = (tableInfo as any[]).some((col: any) => col.name === columnName)
    if (!columnExists) {
      db.exec(`ALTER TABLE schedule_items ADD COLUMN ${columnName} ${columnDef}`)
      console.log(`✅ Adicionada coluna: ${columnName}`)
    }
  } catch (error) {
    console.log(`ℹ️ Coluna ${columnName} já existe ou erro: ${error}`)
  }
}

// Adicionar colunas novas se necessário
addColumnSafe('code', 'TEXT UNIQUE')
addColumnSafe('rescheduled_reason', 'TEXT')
addColumnSafe('is_completed', 'INTEGER DEFAULT 0')

// Gerar códigos para itens existentes que não têm código
const itemsWithoutCode = db.prepare('SELECT id FROM schedule_items WHERE code IS NULL').all()
if (itemsWithoutCode.length > 0) {
  console.log(`Gerando códigos para ${itemsWithoutCode.length} itens existentes...`)
  const updateCodeStmt = db.prepare('UPDATE schedule_items SET code = ? WHERE id = ?')
  
  for (const item of itemsWithoutCode as any[]) {
    let code: string
    let isUnique = false
    
    while (!isUnique) {
      code = generateUniqueCode()
      const existing = db.prepare('SELECT id FROM schedule_items WHERE code = ?').get(code)
      if (!existing) {
        isUnique = true
        updateCodeStmt.run(code, item.id)
      }
    }
  }
}

function generateUniqueCode(): string {
  const chars = '0123456789ABCDEF'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * 16)]
  }
  return code
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const insertStmt = db.prepare(`
  INSERT INTO schedule_items (id, code, title, description, date, start, end, color, googleMapsLink, rescheduled_reason, is_completed)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const updateStmt = db.prepare(`
  UPDATE schedule_items 
  SET title = ?, description = ?, date = ?, start = ?, end = ?, color = ?, googleMapsLink = ?, rescheduled_reason = ?, is_completed = ?
  WHERE id = ?
`)

const deleteStmt = db.prepare('DELETE FROM schedule_items WHERE id = ?')
const selectAllStmt = db.prepare('SELECT * FROM schedule_items ORDER BY date, start')
const selectByDateStmt = db.prepare('SELECT * FROM schedule_items WHERE date = ? ORDER BY start')
const selectByCodeStmt = db.prepare('SELECT * FROM schedule_items WHERE code = ?')

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method === 'GET') {
    const query = getQuery(event)
    
    if (query.date) {
      const items = selectByDateStmt.all(query.date as string)
      return items
    }
    
    if (query.code) {
      const item = selectByCodeStmt.get(query.code as string)
      return item
    }
    
    const items = selectAllStmt.all()
    return items
  }
  
  if (method === 'POST') {
    const body = await readBody(event)
    
    // Gerar código único
    let code: string
    let isUnique = false
    
    while (!isUnique) {
      code = body.code || generateUniqueCode()
      const existing = selectByCodeStmt.get(code)
      if (!existing) {
        isUnique = true
      } else if (body.code) {
        // Se o código foi fornecido mas já existe, gerar um novo
        code = generateUniqueCode()
      }
    }
    
    const item: ScheduleItem = {
      id: generateId(),
      code: code!,
      ...body
    }
    
    // Verificar conflito de horário (apenas para itens não finalizados)
    if (!item.is_completed) {
      const conflicts = selectByDateStmt.all(item.date)
        .filter((existing: any) => {
          if (existing.id === item.id || existing.is_completed === 1) return false
          return !(item.end <= existing.start || item.start >= existing.end)
        })
      
      if (conflicts.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Conflito de horário'
        })
      }
    }
    
    insertStmt.run(
      item.id,
      item.code,
      item.title,
      item.description || '',
      item.date,
      item.start,
      item.end,
      item.color || '#6366F1',
      item.googleMapsLink || '',
      item.rescheduled_reason || '',
      item.is_completed ? 1 : 0
    )
    
    return item
  }
  
  if (method === 'PUT') {
    const body = await readBody(event)
    const { id, ...updateData } = body
    
    // Verificar conflito de horário (apenas para itens não finalizados)
    if (!updateData.is_completed) {
      const conflicts = selectByDateStmt.all(updateData.date)
        .filter((existing: any) => {
          if (existing.id === id || existing.is_completed === 1) return false
          return !(updateData.end <= existing.start || updateData.start >= existing.end)
        })
      
      if (conflicts.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Conflito de horário'
        })
      }
    }
    
    updateStmt.run(
      updateData.title,
      updateData.description || '',
      updateData.date,
      updateData.start,
      updateData.end,
      updateData.color || '#6366F1',
      updateData.googleMapsLink || '',
      updateData.rescheduled_reason || '',
      updateData.is_completed ? 1 : 0,
      id
    )
    
    return { id, ...updateData }
  }
  
  if (method === 'DELETE') {
    const query = getQuery(event)
    const id = query.id as string
    
    deleteStmt.run(id)
    return { success: true }
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed'
  })
})