backup-auto: backup backup-clean ## Backup automático (backup + limpeza)
	@echo "🤖 Backup automático concluído!"# Agenda BJJ - Makefile para comandos úteis
# Uso: make [comando]

.PHONY: help install dev build prod stop logs clean backup restore lint format test deploy health status

# Variáveis
CONTAINER_NAME=agenda-bjj
BACKUP_DIR=./backups

# Comando padrão
help: ## Mostrar esta ajuda
	@echo "📅 Agenda BJJ - Comandos Disponíveis"
	@echo "=================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🔧 Desenvolvimento (via Docker):"
	@echo "   make install    - Instalar dependências"
	@echo "   make dev        - Modo desenvolvimento"
	@echo "   make build      - Build de produção"
	@echo "   make lint       - Verificar código"
	@echo "   make format     - Formatar código"
	@echo ""
	@echo "🐳 Docker:"
	@echo "   make prod       - Deploy produção"
	@echo "   make stop       - Parar aplicação"
	@echo "   make logs       - Ver logs"
	@echo "   make status     - Status da aplicação"
	@echo ""
	@echo "💾 Backup:"
	@echo "   make backup     - Criar backup"
	@echo "   make restore    - Restaurar backup"
	@echo ""

# Comandos de desenvolvimento
install: ## Instalar dependências via Docker
	@echo "📦 Instalando dependências via Docker..."
	@docker run --rm -v $(PWD):/app -w /app node:20-alpine npm install --no-package-lock --no-package-lock

dev: ## Iniciar desenvolvimento local via Docker
	@echo "🛠️ Iniciando modo desenvolvimento..."
	@$(MAKE) prod-dev

build: ## Build da aplicação via Docker
	@echo "🔨 Building aplicação..."
	@docker build --target build -t agenda-bjj-build .

# Comandos de qualidade de código  
lint: ## Verificar código com ESLint via Docker
	@echo "🔍 Verificando código..."
	@docker run --rm -v $(PWD):/app -w /app node:20-alpine sh -c "npm install --no-package-lock && npm run lint"

lint-fix: ## Corrigir problemas do ESLint via Docker
	@echo "🔧 Corrigindo problemas de código..."
	@docker run --rm -v $(PWD):/app -w /app node:20-alpine sh -c "npm install --no-package-lock && npm run lint:fix"

format: ## Formatar código com Prettier via Docker
	@echo "✨ Formatando código..."
	@docker run --rm -v $(PWD):/app -w /app node:20-alpine sh -c "npm install --no-package-lock && npm run format"

format-check: ## Verificar formatação via Docker
	@echo "🔍 Verificando formatação..."
	@docker run --rm -v $(PWD):/app -w /app node:20-alpine sh -c "npm install --no-package-lock && npm run format:check"

type-check: ## Verificar tipos TypeScript via Docker
	@echo "🔍 Verificando tipos..."
	@docker run --rm -v $(PWD):/app -w /app node:20-alpine sh -c "npm install --no-package-lock && npm run type-check"

test: ## Executar todos os testes via Docker
	@echo "🧪 Executando todos os testes via Docker..."
	@docker run --rm -v $(PWD):/app -w /app node:20-alpine sh -c "npm install --no-package-lock && npm run lint && npm run format:check && npm run type-check && npm run build"
	@echo "✅ Todos os testes passaram!"

# Comandos Docker
prod: ## Deploy de produção
	@echo "🚀 Fazendo deploy de produção..."
	docker-compose down --remove-orphans || true
	docker-compose up -d --build

prod-dev: ## Deploy de desenvolvimento
	@echo "🛠️ Fazendo deploy de desenvolvimento..."
	docker-compose --profile dev down --remove-orphans || true
	docker-compose --profile dev up -d --build

stop: ## Parar aplicação
	@echo "⏹️ Parando aplicação..."
	docker-compose down --remove-orphans

restart: ## Reiniciar aplicação
	@echo "🔄 Reiniciando aplicação..."
	docker-compose restart $(CONTAINER_NAME)

logs: ## Ver logs da aplicação
	@echo "📋 Visualizando logs..."
	docker-compose logs -f $(CONTAINER_NAME)

logs-tail: ## Ver últimas 100 linhas dos logs
	@echo "📋 Últimas 100 linhas dos logs..."
	docker-compose logs --tail=100 $(CONTAINER_NAME)

# Comandos de monitoramento
status: ## Status da aplicação
	@echo "📊 Status da aplicação:"
	@if docker ps | grep -q $(CONTAINER_NAME); then \
		echo "✅ Aplicação rodando"; \
		docker ps --filter name=$(CONTAINER_NAME) --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"; \
	else \
		echo "❌ Aplicação parada"; \
	fi

health: ## Verificar saúde da aplicação
	@echo "🏥 Verificando saúde da aplicação..."
	@curl -s http://localhost:3000/api/health | jq . || echo "❌ Aplicação não responde"

