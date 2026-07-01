# -*- coding: utf-8 -*-
import re, io

import os
SRC = r"C:\Users\eliss\Desktop\pfe-rapport\main.tex"
PRE = r"C:\Users\eliss\Desktop\pfe\final report elissa\_build\new_preamble.tex"
OUT = r"C:\Users\eliss\Desktop\pfe\final report elissa\main.tex"
IMGDIR = r"C:\Users\eliss\Desktop\pfe\final report elissa\umls\img"

with io.open(SRC, encoding="utf-8") as f:
    txt = f.read()
with io.open(PRE, encoding="utf-8") as f:
    preamble = f.read()

idx = txt.index(r"\begin{document}")
body = txt[idx:]

# 2) remove the two manual "Summary" mini-toc blocks
body = re.sub(
    r"\\begin\{center\}\s*\\vspace\*\{0\.5cm\}\s*\{\\Large\\bfseries Summary\}\s*\\end\{center\}\s*"
    r"\\vspace\{0\.3cm\}\s*\\begin\{tabularx\}\{\\textwidth\}\{Xr\}.*?\\end\{tabularx\}\s*\\vspace\{0\.8cm\}",
    "", body, flags=re.S)

# 3) screenshots .jpg -> .png
body = re.sub(r"(\\screenshot\{[^}]*?)\.jpg\}", r"\1.png}", body)

# 3b) UC diagrams must not carry the "AI CRM Platform" system-boundary label (interim TikZ fallback)
body = body.replace(r"(ttl) {AI CRM Platform}", r"(ttl) {Platform Foundation}")

# 4) front matter: force each cover-list / starred chapter onto its own page (mirror reference)
for h in [r"\chapter*{Acknowledgements}", r"\chapter*{Abstract}",
          r"\chapter*{List of Abbreviations}", r"\chapter*{General Conclusion}"]:
    body = body.replace(h, r"\clearpage" + "\n" + h, 1)
body = body.replace(r"\tableofcontents", r"\clearpage" + "\n" + r"\tableofcontents", 1)
body = body.replace(r"\listoffigures", r"\clearpage" + "\n" + r"\listoffigures", 1)
body = body.replace(r"\listoftables", r"\clearpage" + "\n" + r"\listoftables", 1)

# 5) replace the 6 missing raster figures with self-contained TikZ
SCRUM = r"""\resizebox{0.96\textwidth}{!}{%
\begin{tikzpicture}[node distance=9mm, >={Latex[length=2.4mm]},
  sb/.style={draw=IITBlue, fill=SoftBlue, rounded corners, align=center, font=\footnotesize, minimum height=1.05cm, text width=2.3cm},
  sprint/.style={draw=Accent, fill=SoftGray, rounded corners, align=center, font=\footnotesize, minimum height=1.7cm, text width=2.7cm},
  ev/.style={draw=gray!60, fill=white, rounded corners, align=center, font=\scriptsize, minimum height=0.85cm, text width=2.4cm}]
\node[sb] (pb) {Product\\Backlog};
\node[sb, right=of pb] (plan) {Sprint\\Planning};
\node[sb, right=of plan] (sbk) {Sprint\\Backlog};
\node[sprint, right=of sbk] (sp) {Sprint\\(2--4 weeks)\\Daily Scrum};
\node[sb, right=of sp] (inc) {Product\\Increment};
\node[ev, below=12mm of sp] (rev) {Sprint Review\\and Retrospective};
\draw[wfarr] (pb) -- (plan);
\draw[wfarr] (plan) -- (sbk);
\draw[wfarr] (sbk) -- (sp);
\draw[wfarr] (sp) -- (inc);
\draw[wfarr] (inc) |- (rev);
\draw[wfarr] (rev) -| (pb);
\end{tikzpicture}%
}"""

def wf(nodes):
    out = [r"\resizebox{\textwidth}{!}{%",
           r"\begin{tikzpicture}[start chain=going right, node distance=6mm, >={Latex[length=2.2mm]}, every join/.style={wfarr}]"]
    for i, n in enumerate(nodes):
        join = "" if i == 0 else ", join"
        out.append(r"\node[wfnode, on chain%s] {%s};" % (join, n))
    out.append(r"\end{tikzpicture}%")
    out.append("}")
    return "\n".join(out)

WF_LEAD = wf([r"Webhook", r"Basic LLM\\Chain", r"Set", r"Code\\(JavaScript)",
              r"Get items\\(Odoo)", r"Check\\Duplicate", r"If: new\\or duplicate",
              r"Create item\\(Odoo)", r"Respond to\\Webhook"])
