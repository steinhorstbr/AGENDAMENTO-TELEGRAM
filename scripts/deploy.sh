#!/bin/bash

# Script de deploy para Agenda BJJ
# Uso: ./scripts/deploy.sh [production|development|stop|logs|backup]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
  exit 1
}

# Verificar se Docker está instalado
check_docker() {
  if ! command -v docker &> /dev/null; then
    error "Docker não está instalado. Instale o Docker primeiro."
  fi
  
  if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado. Instale o Docker Compose primeiro."
  fi
  
  log "Docker e Docker Compose encontrados ✅"
}

# Verificar arquivo .env
check_env() {
  if [ ! -f .env ]; then
    warn "Arquivo .env não encontrado. Criando a partir do .env.example..."
    if [ -f .env.example ]; then
      cp .env.example .env
      warn "Configure suas variáveis de ambiente no arquivo .env antes de continuar!"
      warn "Principalmente TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID"
      exit 1
    else
      error "Arquivo .env.example não encontrado!"
    fi
  fi
  
  log "Arquivo .env encontrado ✅"
}

# Deploy de produção
deploy_production() {
  log "🚀 Iniciando deploy de produção..."
  
  check_docker
  check_env
  
  log "Parando containers existentes..."
  docker-compose down --remove-orphans
  
  log "Construindo e iniciando aplicação..."
  docker-compose up -d --build
  
  log "Aguardando aplicação inicializar..."
  sleep 10
  
  # Verificar se a aplicação está funcionando
  if curl -f -s http://localhost:3000/api/health > /dev/null; then
    log "✅ Aplicação está funcionando!"
    log "📱 Acesse: http://localhost:3000"
    log "🔍 Health Check: http://localhost:3000/api/health"
  else
    error "❌ Aplicação não está respondendo. Verifique os logs com: docker-compose logs -f"
  fi
}

# Deploy de desenvolvimento
deploy_development() {
  log "🛠️ Iniciando deploy de desenvolvimento..."
  
  check_docker
  check_env
  
  log "Parando containers existentes..."
  docker-compose --profile dev down --remove-orphans
  
  log "Construindo e iniciando aplicação (modo desenvolvimento)..."
  docker-compose --profile dev up -d --build
  
  log "Aguardando aplicação inicializar..."
  sleep 15
  
  # Verificar se a aplicação está funcionando
  if curl -f -s http://localhost:3001/api/health > /dev/null; then
    log "✅ Aplicação de desenvolvimento está funcionando!"
    log "📱 Acesse: http://localhost:3001"
    log "🔥 Hot reload ativado para desenvolvimento"
  else
    error "❌ Aplicação não está respondendo. Verifique os logs com: docker-compose --profile dev logs -f"
  fi
}

# Parar aplicação
stop_application() {
  log "🛑 Parando aplicação..."
  
  docker-compose down --remove-orphans
  docker-compose --profile dev down --remove-orphans
  
  log "✅ Aplicação parada com sucesso!"
}

# Mostrar logs
show_logs() {
  log "📋 Mostrando logs da aplicação..."
  docker-compose logs -f agenda-bjj
}

# Fazer backup do banco de dados
backup_database() {
  log "💾 Criando backup do banco de dados..."
  
  BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="backup_${BACKUP_DATE}.db"
  
  if docker ps | grep -q agenda-bjj; then
    docker exec agenda-bjj cp /app/data/schedule.db /app/data/${BACKUP_FILE}
    docker cp agenda-bjj:/app/data/${BACKUP_FILE} ./backups/${BACKUP_FILE}
    
    # Criar diretório de backup se não existir
    mkdir -p ./backups
    
    log "✅ Backup criado: ./backups/${BACKUP_FILE}"
  else
    error "Container agenda-bjj não está rodando!"
  fi
}

# Status da aplicação
show_status() {
  log "📊 Status da aplicação:"
  
  if docker ps | grep -q agenda-bjj; then
    echo -e "${GREEN}✅ Aplicação está rodando${NC}"
    docker ps --filter name=agenda-bjj --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    log "🔍 Health Check:"
    curl -s http://localhost:3000/api/health | jq . 2>/dev/null || echo "Health check não disponível"
  else
    echo -e "${RED}❌ Aplicação não está rodando${NC}"
  fi
}

# Menu de ajuda
show_help() {
  echo -e "${BLUE}"
  echo "📅 Agenda BJJ - Script de Deploy"
  echo "================================="
  echo ""
  echo "Uso: $0 [comando]"
  echo ""
  echo "Comandos disponíveis:"
  echo "  production  - Deploy de produção (porta 3000)"
  echo "  development - Deploy de desenvolvimento (porta 3001)"
  echo "  stop        - Parar aplicação"
  echo "  logs        - Mostrar logs"
  echo "  backup      - Backup do banco de dados"
  echo "  status      - Status da aplicação"
  echo "  help        - Mostrar esta ajuda"
  echo ""
  echo "Exemplos:"
  echo "  $0 production"
  echo "  $0 development"
  echo "  $0 logs"
  echo -e "${NC}"
}

# Script principal
case "${1:-}" in
  "production"|"prod")
    deploy_production
    ;;
  "development"|"dev")
    deploy_development
    ;;
  "stop")
    stop_application
    ;;
  "logs")
    show_logs
    ;;
  "backup")
    backup_database
    ;;
  "status")
    show_status
    ;;
  "help"|"-h"|"--help")
    show_help
    ;;
  "")
    warn "Nenhum comando especificado. Use 'help' para ver os comandos disponíveis."
    show_help
    ;;
  *)
    error "Comando desconhecido: $1. Use 'help' para ver os comandos disponíveis."
    ;;
esac