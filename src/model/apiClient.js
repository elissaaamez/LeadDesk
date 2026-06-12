/* ============================================================================
   MODEL · API CLIENT — talks to the local Node/NeDB backend (same origin, so
   no CORS) used by "Local" mode and by real auth. Distinct from api.js, which
   posts to the n8n webhooks used by "Live" mode.
   Depends on: store.js (state.session.token, state.serverOpps).
   ========================================================================== */
"use strict";

const API_BASE = "/api";

async function apiFetch(path, { method = "GET", body, auth = true } = {}){
  const headers = { "Content-Type": "application/json" };
  if(auth && state.session && state.session.token) headers.Authorization = "Bearer " + state.session.token;
  const res = await fetch(API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  if(!res.ok){ const e = new Error(data.error || ("HTTP " + res.status)); e.status = res.status; throw e; }
  return data;
}

/* True only for genuine connectivity failures (backend absent / file://),
   so the UI can fall back to offline demo auth — but NOT for 401/409 etc. */
function isNetworkError(e){ return e && (e.name === "TypeError" || /failed to fetch|networkerror|load failed/i.test(e.message || "")); }

const api = {
  health:        ()                      => apiFetch("/health", { auth: false }),
  login:         (email, password)       => apiFetch("/auth/login",  { method: "POST", auth: false, body: { email, password } }),
  signup:        (name, email, password) => apiFetch("/auth/signup", { method: "POST", auth: false, body: { name, email, password } }),
  me:            ()                      => apiFetch("/auth/me"),
  logout:        ()                      => apiFetch("/auth/logout", { method: "POST" }).catch(() => {}),
  opportunities: (q, filter)             => apiFetch("/opportunities?q=" + encodeURIComponent(q || "") + "&filter=" + encodeURIComponent(filter || "all")),
  capture:       (payload)               => apiFetch("/captures", { method: "POST", body: payload }),
  analytics:     ()                      => apiFetch("/analytics/summary"),
  followups:     ()                      => apiFetch("/followups/run", { method: "POST" })
};

/* Refresh the opportunities cache that views read from in Local mode. */
async function loadServerOpps(){
  state.serverOpps = await api.opportunities("", "all");
  return state.serverOpps;
}
