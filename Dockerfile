# ================================================
# NapMaps — Dockerfile para NaN.builders
# Build + serve en una sola etapa con Node.js
# Puerto: 3700
# ================================================

FROM node:20-alpine

WORKDIR /app

ENV PORT=3700

# 1. Dependencias (caché)
COPY package.json package-lock.json ./
RUN npm ci

# 2. Código fuente
COPY index.html vite.config.js ./
COPY public/ ./public/
COPY src/ ./src/

# 3. Build
RUN npx vite build

# 4. Servidor HTTP mínimo para SPA
RUN echo 'const http = require("http"); \
const fs = require("fs"); \
const path = require("path"); \
const PORT = process.env.PORT || 3700; \
const DIST = path.join(__dirname, "dist"); \
const MIME = { \
  ".html": "text/html", ".css": "text/css", \
  ".js": "application/javascript", ".json": "application/json", \
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", \
  ".ico": "image/x-icon", ".woff2": "font/woff2" \
}; \
const server = http.createServer((req, res) => { \
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
}); \
server.listen(PORT, "0.0.0.0", () => console.log("NapMaps en puerto " + PORT));' > server.js

# 5. Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3700/ || exit 1

EXPOSE 3700
CMD ["node", "server.js"]