# -*- coding: utf-8 -*-
# Remove "AI CRM Platform" and the "(from ...)" namespace labels from the SAVED StarUML
# use-case .mdj files, in place, without touching the diagram layout.
import json, glob, io, re, os

DIR = r"C:\Users\eliss\Desktop\pfe\final report elissa\umls\staruml"
NSLABEL = re.compile(r"^\(from .*\)$")

stats = {"showNamespace_off": 0, "aicrm_blanked": 0, "nslabel_blanked": 0}

def clean(obj):
    if isinstance(obj, dict):
        for k, v in list(obj.items()):
            if k == "showNamespace" and v is True:
                obj[k] = False; stats["showNamespace_off"] += 1
            elif isinstance(v, str):
                if v == "AI CRM Platform":
                    obj[k] = ""; stats["aicrm_blanked"] += 1
                elif NSLABEL.match(v.strip()):
                    obj[k] = ""; stats["nslabel_blanked"] += 1
            else:
                clean(v)
    elif isinstance(obj, list):
        for it in obj:
            clean(it)

for f in sorted(glob.glob(os.path.join(DIR, "uc-*.mdj"))):
    data = json.load(io.open(f, encoding="utf-8"))
    clean(data)
    with io.open(f, "w", encoding="utf-8") as out:
        json.dump(data, out, indent=2, ensure_ascii=False)
    print("cleaned", os.path.basename(f))
print("stats:", stats)
