# -*- coding: utf-8 -*-
# Generate a UML class diagram (.drawio) for the AI CRM Platform domain model.
import io

OUT = r"C:\Users\eliss\Desktop\pfe\final report elissa\umls\drawio\class-domain.drawio"

HEADER = ('class;html=1;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;'
          'horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;'
          'collapsible=0;marginBottom=0;fillColor=#EAF2F8;strokeColor=#004389;fontColor=#003063;'
          'swimlaneFillColor=#FFFFFF;fontSize=13;')
ROW = ('text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;'
       'spacingLeft=8;spacingRight=6;overflow=hidden;rotatable=0;fontSize=11;fontColor=#1A1A1A;'
       'points=[[0,0.5],[1,0.5]];portConstraint=eastwest;')
LINE = ('line;html=1;strokeWidth=1;fillColor=none;align=left;verticalAlign=middle;spacingTop=-1;'
        'spacingLeft=0;spacingRight=0;rotatable=0;labelPosition=right;points=[];portConstraint=eastwest;'
        'strokeColor=#9AA7B4;')

classes = [
    {"id": "User", "x": 40, "y": 40, "w": 250,
     "attrs": ["- _id: String", "- email: String", "- passwordHash: String", "- role: String"],
     "methods": ["+ authenticate(password): Session"]},
    {"id": "Opportunity", "x": 360, "y": 40, "w": 270,
     "attrs": ["- _id: String", "- name: String", "- email: String", "- phone: String",
               "- priority: String", "- lastUpdate: Date"],
     "methods": ["+ isInactive(days): Boolean"]},
    {"id": "Settings", "x": 40, "y": 320, "w": 250,
     "attrs": ["- _id: String", "- leadCaptureUrl: String", "- summaryUrl: String",
               "- assistantUrl: String", "- environment: String"],
     "methods": []},
    {"id": "Capture", "x": 360, "y": 320, "w": 270,
     "attrs": ["- _id: String", "- message: String", "- extractedFields: JSON", "- status: String",
               "- opportunityId: String", "- createdAt: Date"],
     "methods": ["+ extract(): Fields"]},
]

RH = 24  # row height
TH = 28  # title height
LH = 8   # separator line height

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
for c in classes:
    h = TH + len(c["attrs"]) * RH + (LH + len(c["methods"]) * RH if c["methods"] else 0)
    cid = c["id"]
    cells.append(
        '<mxCell id="%s" value="%s" style="%s" vertex="1" parent="1">'
        '<mxGeometry x="%d" y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
        % (cid, esc(cid), HEADER, c["x"], c["y"], c["w"], h))
    yoff = TH
    n = 0
    for a in c["attrs"]:
        cells.append(
            '<mxCell id="%s_a%d" value="%s" style="%s" vertex="1" parent="%s">'
            '<mxGeometry y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
            % (cid, n, esc(a), ROW, cid, yoff, c["w"], RH))
        yoff += RH; n += 1
    if c["methods"]:
        cells.append(
            '<mxCell id="%s_line" value="" style="%s" vertex="1" parent="%s">'
            '<mxGeometry y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
            % (cid, LINE, cid, yoff, c["w"], LH))
        yoff += LH
        m = 0
        for meth in c["methods"]:
            cells.append(
                '<mxCell id="%s_m%d" value="%s" style="%s" vertex="1" parent="%s">'
                '<mxGeometry y="%d" width="%d" height="%d" as="geometry"/></mxCell>'
                % (cid, m, esc(meth), ROW, cid, yoff, c["w"], RH))
            yoff += RH; m += 1

# association: Capture --> Opportunity (0..1), "produces"
EDGE = ('endArrow=open;endFill=0;html=1;strokeColor=#004389;fontColor=#1A1A1A;fontSize=11;'
        'edgeStyle=orthogonalEdgeStyle;rounded=0;')
cells.append(
    '<mxCell id="e1" value="produces" style="%s" edge="1" parent="1" source="Capture" target="Opportunity">'
    '<mxGeometry relative="1" as="geometry"/></mxCell>' % EDGE)
cells.append(
    '<mxCell id="e1m" value="0..1" style="edgeLabel;html=1;align=center;verticalAlign=middle;'
    'fontSize=10;fontColor=#1A1A1A;" connectable="0" vertex="1" parent="e1">'
    '<mxGeometry x="0.7" relative="1" as="geometry"><mxPoint as="offset"/></mxGeometry></mxCell>')

xml = (
    '<mxfile host="app.diagrams.net">'
    '<diagram id="domain" name="Class Diagram">'
    '<mxGraphModel dx="900" dy="640" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" '
    'arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="600" math="0" shadow="0">'
    '<root>' + "".join(cells) + '</root></mxGraphModel></diagram></mxfile>')

io.open(OUT, "w", encoding="utf-8").write(xml)
print("WROTE", OUT, len(xml), "bytes")
