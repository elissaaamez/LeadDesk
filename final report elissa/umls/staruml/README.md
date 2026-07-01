# Use-case diagrams — StarUML kit

The 4 sprint use-case diagrams are set up for StarUML. **StarUML could not be installed
automatically here** because its installer requires Administrator elevation (a
non-interactive session cannot approve the UAC prompt). Install it yourself, then export.

## 1. Install StarUML (run in an **Administrator** PowerShell / terminal)

```
winget install -e --id MKLabs.StarUML --accept-package-agreements --accept-source-agreements
```

## 2. Produce / refresh the model files (already generated, but to regenerate)

```
node build_kits.cjs
```

This writes, for each diagram: `uc-sprintN.mdj` (the model) and `uc-sprintN.populate.js`
(the layout script).

## 3. For each of the 4 diagrams

1. StarUML → **File → Open** → `uc-sprintN.mdj`
2. Double-click the diagram under the **Model** node in the sidebar
3. **Debug → Show DevTools** (Ctrl+Alt+I) → **Console** tab
4. Open `uc-sprintN.populate.js`, copy all, paste into the console, press Enter
   (this places the actor(s), the system rectangle, and the use cases)
5. Drag any element if you want to fine-tune the layout
6. **File → Export Diagram As → JPG** (or PNG) → save into `../img/` as **`uc-sprintN.jpg`**
   (exact names: `uc-sprint1.jpg` … `uc-sprint4.jpg`)

## 4. Wire them into the report

Re-run the build — it auto-detects the exported images and replaces the temporary
diagrams with your StarUML exports:

```
python "..\.._build\transform.py"   # actually: python "<report>\_build\transform.py"
"C:\Users\eliss\tectonic\tectonic.exe" main.tex
```

(`transform.py` looks for `umls/img/uc-sprintN.png|jpg`; if present it wires them,
otherwise it keeps the built-in diagrams so the report always compiles.)

## Diagrams in this kit

| File | Subject | Actor(s) |
|---|---|---|
| uc-sprint1 | AI CRM Platform | User |
| uc-sprint2 | Lead Capture Module | Sales user |
| uc-sprint3 | Analytics and Follow-Up | Manager, Sales user |
| uc-sprint4 | Assistant and Live Integration | User |