WF_ANALYTICS = wf([r"Webhook", r"Get items\\(Odoo)", r"Calculate\\CRM KPIs",
                   r"Prepare\\Summary Prompt", r"Basic LLM Chain\\(Ollama)", r"Respond to\\Webhook"])
WF_FOLLOWUP = wf([r"Webhook", r"Get items\\(Odoo)", r"Detect\\Inactive Leads",
                  r"Prepare\\Follow-Up Prompt", r"Basic LLM Chain\\(Ollama)", r"Format\\Result",
                  r"Update item\\(Odoo)", r"Respond to\\Webhook"])
WF_ASSISTANT = wf([r"Webhook", r"AI Agent", r"Groq\\Chat Model", r"CRM Tools\\(list/get/create/update)",
                   r"Odoo\\CRM", r"Prepare\\Message", r"Respond to\\Webhook"])
WF_LIST = wf([r"Webhook", r"Ping Guard\\(/ Respond Pong)", r"Get items\\(Odoo)",
              r"Shape\\Leads", r"Respond to\\Webhook"])

fig_map = {
    "images/scrum-framework.png": SCRUM,
    "images/lead-capture-workflow.png": WF_LEAD,
    "images/crm-analytics-workflow.png": WF_ANALYTICS,
    "images/smart-followup-workflow.png": WF_FOLLOWUP,
    "images/ai-assistant-workflow.png": WF_ASSISTANT,
    "images/crm-list-leads-workflow.png": WF_LIST,
}
for fname, tikz in fig_map.items():
    pat = r"\\includegraphics(?:\[[^\]]*\])?\{" + re.escape(fname) + r"\}"
    body, nsub = re.subn(pat, lambda m, t=tikz: t, body)
    assert nsub == 1, "figure replace failed for %s (got %d)" % (fname, nsub)

# 6) remove NeDB logo figure + lead-in sentence
body = re.sub(
    r"\nThe figure below shows its official logo\.\s*\n\s*\\begin\{figure\}\[H\]\s*\\centering\s*"
    r"\\includegraphics(?:\[[^\]]*\])?\{images/nedb\.png\}\s*\\caption\{[^}]*\}\s*(?:\\label\{[^}]*\}\s*)?\\end\{figure\}",
    "", body, flags=re.S)

# 6b) wire tool-rendered diagrams in place of TikZ (PlantUML seq now; StarUML UC + draw.io class when exported)
def find_img(basenames):
    for b in basenames:
        if os.path.isfile(os.path.join(IMGDIR, b)):
            return "umls/img/" + b
    return None

def wire_figure(body, caption, relpath, opts):
    pat = re.compile(
        r"(\\begin\{figure\}\[H\]\s*\\centering\s*)"
        r"((?:(?!\\end\{figure\}).)*?)"
        r"(\\caption\{" + re.escape(caption) + r"\})", re.S)
    inc = r"\includegraphics[" + opts + r"]{" + relpath + r"}"
    def repl(m):  # function repl avoids re backslash-escape processing of \textwidth etc.
        return m.group(1) + inc + "\n" + m.group(3)
    return pat.subn(repl, body)

SEQ_OPTS = r"width=0.92\textwidth,height=0.62\textheight,keepaspectratio"
UC_OPTS = r"width=0.95\textwidth,height=0.75\textheight,keepaspectratio"
CLASS_OPTS = r"width=0.95\textwidth,height=0.6\textheight,keepaspectratio"
UC_GLOBAL_OPTS = r"width=\textwidth,height=0.9\textheight,keepaspectratio"

seq_map = [
    ("Sequence diagram of the sign-in workflow", ["seq-signin.png"]),
    ("Sequence diagram of the lead capture and duplicate detection workflow", ["seq-lead-capture.png"]),
    ("Sequence diagram of the CRM analytics summary workflow", ["seq-analytics.png"]),
    ("Sequence diagram of the smart follow-up workflow", ["seq-followup.png"]),
    ("Sequence diagram of the AI assistant workflow", ["seq-assistant.png"]),
]
uc_map = [
    ("Use case diagram of the platform foundation", ["uc-sprint1.png", "uc-sprint1.jpg", "uc-sprint1_staruml.jpg"]),
    ("Use case diagram of the lead capture module", ["uc-sprint2.png", "uc-sprint2.jpg", "uc-sprint2_staruml.jpg"]),
    ("Use case diagram of the analytics and follow-up module", ["uc-sprint3.png", "uc-sprint3.jpg", "uc-sprint3_staruml.jpg"]),
    ("Use case diagram of the assistant and live integration module", ["uc-sprint4.png", "uc-sprint4.jpg", "uc-sprint4_staruml.jpg"]),
]
class_map = [
    ("Local data model used by NeDB (each collection is stored as a separate NeDB file)",
     ["class-domain.png", "class-domain.jpg", "class-domain_drawio.png"]),
]
wired = {"seq": 0, "uc": 0, "class": 0}
for cap, names in seq_map:
    rel = find_img(names)
    if rel:
        body, n = wire_figure(body, cap, rel, SEQ_OPTS); wired["seq"] += n
