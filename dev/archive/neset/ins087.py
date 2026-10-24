# ins087.py (2026-10-19): Ahtal-Neset's shells, step 1 -- sp_01 (0x177): the (7, 4) maker and the event type 10 rows; the delay chain
import subprocess, sys, json, collections, re
BS = chr(92)
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
js = open(SP + r'\neset\neset.js', encoding='utf8').read()
out = subprocess.check_output([sys.executable, 'gen071.py', 'em087_00'], text=True, cwd=SP + r'\fb')
B = {b[:2]: b[3:].rstrip('\n') for b in out.split('MODES ')[1:]}
def MB(k):
    L = B[k].split('\n'); return '\n'.join(L[:-1]), L[-1].split('hitdata: ')[1].rstrip(' },')
m01, hd01 = MB('01'); m58, hd58 = MB('58'); m48, hd48 = MB('48')
R = json.load(open(SP + r'\neset\rows087.json'))['rows']
TYPES = (9, 10, 11)
def fmt(r):
    if r[1] == 9: return '{ frame: %g, ev: 9, mode: %d }' % (r[0], int(r[3]))
    if r[1] == 10: return '{ frame: %g, ev: 10, mode: %d, joint: %d, deg: %g }' % (r[0], int(r[3]), int(r[4]), r[5])
    if r[1] == 11: return '{ frame: %g, ev: 11, mode: %d, deg: %g, snd: %d }' % (r[0], int(r[3]), r[4], int(r[5]))
rows = []
for act in sorted(R, key=lambda a: (int(a.split(':')[0]), int(a.split(':')[1], 16))):
    st, n = int(act.split(':')[0]), int(act.split(':')[1], 16)
    by = collections.defaultdict(lambda: collections.defaultdict(list))
    for mot, rs in R[act].items():
        for r in rs:
            if r[1] in TYPES and r[2] == 1: by[r[6]][mot].append(r)
    if not by: continue
    sets = {k: tuple(sorted((m, tuple(tuple(r[:6]) for r in v)) for m, v in d.items())) for k, d in by.items()}
    one = len(set(sets.values())) == 1
    for sel in (sorted(by)[:1] if one else sorted(by)):
        for mot, rs in sorted(by[sel].items()):
            L, M = re.match(r'L(\d+) M(\d+)', mot).groups()
            x = '' if one else ", { variant: '%d:0x%02x/s%d' }" % (st, n, sel)
            rows.append("    act087(%d, 0x%02x, '%s', 'Motion[%s]', [%s]%s),   // selector %s" % (st, n, L, M, ', '.join(fmt(r) for r in rs), x,
                        ', '.join(map(str, sorted(by))) if one else sel))
data = ("SHELL_DATA.em087_00 = {\n  name: 'Ahtal-Neset',\n  lists: { 0: { list: 'u', pel: 'em087_00u' } },\n  shells: {\n"
  "    shell01: { id: 0x177, cls: 'uShellEm087_sp_01', base: 'base01', reader: 0x10c229c, folder: 'shell" + BS + BS + "em" + BS + BS + "em087_00_shell01',\n"
  "      modes: {\n" + m01 + "\n      },\n      hitdata: " + hd01 + " },\n"
  "    shell58: { id: 0x179, cls: 'uShellEm087_sp_58', base: 'base58', reader: 0x10c2a50, folder: 'shell" + BS + BS + "em" + BS + BS + "em087_00_shell58',\n"
  "      modes: {\n" + m58 + "\n      },\n      hitdata: " + hd58 + " },\n"
  "    shell48: { id: 0x178, cls: 'uShellEm087_sp_48', base: 'base48', reader: 0x10c25cc, folder: 'shell" + BS + BS + "em" + BS + BS + "em087_00_shell48',\n"
  "      modes: {\n" + m48 + "\n      },\n      hitdata: " + hd48 + " },\n  },\n  actions: [\n"
  "    // (7, 4) 0x10b0e04: phase 0 L2 M3 (0x203) and at once 0x10abc08(e, 0, 0x11, 0): sp_01 0 at joint 17; phase 1 at f204 (0xb0968 mode\n"
  "    // 0) sp_01 0 at joint 13\n"
  "    act087(7, 0x04, '2', 'Motion[3]', [{ start: true, ev: 10, mode: 0, joint: 17, deg: 0 }, { frame: 204, ev: 10, mode: 0, joint: 13, deg: 0 }]),\n"
  "    // THE EVENT ROWS, type 9 (vt+0x480 0x10ab7ac: sp_48 mode a0), type 10 (0x10ab800: sp_01 mode a0 at joint a1, the Y word + a2 deg) and\n"
  "    // type 11 (0x10ab8fc: sp_58 mode a0, the yaw offset a1 deg, the sound a2), kind 1 (the crossing of f0) -- the\n"
  "    // selector's rows on the motion they name (<scratchpad>/neset/rows087.json)\n" + '\n'.join(rows) + "\n  ],\n};\n")
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
anchor = "// ---- BASE60 / BASE61: Ahtal-Ka's web anchors"
assert s.count(anchor) == 1
FIRST = 'SHELL_DATA.em087_00 = {' not in s
if FIRST:
    s = s.replace(anchor, js.lstrip('\n') + data + '\n' + anchor)
else:
    # a re-run: the code is in already -- replace the data block (SHELL_DATA.em087_00 .. the anchor) alone
    # (the whole Neset block -- his code and data, this lane's own lines -- from its header to the anchor)
    i0 = s.index('// ---- AHTAL-NESET (em087_00'); i1 = s.index(anchor)
    assert s.count('// ---- AHTAL-NESET (em087_00') == 1 and i0 < i1
    s = s[:i0] + js.lstrip('\n') + data + '\n' + s[i1:]
reps = [] if not FIRST else [
  ("  } else if (a && a.code === 'em071'){\n",
   "  } else if (a && a.code === 'em087'){\n    spawn087(state, D, a, ctx, input, out, fresh);           // Ahtal-Neset's shells (his event rows)\n  } else if (a && a.code === 'em071'){\n"),
  ("  if (S.base === 'base51') return sweep51(S);           // base51's +0x150 0x428f48 (the Fatalis line's sweep)\n",
   "  if (S.base === 'base51') return sweep51(S);           // base51's +0x150 0x428f48 (the Fatalis line's sweep)\n"
   "  if (S.cls === 'uShellEm087_sp_01') return delay087s01(S, ctx);   // Ahtal-Neset's sp_01 +0x150 0x10c2344: the delay, then the next mode\n"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok', len(rows), 'event rows')
