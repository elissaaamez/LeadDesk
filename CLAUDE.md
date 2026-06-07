# AI CRM Platform — Engineering Contract (CLAUDE.md)

> Corrected, reality-based handoff for this repo (`pfe/`). Supersedes the original
> `AI-CRM-Platform-BRIEF.md`, which described a different/older build. Where they
> disagree, **this file and the actual code on disk win.**

## What this project is
A locally-run CRM automation console for a sales team. It does **not** replace Odoo —
it speeds up how the team works with Odoo: capture a customer message into a CRM
opportunity, block duplicates, list/summarize opportunities, find inactive leads,
draft follow-ups, answer CRM questions via an assistant, and explain its own
architecture for a final-year-project (PFE) jury.

## Stack & architecture
- **Front-end:** one self-contained file — `index.html` (vanilla HTML/CSS/JS, **no build step, no framework**). Open it directly in a browser.
- **Automation:** n8n workflows exposed as HTTP webhooks (exported JSON in this folder).
- **System of record:** Odoo CRM (`crm.lead`, treated as opportunities).
- **AI:** a local Ollama model (`llama3.2:3b` / `qwen2.5:3b`, temperature 0).
- **Two modes** (sidebar toggle): **Demo** (offline, local seed dataset, labelled) and **Live** (calls the real webhooks).

## Current identity (as of Milestone 1)
- **Product name:** `AI CRM Platform`. No "Nexus CRM" or "LeadDesk" text anywhere.
- **Palette:** grounded **teal/slate** (no purple). Accent tokens are `--accent` / `--accent-deep` (teal).
- **Fonts:** IBM Plex Sans (display + body) + IBM Plex Mono (data).
- **Browser-storage keys:** `acp_session`, `acp_config`, `acp_mode`, `acp_captured`.
- **Currency:** TND. **Inactive lead (front-end):** no activity ≥ 7 days.
- **Demo logins:** `manager@company.com / admin123`, `sales@company.com / sales123`.

## Webhook endpoints (defaults in the front-end; editable in Settings)
```
POST http://localhost:5678/webhook/lead-capture       (Module 2)
POST http://localhost:5678/webhook/crm-ai-assistant   (AI Assistant Webhook)
POST http://localhost:5678/webhook/crm-summary        (CRM Analytics Summary)
POST http://localhost:5678/webhook/smart-follow-up    (module2.1)
```
All four are real and reach Odoo `crm.lead`. Preserve their request/response
contracts:
- **lead-capture** ← `{message, source, submitted_by}` → `{status:'created'|'duplicate', message}`
- **crm-ai-assistant** ← `{message, chatInput, sessionId, source}` → text under `answer || output || text`
- **crm-summary** ← `{trigger, requested_by}` → text under `text || output || summary`
- **smart-follow-up** ← `{trigger, requested_by}` → array/object of `{name, email, inactive_days, follow_up_message|text}`

## Non-negotiable laws
1. **Don't break Lead Capture or the CRM Assistant.** Keep endpoints + request structure stable.
2. **Stay local-demo friendly** — no required paid SaaS, works offline in Demo mode.
3. **No fake business results** (no fake testimonials/companies/numbers).
4. **Professional, human-made UI** — no AI buzzwords, marketing slogans, or emojis in the console.
5. **Reliability over complexity.**
6. **No secrets in front-end files.** (Currently none; n8n holds credential references only.)
7. **Inspect first, plan, get approval, implement, test, document.** Work in small milestones.

## Status & open items
- **DONE — `smart-follow-up` threshold:** `module2.1.json` now uses `inactiveAfterDays = 7`, matching the front-end (committed). Relevant only to **Live** follow-up; Demo mode computes inactivity in-browser.
- **DONE — workflow ping-guard:** all four webhook JSONs now have an `IF ($json.body.ping === true)` → `Respond Pong {ok,pong:true}` short-circuit *before* any Odoo node (committed). Existing nodes unchanged; the guard only fires on a `{ping:true}` body — normal requests flow exactly as before.
- **Front-end Test button (construction-safe):** `probe` flags are `crm-summary`-only, so "Test connections" only POSTs to `crm-summary` (which has no Odoo write node). Lead Capture, Smart Follow-Up, and the Assistant show "not tested — would modify Odoo." Safe regardless of n8n state — no footgun. If you later import the four guarded workflows, flip the `probe` flags to `true` to ping all four safely. Normal capture/assistant Live flows do NOT depend on the guard.
- **Demo mode needs no backend:** follow-up and analytics in Demo mode are computed in-browser from the seed dataset and never call n8n.
- Optional docs to add: `ARCHITECTURE.md`, `DEMO.md`, `TESTING.md`, `docs/workflows.md`.

## Repo contents
```
index.html            ← the whole front-end
README.md             ← run + data-contract overview
DEFENSE_GUIDE.md      ← architecture, rationale, demo script, jury Q&A
CLAUDE.md             ← this contract
Module 2.json         ← lead-capture workflow
AI Assistant Webhook.json ← crm-ai-assistant workflow
CRM Analytics Summary.json ← crm-summary workflow
module2.1.json        ← smart-follow-up workflow
Module 1.json         ← in-app chat twin of the assistant (no HTTP webhook; unused by the UI)
```

## Verifying the front-end
No test suite (single static file). After changes: open `index.html`, confirm a
clean console, log in/out, and walk Demo mode (dashboard summary, capture +
duplicate, workspace draft, follow-up batch, assistant, architecture). For Live
mode, the user tests against their own running n8n + Odoo + Ollama.
