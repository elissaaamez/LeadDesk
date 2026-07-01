/* ============================================================================
   Backend configuration. Local-only, no secrets — values are safe defaults
   overridable by environment variables.
   ========================================================================== */
"use strict";
const path = require("path");

module.exports = {
  PORT: process.env.PORT || 3000,
  ROOT: path.join(__dirname, ".."),            // project root (serves index.html + src/)
  DATA_DIR: process.env.DATA_DIR || path.join(__dirname, "data"), // NeDB files live here
  TOKEN_BYTES: 24,

  // Live mode: the backend proxies the browser's webhook calls to n8n server-side
  // (same origin for the browser → no CORS, and a real timeout instead of a silent
  // hang when n8n is down). N8N_BASE is the webhook base; LIVE maps each front-end
  // target key to its n8n path and a per-call timeout (ms) sized for the slow LLM step.
  N8N_BASE: process.env.N8N_BASE || "http://localhost:5678/webhook",
  LIVE: {
    leadCapture: { path: "lead-capture",      timeout: 60000 },
    leadList:    { path: "crm-list-leads",     timeout: 60000 },  // read-only: lists Odoo opportunities for the workspace
    analytics:   { path: "crm-summary",        timeout: 60000 },
    followUp:    { path: "smart-follow-up",     timeout: 90000 },
    assistant:   { path: "crm-ai-assistant",    timeout: 120000 }
  }
};
