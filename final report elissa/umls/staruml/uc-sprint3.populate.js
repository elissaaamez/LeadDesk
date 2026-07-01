/* Paste into the StarUML console (Debug > Show DevTools > Console) after opening uc-sprint3.mdj
   and double-clicking the diagram. It places the actors + use cases; StarUML then draws the
   associations, <<include>> and <<extend>> relationships automatically. Then File > Export > PNG/JPG. */
(function () {
  const SUBJECT = "Analytics and Follow-Up";
  const BOX = { x: 240, y: 60, w: 540, h: 375 };
  const UC_POS = {
  "Authenticate": {
    "x": 280,
    "y": 120
  },
  "View dashboard KPIs": {
    "x": 510,
    "y": 120
  },
  "Generate summary": {
    "x": 280,
    "y": 215
  },
  "View follow-up center": {
    "x": 510,
    "y": 215
  },
  "Detect inactive leads": {
    "x": 280,
    "y": 310
  },
  "Generate follow-up message": {
    "x": 510,
    "y": 310
  }
};
  const ACTOR_POS = {
  "Manager": {
    "x": 60,
    "y": 217.5
  },
  "Sales user": {
    "x": 910,
    "y": 217.5
  }
};
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
