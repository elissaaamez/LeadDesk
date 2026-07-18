# -*- coding: utf-8 -*-
# Generate the 3 global data-model diagrams (.drawio) for LeadDesk from ONE shared model.
#   1. class-domain.drawio        Class diagram (UML)  -> entities + value objects + services, full methods
#   2. entity-association.drawio  Entity-association    -> entities + value objects (conceptual, no methods)
#   3. database.drawio            Database (physical)   -> persisted collections + «PK»/«FK», no methods
# All 3 share a central "Database «NeDB store»" mother, plain associations with cardinalities
# (NO arrowheads), STRAIGHT edges, and explicit full-width title|attributes|methods separators.
# Model cross-referenced to server/ (db.js, repositories.js, services/*.js, lib/domain.js, auth.service.js).
# Run:  python make_class_drawio.py     (writes into ../umls/drawio/)
import io, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.join(HERE, "..", "umls", "drawio")

# swimlane WITHOUT stackLayout: children keep fixed positions, so separators never snap/collapse
# when the class is moved or resized. Title separator is an explicit line just below the title.
HEADER = ('swimlane;html=1;fontStyle=1;align=center;verticalAlign=top;horizontal=1;startSize=28;'
          'collapsible=0;marginBottom=0;swimlaneLine=0;fillColor=%s;strokeColor=#004389;'
          'fontColor=#003063;swimlaneFillColor=#FFFFFF;fontSize=13;')
ROW = ('text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;'
       'spacingLeft=8;spacingRight=6;overflow=hidden;rotatable=0;fontSize=11;fontColor=#1A1A1A;'
       'points=[[0,0.5],[1,0.5]];portConstraint=eastwest;')
ROW_SM = ROW.replace('fontSize=11;', 'fontSize=10;')
# full-width compartment separator that matches the class border (so it "goes all the way")
SEP = ('line;html=1;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;'
       'spacingLeft=0;spacingRight=0;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;'
       'strokeColor=#004389;')
# STRAIGHT edge, no arrowhead
EDGE = 'endArrow=none;html=1;strokeColor=#004389;fontColor=#1A1A1A;fontSize=11;rounded=0;'
ELABEL = ('edgeLabel;html=1;align=center;verticalAlign=middle;fontSize=10;fontColor=#1A1A1A;'
          'labelBackgroundColor=#FFFFFF;')

RH, TH, SH = 24, 28, 8

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def A(name, typ, *flags):   # attribute with optional flags: "pk", "unique", ("fk","Target")
    return (name, typ, list(flags))

