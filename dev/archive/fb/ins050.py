import subprocess, re, json, ast
BS = chr(92)
js = open('alatreon.js', encoding='utf8').read()
out = subprocess.check_output(['python', 'gen050.py'], text=True)
blocks = {b[:2]: b[3:].rstrip('\n') for b in out.split('MODES ')[1:]}
def body(nn):
    b = blocks[nn]
    lines = b.split('\n')
    hd = lines[-1]
    return '\n'.join(lines[:-1]), hd.split('hitdata: ')[1].rstrip(' },')
def folder(nn): return "'shell" + BS + BS + "em" + BS + BS + "em050_00_shell%s'" % nn
L = "lists: { 0: { list: 'u', pel: 'em050_00u' } }"
parts = []
m, hd = body('00')
parts.append("    shell00: { id: 0xef, cls: 'uShellEm050_sp_00', base: 'base00', folder: %s, %s,\n      modes: {\n%s\n      },\n      hitdata: %s },"
             % (folder('00'), L, m, hd))
m, hd = body('01')
parts.append("    shell01: { id: 0xf0, cls: 'uShellEm050_sp_01', base: 'base01', reader: 0xecf990, folder: %s, %s,\n      modes: {\n%s\n      },\n      hitdata: %s },"
             % (folder('01'), L, m, hd))
m, hd = body('11')
parts.append("    // (sp_11's reader reads no ef: base01's +0x15c8 stays 0 -- its .shl's u 150 is never started)\n"
             "    shell11: { id: 0xf2, cls: 'uShellEm050_sp_11', base: 'base11', reader: 0xecff90, folder: %s, %s,\n      modes: {\n%s\n      } },"
             % (folder('11'), L, m))
m, hd = body('41')
parts.append("    shell41: { id: 0xf3, cls: 'uShellEm050_sp_41', base: 'base41', folder: %s, %s,\n      cmn: { ints: [], floats: [31.0, 10.0, 10.0], vecs: [] },\n      modes: {\n%s\n      },\n      hitdata: %s },"
             % (folder('41'), L, m, hd))
js = js.replace('@@SHELLS@@', '\n'.join(parts))
t = open('../tab050k.txt', encoding='utf8').read().splitlines()
sel = [ast.literal_eval(l.split(' ', 2)[2]) for l in t if l.startswith('sel ')]
V = ast.literal_eval([l for l in t if l.startswith('V ')][0][2:])
R = ast.literal_eval([l for l in t if l.startswith('R ')][0][2:])
tm = ("const T050M = %s;\nconst V050M = [%s].map(v => v.map(f));\nconst R050M = %s.map(f);"
      % (json.dumps(sel), ', '.join('[%r, %r, %r]' % tuple(v) for v in V), json.dumps(R)))
js = js.replace('@@T050M@@', tm)
assert '@@' not in js
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
anchor = "// ---- BASE60 / BASE61: Ahtal-Ka's web anchors"
assert s.count(anchor) == 1
s = s.replace(anchor, js.lstrip('\n') + '\n' + anchor)
a = "  } else if (a && a.code === 'em027'){\n"
assert s.count(a) == 1
s = s.replace(a, "  } else if (a && a.code === 'em050'){\n    spawn050(state, D, a, ctx, input, out, fresh);           // Alatreon's balls, blasts, strike lines and meteors\n" + a)
a = "    else if (S.base === 'base20') step20(S, ctx, input, D, out);   // Teostra's nova ring\n"
assert s.count(a) == 1
s = s.replace(a, a + "    else if (S.base === 'base41') step41(S, ctx, input, D, out);   // Alatreon's meteors\n")
a = "                                : def.base === 'base20' ? null                            // (Teostra's ring: the owner's point)\n"
assert s.count(a) == 1
s = s.replace(a, a + "                                : def.base === 'base41' ? (mode.sh.ints[3] === -1 || mode.sh.ints[3] == null ? null : mode.sh.ints[3])   // (Alatreon's meteors: int 3)\n")
open(p, 'w', encoding='utf8').write(s)
print('ok')
