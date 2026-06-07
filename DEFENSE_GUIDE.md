# PFE Defense Guide — AI CRM Platform

This is your private preparation document. It explains the system, the decisions behind it,
how to demo it, and the questions a jury is likely to ask — with answers you can give in
your own words.

---

## 1. One-sentence pitch

> "I built an AI-driven CRM automation platform: a sales team captures a lead in plain
> language, and the system uses a local LLM to structure it, prevent duplicates, create the
> opportunity in Odoo, summarize the pipeline, draft follow-ups, and answer questions about
> the CRM — all orchestrated in n8n and presented through one clean web console."

## 2. The problem you're solving

Sales teams lose leads in three ways: messy intake (info in emails, chats, notes), duplicate
records, and forgotten follow-ups. Managers also lack a quick read on pipeline health. Your
platform automates the boring, error-prone steps so the salesperson focuses on the customer.

## 3. Architecture (draw this on the board)

Three layers, bottom to top:

1. **Data & AI layer** — Odoo CRM (the `crm.lead` model) holds opportunities. A local
   Ollama model (`llama3.2:3b`, temperature 0) does the language work. *Local* matters:
   no customer data leaves the company, and there's no per-call API cost.
2. **Orchestration layer** — n8n connects everything. Each capability is a workflow exposed
   as an HTTP webhook. n8n handles the LLM calls, the JSON parsing, the Odoo reads/writes,
   and the deduplication logic.
3. **Presentation layer** — the AI CRM Platform console (this website). A single self-contained page
   that calls the four webhooks and presents results to managers and sales reps.

The four workflows:

- **Lead Capture (Module 2)** — free text → LLM extracts structured fields → dedupe check
  against Odoo by email/phone → create opportunity if new. Returns created/duplicate.
- **CRM Analytics Summary** — pulls all opportunities → a code node computes 5 KPIs → LLM
  writes a manager summary under strict "do not invent numbers" rules.
- **Smart Follow-Up (module2.1)** — finds inactive opportunities → dedupes by email (keeps
  most recent) → LLM drafts a personalized message → writes it back to Odoo.
- **AI Assistant** — a tool-using agent that can list, fetch, create, and update
  opportunities in Odoo in response to natural-language questions.

## 4. Why these design decisions (the jury loves rationale)

- **Local LLM (Ollama) instead of a cloud API:** data privacy, zero marginal cost, works
  offline, full control of the model. Trade-off: a 3B model is small, so you constrain it
  with strict prompts and `temperature: 0` for deterministic, format-bound output.
- **n8n as orchestrator:** visual, auditable workflows; each step is inspectable; easy to
  extend without rewriting code. Good fit for a CRM-integration project.
- **Strict prompts + JSON parsing with fallback:** small models drift, so every prompt
  fixes the exact output shape, forbids invented numbers/placeholders, and the code node
  wraps `JSON.parse` in try/catch with a safe fallback. This is reliability engineering, not
  just prompting.
- **Deduplication in two places:** capture-time (don't create the duplicate) and
  follow-up-time (don't message the same person twice). Shows you thought about data quality.
- **One self-contained HTML file for the front end:** the single most demo-safe choice. No
  build, no dependency that can fail in the room. It runs by double-clicking and works
  offline in Demo mode. (If asked why not React: you *had* a React/Vite version; you chose
  reliability and zero-dependency portability for the deliverable. You can speak to both.)
- **Demo vs Live mode + "never fabricate live data":** the console clearly separates a
  rehearsed offline demo from real webhook calls, and in Live mode it reports failures
  honestly instead of faking success. This is an integrity decision an evaluator respects.

## 5. Live demo script (~6–7 minutes)

Open in **Demo mode** so nothing can fail. Log in as Manager.

1. **Dashboard (45s)** — point out the animated KPIs and the charts (pipeline by priority,
   intent breakdown). "All computed from the dataset — the same KPIs my n8n summary workflow
   produces." Click **Generate summary** to show the manager narrative.
2. **Lead Capture (90s)** — paste a messy sentence, e.g.
   *"Hi, I'm Sarah Ben Ali from a logistics company in Sousse, interested in your premium
   plan, reach me at sarah.benali@example.com or +216 22 333 444."* Show the structured
   extraction (name, email, phone, interest, intent, priority, recommended action). Submit a
   second time → the duplicate guard fires. "Same logic my LLM + Odoo dedupe does live."
3. **Lead Workspace (60s)** — search/filter, open a lead drawer, show the auto-drafted
   follow-up.
4. **Follow-Up Center (60s)** — run it, show per-lead personalized messages with copy
   buttons; explain these get written back to the Odoo description field.
5. **AI Assistant (60s)** — ask "show me hot leads", "how many opportunities do we have",
   "find the lead with email …". Explain that in Live mode this is the Odoo tool-using agent.
6. **Architecture page (45s)** — close on the diagram; restate the three layers.

Then, if the room has the stack running, flip to **Live mode** and capture one real lead so
they see the genuine n8n → Ollama → Odoo round trip.

**Backup plan:** if Live fails (CORS, server down), stay in Demo mode and explain the data
contract from the Architecture page. You never get stuck.

## 6. Likely jury questions + answers

- **"Is the AI making up the numbers?"** No. KPIs are computed in a deterministic code node;
  the LLM only phrases them and is explicitly forbidden from inventing figures.
- **"What if the model returns invalid JSON?"** The format node parses defensively with a
  try/catch fallback, so a malformed response degrades gracefully instead of crashing.
- **"Why a 3B model — isn't it weak?"** It's enough for constrained extraction/summarization
  when paired with strict prompts and temperature 0; it runs locally for privacy and cost.
  Larger models are a drop-in swap in the Ollama node if needed.
- **"How do you prevent duplicate leads?"** Email/phone match against existing Odoo
  opportunities at capture time, plus email-based dedup (most-recent wins) before follow-ups.
- **"How does the website talk to n8n?"** Plain HTTP POST to four webhook endpoints; the
  console handles timeouts and shows honest errors. CORS must be enabled for cross-origin.
- **"Could this scale / go to production?"** Add authentication on the webhooks, move secrets
  to env config, add logging/retries in n8n, and put the model behind a queue. The
  architecture already separates concerns cleanly.
- **"What was the hardest part?"** Making a small local model reliable — that's why so much
  work went into prompt constraints, deterministic settings, and defensive parsing.

## 7. Honest limitations (say these before they ask — it builds credibility)

- Webhooks are unauthenticated in the current setup — fine for a demo, needs securing for
  production.
- The 3B model can still occasionally mis-extract unusual phrasing; strict prompts mitigate
  but don't eliminate this.
- The follow-up workflow currently writes the message to Odoo but doesn't send the email —
  sending is a clear next step.

## 8. Possible next improvements (good answer to "what would you add?")

- Have **lead-capture** return the extracted fields (not just created/duplicate) so the Live
  UI can show the structured result the same way Demo does.
- Add real email sending to the follow-up workflow.
- Add webhook auth + per-user audit logging.
- Track lead status changes over time for trend charts.

---

Good luck — you know this system better than anyone in the room. Speak to your decisions,
not just your features.
