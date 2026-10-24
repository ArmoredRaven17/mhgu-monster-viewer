# emcpair.py: em087_00 EMC -- for each op `a3 00 n` (selector n) the action op `00 s m` that follows it in the same stream
# (ops between them listed), and every `a3 02 b` (e+0xd3fc) with its following action
import sys, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\barioth-scratch')
import emc
ver, groups = emc.load(r'C:\MHGU-Extract\scratch-em\em087_00\enemy\cmd_tbl\em087_00_cmdtbl.emc')
sel = collections.defaultdict(set); d3fc = collections.defaultdict(set); nofollow = []
for g, st in enumerate(groups):
    for k, s in enumerate(st):
        ops = emc.parse(s)
        for i, o in enumerate(ops):
            b = o.split()
            if b[0] != 'a3': continue
            # the next action op
            j = i + 1; between = []
            while j < len(ops) and not ops[j].startswith('00 '):
                between.append(ops[j]); j += 1
            act = ops[j] if j < len(ops) else None
            key = (int(b[1], 16), int(b[2], 16))
            tag = '(%s)' % ', '.join('%#x' % int(x, 16) for x in act.split()[1:]) if act else 'none'
            if key[0] == 0: sel[key[1]].add((tag, 'g%d s%d' % (g, k), ' '.join(between)))
            if key[0] == 2: d3fc[key[1]].add((tag, 'g%d s%d' % (g, k), ' '.join(between)))
for n in sorted(sel):
    acts = sorted(set(a for a, _, _ in sel[n]))
    print('selector %2d (%#x): actions %s   [%s]' % (n, n, ', '.join(acts), '; '.join(sorted(set('%s%s' % (w, (' via ' + b) if b else '') for _, w, b in sel[n])))[:300]))
print()
for n in sorted(d3fc):
    print('d3fc %d: %s' % (n, '; '.join(sorted('%s %s%s' % (a, w, (' via ' + b) if b else '') for a, w, b in d3fc[n]))[:600]))