# Comandos de backup
backup: ## Criar backup do banco de dados
	@echo "💾 Criando backup..."
	@mkdir -p $(BACKUP_DIR)
	@BACKUP_FILE="agenda_backup_$(date +%Y%m%d_%H%M%S).db" && \
	docker exec $(CONTAINER_NAME) sqlite3 /app/data/schedule.db ".backup /app/data/temp_backup.db" && \
	docker cp $(CONTAINER_NAME):/app/data/temp_backup.db $(BACKUP_DIR)/$BACKUP_FILE && \
	docker exec $(CONTAINER_NAME) rm /app/data/temp_backup.db && \
	echo "✅ Backup criado: $(BACKUP_DIR)/$BACKUP_FILE"

backup-list: ## Listar backups disponíveis
	@echo "📋 Listando backups..."
	@ls -la $(BACKUP_DIR)/*.db 2>/dev/null || echo "❌ Nenhum backup encontrado"

backup-clean: ## Limpar backups antigos
	@echo "🧹 Limpando backups antigos..."
	@find $(BACKUP_DIR) -name "*.db" -mtime +7 -delete 2>/dev/null || true
	@echo "✅ Backups antigos removidos"

restore: ## Restaurar backup (uso: make restore FILE=nome_do_arquivo.db)
	@if [ -z "$(FILE)" ]; then \
		echo "❌ Especifique o arquivo: make restore FILE=backup.db"; \
		exit 1; \
	fi
	@if [ ! -f "$(BACKUP_DIR)/$(FILE)" ]; then \
		echo "❌ Arquivo não encontrado: $(BACKUP_DIR)/$(FILE)"; \
		exit 1; \
	fi
	@echo "🔄 Restaurando backup: $(FILE)"
	@echo "⚠️ ATENÇÃO: Esta operação substituirá o banco atual!"
	@read -p "Continuar? (y/N): " confirm && [ "$confirm" = "y" ]
	@docker-compose stop $(CONTAINER_NAME)
	@docker-compose start $(CONTAINER_NAME)
	@sleep 5
	@docker cp "$(BACKUP_DIR)/$(FILE)" $(CONTAINER_NAME):/app/data/schedule.db
	@docker-compose restart $(CONTAINER_NAME)
	@echo "✅ Backup restaurado com sucesso!"

# Comandos de limpeza
clean: ## Limpar arquivos temporários
	@echo "🧹 Limpando arquivos temporários..."
	npm run clean
	docker system prune -f

clean-all: clean ## Limpeza completa (inclui volumes Docker)
	@echo "🧹 Limpeza completa..."
	docker-compose down -v
	docker system prune -a -f --volumes

# Comandos de deploy
deploy: ## Deploy completo (test + prod) via Docker
	@echo "🚀 Deploy completo..."
	@$(MAKE) test
	@$(MAKE) prod

deploy-quick: ## Deploy rápido (sem testes)
	@echo "⚡ Deploy rápido..."
	@$(MAKE) prod

# Comandos de configuração
setup: ## Configuração inicial (apenas Docker)
	@echo "⚙️ Configuração inicial..."
	@if [ ! -f .env ]; then \
		echo "📝 Criando arquivo .env..."; \
		cp .env.example .env; \
		echo "✏️ Configure suas variáveis de ambiente no arquivo .env"; \
	fi
	@mkdir -p $(BACKUP_DIR)
	@mkdir -p data
	@mkdir -p logs
	@echo "📦 Instalando dependências via Docker..."
	@docker run --rm -v $(PWD):/app -w /app node:20-alpine npm install
	@echo "✅ Setup concluído! Configure o .env e execute: make prod"

env-check: ## Verificar variáveis de ambiente
	@echo "🔍 Verificando configuração..."
	@if [ ! -f .env ]; then \
		echo "❌ Arquivo .env não encontrado!"; \
		exit 1; \
	fi
	@echo "✅ Arquivo .env encontrado"
	@if grep -q "your_.*_token_here" .env; then \
		echo "⚠️ Configure seus tokens no arquivo .env"; \
	else \
		echo "✅ Tokens configurados"; \
	fi

# Comandos de desenvolvimento avançado
docker-build: ## Build manual da imagem Docker
	@echo "🔨 Building imagem Docker..."
	docker build -t agenda-bjj .

docker-run: ## Executar container manualmente
	@echo "🏃 Executando container..."
	docker run -d --name $(CONTAINER_NAME) -p 3000:3000 --env-file .env agenda-bjj

shell: ## Acessar shell do container
	@echo "🐚 Acessando shell do container..."
	docker exec -it $(CONTAINER_NAME) /bin/sh

db-shell: ## Acessar SQLite shell
	@echo "🗄️ Acessando banco de dados..."
	docker exec -it $(CONTAINER_NAME) sqlite3 /app/data/schedule.db

# Comando para CI/CD
ci: ## Comandos para CI/CD via Docker
	@echo "🤖 Executando pipeline CI/CD..."
	@docker run --rm -v $(PWD):/app -w /app node:20-alpine sh -c "npm install --no-package-lock && npm run lint && npm run format:check && npm run type-check && npm run build"
	@echo "✅ Pipeline CI/CD concluído!"