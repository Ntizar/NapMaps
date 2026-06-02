# ================================================
# NapMaps — Dockerfile para NaN.builders
# Build multi-etapa: Node.js → Nginx
# Puerto de exposición: 3700
# ================================================

# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /build

# Copiar dependencias primero (caché de capas)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar código fuente
COPY index.html vite.config.js ./
COPY public/ public/
COPY src/ src/

# Build de producción
RUN npx vite build

# ---- Stage 2: Servir ----
FROM nginx:alpine

# Puerto expuesto
EXPOSE 3700

# Copiar build
COPY --from=builder /build/dist/ /usr/share/nginx/html

# Configuración de nginx para SPA + puerto 3700
RUN echo 'server { \
  listen 3700; \
  server_name _; \
  root /usr/share/nginx/html; \
  index index.html; \
  \
  # Gzip \
  gzip on; \
  gzip_types text/css application/javascript image/svg+xml; \
  gzip_min_length 256; \
  \
  # Cache de assets con hash \
  location /assets/ { \
    expires 1y; \
    add_header Cache-Control "public, immutable"; \
  } \
  \
  # SPA fallback \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf && \
# Eliminar la configuración por defecto de nginx que usa el puerto 80
rm -f /etc/nginx/conf.d/80.conf 2>/dev/null; \
true

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3700/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
