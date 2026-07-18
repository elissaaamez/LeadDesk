# Use-case diagrams — StarUML kit (LeadDesk)

Five use-case diagrams (4 sprints + 1 global) are set up for StarUML. **StarUML could not be
installed automatically here** because its installer requires Administrator elevation (a
non-interactive session cannot approve the UAC prompt). Install it yourself, then export.

Each kit is code-cross-referenced to `server/` (see the header of `build_kits.cjs`). The
model is authored so that:

- the system boundary is a **titled rectangle with no folder tab** (a `UMLUseCaseSubject`,
  not a `UMLPackage`), carrying the **LeadDesk** system name;
- use cases are owned by the model, so **no `(from …)` label** appears under them;
- **human actors** (User / Manager / Sales operator) are stick figures on the left;
- the backend automation (Odoo CRM + n8n + the LLM) is shown as **one non-human `System` actor** —
  a **rectangle** (`UMLClass`) on the right;
- CRUD is represented as **Create / Read / Update only — there is no Delete anywhere** in the code.

## 1. Install StarUML (run in an **Administrator** PowerShell / terminal)

```
winget install -e --id MKLabs.StarUML --accept-package-agreements --accept-source-agreements
```

## 2. Produce / refresh the model files (already generated, but to regenerate)

```
node build_kits.cjs
```

This writes, for each diagram: `uc-<name>.mdj` (the model) and `uc-<name>.populate.js`
(the layout script). Regenerating **overwrites** any StarUML layout you saved earlier
(`_backup/` holds the pre-rebrand copies of `uc-sprint1` and `uc-global`).

## 3. For each of the 5 diagrams

1. StarUML → **File → Open** → `uc-<name>.mdj`
2. Double-click the diagram under the **Model** node in the sidebar
3. **Debug → Show DevTools** (Ctrl+Alt+I) → **Console** tab
4. Open `uc-<name>.populate.js`, copy all, paste into the console, press Enter
   (this draws the titled boundary, the use cases inside it, the human actor(s) on the left,
   and the `System` rectangle on the right — StarUML then draws the associations,
   `<<include>>` and `<<extend>>` links)
5. Drag any element if you want to fine-tune the layout
6. **File → Export Diagram As → PNG** (or JPG) → save into `../img/` with the **exact** names
   `uc-platform-foundation.png`, `uc-authentication.png`, `uc-account-management.png`,
   `uc-lead-capture.png`, `uc-analytics-followup.png`, `uc-assistant-live.png` and
   **`uc-global.png`** (export the global one large)

### Verify the three fixes before exporting
- **No `(from …)`** text under any use case.
- **Boundary** is a plain titled rectangle (LeadDesk system name at the top) with **no folder tab**.
  If the console logged "Could not auto-create the boundary", draw a Rectangle named after the
  title and send it to back.
- The **`System`** actor appears as a **rectangle** on the right, connected to the right use cases.
  (Optionally add a `«system»` stereotype in StarUML.)

## 4. Wire them into the report

Re-run the build — it auto-detects the exported images and replaces the interim TikZ
diagrams with your StarUML exports:

```
python "<report>\_build\transform.py"
tectonic main.tex
```

(`transform.py` looks for the exported `umls/img/uc-*.png|jpg`; if present it wires them,
otherwise it keeps the built-in diagrams so the report always compiles.)

## Diagrams in this kit

| File | Boundary title | Human actor(s) | Non-human actor (rectangle) |
|---|---|---|---|
| uc-platform-foundation | LeadDesk — Platform Foundation | User | — |
| uc-authentication | LeadDesk — Authentication | User | — |
| uc-account-management | LeadDesk — Account Management _(planned — see note)_ | Manager, Sales operator → User | — |
| uc-lead-capture | LeadDesk — Lead Capture and Duplicate Detection | Sales operator | System |
| uc-analytics-followup | LeadDesk — Analytics and Smart Follow-Up | Manager, Sales operator | System |
| uc-assistant-live | LeadDesk — CRM Assistant and Live Integration | User | System |
| uc-global | LeadDesk | Manager, Sales operator | System (hand-maintained; frozen in generator) |

**Note — `uc-account-management` is a _planned_ feature.** It is not implemented in `server/` yet
(no `usersRepo.update/remove`, no `PATCH`/`DELETE` auth routes). The diagram is drawn as a normal
(built-looking) use-case diagram at the owner's request; "planned" is recorded here and in the
`build_kits.cjs` comment, not on the diagram. Build it (backend + a sidebar account tab), then it
already matches. `uc-authentication` splits the auth use cases out of Platform Foundation.

The `System` actor stands for the backend automation the console talks to in Live mode
(Odoo CRM + n8n + the LLM — Ollama for capture/analytics, Groq for the assistant).
