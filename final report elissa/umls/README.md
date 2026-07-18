# UML / diagram sources

Diagrams are organized by the tool that owns them. The build script
`_build/transform.py` wires rendered images from `umls/img/` into `main.tex`, and falls
back to a built-in TikZ version when an image is absent so the report always compiles.

```
umls/
  puml/      PlantUML : 8 sequence diagrams + 5 Gantt (global + 4 sprint) + WBS  (.puml)  -> rendered
  drawio/    draw.io  : class diagram                             (.drawio) -> rendered
  staruml/   StarUML  : 5 use-case kits (4 sprints + global)      (.mdj + .populate.js)
  img/       rendered images consumed by the report              (.png / .jpg)
```

## Tool ownership (per your instructions)
- **Sequence diagrams → PlantUML.** Standard black-and-white UML style. `puml/seq-*.puml`.
- **Gantt + WBS → PlantUML.** Global sprint-level overview `puml/gantt-project.puml` (weekly scale) + per-sprint task detail `puml/gantt-sprint1..4.puml` (daily scale, ~square); `puml/wbs-project.puml`.
- **Class diagram → draw.io only.** `drawio/class-domain.drawio` → `img/class-domain.png`.
- **Use-case diagrams → StarUML only.** No PlantUML/draw.io use-case sources exist.

## Use-case diagrams (StarUML) — your step
StarUML cannot run in this environment (installer needs Administrator; no headless export),
so the kits are prepared for you to open, lay out, edit, and export:

1. Install StarUML (elevated shell): `winget install -e --id MKLabs.StarUML`
2. For each `staruml/uc-*.mdj`: open it, double-click the diagram, open the console
   (Debug > Show DevTools), paste the matching `uc-*.populate.js`, press Enter.
   This places the actors + use cases; StarUML draws the associations, **`<<include>>`**
   and **`<<extend>>`** relationships automatically.
3. Fine-tune the layout, then **File > Export Diagram As > PNG/JPG** into `img/` as
   `uc-platform-foundation.png`, `uc-authentication.png`, `uc-account-management.png`,
   `uc-lead-capture.png`, `uc-analytics-followup.png`, `uc-assistant-live.png` and `uc-global.png`.
4. Tell me and I re-run the build — it wires your StarUML exports in (the global one large),
   replacing the interim fallbacks.

Relationships in the kits are cross-referenced to the code (`server/`):
- **Central `<<include>> Authenticate`** — every protected action includes it, because
  `server/middleware.js` `requireAuth` guards every route except signup/login.
- Create opportunity `<<include>>` Detect duplicate — `opportunity.service.create` calls
  `matchDuplicate` **unconditionally**, so this is a mandatory `<<include>>`, never an `<<extend>>`.
- Capture lead `<<include>>` Create opportunity `<<include>>` Detect duplicate; Submit customer
  message `<<include>>` View extracted fields.
- View dashboard KPIs `<<include>>` Generate summary; View follow-up center `<<include>>` Detect
  inactive leads / Generate follow-up message.
- The Live assistant's six Odoo tools `<<extend>>` Ask the assistant:
  List / Get / Create / Update opportunity and Read CRM notes (Create/Read/Update — **no Delete**).
- The backend automation (Odoo CRM + n8n + the LLM) is drawn as **one non-human `System` actor** —
  a **rectangle** (`UMLClass`) on the right; human actors (User / Manager / Sales operator) are
  stick figures on the left.
- Every diagram carries a **titled `LeadDesk` system boundary** (a tab-less `UMLUseCaseSubject`):
  the global one is titled `LeadDesk`, the sprint ones `LeadDesk — <Module>`.

## Re-render
PlantUML (sequences, Gantt, WBS):
```
cd umls/puml
java -jar C:\Users\eliss\tectonic\plantuml.jar -tpng -Sdpi=200 -o ../img seq-*.puml
java -jar C:\Users\eliss\tectonic\plantuml.jar -tpng -Sdpi=170 -o ../img gantt-*.puml wbs-project.puml
```
draw.io (class) — portable at `C:\Users\eliss\tectonic\drawio-portable\draw.io.exe`:
```
draw.io.exe --no-sandbox --disable-gpu -x -f png -s 3 -b 12 -o img/class-domain.png drawio/class-domain.drawio
```
Rebuild report: `python "_build/transform.py"` then `C:\Users\eliss\tectonic\tectonic.exe main.tex`.
