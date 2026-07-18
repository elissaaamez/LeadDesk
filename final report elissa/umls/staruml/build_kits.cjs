/* eslint-disable */
/*
 * StarUML use-case kit generator for LeadDesk (4 sprints + global).
 * Every element is cross-referenced to the codebase (server/) so the diagrams match
 * what the app actually does:
 *   - server/middleware.js requireAuth guards every endpoint except signup/login
 *     => every PROTECTED use case <<include>> Authenticate (central hub).
 *   - opportunity.service.create() calls matchDuplicate() UNCONDITIONALLY
 *     => Create opportunity <<include>> Detect duplicate (mandatory, never an <<extend>>).
 *   - capture.service: Submit message -> extract() -> create()   => <<include>> View extracted fields + Create opportunity.
 *   - analytics.service: summary = KPIs (+LLM text); followups = detect-inactive(>=7d) -> draft.
 *   - assistant.service (Local) is read-only; the LIVE Groq agent (AI Assistant Webhook.json)
 *     exposes Odoo tools list/get/create/update + read CRM notes => those <<extend>> Ask the assistant.
 *   - CRUD on opportunities is Create/Read/Update ONLY — there is NO delete route or service anywhere.
 *   - The backend automation (Odoo CRM + n8n + the LLM — Ollama for capture/analytics, Groq for the
 *     assistant) is shown as ONE non-human "System" secondary actor, drawn as a rectangle (UMLClass),
 *     not a stick figure. Human actors (User / Manager / Sales operator) are stick figures.
 *
 * Produces, per diagram:  <name>.mdj  and  <name>.populate.js
 * Run:  node build_kits.cjs
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const id = () => "id-" + crypto.randomBytes(8).toString("hex");

/* Each diagram:
 *   boundaryTitle : titled system-boundary rectangle (the LeadDesk system name)
 *   humanActors   : stick-figure actors, drawn on the LEFT
 *   systemActors  : non-human "System" actor(s), drawn as rectangle(s) on the RIGHT
 *   ucs           : use cases (owned by the model, NOT by the boundary -> no "(from ...)" label)
 *   assoc         : actor -> use case associations (human primary actors + system participants)
 *   includes      : [base, addition] — base <<include>> addition (mandatory sub-behaviour)
 *   extends       : [extension, base] — extension <<extend>> base (optional/model-chosen behaviour)
 *   generalizations : [child, parent] — child actor --|> parent actor (optional; e.g. roles -> User)
 */
