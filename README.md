# Nexus CRM — AI Sales Operations Console

A single-page operations console that unifies four n8n + Ollama + Odoo workflows into one
interface a sales team can actually use: capture leads, avoid duplicates, summarize CRM
activity, generate follow-ups, and query the CRM through an AI assistant.

The entire front end is **one file — `index.html`** — built with vanilla HTML/CSS/JS.
No build step, no `npm install`, no framework. Double-click it and it runs.

---

## Run it

1. Double-click `index.html` (or open it in any modern browser).
2. Sign in with one of the demo accounts:

   | Role    | Email                | Password   |
   |---------|----------------------|------------|
   | Manager | manager@company.com  | admin123   |
   | Sales   | sales@company.com    | sales123   |

That's it. The app opens in **Demo mode** with a realistic local dataset so every screen
works offline — ideal for a live presentation where Wi-Fi may be unreliable.

## Demo mode vs Live mode

The toggle is in the left sidebar.

- **Demo** — runs entirely in the browser against a built-in sample dataset and a local
  rules-based stand-in for the AI. Nothing leaves the machine. Use this to walk the jury
  through every feature with zero dependencies.
- **Live** — calls your real n8n webhooks. The console never fabricates live data: if a
  webhook is unreachable it says so plainly instead of inventing a result.

## Connecting your workflows (Live mode)

Open **Settings** and set the base URL (default `http://localhost:5678/webhook`). The four
endpoints the console calls:

| Feature              | Method | Path                | Workflow                  |
|----------------------|--------|---------------------|---------------------------|
| Lead capture         | POST   | `/lead-capture`     | Module 2                  |
| CRM summary          | POST   | `/crm-summary`      | CRM Analytics Summary     |
| Smart follow-up      | POST   | `/smart-follow-up`  | module2.1                 |
| AI assistant         | POST   | `/crm-ai-assistant` | AI Assistant Webhook      |

**Note on CORS:** browsers block cross-origin requests unless the server allows them. For a
live demo from `file://` or a different host, enable CORS on your n8n webhooks (respond with
`Access-Control-Allow-Origin: *`) or serve the page from the same origin as n8n. The Settings
page has a "Test connection" button and explains this if a ping fails.

## Data contracts (what each webhook expects / returns)

- **lead-capture** — send `{ message, source, submitted_by }`. The workflow's LLM extracts
  name/email/phone/interest/intent/priority, checks Odoo for duplicates, and returns
  `{ status: "created" | "duplicate", message }`.
- **crm-summary** — no body needed. Returns a manager-readable summary built from five KPIs
  (total opportunities, with email, with phone, inactive ≥7 days, new this week). The prompt
  forbids inventing numbers.
- **smart-follow-up** — finds inactive opportunities, de-duplicates by email (keeps the most
  recent), and has the LLM draft a polite follow-up per lead, also written back to the Odoo
  record's description.
- **crm-ai-assistant** — send `{ message, sessionId }`. A tool-using agent reads/updates Odoo
  opportunities and replies in plain text (`ID: / Name: / Email: / Phone:` blocks), or
  "Lead not found." / "No leads found." It never guesses.

## Project structure

```
index.html   ← the whole application (UI + logic + sample data)
README.md     ← this file
DEFENSE_GUIDE.md ← architecture, design rationale, demo script, jury Q&A
```

## Tech

Vanilla JS (ES2020), CSS custom properties, hand-built animated SVG charts (no chart
library). Fonts load from Google Fonts when online and fall back to system fonts offline.
Back end (not in this repo): n8n workflows, a local Ollama `llama3.2:3b` model, and Odoo CRM.
