# -*- coding: utf-8 -*-
# Restyle the sequence .puml files to a standard black-and-white UML look.
import re, io, glob, os

PUMLDIR = r"C:\Users\eliss\Desktop\pfe\final report elissa\umls\puml"

NEW_SEQ = """skinparam sequence {
  ArrowColor #000000
  ArrowFontColor #000000
  LifeLineBorderColor #333333
  LifeLineBackgroundColor #FFFFFF
  ParticipantBackgroundColor #FFFFFF
  ParticipantFontColor #000000
  ParticipantBorderColor #333333
  ActorBackgroundColor #FFFFFF
  ActorBorderColor #333333
  DatabaseBackgroundColor #FFFFFF
  DatabaseBorderColor #333333
}"""

for f in sorted(glob.glob(os.path.join(PUMLDIR, "seq-*.puml"))):
    s = io.open(f, encoding="utf-8").read()
    s = s.replace("skinparam roundcorner 6\n", "")
    s = re.sub(r"skinparam sequence \{[^}]*\}", NEW_SEQ, s, flags=re.S)
    io.open(f, "w", encoding="utf-8").write(s)
    print("restyled", os.path.basename(f))
