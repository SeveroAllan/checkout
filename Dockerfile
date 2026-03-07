# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia manifesto e instala dependências de produção
COPY package*.json ./
RUN npm install --omit=dev

# Copia o restante do código
COPY . .

# A porta que o Express vai escutar
EXPOSE 3000

# Inicia o servidor
CMD ["node", "src/server.js"]
