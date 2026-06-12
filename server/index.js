/* ============================================================================
   AI CRM Platform — application server. Serves the static front-end AND the
   /api backend from a single origin (so the in-browser app calls the API with
   no CORS), backed by embedded NeDB. The n8n/Odoo Live path is unaffected.
     npm start          → this server (full: static + API + DB) on PORT (3000)
     npm run static     → server.js (pure static, no backend)
   ========================================================================== */
"use strict";
const express = require("express");
const path = require("path");
const { PORT, ROOT } = require("./config");
const { seedIfEmpty } = require("./db");
const apiRouter = require("./routes");
const { errorHandler } = require("./middleware");

async function main(){
  await seedIfEmpty();

  const app = express();
  app.use(express.json({ limit: "256kb" }));

  // API first, then the static front-end (index.html, src/, screenshots/).
  app.use("/api", apiRouter);
  app.use(express.static(ROOT, { index: "index.html", extensions: ["html"] }));

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log("AI CRM Platform (backend + static) → http://localhost:" + PORT + "/");
    console.log("API base: http://localhost:" + PORT + "/api   ·   data: embedded NeDB (server/data)");
  });
}

main().catch((e) => { console.error("Failed to start server:", e); process.exit(1); });
