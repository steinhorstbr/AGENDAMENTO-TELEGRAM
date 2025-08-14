// server/api/schedule.ts - UPDATED VERSION
import Database from 'better-sqlite3'
import { join } from 'path'
import { requireAuth } from '~/server/utils/auth'

export interface ScheduleItem {
  id: string
  code: string // Código hexadecimal de 4 dígitos
  title: string
  description?: string
  date: string // ISO date (yyyy-mm-dd)
  start: string // HH:MM (24h)
  end: string   // HH:MM (24h)
  color?: string
  category_id?: string
  created_by?: string
  assigned_to?: string
  googleMapsLink?: string
  rescheduled_reason?: string // Motivo do reagendamento
  is_completed?: boolean // Se foi finalizada
  created_at?: string
  updated_at?: string
}

// Inicializar banco de dados
const dbPath = join(process.cwd(), 'data', 'schedule.db')

function getDb() {
  return new Database(dbPath)
}

// Função para gerar código hexadecimal único de 4 dígitos
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

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  const user = requireAuth(event)
  
  const method = getMethod(event)
  const db = getDb()

  try {
    if (method === 'GET') {
      const query = getQuery(event)
      
      let sql = `
        SELECT si.*, 
               c.name as category_name, c.color as category_color, c.icon as category_icon,
               u1.name as created_by_name,
               u2.name as assigned_to_name
        FROM schedule_items si
        LEFT JOIN categories c ON si.category_id = c.id
        LEFT JOIN users u1 ON si.created_by = u1.id
        LEFT JOIN users u2 ON si.assigned_to = u2.id
        WHERE 1=1
      `
      const params: any[] = []
      
      // Filtros
      if (query.date) {
        sql += ' AND si.date = ?'
        params.push(query.date as string)
      }
      
      if (query.code) {
        sql += ' AND si.code = ?'
        params.push(query.code as string)
        const item = db.prepare(sql).get(...params)
        return item
      }
      
      if (query.category_id) {
        sql += ' AND si.category_id = ?'
        params.push(query.category_id as string)
      }
      
      if (query.assigned_to) {
        sql += ' AND si.assigned_to = ?'
        params.push(query.assigned_to as string)
      }
      
      if (query.created_by) {
        sql += ' AND si.created_by = ?'
        params.push(query.created_by as string)
      }
      
      if (query.is_completed !== undefined) {
        sql += ' AND si.is_completed = ?'
        params.push(query.is_completed === 'true' ? 1 : 0)
      }
      
      // Filtro de permissão: usuários normais só veem suas tarefas ou tarefas não atribuídas
      if (user.role === 'staff') {
        sql += ' AND (si.assigned_to = ? OR si.created_by = ? OR si.assigned_to IS NULL)'
        params.push(user.id, user.id)
      }
      
      sql += ' ORDER BY si.date ASC, si.start ASC'
      
      const items = db.prepare(sql).all(...params)
      return items
    }
    
    if (method === 'POST') {
      const body = await readBody(event)
      
      // Gerar código único
      let code: string
      let isUnique = false
      
      while (!isUnique) {
        code = body.code || generateUniqueCode()
        const existing = db.prepare('SELECT id FROM schedule_items WHERE code = ?').get(code)
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
        title: body.title,
        description: body.description || '',
        date: body.date,
        start: body.start,
        end: body.end,
        color: body.color || '#6366F1',
        category_id: body.category_id || null,
        created_by: body.created_by || user.id,
        assigned_to: body.assigned_to || null,
        googleMapsLink: body.googleMapsLink || '',
        rescheduled_reason: body.rescheduled_reason || '',
        is_completed: body.is_completed ? 1 : 0
      }
      
      // Verificar conflito de horário (apenas para itens não finalizados)
      if (!item.is_completed) {
        const conflicts = db.prepare(`
          SELECT * FROM schedule_items 
          WHERE date = ? AND id != ? AND is_completed = 0
          AND (
            (start < ? AND end > ?) OR
            (start < ? AND end > ?) OR
            (start >= ? AND end <= ?)
          )
        `).all(
          item.date, item.id || '',
          item.end, item.start,
          item.start, item.end,
          item.start, item.end
        )
        
        if (conflicts.length > 0) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Conflito de horário detectado'
          })
        }
      }
      
      // Inserir no banco
      db.prepare(`
        INSERT INTO schedule_items (
          id, code, title, description, date, start, end, color, 
          category_id, created_by, assigned_to, googleMapsLink, 
          rescheduled_reason, is_completed, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        item.id,
        item.code,
        item.title,
        item.description,
        item.date,
        item.start,
        item.end,
        item.color,
        item.category_id,
        item.created_by,
        item.assigned_to,
        item.googleMapsLink,
        item.rescheduled_reason,
        item.is_completed
      )
      
      return item
    }
    
    if (method === 'PUT') {
      const body = await readBody(event)
      const { id, ...updateData } = body
      
      if (!id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'ID é obrigatório'
        })
      }
      
      // Verificar se o item existe e se o usuário tem permissão
      const existingItem = db.prepare('SELECT * FROM schedule_items WHERE id = ?').get(id) as any
      
      if (!existingItem) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Item não encontrado'
        })
      }
      
      // Verificar permissões
      if (user.role === 'staff' && 
          existingItem.created_by !== user.id && 
          existingItem.assigned_to !== user.id) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Sem permissão para editar este item'
        })
      }
      
      // Verificar conflito de horário (apenas para itens não finalizados)
      if (!updateData.is_completed && updateData.date && updateData.start && updateData.end) {
        const conflicts = db.prepare(`
          SELECT * FROM schedule_items 
          WHERE date = ? AND id != ? AND is_completed = 0
          AND (
            (start < ? AND end > ?) OR
            (start < ? AND end > ?) OR
            (start >= ? AND end <= ?)
          )
        `).all(
          updateData.date, id,
          updateData.end, updateData.start,
          updateData.start, updateData.end,
          updateData.start, updateData.end
        )
        
        if (conflicts.length > 0) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Conflito de horário detectado'
          })
        }
      }
      
      // Preparar dados para atualização
      const fieldsToUpdate = []
      const values = []
      
      const allowedFields = [
        'title', 'description', 'date', 'start', 'end', 'color',
        'category_id', 'assigned_to', 'googleMapsLink', 'rescheduled_reason', 'is_completed'
      ]
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          fieldsToUpdate.push(`${field} = ?`)
          values.push(field === 'is_completed' ? (updateData[field] ? 1 : 0) : updateData[field])
        }
      }
      
      if (fieldsToUpdate.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Nenhum campo para atualizar'
        })
      }
      
      fieldsToUpdate.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      
      db.prepare(`
        UPDATE schedule_items 
        SET ${fieldsToUpdate.join(', ')}
        WHERE id = ?
      `).run(...values)
      
      // Retornar item atualizado
      const updatedItem = db.prepare(`
        SELECT si.*, 
               c.name as category_name, c.color as category_color, c.icon as category_icon,
               u1.name as created_by_name,
               u2.name as assigned_to_name
        FROM schedule_items si
        LEFT JOIN categories c ON si.category_id = c.id
        LEFT JOIN users u1 ON si.created_by = u1.id
        LEFT JOIN users u2 ON si.assigned_to = u2.id
        WHERE si.id = ?
      `).get(id)
      
      return updatedItem
    }
    
    if (method === 'DELETE') {
      const query = getQuery(event)
      const id = query.id as string
      
      if (!id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'ID é obrigatório'
        })
      }
      
      // Verificar se o item existe e se o usuário tem permissão
      const existingItem = db.prepare('SELECT * FROM schedule_items WHERE id = ?').get(id) as any
      
      if (!existingItem) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Item não encontrado'
        })
      }
      
      // Verificar permissões
      if (user.role === 'staff' && 
          existingItem.created_by !== user.id && 
          existingItem.assigned_to !== user.id) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Sem permissão para deletar este item'
        })
      }
      
      // Deletar registros relacionados primeiro (cascade)
      db.prepare('DELETE FROM task_assignments WHERE task_id = ?').run(id)
      db.prepare('DELETE FROM task_completions WHERE task_id = ?').run(id)
      
      // Deletar o item
      db.prepare('DELETE FROM schedule_items WHERE id = ?').run(id)
      
      return { success: true }
    }
    
    throw createError({
      statusCode: 405,
      statusMessage: 'Método não permitido'
    })
  } finally {
    db.close()
  }
})