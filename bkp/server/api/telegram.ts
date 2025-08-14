import Database from 'better-sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'data', 'schedule.db')

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method === 'POST') {
    const body = await readBody(event)
    const { action, code, hours } = body
    
    const db = new Database(dbPath)
    
    try {
      if (action === 'reschedule') {
        return await rescheduleTask(db, code, hours)
      } else if (action === 'complete') {
        return await completeTask(db, code)
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid action'
        })
      }
    } finally {
      db.close()
    }
  }
  
  if (method === 'GET') {
    const query = getQuery(event)
    const { code } = query
    
    if (!code) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Code is required'
      })
    }
    
    const db = new Database(dbPath)
    
    try {
      const task = db.prepare('SELECT * FROM schedule_items WHERE code = ?').get(code as string)
      return task
    } finally {
      db.close()
    }
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed'
  })
})

async function rescheduleTask(db: Database.Database, code: string, hours: number) {
  const task = db.prepare('SELECT * FROM schedule_items WHERE code = ? AND is_completed = 0').get(code)
  
  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Task not found or already completed'
    })
  }

  const taskData = task as any
  
  // Calcular novo horário
  const [startHour, startMin] = taskData.start.split(':').map(Number)
  const [endHour, endMin] = taskData.end.split(':').map(Number)
  
  const newStartHour = startHour + hours
  const newEndHour = endHour + hours
  
  // Validar se não passou da meia-noite
  if (newStartHour >= 24 || newEndHour >= 24) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cannot reschedule - time would exceed midnight'
    })
  }

  const newStart = `${newStartHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`
  const newEnd = `${newEndHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
  
  // Verificar conflitos
  const conflicts = db.prepare('SELECT * FROM schedule_items WHERE date = ? AND id != ? AND is_completed = 0').all(taskData.date, taskData.id)
    .filter((existing: any) => {
      return !(newEnd <= existing.start || newStart >= existing.end)
    })
  
  if (conflicts.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Time conflict detected'
    })
  }

  // Atualizar no banco
  const rescheduledReason = `Reagendado via Telegram: +${hours}h`
  db.prepare(`
    UPDATE schedule_items 
    SET start = ?, end = ?, rescheduled_reason = ?
    WHERE code = ?
  `).run(newStart, newEnd, rescheduledReason, code)

  return {
    success: true,
    task: {
      ...taskData,
      start: newStart,
      end: newEnd,
      rescheduled_reason: rescheduledReason
    }
  }
}

async function completeTask(db: Database.Database, code: string) {
  const task = db.prepare('SELECT * FROM schedule_items WHERE code = ? AND is_completed = 0').get(code)
  
  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Task not found or already completed'
    })
  }

  // Marcar como finalizada
  db.prepare('UPDATE schedule_items SET is_completed = 1 WHERE code = ?').run(code)

  return {
    success: true,
    task: {
      ...(task as any),
      is_completed: true
    }
  }
}