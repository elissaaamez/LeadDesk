# Verification report

Generated while validating the AI CRM Platform front-end and the n8n workflows.

## How it was run
- Static server: `npm start` → http://localhost:3000/ (zero-dependency `server.js`).
- Screenshots: real headless **Chrome** via Playwright (`npm run screenshots`, `scripts/shots.cjs`),
  viewport 1440×900 @2x, full-page. **Demo mode only — no backend side effects.**
- Each screenshot was captured only after the harness waited for the relevant content to
  render, and every image below was then opened and visually confirmed.

## Use-case screenshots (Demo mode) — all verified ✓
| # | File | Use case | Verified |
|---|------|----------|----------|
| 01 | 01-landing.png | Public landing page → CTAs to login/signup | ✓ styled, hero + preview (14/9/5) + sections |
| 02 | 02-signup.png | Sign-up screen (demo-only, routes to login) | ✓ form + disclaimer + links |
| 03 | 03-login.png | Sign-in (demo accounts, back-to-home, create-account) | ✓ |
| 04 | 04-dashboard.png | Dashboard KPIs + charts | ✓ |
| 05 | 05-dashboard-analytics.png | "Run analytics" → on-device summary | ✓ summary text + toast |
| 06 | 06-capture-created.png | Lead capture → opportunity created | ✓ extraction panel + result |
| 07 | 07-capture-duplicate.png | Lead capture → duplicate detected (#1002) | ✓ "Duplicate — not created" |
| 08 | 08-workspace.png | Lead workspace list + filters | ✓ |
| 09 | 09-workspace-detail.png | Lead detail + drafted follow-up | ✓ (captured lead persisted) |
| 10 | 10-followup.png | Follow-Up Center batch (9 messages) | ✓ |
| 11 | 11-assistant.png | CRM assistant → record cards | ✓ |
| 12 | 12-architecture.png | Architecture page | ✓ |
| 13 | 13-settings.png | Settings / webhook endpoints | ✓ |

## n8n workflow tests (Live, server-side via curl — no browser CORS)
| Workflow | Endpoint | Result |
|----------|----------|--------|
| CRM Analytics Summary | `POST /webhook/crm-summary` | ✅ **PASS** — real AI summary returned (27 opportunities, 23 inactive, 17 email / 17 phone). Read-only. |
| CRM AI Assistant | `POST /webhook/crm-ai-assistant` | ✅ **PASS** — returned 17 real Odoo records (`source: odoo-direct-fast`). Read-only query. |
| Lead Capture | `POST /webhook/lead-capture` | ⚠️ **REACHABLE & FUNCTIONAL, but ping-guard is NOT active in the running n8n.** A `{ping:true}` probe was **not** short-circuited and **created `lead_id: 40` ("New CRM Lead", empty email)** in Odoo. |
| Smart Follow-Up | `POST /webhook/smart-follow-up` | ⚠️ **UNCERTAIN** — `{ping:true}` returned empty within 20 s; guard inactive, so it may have run the batch and written follow-up text to inactive opportunities' descriptions. Not confirmed. |

## Action items (recommended)
1. **Delete the junk `lead_id: 40`** from Odoo (created by the probe above).
2. **Import the four guarded workflow JSONs** from this repo into the running n8n and activate
   them — they contain the `IF $json.body.ping === true → Respond Pong` short-circuit, after which
   `{ping:true}` (and the in-app "Test connections") becomes safe for all four endpoints.
3. Browser **Live mode** (from http://localhost:3000 → http://localhost:5678) may be blocked by
   **CORS** even though the workflows work via curl. Enable CORS on the n8n webhooks (or serve both
   from the same origin / a proxy) if you want Live mode to run in the browser.
