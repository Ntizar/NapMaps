# ================================================
# NapMaps — Dockerfile para NaN.builders
# Servidor Node.js con usuario no-root (requisito NaN)
# ================================================

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3030

# 1. Dependencias
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# 2. Código fuente
COPY index.html vite.config.js ./
COPY public/ ./public/
COPY src/ ./src/

# 3. Build
RUN npx vite build

# 4. Usuario no-root (requisito NaN)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 5. Servidor HTTP Node.js (SPA + multi-puerto)
RUN echo 'const http = require("http"); \
const fs = require("fs"); \
const path = require("path"); \
const DIST = path.join(__dirname, "dist"); \
const MIME = { \
  ".html": "text/html", ".css": "text/css", \
  ".js": "application/javascript", ".json": "application/json", \
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", \
  ".ico": "image/x-icon", ".woff2": "font/woff2" \
}; \
function handler(req, res) { \
  if (req.url === "/healthz") { \
    res.writeHead(200, {"Content-Type": "application/json"}); \
    res.end(JSON.stringify({status:"ok",uptime:process.uptime()})); \
    return; \
  } \
  let filePath = path.join(DIST, req.url === "/" ? "index.html" : req.url); \
  const ext = path.extname(filePath); \
  fs.readFile(filePath, (err, data) => { \
    if (err) { \
      fs.readFile(path.join(DIST, "index.html"), (e2, d2) => { \
        if (e2) { res.writeHead(500); res.end("Error"); return; } \
        res.writeHead(200, {"Content-Type": "text/html"}); \
        res.end(d2); \
      }); \
    } else { \
      res.writeHead(200, {"Content-Type": MIME[ext] || "application/octet-stream"}); \
      res.end(data); \
    } \
  }); \
} \
http.createServer(handler).listen(process.env.PORT || 3030, "0.0.0.0", () => console.log("NapMaps en puerto " + (process.env.PORT || 3030)));' > server.js

# 6. Ajustar permisos y cambiar a usuario no-root
RUN chown -R appuser:appgroup /app

USER appuser

# 7. Healthcheck
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3030/healthz || exit 1

EXPOSE 3030
CMD ["node", "server.js"]