const DIAGRAMS = [
  { file: "uc-platform-foundation", boundaryTitle: "LeadDesk — Platform Foundation",
    humanActors: ["User"], systemActors: [],
    // Auth use cases (Sign up / Sign in) moved to the dedicated uc-authentication diagram to avoid
    // duplication. This one covers in-app navigation, the environment toggle, and settings — all
    // behind requireAuth, so each <<include>> Authenticate.
    ucs: ["Navigate pages", "Select environment", "Configure endpoints", "Authenticate"],
    assoc: { "User": ["Navigate pages", "Select environment", "Configure endpoints"] },
    includes: [["Navigate pages", "Authenticate"], ["Select environment", "Authenticate"], ["Configure endpoints", "Authenticate"]],
    extends: [] },

  { file: "uc-lead-capture", boundaryTitle: "LeadDesk — Lead Capture and Duplicate Detection",
    humanActors: ["Sales operator"], systemActors: ["System"],
    ucs: ["Submit customer message", "View extracted fields", "Create opportunity", "Detect duplicate", "View capture history", "Authenticate"],
    // The Sales operator drives the two top-level use cases; the backend "System" (Odoo CRM + n8n +
    // Ollama in Live mode) participates through the base UC only (the internal <<include>>d steps
    // stay actor-free — same convention as the global diagram).
    assoc: { "Sales operator": ["Submit customer message", "View capture history"],
             "System": ["Submit customer message"] },
    includes: [["Submit customer message", "View extracted fields"], ["Submit customer message", "Create opportunity"],
               ["Create opportunity", "Detect duplicate"], ["Submit customer message", "Authenticate"], ["View capture history", "Authenticate"]],
    extends: [] },

  { file: "uc-analytics-followup", boundaryTitle: "LeadDesk — Analytics and Smart Follow-Up",
    humanActors: ["Manager", "Sales operator"], systemActors: ["System"],
    ucs: ["View dashboard KPIs", "Generate summary", "View follow-up center", "Generate follow-up message", "Detect inactive leads", "Authenticate"],
    assoc: { "Manager": ["View dashboard KPIs", "Generate summary"],
             "Sales operator": ["View follow-up center", "Generate follow-up message"],
             "System": ["View dashboard KPIs", "Generate summary", "View follow-up center", "Generate follow-up message"] },
    // Detect inactive leads is included from the single follow-up base UC (analytics.service.followups
    // runs the >=7d filter once). Generate summary reuses the dashboard KPIs.
    includes: [["View dashboard KPIs", "Authenticate"], ["Generate summary", "Authenticate"], ["View follow-up center", "Authenticate"],
               ["Generate follow-up message", "Authenticate"], ["Generate summary", "View dashboard KPIs"], ["View follow-up center", "Detect inactive leads"]],
    extends: [] },

  { file: "uc-assistant-live", boundaryTitle: "LeadDesk — CRM Assistant and Live Integration",
    humanActors: ["User"], systemActors: ["System"],
    ucs: ["Ask the assistant", "List opportunities", "Get an opportunity", "Create an opportunity", "Update an opportunity", "Read CRM notes", "Configure endpoints", "Test connection", "Authenticate"],
    // The Live Groq agent's six Odoo tools are optional, model-chosen actions => <<extend>> Ask the assistant.
    // The backend "System" (n8n proxy + Groq agent + Odoo CRM) fulfils the assistant and its tool operations.
    assoc: { "User": ["Ask the assistant", "Configure endpoints", "Test connection"],
             "System": ["Ask the assistant", "Test connection", "List opportunities", "Get an opportunity", "Create an opportunity", "Update an opportunity", "Read CRM notes"] },
    includes: [["Ask the assistant", "Authenticate"], ["Configure endpoints", "Authenticate"], ["Test connection", "Authenticate"]],
    extends: [["List opportunities", "Ask the assistant"], ["Get an opportunity", "Ask the assistant"], ["Create an opportunity", "Ask the assistant"],
              ["Update an opportunity", "Ask the assistant"], ["Read CRM notes", "Ask the assistant"]] },

  { file: "uc-authentication", boundaryTitle: "LeadDesk — Authentication",
    humanActors: ["User"], systemActors: [],
    // Create account (POST /auth/signup) and Sign in (POST /auth/login) are the unauthenticated entry
    // points; Sign out (POST /auth/logout) and View session (GET /auth/me) require an active session
    // (middleware.requireAuth) so they <<include>> Authenticate. Local scrypt auth — no external system.
    ucs: ["Create account", "Sign in", "Sign out", "View session", "Authenticate"],
    assoc: { "User": ["Create account", "Sign in", "Sign out", "View session"] },
    includes: [["Sign out", "Authenticate"], ["View session", "Authenticate"]],
    extends: [] },

  // PLANNED — NOT yet implemented in server/ (usersRepo exposes only findByEmail/create/all; there are
  // no PATCH/DELETE auth routes). Diagrammed ahead of implementation at the owner's request: self-service
  // account management. When built (usersRepo.update/remove + PATCH/DELETE /auth routes + a sidebar
  // account tab), this diagram already matches. Mark it as "planned" wherever it appears in the report.
  { file: "uc-account-management", boundaryTitle: "LeadDesk — Account Management",
    // Both roles (Manager, Sales operator) manage their own account, so they generalize to a single
    // "User" actor and the use cases attach to User — one consistent actor name, no confusion.
    humanActors: ["User", "Manager", "Sales operator"], systemActors: [],
    generalizations: [["Manager", "User"], ["Sales operator", "User"]],
    ucs: ["View profile", "Change username", "Change password", "Change profile picture", "Delete account", "Authenticate"],
    assoc: { "User": ["View profile", "Change username", "Change password", "Change profile picture", "Delete account"] },
    includes: [["View profile", "Authenticate"], ["Change username", "Authenticate"], ["Change password", "Authenticate"],
               ["Change profile picture", "Authenticate"], ["Delete account", "Authenticate"]],
    extends: [] },

  // FROZEN: the global diagram is hand-maintained in StarUML (laid out + edited by the owner).
  // The generator no longer regenerates it — this entry is kept only as documentation of intent.
  { file: "uc-global", frozen: true, boundaryTitle: "LeadDesk",
    humanActors: ["Manager", "Sales operator"], systemActors: ["System"],
    ucs: ["Authenticate", "Sign up", "Sign in", "Capture lead", "Create opportunity", "Detect duplicate",
          "List opportunities", "View opportunity", "Update opportunity", "View dashboard", "Run smart follow-ups",
          "Detect inactive leads", "Generate follow-up message", "Ask CRM assistant", "Manage live connection"],
    assoc: {
      "Manager": ["Sign in", "Capture lead", "List opportunities", "View opportunity", "Update opportunity", "View dashboard", "Run smart follow-ups", "Ask CRM assistant", "Manage live connection"],
      "Sales operator": ["Sign up", "Sign in", "Capture lead", "List opportunities", "View opportunity", "Update opportunity", "View dashboard", "Ask CRM assistant"],
      // One "System" actor = the backend automation (Odoo CRM + n8n + LLM), union of its participations.
      "System": ["Capture lead", "List opportunities", "View opportunity", "Update opportunity", "View dashboard", "Run smart follow-ups", "Ask CRM assistant", "Manage live connection", "Generate follow-up message"]
    },
    // Duplicate detection is mandatory (matchDuplicate is called unconditionally inside create()),
    // so it is an <<include>> chain — never an <<extend>>. No extends on the global diagram.
    includes: [["Sign in", "Authenticate"], ["Capture lead", "Authenticate"], ["Capture lead", "Create opportunity"],
               ["Create opportunity", "Detect duplicate"], ["List opportunities", "Authenticate"], ["View opportunity", "Authenticate"],
               ["Update opportunity", "Authenticate"], ["View dashboard", "Authenticate"], ["Run smart follow-ups", "Authenticate"],
               ["Run smart follow-ups", "Detect inactive leads"], ["Run smart follow-ups", "Generate follow-up message"],
               ["Ask CRM assistant", "Authenticate"], ["Manage live connection", "Authenticate"]],
    extends: [] },
];

