// server/api/task-completion.ts
import Database from 'better-sqlite3'
import { join } from 'path'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-forte-aqui'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token não fornecido'
    })
  }

  const token = authHeader.substring(7)
  let decodedUser: any

  try {
    decodedUser = jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido'
    })
  }

  const method = getMethod(event)
  const dbPath = join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)

  try {
    if (method === 'POST') {
      const body = await readBody(event)
      const { task_id, completed_by, photos, notes, location_lat, location_lng, location_address } = body

      if (!task_id || !completed_by) {
        throw createError({
          statusCode: 400,
          statusMessage: 'task_id e completed_by são obrigatórios'
        })
      }

      // Verificar se a tarefa existe e não está finalizada
      const task = db.prepare('SELECT * FROM schedule_items WHERE id = ? AND is_completed = 0').get(task_id)
      
      if (!task) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Tarefa não encontrada ou já finalizada'
        })
      }

      // Verificar permissões - deve ser o responsável pela tarefa ou admin/instructor
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decodedUser.id) as any
      const taskData = task as any
      
      if (taskData.assigned_to !== decodedUser.id && 
          user.role !== 'admin' && 
          user.role !== 'instructor') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Sem permissão para finalizar esta tarefa'
        })
      }

      // Criar registro de finalização
      const completionId = generateId()
      const photosJson = JSON.stringify(photos || [])

      db.prepare(`
        INSERT INTO task_completions (
          id, task_id, completed_by, photos, notes, 
          location_lat, location_lng, location_address, completed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        completionId,
        task_id,
        completed_by,
        photosJson,
        notes || '',
        location_lat || null,
        location_lng || null,
        location_address || ''
      )

      // Marcar tarefa como finalizada
      db.prepare('UPDATE schedule_items SET is_completed = 1 WHERE id = ?').run(task_id)

      return {
        success: true,
        completion_id: completionId,
        message: 'Tarefa finalizada com sucesso'
      }
    }

    if (method === 'GET') {
      const query = getQuery(event)
      const { task_id, completed_by } = query

      let sql = `
        SELECT tc.*, u.name as completed_by_name, si.title as task_title
        FROM task_completions tc
        LEFT JOIN users u ON tc.completed_by = u.id
        LEFT JOIN schedule_items si ON tc.task_id = si.id
        WHERE 1=1
      `
      const params: any[] = []

      if (task_id) {
        sql += ' AND tc.task_id = ?'
        params.push(task_id as string)
      }

      if (completed_by) {
        sql += ' AND tc.completed_by = ?'
        params.push(completed_by as string)
      }

      sql += ' ORDER BY tc.completed_at DESC'

      const completions = db.prepare(sql).all(...params)
      
      // Parse photos JSON
      const completionsWithPhotos = (completions as any[]).map(completion => ({
        ...completion,
        photos: completion.photos ? JSON.parse(completion.photos) : []
      }))

      return completionsWithPhotos
    }

    throw createError({
      statusCode: 405,
      statusMessage: 'Método não permitido'
    })
  } finally {
    db.close()
  }
})

// server/api/task-assignment.ts
export default defineEventHandler(async (event) => {
  // Verificar autenticação
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token não fornecido'
    })
  }

  const token = authHeader.substring(7)
  let decodedUser: any

  try {
    decodedUser = jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido'
    })
  }

  const method = getMethod(event)
  const dbPath = join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)

  try {
    if (method === 'POST') {
      const body = await readBody(event)
      const { task_id, assigned_to, assigned_by, notes, priority = 'normal' } = body

      if (!task_id || !assigned_to || !assigned_by) {
        throw createError({
          statusCode: 400,
          statusMessage: 'task_id, assigned_to e assigned_by são obrigatórios'
        })
      }

      // Verificar permissões - deve ser admin ou instructor
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decodedUser.id) as any
      
      if (user.role !== 'admin' && user.role !== 'instructor') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Sem permissão para atribuir tarefas'
        })
      }

      // Verificar se a tarefa existe
      const task = db.prepare('SELECT * FROM schedule_items WHERE id = ?').get(task_id)
      
      if (!task) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Tarefa não encontrada'
        })
      }

      // Verificar se o usuário de destino existe e está ativo
      const targetUser = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(assigned_to)
      
      if (!targetUser) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Usuário de destino não encontrado ou inativo'
        })
      }

      // Criar registro de atribuição
      const assignmentId = generateId()

      db.prepare(`
        INSERT INTO task_assignments (
          id, task_id, assigned_to, assigned_by, status, assigned_at
        )
        VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `).run(assignmentId, task_id, assigned_to, assigned_by)

      // Atualizar tarefa com novo responsável
      db.prepare('UPDATE schedule_items SET assigned_to = ? WHERE id = ?').run(assigned_to, task_id)

      return {
        success: true,
        assignment_id: assignmentId,
        message: 'Tarefa atribuída com sucesso'
      }
    }

    if (method === 'GET') {
      const query = getQuery(event)
      const { task_id, assigned_to, assigned_by, status } = query

      let sql = `
        SELECT ta.*, 
               u1.name as assigned_to_name,
               u2.name as assigned_by_name,
               si.title as task_title
        FROM task_assignments ta
        LEFT JOIN users u1 ON ta.assigned_to = u1.id
        LEFT JOIN users u2 ON ta.assigned_by = u2.id
        LEFT JOIN schedule_items si ON ta.task_id = si.id
        WHERE 1=1
      `
      const params: any[] = []

      if (task_id) {
        sql += ' AND ta.task_id = ?'
        params.push(task_id as string)
      }

      if (assigned_to) {
        sql += ' AND ta.assigned_to = ?'
        params.push(assigned_to as string)
      }

      if (assigned_by) {
        sql += ' AND ta.assigned_by = ?'
        params.push(assigned_by as string)
      }

      if (status) {
        sql += ' AND ta.status = ?'
        params.push(status as string)
      }

      sql += ' ORDER BY ta.assigned_at DESC'

      const assignments = db.prepare(sql).all(...params)
      return assignments
    }

    if (method === 'PUT') {
      const body = await readBody(event)
      const { assignment_id, status, notes } = body

      if (!assignment_id || !status) {
        throw createError({
          statusCode: 400,
          statusMessage: 'assignment_id e status são obrigatórios'
        })
      }

      // Verificar se a atribuição existe
      const assignment = db.prepare('SELECT * FROM task_assignments WHERE id = ?').get(assignment_id)
      
      if (!assignment) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Atribuição não encontrada'
        })
      }

      const assignmentData = assignment as any

      // Verificar permissões - deve ser o usuário atribuído ou admin/instructor
      if (assignmentData.assigned_to !== decodedUser.id) {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decodedUser.id) as any
        if (user.role !== 'admin' && user.role !== 'instructor') {
          throw createError({
            statusCode: 403,
            statusMessage: 'Sem permissão para alterar esta atribuição'
          })
        }
      }

      // Atualizar status da atribuição
      let updateSql = 'UPDATE task_assignments SET status = ?'
      const updateParams = [status]

      if (status === 'completed') {
        updateSql += ', completed_at = CURRENT_TIMESTAMP'
      }

      updateSql += ' WHERE id = ?'
      updateParams.push(assignment_id)

      db.prepare(updateSql).run(...updateParams)

      return {
        success: true,
        message: 'Status da atribuição atualizado'
      }
    }

    throw createError({
      statusCode: 405,
      statusMessage: 'Método não permitido'
    })
  } finally {
    db.close()
  }
})

// server/api/dashboard-stats.ts
export default defineEventHandler(async (event) => {
  // Verificar autenticação
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token não fornecido'
    })
  }

  const token = authHeader.substring(7)
  let decodedUser: any

  try {
    decodedUser = jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido'
    })
  }

  const dbPath = join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)

  try {
    const query = getQuery(event)
    const { period = 'week', user_id } = query

    // Calcular datas baseado no período
    const now = new Date()
    let startDate: string
    let endDate: string

    switch (period) {
      case 'today':
        startDate = endDate = now.toISOString().split('T')[0]
        break
      case 'week':
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startDate = startOfWeek.toISOString().split('T')[0]
        
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endDate = endOfWeek.toISOString().split('T')[0]
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        break
      default:
        startDate = endDate = now.toISOString().split('T')[0]
    }

    // Base SQL conditions
    let whereConditions = 'WHERE si.date >= ? AND si.date <= ?'
    let params = [startDate, endDate]

    if (user_id) {
      whereConditions += ' AND (si.assigned_to = ? OR si.created_by = ?)'
      params.push(user_id as string, user_id as string)
    }

    // Total de tarefas
    const totalTasks = db.prepare(`
      SELECT COUNT(*) as count FROM schedule_items si ${whereConditions}
    `).get(...params) as { count: number }

    // Tarefas completadas
    const completedTasks = db.prepare(`
      SELECT COUNT(*) as count FROM schedule_items si ${whereConditions} AND si.is_completed = 1
    `).get(...params) as { count: number }

    // Tarefas pendentes
    const pendingTasks = db.prepare(`
      SELECT COUNT(*) as count FROM schedule_items si ${whereConditions} AND si.is_completed = 0
    `).get(...params) as { count: number }

    // Tarefas por categoria
    const tasksByCategory = db.prepare(`
      SELECT c.name, c.color, c.icon, COUNT(si.id) as count
      FROM schedule_items si
      LEFT JOIN categories c ON si.category_id = c.id
      ${whereConditions}
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY count DESC
    `).all(...params)

    // Tarefas por dia (para gráfico)
    const tasksByDay = db.prepare(`
      SELECT si.date, 
             COUNT(*) as total,
             SUM(si.is_completed) as completed,
             COUNT(*) - SUM(si.is_completed) as pending
      FROM schedule_items si
      ${whereConditions}
      GROUP BY si.date
      ORDER BY si.date
    `).all(...params)

    // Usuários mais ativos (apenas para admins/instructors)
    let topUsers: any[] = []
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(decodedUser.id) as any
    
    if (user && (user.role === 'admin' || user.role === 'instructor')) {
      topUsers = db.prepare(`
        SELECT u.name, u.role, COUNT(si.id) as task_count,
               SUM(si.is_completed) as completed_count
        FROM users u
        LEFT JOIN schedule_items si ON (si.assigned_to = u.id OR si.created_by = u.id)
        WHERE si.date >= ? AND si.date <= ?
        GROUP BY u.id, u.name, u.role
        HAVING task_count > 0
        ORDER BY completed_count DESC, task_count DESC
        LIMIT 5
      `).all(startDate, endDate)
    }

    return {
      period,
      date_range: { startDate, endDate },
      stats: {
        total_tasks: totalTasks.count,
        completed_tasks: completedTasks.count,
        pending_tasks: pendingTasks.count,
        completion_rate: totalTasks.count > 0 ? Math.round((completedTasks.count / totalTasks.count) * 100) : 0
      },
      tasks_by_category: tasksByCategory,
      tasks_by_day: tasksByDay,
      top_users: topUsers
    }
  } finally {
    db.close()
  }
})