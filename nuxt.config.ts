// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  
  runtimeConfig: {
    // Variáveis do servidor (privadas)
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "6307490274:AAGx5q-tQAP-HeAUGbAOo4XVJSlbtLCkpEA",
    telegramChatId: process.env.TELEGRAM_CHAT_ID || "-4505537919",
    
    // Variáveis públicas (se necessário)
    public: {
      appName: 'Agenda BJJ'
    }
  },
  
  // Configurações para produção
  nitro: {
    experimental: {
      wasm: true
    }
  },
  
  // CSS customizado
  css: [
    '~/assets/css/main.css'
  ],
  
  // Configurações da aplicação
  app: {
    head: {
      title: 'Agenda BJJ - Sistema de Agendamento',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 
          name: 'description', 
          content: 'Sistema de agendamento com notificações do Telegram para academias de BJJ' 
        }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})