function buildModel(d) {
  const projectId = id(), modelId = id(), diagramId = id();
  const byName = {};

  // Human actors -> UMLActor (stick figure). Non-human/system actors -> UMLClass (rectangle).
  const humanActors = (d.humanActors || []).map(a => {
    const el = { _type: "UMLActor", _id: id(), _parent: { $ref: modelId }, name: a };
    byName[a] = el; return el;
  });
  const systemActors = (d.systemActors || []).map(a => {
    const el = { _type: "UMLClass", _id: id(), _parent: { $ref: modelId }, name: a, attributes: [], operations: [] };
    byName[a] = el; return el;
  });

  // Use cases are owned by the MODEL (not by any boundary) so their namespace equals the diagram's
  // namespace and StarUML shows NO "(from ...)" qualifier under the name.
  const ucs = d.ucs.map(u => {
    const el = { _type: "UMLUseCase", _id: id(), _parent: { $ref: modelId }, name: u };
    byName[u] = el; return el;
  });

  // actor/class -> use case associations
  Object.entries(d.assoc || {}).forEach(([actor, targets]) => targets.forEach(t => {
    const a = byName[actor], uc = byName[t];
    if (!a || !uc) throw new Error(`${d.file}: association references unknown "${a ? t : actor}"`);
    const assocId = id(), e1 = id(), e2 = id();
    (a.ownedElements = a.ownedElements || []).push({
      _type: "UMLAssociation", _id: assocId, _parent: { $ref: a._id },
      end1: { _type: "UMLAssociationEnd", _id: e1, _parent: { $ref: assocId }, reference: { $ref: a._id }, navigable: "unspecified" },
      end2: { _type: "UMLAssociationEnd", _id: e2, _parent: { $ref: assocId }, reference: { $ref: uc._id }, navigable: "unspecified" },
    });
  }));

  // base <<include>> addition
  (d.includes || []).forEach(([base, sub]) => {
    const b = byName[base], s = byName[sub];
    if (!b || !s) throw new Error(`${d.file}: include references unknown "${!b ? base : sub}"`);
    (b.ownedElements = b.ownedElements || []).push({
      _type: "UMLInclude", _id: id(), _parent: { $ref: b._id }, source: { $ref: b._id }, target: { $ref: s._id },
    });
  });

  // extension <<extend>> base
  (d.extends || []).forEach(([ext, base]) => {
    const e = byName[ext], b = byName[base];
    if (!e || !b) throw new Error(`${d.file}: extend references unknown "${!e ? ext : base}"`);
    (e.ownedElements = e.ownedElements || []).push({
      _type: "UMLExtend", _id: id(), _parent: { $ref: e._id }, source: { $ref: e._id }, target: { $ref: b._id },
    });
  });

  // child actor --|> parent actor (generalization: e.g. Manager and Sales operator generalize to User)
  (d.generalizations || []).forEach(([child, parent]) => {
    const c = byName[child], p = byName[parent];
    if (!c || !p) throw new Error(`${d.file}: generalization references unknown "${!c ? child : parent}"`);
    (c.ownedElements = c.ownedElements || []).push({
      _type: "UMLGeneralization", _id: id(), _parent: { $ref: c._id }, source: { $ref: c._id }, target: { $ref: p._id },
    });
  });

  const diagram = { _type: "UMLUseCaseDiagram", _id: diagramId, _parent: { $ref: modelId }, name: d.boundaryTitle, defaultDiagram: true, ownedViews: [] };
  // The titled boundary (UMLUseCaseSubject) is created at runtime by populate.js so the .mdj only
  // uses well-established model types and always loads cleanly.
  const modelChildren = [...humanActors, ...systemActors, ...ucs, diagram];
  return { _type: "Project", _id: projectId, name: d.boundaryTitle, ownedElements: [
    { _type: "UMLModel", _id: modelId, _parent: { $ref: projectId }, name: "Model", ownedElements: modelChildren },
  ] };
}

