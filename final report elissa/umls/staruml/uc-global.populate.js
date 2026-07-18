/* Paste into the StarUML console (Debug > Show DevTools > Console) after opening uc-global.mdj
   and double-clicking the diagram under the Model node. It draws:
     - a titled system-boundary rectangle "LeadDesk" (UMLUseCaseSubject: no folder tab),
     - the use cases inside it (namespace label suppressed -> no "(from ...)" text),
     - the human actor(s) on the left (stick figures),
     - the external system(s) on the right as labelled rectangles (UMLClass),
   then StarUML auto-draws the associations, <<include>> and <<extend>> relationships.
   Fine-tune the layout, then File > Export Diagram As > PNG/JPG into ../img/. */
(function () {
  const BOUNDARY_TITLE = "LeadDesk";
  const BOX = { x: 260, y: 70, w: 590, h: 855 };
  const UC_POS = {
  "Authenticate": {
    "x": 305,
    "y": 135
  },
  "Sign up": {
    "x": 555,
    "y": 135
  },
  "Sign in": {
    "x": 305,
    "y": 230
  },
  "Capture lead": {
    "x": 555,
    "y": 230
  },
  "Create opportunity": {
    "x": 305,
    "y": 325
  },
  "Detect duplicate": {
    "x": 555,
    "y": 325
  },
  "List opportunities": {
    "x": 305,
    "y": 420
  },
  "View opportunity": {
    "x": 555,
    "y": 420
  },
  "Update opportunity": {
    "x": 305,
    "y": 515
  },
  "View dashboard": {
    "x": 555,
    "y": 515
  },
  "Run smart follow-ups": {
    "x": 305,
    "y": 610
  },
  "Detect inactive leads": {
    "x": 555,
    "y": 610
  },
  "Generate follow-up message": {
    "x": 305,
    "y": 705
  },
  "Ask CRM assistant": {
    "x": 555,
    "y": 705
  },
  "Manage live connection": {
    "x": 305,
    "y": 800
  }
};
  const ACTOR_POS = {
  "Manager": {
    "x": 70,
    "y": 403
  },
  "Sales operator": {
    "x": 70,
    "y": 593
  }
};
  const SYS_POS = {
  "System": {
    "x": 1000,
    "y": 498
  }
};

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
    console.warn("Could not auto-create the boundary (" + e.message + "). Draw a Rectangle named \"" + BOUNDARY_TITLE + "\" and send it to back.");
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