# ---- shared model -----------------------------------------------------------------------------
# group: entity (persisted), value (value object), service, infra
CLASSES = {
  "Database": {"g": "infra", "st": "NeDB store", "w": 280,
    "attrs": [A("dataDir", "Path"), A("users", "Collection"), A("opportunities", "Collection"),
              A("captures", "Collection"), A("settings", "Collection")],
    "methods": ["+ open(name): Collection", "+ seedIfEmpty(): void", "+ ensureIndex(field): void"]},
  "User": {"g": "entity", "st": "users", "w": 300,
    "attrs": [A("_id","String","pk"), A("name","String"), A("email","String","unique"),
              A("password","String  (scrypt hash)"), A("role","String  {Manager | Sales}"), A("created_at","Date")],
    "methods": ["+ create(): User", "+ findByEmail(email): User", "+ verifyPassword(pwd): Boolean",
                 "+ update(fields): User", "+ delete(): void", "+ all(): User[]"]},
  "Opportunity": {"g": "entity", "st": "opportunities", "w": 330,
    "attrs": [A("_id","String"), A("id","Number","pk","unique"), A("name","String"), A("email_from","String"),
              A("phone","String"), A("type","String  {opportunity}"), A("interest","String"), A("intent","String"),
              A("priority","String  {hot | warm | cold}"), A("create_date","Date"), A("write_date","Date"),
              A("expected_revenue","Number")],
    "methods": ["+ create(data): Opportunity", "+ findById(id): Opportunity", "+ list(filter): Opportunity[]",
                 "+ update(id, patch): Opportunity", "+ delete(id): void", "+ matchDuplicate(email, phone): Opportunity",
                 "+ isInactive(): Boolean"]},
  "Capture": {"g": "entity", "st": "captures", "w": 330,
    "attrs": [A("_id","String","pk"), A("at","Date"), A("by","String",("fk","User.email")), A("message","String"),
              A("extract","JSON"), A("status","String  {created | duplicate}"),
              A("opportunity_id","Number",("fk","Opportunity.id"))],
    "methods": ["+ create(input): Capture", "+ history(): Capture[]", "+ isDuplicate(): Boolean"]},
  "Settings": {"g": "entity", "st": "settings", "w": 300,
    "attrs": [A("_id","String"), A("key","String  {endpoints}","pk"), A("value","JSON")],
    "methods": ["+ get(): Settings", "+ set(value): Settings", "+ endpoint(target): String"]},
  # value objects (produced/held by entities; no persistence, no methods)
  "Session": {"g": "value", "st": "value object", "w": 240,
    "attrs": [A("token","String"), A("email","String"), A("name","String"), A("role","String")], "methods": []},
  "ExtractedFields": {"g": "value", "st": "value object", "w": 300,
    "attrs": [A("name","String"), A("email","String"), A("phone","String"), A("interest","String"),
              A("intent","String"), A("priority","String"), A("recommended_action","String")], "methods": []},
  "KpiSummary": {"g": "value", "st": "value object", "w": 240,
    "attrs": [A("total","Number"), A("withEmail","Number"), A("withPhone","Number"),
              A("inactive","Number"), A("newWeek","Number"), A("active","Number")], "methods": []},
  "FollowUp": {"g": "value", "st": "value object", "w": 260,
    "attrs": [A("name","String"), A("email","String"), A("inactive_days","Number"),
              A("priority","String"), A("message","String")], "methods": []},
}

# associations: (source, target, name, sourceCard, targetCard)
ASSOC = [
  ("Database","User","stores","1","0..*"), ("Database","Opportunity","stores","1","0..*"),
  ("Database","Capture","stores","1","0..*"), ("Database","Settings","stores","1","1"),
  ("User","Capture","creates","1","0..*"), ("Capture","Opportunity","results in","0..*","0..1"),
  ("User","Session","opens","1","0..*"), ("Capture","ExtractedFields","holds","1","1"),
  ("Opportunity","KpiSummary","aggregated into","0..*","1"), ("Opportunity","FollowUp","drafted for","1","0..1"),
]

COL_X = {"infra": 40, "entity": 40, "value": 560}

def render_attr(a, show_keys):
    name, typ, flags = a
    s = "- %s: %s" % (name, typ)
    if show_keys and "pk" in flags: s += "  «PK»"
    if show_keys:
        for f in flags:
            if isinstance(f, tuple) and f[0] == "fk": s += "  «FK» → %s" % f[1]
    if "unique" in flags: s += "  {unique}"
    return s

def box_height(meta, show_methods):
    n = len(meta["attrs"]); m = len(meta["methods"]) if show_methods else 0
    h = TH + SH                      # title + explicit title|attributes separator
    h += n * RH
    if m and n: h += SH              # attributes|methods separator
    h += m * RH
    return h

