# -*- coding: utf-8 -*-
import fitz, sys, os
pdf = r"C:\Users\eliss\Desktop\pfe\final report elissa\main.pdf"
outdir = r"C:\Users\eliss\Desktop\pfe\_refwork\out"
os.makedirs(outdir, exist_ok=True)
doc = fitz.open(pdf)
print("PAGES:", doc.page_count)
pages = [int(x) for x in sys.argv[1:]] if len(sys.argv) > 1 else list(range(1, doc.page_count+1))
for p in pages:
    if 1 <= p <= doc.page_count:
        pix = doc[p-1].get_pixmap(matrix=fitz.Matrix(110/72, 110/72))
        pix.save(os.path.join(outdir, "o%03d.png" % p))
        print("rendered", p)
