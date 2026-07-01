/* eslint-disable */
/*
 * StarUML use-case kit generator for the AI CRM Platform (4 sprints + global).
 * Relationships are cross-referenced to the codebase:
 *   - server/middleware.js requireAuth guards every endpoint except signup/login
 *     => every protected use case <<include>> Authenticate (central hub).
 *   - opportunity.service.create() runs matchDuplicate  => Create opportunity <<include>> Check duplicate.
 *   - capture.service: extract -> create               => Submit/Capture <<include>> extract + create.
 *   - analytics.service: summary = KPIs+summary; followups = detect-inactive -> draft.
 *   - assistant.service: list / lookup / update        => <<extend>> Ask the assistant.
 *   - live.service + settings                          => Test connection <<extend>> Configure endpoints.
 *
 * Produces, per diagram:  <name>.mdj  and  <name>.populate.js
 * Run:  node build_kits.cjs
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const id = () => "id-" + crypto.randomBytes(8).toString("hex");

const DIAGRAMS = [
  { file: "uc-sprint1", subject: "Platform Foundation",
    actorsLeft: ["User"], actorsRight: [],
    ucs: ["Sign up", "Sign in", "Navigate pages", "Select environment", "Configure endpoints"],
    assoc: { "User": ["Sign up", "Sign in", "Navigate pages", "Select environment", "Configure endpoints"] },
    includes: [["Navigate pages", "Sign in"], ["Configure endpoints", "Sign in"], ["Select environment", "Sign in"]],
    extends: [] },

  { file: "uc-sprint2", subject: "Lead Capture Module",
    actorsLeft: ["Sales user"], actorsRight: [],
    ucs: ["Authenticate", "Submit customer message", "View extracted fields", "Create opportunity", "Detect duplicate", "View capture history"],
    assoc: { "Sales user": ["Submit customer message", "View capture history"] },
    includes: [["Submit customer message", "Authenticate"], ["View capture history", "Authenticate"],
               ["Submit customer message", "View extracted fields"], ["Submit customer message", "Create opportunity"],
               ["Create opportunity", "Detect duplicate"]],
    extends: [] },

  { file: "uc-sprint3", subject: "Analytics and Follow-Up",
    actorsLeft: ["Manager"], actorsRight: ["Sales user"],
    ucs: ["Authenticate", "View dashboard KPIs", "Generate summary", "View follow-up center", "Detect inactive leads", "Generate follow-up message"],
    assoc: { "Manager": ["View dashboard KPIs"], "Sales user": ["View follow-up center"] },
    includes: [["View dashboard KPIs", "Authenticate"], ["View dashboard KPIs", "Generate summary"],
               ["View follow-up center", "Authenticate"], ["View follow-up center", "Detect inactive leads"],
               ["View follow-up center", "Generate follow-up message"], ["Generate follow-up message", "Detect inactive leads"]],
    extends: [] },

  { file: "uc-sprint4", subject: "Assistant and Live Integration",
    actorsLeft: ["User"], actorsRight: [],
    ucs: ["Authenticate", "Ask the assistant", "List opportunities", "Get an opportunity", "Update an opportunity", "Configure endpoints", "Test connection"],
    assoc: { "User": ["Ask the assistant", "Configure endpoints", "Test connection"] },
    includes: [["Ask the assistant", "Authenticate"], ["Configure endpoints", "Authenticate"], ["Test connection", "Authenticate"]],
    extends: [["List opportunities", "Ask the assistant"], ["Get an opportunity", "Ask the assistant"],
              ["Update an opportunity", "Ask the assistant"], ["Test connection", "Configure endpoints"]] },

  { file: "uc-global", subject: "", noBoundary: true,
    actorsLeft: ["User"], actorsRight: [],
    ucs: ["Authenticate", "Capture lead", "View dashboard", "Generate follow-up", "Ask CRM assistant", "Manage live connection",
          "Check duplicate", "Create opportunity", "Report duplicate", "Generate summary", "Detect inactive leads"],
    assoc: { "User": ["Authenticate", "Capture lead", "View dashboard", "Generate follow-up", "Ask CRM assistant", "Manage live connection"] },
    includes: [["Capture lead", "Authenticate"], ["View dashboard", "Authenticate"], ["Generate follow-up", "Authenticate"],
               ["Ask CRM assistant", "Authenticate"], ["Manage live connection", "Authenticate"],
               ["Capture lead", "Create opportunity"], ["Create opportunity", "Check duplicate"],
               ["View dashboard", "Generate summary"], ["Generate follow-up", "Detect inactive leads"]],
    extends: [["Report duplicate", "Capture lead"]] },
];

function buildModel(d) {
  const projectId = id(), modelId = id(), subsystemId = id(), diagramId = id();
  const byName = {};
  const actors = [...d.actorsLeft, ...d.actorsRight].map(a => {
    const el = { _type: "UMLActor", _id: id(), _parent: { $ref: modelId }, name: a };
    byName[a] = el; return el;
  });
  const ucParent = d.noBoundary ? modelId : subsystemId;
  const ucs = d.ucs.map(u => {
    const el = { _type: "UMLUseCase", _id: id(), _parent: { $ref: ucParent }, name: u };
    byName[u] = el; return el;
  });
  const subsystem = d.noBoundary ? null
    : { _type: "UMLPackage", _id: subsystemId, _parent: { $ref: modelId }, name: d.subject, ownedElements: ucs };

  Object.entries(d.assoc).forEach(([actor, targets]) => targets.forEach(t => {
    const a = byName[actor], uc = byName[t];
    const assocId = id(), e1 = id(), e2 = id();
    (a.ownedElements = a.ownedElements || []).push({
      _type: "UMLAssociation", _id: assocId, _parent: { $ref: a._id },
      end1: { _type: "UMLAssociationEnd", _id: e1, _parent: { $ref: assocId }, reference: { $ref: a._id }, navigable: "unspecified" },
      end2: { _type: "UMLAssociationEnd", _id: e2, _parent: { $ref: assocId }, reference: { $ref: uc._id }, navigable: "unspecified" },
    });
  }));
  (d.includes || []).forEach(([base, sub]) => {
    const b = byName[base], s = byName[sub];
    (b.ownedElements = b.ownedElements || []).push({
      _type: "UMLInclude", _id: id(), _parent: { $ref: b._id }, source: { $ref: b._id }, target: { $ref: s._id },
    });
  });
  (d.extends || []).forEach(([ext, base]) => {
    const e = byName[ext], b = byName[base];
    (e.ownedElements = e.ownedElements || []).push({
      _type: "UMLExtend", _id: id(), _parent: { $ref: e._id }, source: { $ref: e._id }, target: { $ref: b._id },
    });
  });

  const diagram = { _type: "UMLUseCaseDiagram", _id: diagramId, _parent: { $ref: modelId }, name: (d.subject || d.file), defaultDiagram: true, ownedViews: [] };
  const modelChildren = d.noBoundary ? [...actors, ...ucs, diagram] : [...actors, subsystem, diagram];
  return { _type: "Project", _id: projectId, name: "AICRM_" + d.file, ownedElements: [
    { _type: "UMLModel", _id: modelId, _parent: { $ref: projectId }, name: "Model", ownedElements: modelChildren },
  ] };
}

function buildPopulate(d) {
  const ucs = d.ucs;
  const cols = ucs.length > 5 ? 2 : 1;
  const rows = Math.ceil(ucs.length / cols);
  const BOX_X = 240, BOX_Y = 60, COLW = 230, ROWH = 95, PADX = 40, PADY = 60;
  const BOX_W = PADX * 2 + cols * COLW;
  const BOX_H = PADY + rows * ROWH + 30;
  const ucPos = {};
  ucs.forEach((u, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    ucPos[u] = { x: BOX_X + PADX + c * COLW, y: BOX_Y + PADY + r * ROWH };
  });
  const actorPos = {};
  const midY = BOX_Y + BOX_H / 2;
  d.actorsLeft.forEach((a, j) => { actorPos[a] = { x: 60, y: midY - 30 + (j - (d.actorsLeft.length - 1) / 2) * 180 }; });
  d.actorsRight.forEach((a, j) => { actorPos[a] = { x: BOX_X + BOX_W + 130, y: midY - 30 + (j - (d.actorsRight.length - 1) / 2) * 180 }; });
  return `/* Paste into the StarUML console (Debug > Show DevTools > Console) after opening ${d.file}.mdj
   and double-clicking the diagram. It places the actors + use cases; StarUML then draws the
   associations, <<include>> and <<extend>> relationships automatically. Then File > Export > PNG/JPG. */