function buildPopulate(d) {
  const ucs = d.ucs;
  const cols = ucs.length > 6 ? 2 : 1;
  const rows = Math.ceil(ucs.length / cols);
  const BOX_X = 260, BOX_Y = 70, COLW = 250, ROWH = 95, PADX = 45, PADY = 65;
  const BOX_W = PADX * 2 + cols * COLW;
  const BOX_H = PADY + rows * ROWH + 30;
  const ucPos = {};
  ucs.forEach((u, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    ucPos[u] = { x: BOX_X + PADX + c * COLW, y: BOX_Y + PADY + r * ROWH };
  });
  const midY = BOX_Y + BOX_H / 2;
  const stack = (names, x, gap) => {
    const pos = {};
    names.forEach((n, j) => { pos[n] = { x, y: Math.round(midY + (j - (names.length - 1) / 2) * gap) }; });
    return pos;
  };
  const actorPos = stack(d.humanActors || [], 70, 190);            // human actors: left
  const sysPos = stack(d.systemActors || [], BOX_X + BOX_W + 150, 140); // system rectangles: right

  return `/* Paste into the StarUML console (Debug > Show DevTools > Console) after opening ${d.file}.mdj
   and double-clicking the diagram under the Model node. It draws:
     - a titled system-boundary rectangle "${d.boundaryTitle}" (UMLUseCaseSubject: no folder tab),
     - the use cases inside it (namespace label suppressed -> no "(from ...)" text),
     - the human actor(s) on the left (stick figures),
     - the external system(s) on the right as labelled rectangles (UMLClass),
   then StarUML auto-draws the associations, <<include>> and <<extend>> relationships.
   Fine-tune the layout, then File > Export Diagram As > PNG/JPG into ../img/. */
(function () {
  const BOUNDARY_TITLE = ${JSON.stringify(d.boundaryTitle)};
  const BOX = { x: ${BOX_X}, y: ${BOX_Y}, w: ${BOX_W}, h: ${BOX_H} };
  const UC_POS = ${JSON.stringify(ucPos, null, 2)};
  const ACTOR_POS = ${JSON.stringify(actorPos, null, 2)};
  const SYS_POS = ${JSON.stringify(sysPos, null, 2)};

  const Repo = app.repository, Factory = app.factory, Diagrams = app.diagrams, Engine = app.engine;
  const diagram = (Repo.select("@UMLUseCaseDiagram") || [])[0];
  if (!diagram) { console.error("No use-case diagram found."); return; }
  Diagrams.setCurrentDiagram(diagram);
  const editor = Diagrams.getEditor();
  const model = diagram._parent;
  const byName = (t, n) => (Repo.select(t) || []).find(x => x.name === n);
  const place = (m, x, y, c) => {
    if (!m) return null;
    try { return Factory.createViewAndRelationships(editor, x, y, m, c || undefined); }
    catch (e) { console.warn(e.message); return null; }
  };

  // 1) Titled system boundary — a plain rectangle with the name at the top and NO folder tab.
  //    Created first so it sits behind the use cases. If this StarUML build has no
  //    UMLUseCaseSubject, draw a Rectangle named BOUNDARY_TITLE by hand and send it to back.
  let subjView = null;
  try {
    subjView = Factory.createModelAndView({
      id: "UMLUseCaseSubject", parent: model, diagram: diagram,
      x1: BOX.x, y1: BOX.y, x2: BOX.x + BOX.w, y2: BOX.y + BOX.h,
      modelInitializer: function (m) { m.name = BOUNDARY_TITLE; }
    });
  } catch (e) {
    console.warn("Could not auto-create the boundary (" + e.message + "). Draw a Rectangle named \\"" + BOUNDARY_TITLE + "\\" and send it to back.");
  }
  if (subjView) { const ov = diagram.ownedViews, i = ov.indexOf(subjView); if (i > 0) { ov.splice(i, 1); ov.unshift(subjView); } }

  // 2) Use cases inside the boundary; suppress the namespace label ("(from ...)").
  for (const [n, p] of Object.entries(UC_POS)) {
    const v = place(byName("@UMLUseCase", n), p.x, p.y, subjView);
    if (v) { try { Engine.setProperty(v, "showNamespace", false); } catch (e) {} }
  }

  // 3) Human actors on the left (stick figures).
  for (const [n, p] of Object.entries(ACTOR_POS)) place(byName("@UMLActor", n), p.x, p.y);

  // 4) The non-human System actor as a plain labelled rectangle (UMLClass, compartments hidden).
  //    No stereotype is set, so the box shows only the name "System" (avoids a «system» + System
  //    doubling on the same box).
  for (const [n, p] of Object.entries(SYS_POS)) {
    const v = place(byName("@UMLClass", n), p.x, p.y);
    if (v) {
      try { Engine.setProperty(v, "suppressAttributes", true); } catch (e) {}
      try { Engine.setProperty(v, "suppressOperations", true); } catch (e) {}
    }
  }

  Diagrams.repaint();
  console.log("Placed " + diagram.ownedViews.length + " views. Fine-tune, then File > Export Diagram As > PNG/JPG.");
})();
`;
}

DIAGRAMS.forEach(d => {
  if (d.frozen) { console.log("Skipped " + d.file + " (frozen: hand-maintained in StarUML — not regenerated)"); return; }
  fs.writeFileSync(path.join(__dirname, d.file + ".mdj"), JSON.stringify(buildModel(d), null, 2));
  fs.writeFileSync(path.join(__dirname, d.file + ".populate.js"), buildPopulate(d));
  const nInc = (d.includes || []).length, nExt = (d.extends || []).length;
  const nHuman = (d.humanActors || []).length, nSys = (d.systemActors || []).length;
  console.log("Wrote " + d.file + " — actors:" + nHuman + "human/" + nSys + "system  ucs:" + d.ucs.length + "  includes:" + nInc + "  extends:" + nExt);
});
