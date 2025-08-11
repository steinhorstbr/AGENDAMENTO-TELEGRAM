import Database from 'better-sqlite3'
import path from 'path'

export function initializeDatabase() {
  const dbPath = path.join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)
  
  // Habilitar WAL mode para melhor performance
  db.pragma('journal_mode = WAL')
  
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Criar índices para melhor performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule_items(date);
    CREATE INDEX IF NOT EXISTS idx_schedule_date_time ON schedule_items(date, start);
  `)
  
  // Trigger para atualizar updated_at
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_schedule_items_updated_at 
    AFTER UPDATE ON schedule_items
    BEGIN
      UPDATE schedule_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `)
  
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
      INSERT INTO schedule_items (id, title, description, date, start, end, color, googleMapsLink)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const sampleData = [
      {
        id: crypto.randomUUID(),
        title: 'Treino Kids BJJ',
        description: 'Aula introdutória de Brazilian Jiu-Jitsu para crianças de 6 a 12 anos',
        date: todayStr,
        start: '10:00',
        end: '11:00',
        color: '#F59E0B',
        googleMapsLink: 'https://maps.google.com/?q=academia+bjj+infantil'
      },
      {
        id: crypto.randomUUID(),
        title: 'BJJ Adulto Iniciante',
        description: 'Fundamentos do Jiu-Jitsu para adultos iniciantes',
        date: todayStr,
        start: '19:00',
        end: '20:30',
        color: '#3B82F6',
        googleMapsLink: 'https://maps.google.com/?q=academia+bjj+adulto'
      },
      {
        id: crypto.randomUUID(),
        title: 'Sparring Avançado',
        description: 'Treino de luta para alunos faixas coloridas',
        date: tomorrowStr,
        start: '20:00',
        end: '21:30',
        color: '#EF4444',
        googleMapsLink: 'https://maps.google.com/?q=academia+bjj+avancado'
      },
      {
        id: crypto.randomUUID(),
        title: 'Aula Particular',
        description: 'Treino personalizado com foco em técnicas específicas',
        date: tomorrowStr,
        start: '14:00',
        end: '15:00',
        color: '#8B5CF6',
        googleMapsLink: 'https://maps.google.com/?q=academia+bjj+particular'
      }
    ]
    
    for (const item of sampleData) {
      insertStmt.run(
        item.id,
        item.title,
        item.description,
        item.date,
        item.start,
        item.end,
        item.color,
        item.googleMapsLink
      )
    }
    
    console.log(`✅ Inseridos ${sampleData.length} agendamentos de exemplo`)
  }
  
  db.close()
  console.log('✅ Banco de dados inicializado com sucesso')
}

// Função para limpar dados antigos (opcional)
export function cleanOldData() {
  const dbPath = path.join(process.cwd(), 'data', 'schedule.db')
  const db = new Database(dbPath)
  
  // Remover agendamentos com mais de 30 dias
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0]
  
  const result = db.prepare('DELETE FROM schedule_items WHERE date < ?').run(cutoffDate)
  
  if (result.changes > 0) {
    console.log(`🧹 Removidos ${result.changes} agendamentos antigos`)
  }
  
  db.close()
}