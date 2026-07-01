/* ============================================================================
   API routes (controllers) — thin handlers that validate input, call a service,
   and shape the HTTP response. No business logic here. Mounted at /api.
   Express 5 forwards rejected promises from async handlers to errorHandler.
   ========================================================================== */
"use strict";
const express = require("express");
const router = express.Router();
const { requireAuth } = require("./middleware");
const authService = require("./services/auth.service");
const opportunityService = require("./services/opportunity.service");
const captureService = require("./services/capture.service");
const analyticsService = require("./services/analytics.service");
const assistantService = require("./services/assistant.service");
const liveService = require("./services/live.service");
const { settingsRepo } = require("./repositories");

router.get("/health", (req, res) => res.json({ ok: true }));

/* ---- Auth ---- */
router.post("/auth/signup", async (req, res) => res.status(201).json(await authService.signup(req.body || {})));
router.post("/auth/login",  async (req, res) => res.json(await authService.login(req.body || {})));
router.get("/auth/me", requireAuth, (req, res) => res.json({ user: req.user }));
router.post("/auth/logout", requireAuth, (req, res) => { authService.logout(req.token); res.json({ ok: true }); });

/* ---- Opportunities ---- */
router.get("/opportunities", requireAuth, async (req, res) => res.json(await opportunityService.list({ q: req.query.q, filter: req.query.filter })));
router.get("/opportunities/:id", requireAuth, async (req, res) => {
  const opp = await opportunityService.get(req.params.id);
  if(!opp) return res.status(404).json({ error: "Opportunity not found" });
  res.json(opp);
});
router.post("/opportunities", requireAuth, async (req, res) => res.status(201).json(await opportunityService.create(req.body || {})));
router.patch("/opportunities/:id", requireAuth, async (req, res) => {
  const opp = await opportunityService.update(req.params.id, req.body || {});
  if(!opp) return res.status(404).json({ error: "Opportunity not found" });
  res.json(opp);
});

/* ---- Captures (lead-capture use case) ---- */
router.post("/captures", requireAuth, async (req, res) => {
  const body = req.body || {};
  res.json(await captureService.capture({ message: body.message, name: body.name, email: body.email, phone: body.phone, by: req.user.email }));
});
router.get("/captures", requireAuth, async (req, res) => res.json(await captureService.history()));

/* ---- Analytics + follow-ups ---- */
router.get("/analytics/summary", requireAuth, async (req, res) => res.json(await analyticsService.summary()));
router.post("/followups/run", requireAuth, async (req, res) => res.json(await analyticsService.followups()));

/* ---- Assistant (Local mode) ---- */
router.post("/assistant", requireAuth, async (req, res) => {
  const body = req.body || {};
  res.json(await assistantService.handleQuery(body.message || ""));
});

/* ---- Live mode (server-side proxy to the n8n webhooks; avoids browser CORS) ---- */
router.post("/live/:target", requireAuth, async (req, res) => res.json(await liveService.forward(req.params.target, req.body || {})));

/* ---- Settings (webhook endpoints, persisted) ---- */
router.get("/settings", requireAuth, async (req, res) => res.json(await settingsRepo.get() || {}));
router.put("/settings", requireAuth, async (req, res) => res.json(await settingsRepo.set(req.body || {})));

module.exports = router;