for cap, names in uc_map:
    rel = find_img(names)
    if rel:
        body, n = wire_figure(body, cap, rel, UC_OPTS); wired["uc"] += n
for cap, names in class_map:
    rel = find_img(names)
    if rel:
        body, n = wire_figure(body, cap, rel, CLASS_OPTS); wired["class"] += n

# 6c) insert NEW figures that have no place in the original content: Gantt, WBS, global use case
def figblock(lead, rel, opts, caption, label):
    return ("\n\n" + lead + "\n"
            r"\begin{figure}[H]" + "\n" + r"\centering" + "\n"
            r"\includegraphics[" + opts + "]{" + rel + "}\n"
            r"\caption{" + caption + "}" + "\n" + r"\label{" + label + "}" + "\n"
            r"\end{figure}" + "\n")

planning = ""
if find_img(["gantt-project.png"]):
    planning += figblock("The Gantt chart below shows the planned schedule of the project across the sprints.",
                         "umls/img/gantt-project.png", r"width=\textwidth,height=0.5\textheight,keepaspectratio",
                         "Project schedule (Gantt chart)", "fig:gantt")
if find_img(["wbs-project.png"]):
    planning += figblock("The work breakdown structure below decomposes the project into its main work packages.",
                         "umls/img/wbs-project.png", r"width=\textwidth,height=0.55\textheight,keepaspectratio",
                         "Work breakdown structure of the project", "fig:wbs")
if planning:
    anc = r"\caption{Agile decomposition of the project into functional sprints}" + "\n" + r"\end{table}"
    assert anc in body, "planning anchor not found"
    body = body.replace(anc, anc + planning, 1)

if find_img(["uc-global.png", "uc-global.jpg", "uc-global_staruml.jpg"]):
    rel = find_img(["uc-global.png", "uc-global.jpg", "uc-global_staruml.jpg"])
    gu = ("\n\n" + r"\clearpage" + "\n"
          "The figure below presents the global use case diagram.\n"
          r"\begin{figure}[H]" + "\n" + r"\centering" + "\n"
          r"\includegraphics[" + UC_GLOBAL_OPTS + "]{" + rel + "}\n"
          r"\caption{Global use case diagram}" + "\n" + r"\label{fig:uc-global}" + "\n" + r"\end{figure}" + "\n")
    anc2 = "allows the platform to communicate with n8n workflows and Odoo CRM." + "\n" + r"\end{itemize}"
    assert anc2 in body, "global-uc anchor not found"
    body = body.replace(anc2, anc2 + gu, 1)

# 7) table styling: gray header + full grid (robust balanced-brace parser)
def match_brace(s, j):
    depth = 0
    for k in range(j, len(s)):
        if s[k] == '{':
            depth += 1
        elif s[k] == '}':
            depth -= 1
            if depth == 0:
                return k
    return -1

def read_group(s, j):
    # s[j] must be '{'; return (inner, index_after_close)
    k = match_brace(s, j)
    if k == -1:
        return "", j + 1
    return s[j+1:k], k + 1

def read_col(spec, i):
    c = spec[i]
    if c in 'pmb':
        j = i + 1
        if j < len(spec) and spec[j] == '{':
            k = match_brace(spec, j)
            if k != -1:
                return spec[i:k+1], k + 1
    return c, i + 1

def add_bars(spec):
    tokens = []
    i, n = 0, len(spec)
    while i < n:
        c = spec[i]
        if c.isspace() or c == '|':
            i += 1
            continue
        if c in '>!@<':
            j = i + 1
            if j < n and spec[j] == '{':
                k = match_brace(spec, j)
                if k == -1:
                    i += 1
                    continue
                prefix = spec[i:k+1]
                i = k + 1
                while i < n and spec[i].isspace():
                    i += 1
                if i >= n:
                    tokens.append(prefix)
                    break
                col, i = read_col(spec, i)
                tokens.append(prefix + col)
                continue
            i += 1
            continue
        col, i = read_col(spec, i)
        tokens.append(col)
    return '|' + '|'.join(tokens) + '|'

