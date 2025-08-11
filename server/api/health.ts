export default defineEventHandler(async (event) => {
  try {
    // Verificar se o banco de dados está acessível
    const Database = await import('better-sqlite3').then(m => m.default)
    const path = await import('path')
    
    const dbPath = path.join(process.cwd(), 'data', 'schedule.db')
    const db = new Database(dbPath)
    
    // Fazer uma consulta simples para verificar a conectividade
    const result = db.prepare('SELECT COUNT(*) as count FROM schedule_items').get()
    db.close()
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      itemCount: (result as any)?.count || 0,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    }
  } catch (error) {
    // Se houver erro, retornar status de erro
    setResponseStatus(event, 500)
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV
    }
  }
})