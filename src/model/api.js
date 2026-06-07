/* ============================================================================
   MODEL · API — the only network boundary. POSTs JSON to an n8n webhook with a
   timeout and tolerant response parsing. Used by Live mode across the app.
   ========================================================================== */
"use strict";

async function postJson(url, payload, timeout=8000){
  if(!url || !url.trim()) throw new Error('Webhook URL is not configured. Add it in Settings.');
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), timeout);
  try{
    const res = await fetch(url.trim(), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), signal:ctrl.signal });
    const raw = await res.text();
    let data; try{ data = raw ? JSON.parse(raw) : {}; }catch{ data = { text: raw }; }
    return { ok:res.ok, status:res.status, data };
  } finally { clearTimeout(t); }
}
