/* ============================================================================
   Tiny zero-dependency static file server for the AI CRM Platform front-end.
   Uses only Node built-ins, so `npm install` needs no packages and `npm start`
   works fully offline. Serves index.html and the src/ tree.
     Usage:  npm start            (defaults to http://localhost:3000)
             PORT=8080 npm start  (custom port)
   ========================================================================== */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".ico":  "image/x-icon",
  ".map":  "application/json; charset=utf-8"
};

const server = http.createServer((req, res) => {
  // Strip query string and decode; default "/" to index.html.
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  // Resolve against ROOT and block directory traversal.
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found: " + urlPath);
      return;
    }
    const type = TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("AI CRM Platform running at  http://localhost:" + PORT + "/");
  console.log("(static server — Ctrl+C to stop. Tailwind loads from its CDN, so keep internet on.)");
});
