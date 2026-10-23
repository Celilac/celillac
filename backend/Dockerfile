# backend/Dockerfile - Multi-stage Production Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig*.json ./
RUN npm install

COPY . .
RUN npm run build

# Imagem final enxuta de produção
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Diretório persistente para uploads de arquivos
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "dist/index.js"]
