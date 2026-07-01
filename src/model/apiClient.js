/* ============================================================================
   MODEL · API CLIENT — talks to the local Node/NeDB backend (same origin, so
   no CORS). Used by "Local" mode, by real auth, AND by "Live" mode: the live
   webhook calls are proxied through /api/live/* server-side, so the browser
   never makes a cross-origin request to n8n.
   Depends on: store.js (state.session.token, state.serverOpps).
   ========================================================================== */
"use strict";

const API_BASE = "/api";

async function apiFetch(path, { method = "GET", body, auth = true, timeout = 0 } = {}){
  const headers = { "Content-Type": "application/json" };
  if(auth && state.session && state.session.token) headers.Authorization = "Bearer " + state.session.token;
  const ctrl = timeout ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeout) : null;
  try{
    const res = await fetch(API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl ? ctrl.signal : undefined });
    const text = await res.text();
    let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
    if(!res.ok){
      // A 401 on an authed call means the bearer token is dead — almost always
      // because the backend restarted (sessions are in-memory). Drop the stale
      // session and bounce to sign-in instead of surfacing a confusing "HTTP 401"
      // deep inside a feature (e.g. the assistant). After re-login the token is fresh.
      if(res.status === 401 && auth && state.session){
        state.session = null; state.serverOpps = [];
        try { LS.del("acp_session"); } catch {}
        if(typeof toast === "function") toast("Your session expired — please sign in again.", "alert");
        if(typeof render === "function"){ state.authView = "login"; render(); }
      }
      const e = new Error(data.error || ("HTTP " + res.status)); e.status = res.status; throw e;
    }
    return data;
  } finally { if(timer) clearTimeout(timer); }
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
  followups:     ()                      => apiFetch("/followups/run", { method: "POST" }),

  /* Live mode → proxied to n8n server-side. Returns { ok, status, data } (the
     same shape the browser used to get calling n8n directly). Client timeout sits
     just above the server's 120s ceiling so the server's friendly message wins. */
  live:          (target, payload)       => apiFetch("/live/" + target, { method: "POST", body: payload, timeout: 130000 }),
  saveSettings:  (cfg)                   => apiFetch("/settings", { method: "PUT", body: cfg })
};

/* Refresh the opportunities cache that views read from in Local mode. */
async function loadServerOpps(){
  state.serverOpps = await api.opportunities("", "all");
  return state.serverOpps;
}

/* Refresh the opportunities cache that views read from in Live mode — the real
   Odoo records, fetched through the crm-list-leads webhook (proxied server-side).
   Throws on an unreachable/failed workflow so the caller can show an honest error. */
async function loadLiveOpps(){
  const res = await api.live("leadList", { action: "list" });
  if(!res.ok) throw new Error(res.data?.text || ("Leads workflow returned HTTP " + res.status));
  state.liveOpps = extractLeadArray(res.data).map(mapLiveLead).filter(l => l.type === "opportunity");
  return state.liveOpps;
}
