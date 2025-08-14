// server/api/auth/login.post.ts
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { join } from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-forte-aqui'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username e password são obrigatórios'
    })
  }

  const dbPath = join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username)

    if (!user || !bcrypt.compareSync(password, (user as any).password_hash)) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciais inválidas'
      })
    }

    const userData = user as any
    const token = jwt.sign(
      { 
        id: userData.id, 
        username: userData.username, 
        role: userData.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Atualizar último login
    db.prepare('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userData.id)

    return {
      token,
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar
      }
    }
  } finally {
    db.close()
  }
})

// server/api/auth/verify.get.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-forte-aqui'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token não fornecido'
    })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    const dbPath = join(process.cwd(), 'data', 'schedule.db')
    const db = new Database(dbPath)
    
    try {
      const user = db.prepare('SELECT id, username, email, name, role, avatar FROM users WHERE id = ? AND is_active = 1').get(decoded.id)
      
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Usuário não encontrado'
        })
      }
      
      return { user }
    } finally {
      db.close()
    }
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token inválido'
    })
  }
})

// server/api/auth/users.ts
import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { join } from 'path'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export default defineEventHandler(async (event) => {
  // Verificar autenticação (middleware seria melhor, mas por simplicidade...)
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Não autorizado'
    })
  }

  const method = getMethod(event)
  const dbPath = join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)

  try {
    if (method === 'GET') {
      const users = db.prepare(`
        SELECT id, username, email, name, role, avatar, is_active, created_at, updated_at 
        FROM users 
        ORDER BY created_at DESC
      `).all()
      
      return users
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const { username, email, password, name, role = 'staff' } = body

      if (!username || !email || !password || !name) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Todos os campos são obrigatórios'
        })
      }

      // Verificar se usuário já existe
      const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email)
      
      if (existingUser) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Usuário ou email já existe'
        })
      }

      const hashedPassword = bcrypt.hashSync(password, 10)
      const userId = generateId()

      const user = {
        id: userId,
        username,
        email,
        password_hash: hashedPassword,
        name,
        role,
        is_active: 1
      }

      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, name, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(user.id, user.username, user.email, user.password_hash, user.name, user.role, user.is_active)

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active
      }
    }

    if (method === 'PUT') {
      const body = await readBody(event)
      const { id, username, email, name, role, is_active, password } = body

      if (!id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'ID é obrigatório'
        })
      }

      let updateData: any = { username, email, name, role, is_active }
      let sql = 'UPDATE users SET username = ?, email = ?, name = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      let params = [username, email, name, role, is_active ? 1 : 0, id]

      if (password) {
        updateData.password_hash = bcrypt.hashSync(password, 10)
        sql = 'UPDATE users SET username = ?, email = ?, name = ?, role = ?, is_active = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        params = [username, email, name, role, is_active ? 1 : 0, updateData.password_hash, id]
      }

      db.prepare(sql).run(...params)

      return { success: true }
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

      db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(id)
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

// server/api/categories.ts
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const dbPath = join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)

  try {
    if (method === 'GET') {
      const categories = db.prepare(`
        SELECT c.*, u.name as created_by_name 
        FROM categories c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.is_active = 1
        ORDER BY c.name
      `).all()
      
      return categories
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const { name, color, icon, description, created_by } = body

      if (!name || !color || !created_by) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Nome, cor e criador são obrigatórios'
        })
      }

      const categoryId = generateId()
      const category = {
        id: categoryId,
        name,
        color,
        icon: icon || '',
        description: description || '',
        created_by,
        is_active: 1
      }

      db.prepare(`
        INSERT INTO categories (id, name, color, icon, description, created_by, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(category.id, category.name, category.color, category.icon, category.description, category.created_by, category.is_active)

      return category
    }

    if (method === 'PUT') {
      const body = await readBody(event)
      const { id, name, color, icon, description, is_active } = body

      if (!id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'ID é obrigatório'
        })
      }

      db.prepare(`
        UPDATE categories 
        SET name = ?, color = ?, icon = ?, description = ?, is_active = ?
        WHERE id = ?
      `).run(name, color, icon || '', description || '', is_active ? 1 : 0, id)

      return { success: true }
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

      db.prepare('UPDATE categories SET is_active = 0 WHERE id = ?').run(id)
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