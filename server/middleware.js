/* ============================================================================
   Express middleware — bearer-token auth guard and a JSON error handler.
   ========================================================================== */
"use strict";
const authService = require("./services/auth.service");

function requireAuth(req, res, next){
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = authService.verify(token);
  if(!user) return res.status(401).json({ error: "Unauthorized — sign in first." });
  req.user = user;
  req.token = token;
  next();
}

function errorHandler(err, req, res, _next){
  const status = err.status || 500;
  if(status >= 500) console.error("API error:", err);
  res.status(status).json({ error: err.message || "Server error" });
}

module.exports = { requireAuth, errorHandler };
