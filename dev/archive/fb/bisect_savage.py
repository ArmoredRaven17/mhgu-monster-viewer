# undo one of this session's shells.js changes in the temp copy, run Savage's snapshot
import sys, subprocess
T = r'C:\Users\humph\AppData\Local\Temp\tmp.0MCO0sdIbr'
src = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js', encoding='utf8', newline='').read()
undo = {
  'joint80': ("      if ((k.flags & 0x80) && got.size){\r\n        const sz = Array.isArray(got.size) ? size001(got) : f(got.size), [x, y, z] = k.vec;", "      if (false){\r\n        const sz = Array.isArray(got.size) ? size001(got) : f(got.size), [x, y, z] = k.vec;"),
  'req80': ("if (k.flags & 0x80){ const sz = got.size == null ? 1 : Array.isArray(got.size) ? size001(got) : f(got.size); o = o.map(x => f(x * sz)); }", "if (k.flags & 0x80){ const sz = got.size == null ? 1 : f(got.size); o = o.map(x => f(x * sz)); }"),
}
for name in [None] + list(undo):
    s = src
    if name:
        a, b = undo[name]
        assert s.count(a) == 1, (name, s.count(a))
        s = s.replace(a, b)
    open(T + r'\docs\render\shells.js', 'w', encoding='utf8', newline='').write(s)
    r = subprocess.run(['node', 'dev/shells-savage-snapshot.mjs'], cwd=T, capture_output=True, text=True)
    print(name, r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr[-300:])
