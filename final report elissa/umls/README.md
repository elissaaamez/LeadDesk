# UML / diagram sources

Diagrams are organized by the tool that owns them. The build script
`_build/transform.py` wires rendered images from `umls/img/` into `main.tex`, and falls
back to a built-in TikZ version when an image is absent so the report always compiles.

```
umls/
  puml/      PlantUML : 5 sequence diagrams + Gantt + WBS        (.puml)  -> rendered
  drawio/    draw.io  : class diagram                             (.drawio) -> rendered
  staruml/   StarUML  : 5 use-case kits (4 sprints + global)      (.mdj + .populate.js)
  img/       rendered images consumed by the report              (.png / .jpg)
```

## Tool ownership (per your instructions)
- **Sequence diagrams → PlantUML.** Standard black-and-white UML style. `puml/seq-*.puml`.
- **Gantt + WBS → PlantUML.** `puml/gantt-project.puml`, `puml/wbs-project.puml`.
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
   `uc-sprint1.png` … `uc-sprint4.png` and `uc-global.png`.
4. Tell me and I re-run the build — it wires your StarUML exports in (the global one large),
   replacing the interim fallbacks.

Relationships in the kits are cross-referenced to the code (`server/`):
- **Central `<<include>> Authenticate`** — every protected action includes it, because
  `server/middleware.js` `requireAuth` guards every route except signup/login.
- Create opportunity `<<include>>` Check duplicate (`opportunity.service.create` → `matchDuplicate`).
- Capture lead `<<include>>` Create opportunity / View extracted fields; Report duplicate `<<extend>>` Capture lead.
- View dashboard `<<include>>` Generate summary; Generate follow-up `<<include>>` Detect inactive leads.
- Ask the assistant `<<extend>>` List / Get / Update opportunity; Test connection `<<extend>>` Configure endpoints.
- The **global** and **Sprint 1** diagrams carry **no "AI CRM Platform" boundary label** (removed).

## Re-render
PlantUML (sequences, Gantt, WBS):
```
cd umls/puml
java -jar C:\Users\eliss\tectonic\plantuml.jar -tpng -Sdpi=200 -o ../img seq-*.puml
java -jar C:\Users\eliss\tectonic\plantuml.jar -tpng -Sdpi=170 -o ../img gantt-project.puml wbs-project.puml
```
draw.io (class) — portable at `C:\Users\eliss\tectonic\drawio-portable\draw.io.exe`:
```
draw.io.exe --no-sandbox --disable-gpu -x -f png -s 3 -b 12 -o img/class-domain.png drawio/class-domain.drawio
```
Rebuild report: `python "_build/transform.py"` then `C:\Users\eliss\tectonic\tectonic.exe main.tex`.
