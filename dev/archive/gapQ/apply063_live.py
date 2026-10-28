# apply063.py: a PATCHED COPY of the viewer's render shells module in gapQ/patched/render/ (the repo is not touched): code063.js (with the
# generated data063.js in its //@@DATA063@@ slot) appended, and the four hooks put into stepShells. Prints the copy's path.
import os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render'
DST = os.path.join(HERE, 'patched', 'render')
os.makedirs(DST, exist_ok=True)
LIVE = os.path.join(SRC, 'shells.js')
s = open(LIVE, 'rb').read().decode('utf-8').replace(chr(13) + chr(10), chr(10))
code = open(os.path.join(HERE, 'code063.js'), encoding='utf-8').read()
data = open(os.path.join(HERE, 'data063.js'), encoding='utf-8').read()
assert code.count('//@@DATA063@@') == 1
code = code.replace('//@@DATA063@@', data.rstrip())
HOOKS = [
    # 1. the action dispatch (line 4): the class's own spawner, before the generic arms
    ("  } else if (a && a.code === 'em061'){\n",
     "  } else if (a && a.code === 'em063'){\n    spawn063(state, D, a, ctx, input, out, fresh);           // Brachydios's / Raging's fists, pools and lines\n"
     "  } else if (a && a.code === 'em061'){\n"),
    # 2. the frame handler vt+0x208 and the eruption (both line 4)
    ("  if (D.perFrame007) perFrame007(state, D, ctx, input, out, fresh);",
     "  if (D.perFrame007) perFrame007(state, D, ctx, input, out, fresh);\n"
     "  if (D.perFrame063) perFrame063(state, D, ctx, input, out, fresh);   // Brachydios's / Raging's frame handler 0xf3552c (L2 M22's fists), line 4\n"
     "  if (D.erupt063 && input.erupt063) eruptStep063(state, D, ctx, input, out);   // Raging's eruption 0xf46234 (the fuse's burn-out), line 4"),
    # 3. base35's move
    ("    else if (S.base === 'base25') step25(S, ctx, input, D, out);",
     "    else if (S.base === 'base25') step25(S, ctx, input, D, out);\n    else if (S.base === 'base35') step35(S, ctx, input, D, out);   // Brachydios's slime pools"),
]
for old, new in HOOKS:
    assert s.count(old) == 1, old
    s = s.replace(old, new)
s = s.rstrip() + '\n\n' + code
open(LIVE + '.tmp063', 'w', encoding='utf-8', newline=chr(13) + chr(10)).write(s)
os.replace(LIVE + '.tmp063', LIVE)
print('live', LIVE)
