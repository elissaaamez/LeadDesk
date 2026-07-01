# Live Mode & AI Assistant — how it works and what was fixed

This note documents the Live-mode pipeline after the June 2026 fixes. It supersedes
the Live-mode description in `README.md`/`CLAUDE.md` where they disagree (the front
end is now an MVC app in `src/` served by a small Node backend, not a single file).

## The three modes

| Mode  | Data source                         | Needs backend? | Needs n8n/Odoo? |
|-------|-------------------------------------|----------------|-----------------|
| Demo  | in-browser seed dataset             | no             | no              |
| Local | Node + NeDB (`/api/*`)              | yes            | no              |
| Live  | n8n → Odoo/Ollama/Groq, **via the backend proxy** | yes | yes |

Demo mode is unchanged and still works fully offline.

## Live mode is now proxied (no more browser → n8n)

Before, the browser called `http://localhost:5678/webhook/...` directly. That is a
cross-origin call (the page is served from `:3000`), so it was fragile (CORS) and,
when n8n was down, the `fetch` hung until a short client timeout fired.

Now the browser calls the backend **same-origin**, and the backend forwards to n8n:

```
browser (:3000)  ──POST /api/live/<target>──►  Node backend  ──►  n8n webhook (:5678)  ──►  Odoo / Groq / Ollama
   src/model/apiClient.js  api.live()              server/services/live.service.js
```

- Targets: `leadCapture`, `analytics`, `followUp`, `assistant`.
- The backend resolves the URL from a saved Settings endpoint, else `N8N_BASE` + the
  target's path (see `server/config.js` → `N8N_BASE`, `LIVE`).
- Each target has a server-side timeout (assistant 120s, follow-up 90s, others 60s).
- The proxy always returns `{ ok, status, data }`. If n8n is unreachable or times
  out it returns `{ ok:false, status:0, data:{ text: "<plain explanation>" } }` so
  the UI shows a clear message instead of hanging.
- Settings → "Save"/"Test" now also `PUT /api/settings`, so the proxy uses the same
  endpoints you see in the UI. The connection test only pings the read-safe targets
  (`analytics`, `assistant`); `leadCapture`/`followUp` stay untested because they can
  write to Odoo.
- A saved custom endpoint is only honoured if it's an `http(s)` URL on the **same host
  as `N8N_BASE`** (so the proxy can't be pointed at cloud-metadata/internal hosts);
  anything else falls back to the default. See `safeCustomUrl` in `live.service.js`.

Request/response contracts to n8n are unchanged (e.g. lead-capture still receives
`{message, source, submitted_by}`). Only the transport (browser→backend→n8n) changed.

## The assistant is now a real Groq agent

The webhook `crm-ai-assistant` was being served by a workflow with **no LLM** that
returned the full opportunity list for *every* question. It has been replaced by the
tool-using agent in `AI Assistant Webhook.json`, now running on **Groq
`llama-3.3-70b-versatile`** (fast, free tier) instead of the local 3B Ollama model.

Verified working: "how many opportunities?" → a count; "show opportunity 4" → a single
record; "list 3 opportunities" → three records.

### n8n state (what is active)

| Webhook            | Active workflow (id)                         | LLM            |
|--------------------|----------------------------------------------|----------------|
| `lead-capture`     | Lead Capture FAST Odoo Direct (ZtINi6Qp8…)   | none (direct)  |
| `crm-summary`      | CRM Analytics Summary (hd0flGIv3…)           | Ollama 3.2:3b  |
| `smart-follow-up`  | module2.1 (ZmIHQRRA7…)                        | Ollama 3.2:3b  |
| `crm-ai-assistant` | **AI Assistant Webhook (iSxu0zHkjDyueNIk)**  | **Groq 70B**   |

The instance also contains several inactive *experiment* copies (e.g. "THE AI
Assistant Webhook", "AI Assistant Webhookk", "…FAST Odoo Direct"). They are off;
leaving them is harmless but they're safe to delete to reduce clutter.

### Credentials in n8n
- `Groq account` (`groqApi`, id `GroqAcctLocal001`) — created from `GROQ_API_KEY` in
  `.env`. Bound to the assistant's "Groq Chat Model" node.
- `Odoo account` (`odooApi`, id `Sv6udoSjCErFqjcV`) — the existing Odoo credential,
  bound to all 7 Odoo tool nodes in the assistant.

### Re-importing the assistant workflow
If you edit `AI Assistant Webhook.json`, re-apply it to the running n8n with:
```
docker cp "AI Assistant Webhook.json" n8n:/tmp/wf.json
docker exec n8n n8n import:workflow --input=/tmp/wf.json
docker restart n8n        # required for webhook (de)activation to take effect
```
Only one workflow may be active on the `crm-ai-assistant` path at a time.

## Running the stack
1. Start Docker Desktop, then the containers: `docker start odoo-db odoo-web n8n`.
2. Start the app: `npm start` → http://localhost:3000 (serves the UI **and** `/api`).
3. Ollama must be running for the analytics/follow-up workflows (`llama3.2:3b`).
4. Sign in, then pick a mode in the sidebar. Live mode needs all of the above up.

## Known limitations
- **Assistant + a non-existent ID** (e.g. "show opportunity 99999"): the Odoo "get"
  tool errors on a missing record and the agent returns an empty answer, so the UI
  shows "No answer returned." instead of "Lead not found." Valid IDs work fine.
- **Data quality in Odoo**: the active lead-capture workflow has created some junk /
  duplicate opportunities (whole message stuffed into the name, repeated "Mohamed
  Ali" rows). That is a CRM-data issue, not a console bug; clean them in Odoo.
- Live mode requires the Node backend (it is the proxy), so opening `index.html`
  from `file://` supports Demo only — run `npm start` for Local/Live.

## Secrets
`.env` holds a real `GROQ_API_KEY`. It is git-ignored and was never committed. Treat
it as live; rotate it in the Groq console if it is ever exposed.