def build(diagram_name, title, groups, show_methods, show_keys):
    names = [n for n in CLASSES if CLASSES[n]["g"] in groups]
    # column auto-layout (owner fine-tunes placement afterwards)
    coly = {}
    pos = {}
    order = sorted(names, key=lambda n: (list(COL_X).index(CLASSES[n]["g"]),))
    for n in order:
        g = CLASSES[n]["g"]; col = COL_X[g]
        y = coly.get(col, 40)
        pos[n] = (col, y)
        coly[col] = y + box_height(CLASSES[n], show_methods) + 40
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    for n in names:
        meta = CLASSES[n]; x, y = pos[n]; w = meta["w"]
        attrs = [render_attr(a, show_keys) for a in meta["attrs"]]
        methods = list(meta["methods"]) if show_methods else []
        h = box_height(meta, show_methods)
        fill = "#DCE9F6" if meta["g"] == "infra" else ("#EFEFEF" if meta["g"] == "service" else "#EAF2F8")
        cells.append('<mxCell id="%s" value="%s" style="%s" vertex="1" parent="1">'
                     '<mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
                     % (n, esc(n), HEADER % fill, x, y, w, h))
        yoff = TH
        cells.append('<mxCell id="%s_ts" value="" style="%s" vertex="1" parent="%s">'
                     '<mxGeometry y="%d" width="%d" height="%d" as="geometry"/></mxCell>' % (n, SEP, n, yoff, w, SH))
        yoff += SH
        for i, a in enumerate(attrs):
            style = ROW_SM if len(a) > 46 else ROW
            cells.append('<mxCell id="%s_a%d" value="%s" style="%s" vertex="1" parent="%s">'
                         '<mxGeometry y="%d" width="%d" height="%d" as="geometry"/></mxCell>' % (n, i, esc(a), style, n, yoff, w, RH))
            yoff += RH
        if methods and attrs:
            cells.append('<mxCell id="%s_ms" value="" style="%s" vertex="1" parent="%s">'
                         '<mxGeometry y="%d" width="%d" height="%d" as="geometry"/></mxCell>' % (n, SEP, n, yoff, w, SH))
            yoff += SH
        for j, meth in enumerate(methods):
            style = ROW_SM if len(meth) > 46 else ROW
            cells.append('<mxCell id="%s_m%d" value="%s" style="%s" vertex="1" parent="%s">'
                         '<mxGeometry y="%d" width="%d" height="%d" as="geometry"/></mxCell>' % (n, j, esc(meth), style, n, yoff, w, RH))
            yoff += RH
    k = 0
    nameset = set(names)
    for (s, t, name, sc, tc) in ASSOC:
        if s not in nameset or t not in nameset: continue
        eid = "e%d" % k; k += 1
        cells.append('<mxCell id="%s" value="%s" style="%s" edge="1" parent="1" source="%s" target="%s">'
                     '<mxGeometry relative="1" as="geometry"/></mxCell>' % (eid, esc(name), EDGE, s, t))
        cells.append('<mxCell id="%s_s" value="%s" style="%s" connectable="0" vertex="1" parent="%s">'
                     '<mxGeometry x="-0.75" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>' % (eid, esc(sc), ELABEL, eid))
        cells.append('<mxCell id="%s_t" value="%s" style="%s" connectable="0" vertex="1" parent="%s">'
                     '<mxGeometry x="0.75" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>' % (eid, esc(tc), ELABEL, eid))
    xml = ('<mxfile host="app.diagrams.net"><diagram id="%s" name="%s">'
           '<mxGraphModel dx="900" dy="640" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" '
           'arrows="1" fold="1" page="1" pageScale="1" pageWidth="1400" pageHeight="1000" math="0" shadow="0">'
           '<root>%s</root></mxGraphModel></diagram></mxfile>' % (diagram_name, esc(title), "".join(cells)))
    path = os.path.join(OUTDIR, diagram_name + ".drawio")
    io.open(path, "w", encoding="utf-8").write(xml)
    print("WROTE %-26s %d classes, %d bytes" % (diagram_name + ".drawio", len(names), len(xml)))

build("class-domain",       "Class Diagram",              {"infra","entity","value"},            show_methods=True,  show_keys=False)
build("entity-association", "Entity Association Diagram", {"infra","entity","value"},            show_methods=False, show_keys=False)
build("database",           "Database Diagram",            {"infra","entity"},                    show_methods=False, show_keys=True)
