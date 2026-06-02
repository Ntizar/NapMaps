# ================================================
# NapMaps — Dockerfile para NaN.builders
# Servidor Node.js con usuario no-root (requisito NaN)
# ================================================

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3030

# 1. Dependencias de producción
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 2. Código fuente
COPY index.html vite.config.js ./
COPY public/ ./public/
COPY src/ ./src/

# 3. Build estático
RUN npx vite build

# 4. Servidor HTTP (ESM — usa .mjs)
COPY server.mjs ./

# 5. Usuario no-root (requisito NaN)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 6. Ajustar permisos y cambiar a usuario no-root
RUN chown -R appuser:appgroup /app

USER appuser

# 7. Healthcheck
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3030/healthz || exit 1

EXPOSE 3030
CMD ["node", "server.mjs"]
