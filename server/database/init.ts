import Database from 'better-sqlite3'
import { join } from 'path'

function generateUniqueCode(): string {
  const chars = '0123456789ABCDEF'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * 16)]
  }
  return code
}

export function initializeDatabase() {
  const dbPath = join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)
  
  // Habilitar WAL mode para melhor performance
  db.pragma('journal_mode = WAL')
  
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Função para adicionar colunas de forma segura
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

  // Adicionar colunas novas se necessário
  addColumnSafe('code', 'TEXT UNIQUE')
  addColumnSafe('rescheduled_reason', 'TEXT')
  addColumnSafe('is_completed', 'INTEGER DEFAULT 0')
  
  // Criar índices para melhor performance
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule_items(date);
      CREATE INDEX IF NOT EXISTS idx_schedule_date_time ON schedule_items(date, start);
      CREATE INDEX IF NOT EXISTS idx_schedule_code ON schedule_items(code);
    `)
  } catch (e) {
    // Ignorar erros de índice já existente
  }
  
  // Trigger para atualizar updated_at
  try {
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_schedule_items_updated_at 
      AFTER UPDATE ON schedule_items
      BEGIN
        UPDATE schedule_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `)
  } catch (e) {
    // Ignorar se trigger já existe
  }
  
  // Gerar códigos para itens existentes que não têm código
  const itemsWithoutCode = db.prepare('SELECT id FROM schedule_items WHERE code IS NULL OR code = ""').all()
  if (itemsWithoutCode.length > 0) {
    console.log(`📝 Gerando códigos para ${itemsWithoutCode.length} itens existentes...`)
    const updateCodeStmt = db.prepare('UPDATE schedule_items SET code = ? WHERE id = ?')
    const existingCodesStmt = db.prepare('SELECT code FROM schedule_items WHERE code IS NOT NULL AND code != ""')
    const existingCodes = new Set((existingCodesStmt.all() as any[]).map(row => row.code))
    
    for (const item of itemsWithoutCode as any[]) {
      let code: string
      let isUnique = false
      
      while (!isUnique) {
        code = generateUniqueCode()
        if (!existingCodes.has(code)) {
          isUnique = true
          existingCodes.add(code)
          updateCodeStmt.run(code, item.id)
        }
      }
    }
    console.log(`✅ Códigos gerados para ${itemsWithoutCode.length} itens`)
  }
  
  // Verificar se já existem dados
  const count = db.prepare('SELECT COUNT(*) as count FROM schedule_items').get() as { count: number }
  
  // Se não houver dados, inserir exemplos
  if (count.count === 0) {
    console.log('📝 Inserindo dados de exemplo...')
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const insertStmt = db.prepare(`
      INSERT INTO schedule_items (id, code, title, description, date, start, end, color, googleMapsLink, rescheduled_reason, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const existingCodesStmt = db.prepare('SELECT code FROM schedule_items WHERE code IS NOT NULL AND code != ""')
    const existingCodes = new Set((existingCodesStmt.all() as any[]).map(row => row.code))
    
    function getUniqueCode(): string {
      let code: string
      do {
        code = generateUniqueCode()
      } while (existingCodes.has(code))
      existingCodes.add(code)
      return code
    }
    
    const sampleData = [
      {
        id: generateId(),
        code: getUniqueCode(),
        title: 'Treino Kids BJJ',
        description: 'Aula introdutória de Brazilian Jiu-Jitsu para crianças de 6 a 12 anos',
        date: todayStr,
        start: '10:00',
        end: '11:00',
        color: '#F59E0B',
        googleMapsLink: 'https://maps.google.com/?q=academia+bjj+infantil',
        rescheduled_reason: '',
        is_completed: false
      },
      {
        id: generateId(),
        code: getUniqueCode(),
        title: 'BJJ Adulto Iniciante',
        description: 'Fundamentos do Jiu-Jitsu para adultos iniciantes',
        date: todayStr,
        start: '19:00',
        end: '20:30',
        color: '#3B82F6',
        googleMapsLink: 'https://maps.google.com/?q=academia+bjj+adulto',
        rescheduled_reason: '',
        is_completed: false
      },
      {
        id: generateId(),
        code: getUniqueCode(),
        title: 'Sparring Avançado',
        description: 'Treino de luta para alunos faixas coloridas',
        date: tomorrowStr,
        start: '20:00',
        end: '21:30',
        color: '#EF4444',
        googleMapsLink: 'https://maps.google.com/?q=academia+bjj+avancado',
        rescheduled_reason: '',
        is_completed: false
      },
      {
        id: generateId(),
        code: getUniqueCode(),
        title: 'Aula Particular',
        description: 'Treino personalizado com foco em técnicas específicas',
        date: tomorrowStr,
        start: '14:00',
        end: '15:00',
        color: '#8B5CF6',
        googleMapsLink: 'https://maps.google.com/?q=academia+bjj+particular',
        rescheduled_reason: '',
        is_completed: false
      }
    ]
    
    for (const item of sampleData) {
      insertStmt.run(
        item.id,
        item.code,
        item.title,
        item.description,
        item.date,
        item.start,
        item.end,
        item.color,
        item.googleMapsLink,
        item.rescheduled_reason,
        item.is_completed ? 1 : 0
      )
    }
    
    console.log(`✅ Inseridos ${sampleData.length} agendamentos de exemplo com códigos únicos`)
  }
  
  db.close()
  console.log('✅ Banco de dados inicializado com sucesso')
}

// Função para gerar ID único
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Função para limpar dados antigos (opcional)
export function cleanOldData() {
  const dbPath = join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)
  
  // Remover agendamentos finalizados com mais de 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0]
  
  const result = db.prepare('DELETE FROM schedule_items WHERE date < ? AND is_completed = 1').run(cutoffDate)
  
  if (result.changes > 0) {
    console.log(`🧹 Removidos ${result.changes} agendamentos finalizados antigos`)
  }
  
  db.close()
}