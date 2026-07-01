/* ============================================================================
   Live service — server-side proxy for Live mode. The browser POSTs same-origin
   to /api/live/:target; this forwards the call to the matching n8n webhook with
   a real timeout. Two things this buys us over the old browser→n8n direct call:
     1. No CORS (the page and the proxy share an origin; n8n is reached server-side).
     2. No silent hang — if n8n is down or slow we return a clear, typed error
        instead of leaving the browser's fetch pending until it gives up.
   forward() resolves to { ok, status, data } for any reachable/unreachable n8n
   upstream so the front-end parses one shape; an unknown target key is a 400.
   ========================================================================== */
"use strict";
const { N8N_BASE, LIVE } = require("../config");
const { settingsRepo } = require("../repositories");

const N8N_HOST = (() => { try { return new URL(N8N_BASE).hostname; } catch { return "localhost"; } })();

/* A user-saved Settings endpoint is only honoured if it is an http(s) URL on the
   SAME host as N8N_BASE. Without this, an authenticated user could save e.g.
   http://169.254.169.254/… as the "analytics" endpoint and turn this proxy into an
   SSRF gadget against cloud-metadata / internal services. Anything that fails the
   check is ignored and we fall back to the configured default. */
function safeCustomUrl(custom){
  const v = custom && String(custom).trim();
  if(!v) return null;
  let u; try { u = new URL(v); } catch { return null; }
  if(u.protocol !== "http:" && u.protocol !== "https:") return null;
  if(u.hostname !== N8N_HOST) return null;
  return u.href;
}

/* Resolve the upstream URL for a target: a validated user-saved endpoint wins,
   otherwise the configured N8N_BASE + the target's path. */
async function resolveTarget(target){
  const cfg = LIVE[target];
  if(!cfg){ const e = new Error("Unknown live target: " + target); e.status = 400; throw e; }
  const saved = (await settingsRepo.get()) || {};
  const url = safeCustomUrl(saved[target]) || (N8N_BASE.replace(/\/+$/, "") + "/" + cfg.path);
  return { url, timeout: cfg.timeout };
}

async function forward(target, body){
  const { url, timeout } = await resolveTarget(target);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try{
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
      signal: ctrl.signal
    });
    const raw = await res.text();
    let data; try { data = raw ? JSON.parse(raw) : {}; } catch { data = { text: raw }; }
    return { ok: res.ok, status: res.status, data };
  } catch(err){
    const timedOut = err.name === "AbortError";
    return {
      ok: false,
      status: 0,
      data: { text: timedOut
        ? `The workflow at ${url} did not respond within ${Math.round(timeout / 1000)}s — n8n may be busy or the model is slow.`
        : `Could not reach n8n at ${url} — is the container running? (${err.message})` }
    };
  } finally { clearTimeout(timer); }
}

module.exports = { forward, resolveTarget };
