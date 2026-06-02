# ================================================
# NapMaps — Dockerfile multi-stage para NaN.builders
# Build con Vite → producción limpia sin devDeps
# ================================================

# === Stage 1: Instalar todas las dependencias ===
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# === Stage 2: Build con Vite ===
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY index.html vite.config.js ./
COPY public/ ./public/
COPY src/ ./src/
RUN npx vite build

# === Stage 3: Producción ===
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3030

# Crear usuario no-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar package.json y reinstalar solo producción
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar build estático
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

# Servidor HTTP ESM
COPY --chown=appuser:appgroup server.mjs ./

USER appuser

# Healthcheck
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3030/healthz || exit 1

EXPOSE 3030
CMD ["node", "server.mjs"]