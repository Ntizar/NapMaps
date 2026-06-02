const http = require("http");
const fs = require("fs");
const path = require("path");
const DIST = path.join(__dirname, "dist");
const MIME = {
  ".html": "text/html", ".css": "text/css",
  ".js": "application/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".woff2": "font/woff2"
};
function handler(req, res) {
  if (req.url === "/healthz") {
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify({status:"ok",uptime:process.uptime()}));
    return;
  }
  let filePath = path.join(DIST, req.url === "/" ? "index.html" : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(DIST, "index.html"), (e2, d2) => {
        if (e2) { res.writeHead(500); res.end("Error"); return; }
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(d2);
      });
    } else {
      res.writeHead(200, {"Content-Type": MIME[ext] || "application/octet-stream"});
      res.end(data);
    }
  });
}
const ports = [process.env.PORT || 3700, 80];
ports.forEach(p => http.createServer(handler).listen(p, "0.0.0.0", () => console.log("NapMaps en puerto " + p)));
