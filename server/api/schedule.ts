import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface ScheduleItem {
  id: string
  title: string
  description?: string
  date: string // ISO date (yyyy-mm-dd)
  start: string // HH:MM (24h)
  end: string   // HH:MM (24h)
  color?: string
  googleMapsLink?: string
}

// Inicializar banco de dados
const dbPath = path.join(process.cwd(), 'data', 'schedule.db')
const db = new Database(dbPath)

// Criar tabela se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS schedule_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    color TEXT,
    googleMapsLink TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

const insertStmt = db.prepare(`
  INSERT INTO schedule_items (id, title, description, date, start, end, color, googleMapsLink)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const updateStmt = db.prepare(`
  UPDATE schedule_items 
  SET title = ?, description = ?, date = ?, start = ?, end = ?, color = ?, googleMapsLink = ?
  WHERE id = ?
`)

const deleteStmt = db.prepare('DELETE FROM schedule_items WHERE id = ?')
const selectAllStmt = db.prepare('SELECT * FROM schedule_items ORDER BY date, start')
const selectByDateStmt = db.prepare('SELECT * FROM schedule_items WHERE date = ? ORDER BY start')

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method === 'GET') {
    const query = getQuery(event)
    
    if (query.date) {
      const items = selectByDateStmt.all(query.date as string)
      return items
    }
    
    const items = selectAllStmt.all()
    return items
  }
  
  if (method === 'POST') {
    const body = await readBody(event)
    const item: ScheduleItem = {
      id: crypto.randomUUID(),
      ...body
    }
    
    // Verificar conflito de horário
    const conflicts = selectByDateStmt.all(item.date)
      .filter((existing: any) => {
        if (existing.id === item.id) return false
        return !(item.end <= existing.start || item.start >= existing.end)
      })
    
    if (conflicts.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Conflito de horário'
      })
    }
    
    insertStmt.run(
      item.id,
      item.title,
      item.description || '',
      item.date,
      item.start,
      item.end,
      item.color || '#6366F1',
      item.googleMapsLink || ''
    )
    
    return item
  }
  
  if (method === 'PUT') {
    const body = await readBody(event)
    const { id, ...updateData } = body
    
    // Verificar conflito de horário (excluindo o próprio item)
    const conflicts = selectByDateStmt.all(updateData.date)
      .filter((existing: any) => {
        if (existing.id === id) return false
        return !(updateData.end <= existing.start || updateData.start >= existing.end)
      })
    
    if (conflicts.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Conflito de horário'
      })
    }
    
    updateStmt.run(
      updateData.title,
      updateData.description || '',
      updateData.date,
      updateData.start,
      updateData.end,
      updateData.color || '#6366F1',
      updateData.googleMapsLink || '',
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