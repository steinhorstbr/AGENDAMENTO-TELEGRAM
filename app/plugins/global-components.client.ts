export default defineNuxtPlugin(() => {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    // Don't show toast for script loading errors
    if (!event.filename || !event.filename.includes('.js')) {
      useToast().error('Ocorreu um erro inesperado')
    }
  })

  // Global promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // Only show toast for actual application errors
    if (event.reason?.message && !event.reason.message.includes('Loading')) {
      useToast().error('Erro na aplicação')
    }
  })

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search (future feature)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && !e.target?.closest('input, textarea')) {
      e.preventDefault()
      // TODO: Open global search
      useToast().info('Busca global em desenvolvimento', 'Em breve!')
    }
    
    // Ctrl/Cmd + N for new task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.target?.closest('input, textarea')) {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('show-create-modal'))
    }
  })

  // Service worker registration (future PWA feature)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silently fail - SW not ready yet
    })
  }

  // Install prompt for PWA
  let deferredPrompt: any
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    
    // Show install banner after 30 seconds
    setTimeout(() => {
      if (deferredPrompt) {
        useToast().info(
          'Instale o Agenda BJJ como app no seu dispositivo!',
          'App Disponível',
          10000
        )
      }
    }, 30000)
  })
})