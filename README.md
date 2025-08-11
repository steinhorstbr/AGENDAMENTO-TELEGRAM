# 📅 Agenda BJJ - Sistema de Agendamento com Telegram

Sistema completo de agendamento desenvolvido em Nuxt.js com notificações automáticas via Telegram Bot. Ideal para academias de BJJ, personal trainers e outros profissionais que precisam de um sistema de agenda com notificações automáticas.

## ✨ Funcionalidades

- 📱 **Interface moderna e responsiva** - Agenda semanal intuitiva
- 🤖 **Notificações automáticas no Telegram**:
  - Resumo diário às 7h da manhã (segunda a sexta)
  - Alertas 15 minutos antes das tarefas
  - Alertas 5 minutos antes das tarefas  
  - Notificação no horário exato da tarefa
- 📍 **Integração com Google Maps** - Links de localização enviados no Telegram
- 💾 **Banco de dados SQLite** - Armazenamento persistente em arquivo
- 🐳 **Dockerizado** - Fácil deploy com Docker Compose
- ⏰ **Detecção de conflitos** - Evita sobreposição de horários

## 🚀 Instalação e Uso

### Pré-requisitos

- Docker e Docker Compose instalados
- Token do Bot do Telegram
- ID do chat/grupo do Telegram

### 1. Configuração do Bot do Telegram

1. Converse com [@BotFather](https://t.me/botfather) no Telegram
2. Crie um novo bot com `/newbot`
3. Anote o token fornecido
4. Para obter o Chat ID:
   - Adicione o bot ao seu grupo
   - Envie uma mensagem no grupo
   - Acesse: `https://api.telegram.org/bot<SEU_TOKEN>/getUpdates`
   - Procure pelo `chat.id` na resposta

### 2. Configuração do Ambiente

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd agenda-bjj

# Copie o arquivo de exemplo das variáveis de ambiente
cp .env.example .env

# Edite o arquivo .env com suas configurações
nano .env
```

### 3. Deploy com Docker

```bash
# Build e start da aplicação
docker-compose up -d

# Para desenvolvimento (com hot reload)
docker-compose --profile dev up -d
```

### 4. Acesso à Aplicação

- **Produção**: http://localhost:3000
- **Desenvolvimento**: http://localhost:3001 (se usando perfil dev)
- **Health Check**: http://localhost:3000/api/health

## 📋 Uso da Aplicação

### Criando Agendamentos

1. Clique no botão "**+ Agendar**" 
2. Preencha os campos:
   - **Título**: Nome da atividade
   - **Descrição**: Detalhes opcionais
   - **Data e Horário**: Quando acontecerá
   - **Cor**: Para identificação visual
   - **Link Google Maps**: Localização (será enviada no Telegram)
3. Clique em "**Adicionar**"

### Editando/Removendo

- **Editar**: Clique no card do agendamento
- **Remover**: Hover sobre o card e clique no "✕"

### Navegação

- Use as setas **← →** para navegar entre semanas
- **Hoje** para voltar à semana atual

## 🤖 Notificações do Telegram

O sistema enviará automaticamente:

### Resumo Diário (7h - Seg a Sex)
```
🌅 Bom dia! 

📅 Agenda de hoje (11/08/2025):

1. 🕐 10:00 - 11:00
   📋 Treino Kids BJJ
   📝 Aula introdutória
   📍 Ver localização

💪 Tenha um dia produtivo!
```

### Lembretes de Tarefas
```
⏰ Lembrete: Tarefa em 15 minutos!

🕐 10:00 - 11:00
📋 Treino Kids BJJ
📝 Aula introdutória

📍 Ver localização no Maps
```

## 🔧 Configurações Avançadas

### Variáveis de Ambiente

```bash
# .env
TELEGRAM_BOT_TOKEN=seu_token_aqui
TELEGRAM_CHAT_ID=seu_chat_id_aqui
NODE_ENV=production
TZ=America/Sao_Paulo
```

### Personalização dos Horários

No arquivo `server/services/telegramService.ts`, você pode modificar:

```typescript
// Horário do resumo diário (atualmente 7h)
cron.schedule('0 7 * * 1-5', () => {
  this.sendDailySchedule()
})

// Intervalo de verificação (atualmente 5 min)
cron.schedule('*/5 * * * *', () => {
  this.checkUpcomingTasks()
})
```

### Backup do Banco de Dados

```bash
# Criar backup
docker exec agenda-bjj cp /app/data/schedule.db /app/data/backup-$(date +%Y%m%d).db

# Restaurar backup
docker cp backup.db agenda-bjj:/app/data/schedule.db
```

## 📁 Estrutura do Projeto

```
├── app/
│   ├── components/schedule/    # Componentes da agenda
│   ├── composables/           # Lógica reativa do Vue
│   ├── pages/                 # Páginas da aplicação
│   └── assets/               # CSS e recursos
├── server/
│   ├── api/                  # APIs do backend
│   ├── services/             # Serviços (Telegram)
│   └── plugins/              # Plugins do Nitro
├── data/                     # Banco de dados SQLite
├── docker-compose.yml        # Configuração Docker
└── Dockerfile               # Container da aplicação
```

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento local
npm run dev

# Build de produção
npm run build

# Preview de produção
npm run preview
```

## 📊 Monitoramento

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Logs do Container
```bash
docker-compose logs -f agenda-bjj
```

### Métricas
O health check retorna informações sobre:
- Status da conexão com banco
- Número de itens na agenda
- Uso de memória
- Tempo de atividade

## 🔒 Segurança

- ✅ Banco de dados local (não exposição de dados)
- ✅ Validação de conflitos de horário
- ✅ Sanitização de URLs do Google Maps
- ✅ Container sem privilégios root
- ✅ Health checks automáticos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 💡 Dicas

- Use cores diferentes para categorizar tipos de atividades
- O bot envia até 3 notificações por tarefa (15min, 5min, agora)
- Links do Google Maps são validados automaticamente
- O timezone está configurado para América/São_Paulo
- Para grupos grandes, considere usar um canal em vez de grupo

---

**Desenvolvido com ❤️ para a comunidade BJJ** 🥋