def style_table_content(content):
    content = content.replace(r"\toprule", r"\hline\rowcolor{TabHead}")
    content = content.replace(r"\midrule", r"\hline")
    content = content.replace(r"\bottomrule", r"\hline")
    content = re.sub(r"\\\\(\s*\n)", r"\\\\\1\\hline\n", content)
    content = re.sub(r"(\\hline\s*){2,}", r"\\hline\n", content)
    return content

def transform_tables(body):
    out = []
    i = 0
    begin_re = re.compile(r"\\begin\{(tabularx|longtable|tabular)\}")
    while True:
        m = begin_re.search(body, i)
        if not m:
            out.append(body[i:])
            break
        out.append(body[i:m.start()])
        env = m.group(1)
        j = m.end()
        while j < len(body) and body[j] in " \n\t":
            j += 1
        if env == "tabularx":
            width, j = read_group(body, j)
            while j < len(body) and body[j] in " \n\t":
                j += 1
            spec, j = read_group(body, j)
            header = r"\begin{tabularx}{%s}{%s}" % (width, add_bars(spec))
        else:
            spec, j = read_group(body, j)
            header = r"\begin{%s}{%s}" % (env, add_bars(spec))
        em = re.compile(r"\\end\{%s\}" % env).search(body, j)
        content = body[j:em.start()]
        out.append(header + style_table_content(content) + (r"\end{%s}" % env))
        i = em.end()
    return "".join(out)

body = transform_tables(body)

# 8) per-chapter Summary (manual, robust) for the main numbered chapters (before \appendix)
appendix_pos = body.find(r"\appendix")
main_part = body if appendix_pos == -1 else body[:appendix_pos]
tail_part = "" if appendix_pos == -1 else body[appendix_pos:]

tok_re = re.compile(r"\\(chapter|section|subsection)\{([^}]*)\}")
toks = list(tok_re.finditer(main_part))
entries = {}      # ci -> list of (numstr, title, label, depth)
chap_end = {}     # ci -> position right after \chapter{...}
label_inserts = []
ci = si = ssi = 0
for m in toks:
    kind, title = m.group(1), m.group(2)
    if kind == "chapter":
        ci += 1; si = 0; ssi = 0
        entries[ci] = []
        chap_end[ci] = m.end()
    elif kind == "section":
        si += 1; ssi = 0
        lbl = "sumlbl:c%ds%d" % (ci, si)
        entries[ci].append(("%d.%d" % (ci, si), title, lbl, 1))
        label_inserts.append((m.end(), r"\label{%s}" % lbl))
    elif kind == "subsection":
        ssi += 1
        lbl = "sumlbl:c%ds%dss%d" % (ci, si, ssi)
        entries[ci].append(("%d.%d.%d" % (ci, si, ssi), title, lbl, 2))
        label_inserts.append((m.end(), r"\label{%s}" % lbl))

def build_summary(items):
    out = ["\n", r"\vspace{0.35cm}", r"{\Large\bfseries Summary}\par",
           r"\vspace{3pt}{\color{black}\hrule height 0.6pt}\vspace{0.30cm}", r"{\small"]
    for num, title, lbl, depth in items:
        cmd = r"\chsummaryitem" if depth == 1 else r"\chsummarysub"
        out.append("%s{%s}{%s}{%s}" % (cmd, num, title, lbl))
    out.append(r"}")
    out.append(r"\clearpage")
    out.append("")
    return "\n".join(out)

all_inserts = list(label_inserts)
for cidx, pos in chap_end.items():
    if entries[cidx]:
        all_inserts.append((pos, build_summary(entries[cidx])))
for pos, text in sorted(all_inserts, key=lambda x: x[0], reverse=True):
    main_part = main_part[:pos] + text + main_part[pos:]

body = main_part + tail_part
n_summaries = sum(1 for c in entries if entries[c])

newdoc = preamble + "\n\n" + body
with io.open(OUT, "w", encoding="utf-8") as f:
    f.write(newdoc)

print("WROTE", OUT)
print("len", len(newdoc))
print("chapter summaries:", n_summaries)
print("tabularx:", newdoc.count(r"\begin{tabularx}"))
print("rowcolor:", newdoc.count(r"\rowcolor{TabHead}"))
print("nedb remaining:", newdoc.count("nedb.png"))
print("workflow png remaining:", newdoc.count("-workflow.png"))
print("scrum png remaining:", newdoc.count("scrum-framework.png"))
print("screenshot jpg remaining:", len(re.findall(r"\\screenshot\{[^}]*\.jpg\}", newdoc)))
