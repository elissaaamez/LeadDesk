/* Paste into the StarUML console (Debug > Show DevTools > Console) after opening uc-sprint1.mdj
   and double-clicking the diagram. It places the actors + use cases; StarUML then draws the
   associations, <<include>> and <<extend>> relationships automatically. Then File > Export > PNG/JPG. */
(function () {
  const SUBJECT = "Platform Foundation";
  const BOX = { x: 240, y: 60, w: 310, h: 565 };
  const UC_POS = {
  "Sign up": {
    "x": 280,
    "y": 120
  },
  "Sign in": {
    "x": 280,
    "y": 215
  },
  "Navigate pages": {
    "x": 280,
    "y": 310
  },
  "Select environment": {
    "x": 280,
    "y": 405
  },
  "Configure endpoints": {
    "x": 280,
    "y": 500
  }
};
  const ACTOR_POS = {
  "User": {
    "x": 60,
    "y": 312.5
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