(function () {
  const SUBJECT = ${JSON.stringify(d.subject)};
  const BOX = { x: ${BOX_X}, y: ${BOX_Y}, w: ${BOX_W}, h: ${BOX_H} };
  const UC_POS = ${JSON.stringify(ucPos, null, 2)};
  const ACTOR_POS = ${JSON.stringify(actorPos, null, 2)};
  const Repo = app.repository, Factory = app.factory, Diagrams = app.diagrams;
  const diagram = (Repo.select("@UMLUseCaseDiagram") || [])[0];
  if (!diagram) { console.error("No use-case diagram"); return; }
  Diagrams.setCurrentDiagram(diagram);
  const editor = Diagrams.getEditor();
  const byName = (t, n) => (Repo.select(t) || []).find(x => x.name === n);
  const place = (m, x, y, c) => { try { return Factory.createViewAndRelationships(editor, x, y, m, c || undefined); } catch (e) { console.warn(e.message); return null; } };
  const sub = byName("@UMLPackage", SUBJECT);
  let box = sub ? place(sub, BOX.x, BOX.y) : null;
  if (box) { box.left = BOX.x; box.top = BOX.y; box.width = BOX.w; box.height = BOX.h; }
  for (const [n, p] of Object.entries(ACTOR_POS)) place(byName("@UMLActor", n), p.x, p.y);
  for (const [n, p] of Object.entries(UC_POS)) place(byName("@UMLUseCase", n), p.x, p.y, box);
  Diagrams.repaint();
  console.log("Placed " + diagram.ownedViews.length + " views. Fine-tune, then File > Export Diagram As > PNG/JPG.");
})();
`;
}

DIAGRAMS.forEach(d => {
  fs.writeFileSync(path.join(__dirname, d.file + ".mdj"), JSON.stringify(buildModel(d), null, 2));
  fs.writeFileSync(path.join(__dirname, d.file + ".populate.js"), buildPopulate(d));
  const nInc = (d.includes || []).length, nExt = (d.extends || []).length;
  console.log("Wrote " + d.file + " (.mdj + .populate.js) — includes:" + nInc + " extends:" + nExt);
});
