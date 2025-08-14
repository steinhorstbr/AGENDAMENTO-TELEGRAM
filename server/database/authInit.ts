// server/database/authInit.ts
import Database from 'better-sqlite3'
import { join } from 'path'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  role: 'admin' | 'instructor' | 'staff'
  name: string
  avatar?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon?: string
  description?: string
  created_by: string
  is_active: boolean
  created_at: string
}

export interface TaskAssignment {
  id: string
  task_id: string
  assigned_to: string
  assigned_by: string
  status: 'pending' | 'accepted' | 'completed' | 'rejected'
  assigned_at: string
  completed_at?: string
}

export interface TaskCompletion {
  id: string
  task_id: string
  completed_by: string
  photos: string[] // Array de URLs das fotos
  notes?: string
  location_lat?: number
  location_lng?: number
  location_address?: string
  completed_at: string
}

export function initializeAuthDatabase() {
  const dbPath = join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)

  // Habilitar WAL mode
  db.pragma('journal_mode = WAL')

  // Tabela de usuários
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'instructor', 'staff')) DEFAULT 'staff',
      name TEXT NOT NULL,
      avatar TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tabela de categorias
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      created_by TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `)

  // Tabela de atribuições de tarefas
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      assigned_to TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'accepted', 'completed', 'rejected')) DEFAULT 'pending',
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (task_id) REFERENCES schedule_items(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    )
  `)

  // Tabela de finalizações de tarefas
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_completions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      completed_by TEXT NOT NULL,
      photos TEXT, -- JSON array das URLs das fotos
      notes TEXT,
      location_lat REAL,
      location_lng REAL,
      location_address TEXT,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES schedule_items(id) ON DELETE CASCADE,
      FOREIGN KEY (completed_by) REFERENCES users(id)
    )
  `)

  // Adicionar campos à tabela de schedule_items
  const addColumnSafe = (columnName: string, columnDef: string) => {
    try {
      const tableInfo = db.pragma('table_info(schedule_items)')
      const columnExists = (tableInfo as any[]).some((col: any) => col.name === columnName)
      if (!columnExists) {
        db.exec(`ALTER TABLE schedule_items ADD COLUMN ${columnName} ${columnDef}`)
        console.log(`✅ Adicionada coluna: ${columnName}`)
      }
    } catch (error) {
      console.log(`ℹ️ Coluna ${columnName}: ${error}`)
    }
  }

  addColumnSafe('category_id', 'TEXT REFERENCES categories(id)')
  addColumnSafe('created_by', 'TEXT REFERENCES users(id)')
  addColumnSafe('assigned_to', 'TEXT REFERENCES users(id)')

  // Criar índices
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
      CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_category ON schedule_items(category_id);
      CREATE INDEX IF NOT EXISTS idx_schedule_assigned ON schedule_items(assigned_to);
    `)
  } catch (e) {
    // Ignorar erros de índice já existente
  }

  // Criar usuário admin padrão se não existir
  const adminExists = db.prepare('SELECT id FROM users WHERE role = ? LIMIT 1').get('admin')
  
  if (!adminExists) {
    const adminId = generateId()
    const defaultPassword = 'admin123'
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10)
    
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, name, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      adminId,
      'admin',
      'admin@agendabjj.com',
      hashedPassword,
      'admin',
      'Administrador',
      1
    )
    
    console.log('👤 Usuário admin criado!')
    console.log('   Username: admin')
    console.log('   Password: admin123')
    console.log('   ⚠️  Altere a senha na primeira utilização!')
  }

  // Criar categorias padrão se não existirem
  const categoryExists = db.prepare('SELECT id FROM categories LIMIT 1').get()
  
  if (!categoryExists) {
    const adminUser = db.prepare('SELECT id FROM users WHERE role = ?').get('admin') as { id: string }
    
    const defaultCategories = [
      { name: 'BJJ Kids', color: '#F59E0B', icon: '🧒', description: 'Aulas de Jiu-Jitsu para crianças' },
      { name: 'BJJ Adulto', color: '#3B82F6', icon: '🥋', description: 'Aulas de Jiu-Jitsu para adultos' },
      { name: 'Sparring', color: '#EF4444', icon: '🥊', description: 'Treinos de luta' },
      { name: 'Particular', color: '#8B5CF6', icon: '👤', description: 'Aulas particulares' },
      { name: 'Competição', color: '#DC2626', icon: '🏆', description: 'Preparação para competições' },
      { name: 'Técnicas', color: '#059669', icon: '📚', description: 'Aulas técnicas específicas' },
      { name: 'Físico', color: '#7C2D12', icon: '💪', description: 'Preparação física' },
      { name: 'Eventos', color: '#BE185D', icon: '🎉', description: 'Eventos e seminários' }
    ]

    const insertCategory = db.prepare(`
      INSERT INTO categories (id, name, color, icon, description, created_by, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    for (const category of defaultCategories) {
      insertCategory.run(
        generateId(),
        category.name,
        category.color,
        category.icon,
        category.description,
        adminUser.id,
        1
      )
    }
    
    console.log(`✅ Criadas ${defaultCategories.length} categorias padrão`)
  }

  db.close()
  console.log('✅ Sistema de autenticação inicializado')
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}