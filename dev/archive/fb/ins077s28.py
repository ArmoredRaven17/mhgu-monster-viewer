import ast, json
BS = chr(92)
SJ = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
L = open('shl_em077_00.txt', encoding='utf8').read().split('\n')
i = [k for k, l in enumerate(L) if l.startswith('== ') and 'shell28' in l][0]
cl = L[i+1]; cmn = ast.literal_eval(cl[cl.index('{'):])
modes = []
for l in L[i+3:i+3+14]:
    l = l.strip(); assert l.startswith('mode '), l
    n = int(l.split()[1]); d = json.loads(l[l.index('{'):])
    ef = d['ef'][0]['arr']
    modes.append("      %d: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (n, d['scale'][0], json.dumps(ef).replace(' ', ''), json.dumps(d['hit']['ints']), json.dumps(d['sh']['ints']), json.dumps(d['sh']['floats']), json.dumps(d['sh']['vecs'])))
data = open('s28_data.js', encoding='utf8').read().replace('@@BS@@', BS + BS).replace('@@CMN@@', json.dumps(cmn['vecs'])).replace('@@MODES@@', '\n'.join(modes))
blk = open('b28_block.js', encoding='utf8').read() + data + '\n'
s = open(SJ, encoding='utf8').read()
assert 'uShellEm077_sp_28' not in s
A = '// ---- BASE60 / BASE61'
assert s.count(A) == 1
s = s.replace(A, blk + A)
reps = [
  ("    else if (S.base === 'base42') step42(S, J, ctx, input, D, out);   // his water lines\n",
   "    else if (S.base === 'base42') step42(S, J, ctx, input, D, out);   // his water lines\n    else if (S.base === 'base28') step28(S, J, ctx, input, D, out);   // Seregios's bladescales\n"),
  ("  if (D.perFrame077) perFrame077(state, D, ctx, input, out, fresh, a);",
   "  if (D.perFrame077) perFrame077(state, D, ctx, input, out, fresh, a);\n  if (D.perFrame077s28) perFrame077s28(state, D, ctx, input, out, fresh, a);   // his frame handler's bladescales (0xfddfcc, L2 M29 / M48), line 4\n  //"),
  ("  } else if (a && !fresh && state.prevJoints && a.code === 'em081'){",
   "  } else if (a && !fresh && state.prevJoints && a.code === 'em077s28'){\n    spawn077s28(state, D, a, ctx, input, out);               // Seregios's bladescales (base28), before the generic `a.spawns` arm below\n  } else if (a && !fresh && state.prevJoints && a.code === 'em081'){"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b)
open(SJ, 'w', encoding='utf8').write(s)
print('ok')
