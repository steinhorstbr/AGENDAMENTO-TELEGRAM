# Use Node.js LTS como base
FROM node:20-alpine AS base

# Instalar dependências do sistema
RUN apk update && apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências de produção
RUN npm install --omit=dev --no-package-lock

# Stage para desenvolvimento
FROM base AS development

# Instalar todas as dependências (incluindo dev)
RUN npm install --no-package-lock

# Copiar código fonte
COPY . .

# Expor porta de desenvolvimento
EXPOSE 3000

# Comando para desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage para build de produção
FROM base AS build

# Instalar dependências completas para o build
COPY package*.json ./
RUN npm install --no-package-lock

# Copiar código fonte
COPY . .

# Criar diretório de dados
RUN mkdir -p data

# Build da aplicação
RUN npm run build

# Stage de produção
FROM node:20-alpine AS production

# Instalar sqlite e wget para health check
RUN apk add --no-cache sqlite wget

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nuxt -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar dependências de produção do stage base
COPY --from=base /app/node_modules ./node_modules

# Copiar build da aplicação
COPY --from=build --chown=nuxt:nodejs /app/.output ./.output
COPY --from=build --chown=nuxt:nodejs /app/package.json ./package.json

# Criar diretório de dados com permissões adequadas
RUN mkdir -p data && chown -R nuxt:nodejs data

# Mudar para usuário não-root
USER nuxt

# Expor porta
EXPOSE 3000

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

# Verificação de saúde
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Comando para produção
CMD ["node", ".output/server/index.mjs"]