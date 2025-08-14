#!/bin/bash

# Script de configuração inicial para Agenda BJJ
# Uso: ./setup.sh

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Arte ASCII
show_banner() {
  echo -e "${BLUE}"
  echo "╔═══════════════════════════════════════════════════╗"
  echo "║                                                   ║"
  echo "║            📅 AGENDA BJJ SETUP 🥋                ║"
  echo "║                                                   ║"
  echo "║     Sistema de Agendamento com Telegram Bot       ║"
  echo "║                                                   ║"
  echo "╚═══════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo ""
}

# Função para log
log() {
  echo -e "${GREEN}[SETUP] $1${NC}"
}

warn() {
  echo -e "${YELLOW}[AVISO] $1${NC}"
}

error() {
  echo -e "${RED}[ERRO] $1${NC}"
  exit 1
}

info() {
  echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar dependências
check_dependencies() {
  log "🔍 Verificando dependências..."
  
  # Verificar Docker
  if ! command -v docker &> /dev/null; then
    error "Docker não encontrado! Instale o Docker primeiro: https://docs.docker.com/get-docker/"
  fi
  
  # Verificar Docker Compose
  if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não encontrado! Instale o Docker Compose primeiro"
  fi
  
  # Verificar Node.js (opcional, para desenvolvimento)
  if command -v node &> /dev/null; then
    local node_version=$(node --version)
    log "✅ Node.js encontrado: $node_version"
  else
    warn "Node.js não encontrado (opcional para desenvolvimento)"
  fi
  
  # Verificar Make (opcional)
  if command -v make &> /dev/null; then
    log "✅ Make encontrado"
  else
    warn "Make não encontrado (opcional, mas recomendado)"
  fi
  
  log "✅ Dependências verificadas!"
}

# Tornar scripts executáveis
make_scripts_executable() {
  log "🔧 Tornando scripts executáveis..."
  
  # Criar diretório scripts se não existir
  mkdir -p scripts
  
  # Tornar scripts executáveis
  find scripts -name "*.sh" -type f -exec chmod +x {} \;
  
  # Tornar este script executável
  chmod +x setup.sh
  
  log "✅ Scripts configurados!"
}

# Configurar arquivo .env
setup_environment() {
  log "⚙️ Configurando arquivo de ambiente..."
  
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      cp .env.example .env
      log "📝 Arquivo .env criado a partir do .env.example"
    else
      error "Arquivo .env.example não encontrado!"
    fi
  else
    warn "Arquivo .env já existe, pulando..."
  fi
}

# Criar diretórios necessários
create_directories() {
  log "📁 Criando diretórios necessários..."
  
  mkdir -p data
  mkdir -p backups
  mkdir -p logs
  
  log "✅ Diretórios criados!"
}

# Instalar dependências Node.js (se disponível)
install_dependencies() {
  if command -v npm &> /dev/null && [ -f package.json ]; then
    log "📦 Instalando dependências Node.js..."
    npm install
    log "✅ Dependências instaladas!"
  else
    info "NPM não disponível ou package.json não encontrado, pulando instalação de dependências"
  fi
}

# Configurar Git hooks (opcional)
setup_git_hooks() {
  if [ -d .git ]; then
    log "🔗 Configurando Git hooks..."
    
    # Hook pre-commit para lint
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook para verificar código

if command -v make &> /dev/null && [ -f Makefile ]; then
  echo "🔍 Verificando código..."
  make lint || exit 1
  make format-check || exit 1
fi
EOF
    
    chmod +x .git/hooks/pre-commit
    log "✅ Git hooks configurados!"
  else
    info "Não é um repositório Git, pulando configuração de hooks"
  fi
}

# Verificar configuração do Telegram
check_telegram_config() {
  log "🤖 Verificando configuração do Telegram..."
  
  if [ -f .env ]; then
    if grep -q "your_.*_token_here" .env; then
      warn "⚠️  Configure seu token do Telegram no arquivo .env!"
      warn "    1. Converse com @BotFather no Telegram"
      warn "    2. Crie um bot com /newbot"
      warn "    3. Anote o token fornecido"
      warn "    4. Adicione o bot ao seu grupo"
      warn "    5. Obtenha o Chat ID e configure no .env"
      echo ""
      info "💡 Guia completo: QUICKSTART.md"
    else
      log "✅ Tokens do Telegram configurados!"
    fi
  fi
}

# Teste básico do Docker
test_docker() {
  log "🐳 Testando Docker..."
  
  if docker ps &> /dev/null; then
    log "✅ Docker funcionando corretamente!"
  else
    error "❌ Docker não está funcionando. Verifique se o serviço está rodando"
  fi
}

# Mostrar próximos passos
show_next_steps() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║          🎉 SETUP CONCLUÍDO! 🎉         ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${GREEN}✅ Configuração inicial concluída com sucesso!${NC}"
  echo ""
  echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
  echo ""
  echo "1. 🤖 Configure o Bot do Telegram:"
  echo "   📝 Edite o arquivo .env com seus tokens"
  echo "   📖 Veja o guia: QUICKSTART.md"
  echo ""
  echo "2. 🚀 Deploy da aplicação:"
  echo "   make deploy          # Produção"
  echo "   make prod-dev        # Desenvolvimento"
  echo ""
  echo "3. 📊 Verificar status:"
  echo "   make status          # Status dos containers"
  echo "   make health          # Saúde da aplicação"
  echo "   make logs            # Ver logs em tempo real"
  echo ""
  echo "4. 🔧 Comandos úteis:"
  echo "   make help            # Ver todos os comandos"
  echo "   make backup          # Backup do banco"
  echo "   make stop            # Parar aplicação"
  echo ""
  echo -e "${GREEN}💡 Dicas:${NC}"
  echo "• 📚 Documentação completa: README.md"
  echo "• ⚡ Guia de 5 minutos: QUICKSTART.md"
  echo "• 🔧 Detalhes técnicos: TECHNICAL.md"
  echo ""
  echo -e "${BLUE}🌐 Após o deploy, acesse:${NC}"
  echo "• 🖥️  Interface: http://localhost:3000"
  echo "• 🏥 Health: http://localhost:3000/api/health"
  echo ""
  echo -e "${GREEN}🥋 Boa sorte com sua academia de BJJ!${NC}"
  echo ""
}

# Script principal
main() {
  show_banner
  
  log "🚀 Iniciando configuração inicial..."
  
  check_dependencies
  make_scripts_executable
  setup_environment
  create_directories
  install_dependencies
  setup_git_hooks
  test_docker
  check_telegram_config
  
  show_next_steps
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi