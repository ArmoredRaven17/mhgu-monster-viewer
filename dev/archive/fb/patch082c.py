import sys
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + chr(92)
def section(fn, name):
    L = open(D + fn).read().split('\n')
    s = [i for i, l in enumerate(L) if l.strip() == '// ' + name][0]
    e = [i for i, l in enumerate(L) if l.startswith('//') and i > s] + [len(L)]
    return '{\n' + '\n'.join('  ' + l for l in L[s + 1:e[0]] if l.strip()) + '\n  }'
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8', newline='').read(); NL = '\r\n' if '\r\n' in s else '\n'
fix = lambda t: t.replace('\r\n', '\n').replace('\n', NL)
def rep(o, n):
    global s
    o, n = fix(o), fix(n)
    if s.count(o) != 1: sys.exit('anchor %d %r' % (s.count(o), o[:70]))
    s = s.replace(o, n)
# 1. the base26 block, generalised
a = s.index(fix('function make26(state, D, m, ctx, own, action, frame){'))
b = s.index(fix("// LAGIACRUS's own spawns"))
s = s[:a] + fix(open(D + 'base26v2.js', encoding='utf8').read().rstrip('\n') + '\n\n') + s[b:]
# 2. spawn082: the 04_26 timers, rows and the frame-0 rows
rep("  if (a.trail && fresh){ state.trail082 = own.ownerPos ? { last: own.ownerPos.slice(), cd: f(550.0), sp: f(550.0), n: 0 } : null; return; }\n",
    "  if (a.trail && fresh){ state.trail082 = own.ownerPos ? { last: own.ownerPos.slice(), cd: f(550.0), sp: f(550.0), n: 0 } : null; return; }\n"
    "  // Soulseer's rest (1, 0x16) 0x103b874: its phase 0 sets the four counters e+0xcb34..+0xcb40 = tune 0x7f..0x82 (500 / 800 / 600 / 900);\n"
    "  // phase 2 (L0 M15) counts each down by the step (0x7206c) and, at or below 0, reloads it and makes its 04_26 (6 / 7 / 8 / 9)\n"
    "  if (a.timers26){\n"
    "    if (fresh){ state.t26 = a.timers26.map(([m, T]) => ({ m, T: f(T), t: f(T) })); return; }\n"
    "    if (!state.t26 || !state.prevJoints) return;\n"
    "    for (const c of state.t26){\n"
    "      c.t = f(c.t - ctx.dt);\n"
    "      if (c.t > 0) continue;\n"
    "      c.t = c.T;\n"
    "      make26row082(state, D, a, c.m, null, ctx, out);\n"
    "    }\n"
    "    return;\n"
    "  }\n")
rep("    if (!sp.now && !pass001(state, f(sp.frame))) continue;\n",
    "    // (a frame-0 test passes on phase 1's first call, the step after the motion is set: 0x72714's window from +0x500 = 0, INFERRED)\n"
    "    if (sp.frame === 0 ? !(state.hist[0] === 0 && state.hist[1] > 0) : (!sp.now && !pass001(state, f(sp.frame)))) continue;\n"
    "    if (sp.s26){ for (const m of sp.s26) make26row082(state, D, a, m, sp.frame, ctx, out); continue; }   // Soulseer's 04_26\n")
rep("// the throw rows: { frame, k, set } -- spawnThrow082 from spawn082\n",
    "// Soulseer's 04_26 maker 0x104a744(e, m) (READ whole): none with the soul flame lit (unlit here), none while tired for m 1 / 4 / 11\n"
    "// (0x812); a base26 setup (0x40fab0, 0x30 bytes): the id e+0xcad0, the mode, the owner, +0x10 / +0x20 the zero vector's\n"
    "function make26row082(state, D, a, m, frame, ctx, out){\n"
    "  if (m <= 0xb && ((0x812 >>> m) & 1) && ctx.tired) return;\n"
    "  const r = make26(state, D, m, ctx, ctx.own001, a.action, frame, state.prevJoints);\n"
    "  if (!r.S){ out.refused.push({ action: a.action, shell: 'shell26', mode: m, why: r.why }); return; }\n"
    "  state.shells.push(r.S); out.spawned.push(r.S);\n"
    "}\n"
    "// the throw rows: { frame, k, set } -- spawnThrow082 from spawn082\n")
# 3. Soulseer's shell26 and its actions
blk = """
// SOULSEER's 04_26 (0x160, base26 -- Lagiacrus's spiral's base, its own reader 0x104e7c4, +0x150 0x104e9ec, +0x154 0x104eb0c, +0x158
// 0x104eadc): the ghost flames. The makers (0x104a744): L2 M69 (7, 0x26 / 0x71 / 0x7b; 0x1044334) f78 1 / 3 / 5, f98 0 / 2 / 4; L2 M38
// (7, 0x13; 0x1042da4) f30 10 / 11 / 12, f110 13; (2, 0x36) L0 M4 (0x103e264, tune 0x98 / 0x99 = 0: phase 1's first call) 14 / 15 -- r5
// 1 and the soul flame out; his rest (1, 0x16) L0 M15 (0x103b874) 6 / 7 / 8 / 9 on their counters
{
  const D = SHELL_DATA.em082_04;
  D.shells.shell26 = { id: 0x160, cls: 'uShellEm082_04_26', base: 'base26', reader: 0x104e7c4, folder: 'shell@@em@@em082_04_shell26',
    modes: @M26@, hitdata: [[2, 600], [2, 600], [2, 600], [2, 1000], [2, 1000], [2, 1000], [2, 300], [32, 300], [2, 0]] };
  D.actions = D.actions.concat([
    act082(7, 0x26, 'Motion[69]', [{ frame: 78, s26: [1, 3, 5] }, { frame: 98, s26: [0, 2, 4] }], { also: [[7, 0x71], [7, 0x7b]] }),
    act082(7, 0x13, 'Motion[38]', [{ frame: 30, s26: [10, 11, 12] }, { frame: 110, s26: [13] }]),
    Object.assign(act082(2, 0x36, 'Motion[4]', [{ frame: 0, s26: [14, 15] }]), { list: '0' }),
    Object.assign(act082(1, 0x16, 'Motion[15]', [], { timers26: [[6, 500], [7, 800], [8, 600], [9, 900]] }), { list: '0' }),
  ]);
}
""".replace('@M26@', section('gen082_04.out', 'em082_04_26')).replace('@@', chr(92) * 2)
anchor = '\n// ---- AGNAKTOR (em049_00)'
rep(anchor, blk.rstrip('\n') + '\n' + anchor)
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')
