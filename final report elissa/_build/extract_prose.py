# -*- coding: utf-8 -*-
import re, io
txt = io.open(r'C:\Users\eliss\Desktop\pfe-rapport\main.tex', encoding='utf-8').read()
txt = txt[txt.index(r'\begin{document}'):]
txt = re.sub(r'(?m)^\s*%.*$', '', txt)
for env in ['figure', 'tikzpicture', 'table', 'tabular', 'tabularx', 'longtable', 'lstlisting', 'center']:
    txt = re.sub(r'\\begin\{' + env + r'\*?\}.*?\\end\{' + env + r'\*?\}', ' ', txt, flags=re.S)
txt = re.sub(r'\\href\{[^}]*\}\{([^}]*)\}', r'\1', txt)
txt = re.sub(r'\\(textbf|textit|emph|texttt|underline)\{([^}]*)\}', r'\2', txt)
txt = re.sub(r'\\url\{[^}]*\}', ' ', txt)
txt = re.sub(r'\\(chapter\*?|section\*?|subsection\*?|subsubsection\*?|paragraph)\{([^}]*)\}', r'\2. ', txt)
txt = re.sub(r'\\(label|ref|cite|caption|includegraphics|item|addcontentsline|markboth|screenshot)(\[[^\]]*\])?(\{[^}]*\})*', ' ', txt)
txt = re.sub(r'\\[a-zA-Z]+\*?(\[[^\]]*\])?', ' ', txt)
txt = txt.replace('{', ' ').replace('}', ' ').replace('~', ' ')
txt = txt.replace('\\\\', ' ').replace('\\', ' ')
txt = re.sub(r'[ \t]+', ' ', txt)
txt = re.sub(r'\n\s*\n+', '\n\n', txt)
out = txt.strip()
io.open(r'C:\Users\eliss\Desktop\pfe\_refwork\prose.txt', 'w', encoding='utf-8').write(out)
print('prose words:', len(out.split()))
print('--- preview ---')
print(out[:600])
