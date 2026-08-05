# Diagnóstico de Performance da VPS e Estratégia de Deploy (Dev vs. Produção)

> **Data:** 2026-08-04  
> **Status:** Mantido temporariamente em Modo de Desenvolvimento (Fase de Validação e Desenvolvimento Ativo)  
> **Servidor:** Oracle Cloud Always Free ARM64 Ubuntu 24.04 (4-core Ampere CPU, 12GB RAM)

---

## 1. Resumo Executivo e Diagnóstico

Durante a fase de testes e desenvolvimento ativo, observou-se uma latência percebida de **1,5s a 4,0s** no carregamento de páginas e navegação no Web App hospedado na VPS.

### 📊 Dados Empíricos Coletados (`docker stats`)

```
CONTAINER ID   NAME               CPU %     MEM USAGE / LIMIT     MEM %     NET I/O          BLOCK I/O         PIDS
7b29c3eece41   celilac-web-app    0.00%     506.9MiB / 11.65GiB   4.25%     314kB / 12.7MB   201kB / 75.3MB    38
cb449cb3f0b5   celilac-backend    0.00%     66.92MiB / 11.65GiB   0.56%     110kB / 93.5kB   8.19kB / 1.2MB    33
8410ee30a0d8   celilac-postgres   1.84%     52.59MiB / 11.65GiB   0.44%     420kB / 407kB    37.3MB / 1.91MB   6
```

- **CPU:** < 2% de uso (sem gargalo de processador).
- **RAM:** Apenas 5% de uso acumulado dos 11.65 GiB disponíveis (sem estouro de memória nem uso de disco SWAP).
- **Rede / Ping ICMP:** Solicitações de `ping` para o IP da VPS retornam *Tempo limite esgotado*. Isso é **100% normal e esperado**: a Oracle Cloud e o firewall Linux (iptables/ufw) bloqueiam requisições ICMP por padrão. O tráfego web HTTP (portas 3002 e 3003) opera normalmente.

---

## 2. Causa Raiz da Lentidão Percebida

Os containers Docker de backend e frontend estão executando com o comando de desenvolvimento:
```dockerfile
CMD ["npm", "run", "dev"]
```

### Por que `npm run dev` causa lentidão na navegação?
1. **Compilação On-The-Fly (JIT):** O servidor de desenvolvimento do Next.js (`next dev`) **não pré-compila as páginas**. A cada clique, troca de rota ou refresh do usuário, o Next.js invoca o compilador (SWC/Webpack) em tempo real para compilar os arquivos `.tsx` e `.module.css`.
2. **Carga em Desenvolvimento:** Essa compilação ao vivo adiciona um atraso inevitável de 1 a 4 segundos por requisição.

---

## 3. Decisão de Projeto & Roteiro de Transição Futura

Por decisão de desenvolvimento, a aplicação **permanecerá temporariamente em modo `dev`** durante a fase de criação de novas funcionalidades, refatorações e suítes de teste.

Quando as funcionalidades do MVP estiverem consolidadas para homologação/produção final, os Dockerfiles e o pipeline de CI/CD deverão ser transicionados para o **Modo de Produção**, conforme os modelos abaixo:

### A. Frontend (`frontend/web-app/Dockerfile`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
CMD ["npm", "start"]
```

### B. Backend (`backend/Dockerfile`)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/infrastructure/http/server.js"]
```

### ⚡ Impacto Esperado da Migração de Produção
- Redução da latência de carregamento de página de **~3,5s para 10ms–30ms** (carregamento instantâneo de páginas pré-renderizadas estaticamente pelo Next.js).
