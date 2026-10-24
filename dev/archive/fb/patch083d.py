import sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8', newline='').read()
NL = '\r\n' if '\r\n' in s else '\n'
fix = lambda t: t.replace('\r\n', '\n').replace('\n', NL)
def rep(old, new, count=1):
    global s
    o, n = fix(old), fix(new)
    c = s.count(o)
    if c != count: sys.exit('anchor x%d (want %d): %r' % (c, count, old[:90]))
    s = s.replace(o, n)

# 1. the 04_13 reader, the class table, thrownOf -- before init083s13
rep("// base13's init 0x4044d8 on his flags (1 | 2?), then sp_13's +0x13c 0x1064314",
"""// ELDERFROST's 04_13 reader 0x10619a0 (READ whole; his L2 M23 snowball, 0x16b): ef 0 -> +0x15c8; hit 0; int 0 the joint +0x15e4;
// +0x15e0: 1 (HELD) unless the joint is 0, 2 int 1, 4 | 0x10 int 4 (the thrown point's flag-4 arm 0x405990, the aim the owner's facing);
// int 2 -> +0x15e8; floats 0 speed +0x15ec, 1 the arc's height +0x15f0, 2 life +0x15f8, 3 far +0x1600, 4 near +0x15fc, 5 per unit
// +0x160c, 6 -> +0x168c (no consumer in the class's code); &vec 0 both points, &vec 1 -> +0x1624, &vec 3 -> +0x162c; ef 3 / 1 / 2 ->
// +0x167c (the other-em083 hit's) / +0x1680 (the split's) / +0x1684 (the flight after it); hit 1 -> +0x1688; int 3 -> +0x1690 (the
// split when >= 2: every rank); MODE 4 (0x1061c1c..0x1061d58): +0x162c = &+0x16a0, vec 3 turned by the target's bearing from the
// owner against its facing (0xaf4f8(e, 0)) clamped to [float 7, float 8] degrees (the clamp 0x3f9e80's)
function params083s132(def, mode, m, own){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => (sh.vecs[i] || ZERO3).map(f);
  let flags = 1 | (I(1) !== -1 ? 2 : 0) | (I(4) !== -1 ? 0x14 : 0);
  if (I(0) === 0) flags &= ~1;
  const k = { joint: I(0), flags, i15e8: I(2), speed0: F(0), f15f0: F(1), life: F(2), far: F(3), near: F(4), speedPer: F(5),
              f168c: F(6), gravity: f(0.0), limitA: f(0.0), limitB: f(0.0), y1614: f(0.0), vec: V(0), centre: V(1), v162c: V(3),
              split: I(3) >= 2 ? I(3) : 0 };
  if (m === 4 && own && own.target && own.ownerPos){
    const T = own.target, O = own.ownerPos;
    const b = u16(s32(mla(0.5, atan2f(f(T[0] - O[0]), f(T[2] - O[2])), RAD_TO_U16)) - (own.ownerY >>> 0));
    const lo = s32(mla(0.5, F(7), DEG_TO_U16)), hi = s32(mla(0.5, F(8), DEG_TO_U16));
    const r = u16(hi - lo), d = u16(b - lo);
    const a = u16(d <= r ? b : ((0x8000 | (r >>> 1)) > d ? hi : lo));
    const rad = f(a * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad), [x, y, z] = k.v162c;
    k.v162c = [mla(f(x * cs), z, sn), y, mls(f(z * cs), x, sn)];
  }
  return k;
}
// the two snowball classes' differences: the split's test and its two params, the landing's table (mode -> [camera, sp_01 mode])
const SNOW083C = {
  uShellEm083_sp_13: { params: params083s13, splitStart: 2, reflight: 3, landing: { 0: [7, 0], 1: [5, 1], 2: [5, 2], 6: [5, 41] } },
  uShellEm083_04_13: { params: params083s132, splitStart: 1, reflight: 2, landing: { 0: [7, 0], 1: [5, 1], 2: [5, 2], 4: [5, 34] } },
};
// vt+0x168 = 0x405500: flag 4 (0x405990: +0x162c + +0x1624 turned by the aim -- with 0x10 the owner's facing --, the height the
// target's) or Khezu's arm (thrown13)
const thrownOf083 = (S, k, own) => (k.flags & 4) ? thrown022(S, own) : thrown13(S, k, own);
// base13's init 0x4044d8 on his flags (1 | 2?), then sp_13's +0x13c 0x1064314""")
rep("""  S.position = pos;
  const T = thrown13(S, k, own);
  const a = wordOf(f(T[0] - pos[0]), f(T[2] - pos[2]));
  const L = launch13r(S, T);
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  S.velocity = [f(L.velocity[2] * sn), L.velocity[1], f(L.velocity[2] * cs)];
  S.gravity = L.acceleration.slice();
  const h = sqrtf(mla(f(L.velocity[2] * L.velocity[2]), L.velocity[0], L.velocity[0]));
  const w = u16(0x10000 - u16(s32(mla(0.5, atan2f(f(-L.velocity[1]), h), RAD_TO_U16))));
  const ratio = w > 0x8000 ? f(1.0) : w > 0x2000 ? f(0.0) : mla(f(1.0), f(w), f(-0.0001220703125));
  const m2 = pair(ratio);
  pos = [0, 1, 2].map(i => f(m2[i] + f(pos[i] - m1[i])));
  S.position = pos;
  S.anchor = pos.slice();
  S.launch = { point: pos.slice(), position: pos.slice(), thrown: T.slice(), aim: a, ratio, velocity: S.velocity.slice(),""",
"""  S.position = pos;
  const T = thrownOf083(S, k, own);
  const a = wordOf(f(T[0] - pos[0]), f(T[2] - pos[2]));
  const L = launch13r(S, T);
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  S.velocity = [f(L.velocity[2] * sn), L.velocity[1], f(L.velocity[2] * cs)];
  S.gravity = L.acceleration.slice();
  const h = sqrtf(mla(f(L.velocity[2] * L.velocity[2]), L.velocity[0], L.velocity[0]));
  const w = u16(0x10000 - u16(s32(mla(0.5, atan2f(f(-L.velocity[1]), h), RAD_TO_U16))));
  const ratio = w > 0x8000 ? f(1.0) : w > 0x2000 ? f(0.0) : mla(f(1.0), f(w), f(-0.0001220703125));
  const m2 = pair(ratio);
  pos = [0, 1, 2].map(i => f(m2[i] + f(pos[i] - m1[i])));
  S.position = pos;
  S.anchor = pos.slice();
  // (a joint-0 04_13 is not held: state 2 at once, +0x40 = the setup's point -- 0x10622f4; none of his files' modes)
  if (!(k.flags & 1)) S.state = 2;
  S.launch = { point: pos.slice(), position: pos.slice(), thrown: T.slice(), aim: a, ratio, velocity: S.velocity.slice(),""")
rep("""  S.state = 2;
  const T = thrown13(S, S.k, own);
  const a = atan2f(f(T[0] - S.position[0]), f(T[2] - S.position[2]));""",
"""  S.state = 2;
  const T = thrownOf083(S, S.k, own);
  const a = atan2f(f(T[0] - S.position[0]), f(T[2] - S.position[2]));""")
# post: by class
rep("""function post083s13(S, D, ctx, out, own){
  if (S.state !== 2 || !(S.k.split >= 2) || S.split083 || S.position[1] > S.anchor[1]) return;
  S.split083 = true;
  const lists = listsOf(D, S);
  if (S.modeIndex <= 2 && S.mode.ef[2]){
    const rq = rockRequest(D, S.mode, 2, S.position, 'split', lists);
    S.events.push(rq ? { ev: 'start', param: 2, kind: 'split', start: rq } : { ev: 'refused', param: 2, kind: 'split' });
    if (rq) out.started.push({ shell: S, start: rq });
  }
  pieces083(S, D, ctx, out, own);
  if (S.effect && !S.effect.gone) S.events.push({ ev: 'stop', param: 0, key: S.effect.key, flag: 1, reflight: true });
  const rq3 = S.mode.ef[3] ? rockRequest(D, S.mode, 3, S.position, 'reflight', lists) : null;
  S.events.push(rq3 ? { ev: 'start', param: 3, kind: 'reflight', start: rq3 } : { ev: 'refused', param: 3, kind: 'reflight' });
  if (rq3){ out.started.push({ shell: S, start: rq3 }); S.effect = { param: 0, key: rq3.key, kind: 'flight', ef: 3 }; S.effects[3].started = true; }
  else S.effect = null;
}""",
"""// Elderfrost's 04_13 vt+0x28 0x106236c (READ whole) is the same with its own fields: +0x1690 (int 3) >= 2 at every rank, once
// (+0x1694); the split's ef 1 (+0x1680) for modes 1 / 2 (`mode - 1 <= 1`), the pieces 0x1062530 (0x166, 0x1064514's code), ef 2
// (+0x1684) into +0x1674
function post083s13(S, D, ctx, out, own){
  if (S.state !== 2 || !(S.k.split >= 2) || S.split083 || S.position[1] > S.anchor[1]) return;
  S.split083 = true;
  const C = SNOW083C[S.cls], lists = listsOf(D, S), p1 = C.splitStart, p2 = C.reflight;
  const at = S.cls === 'uShellEm083_04_13' ? (S.modeIndex >= 1 && S.modeIndex <= 2) : S.modeIndex <= 2;
  if (at && S.mode.ef[p1]){
    const rq = rockRequest(D, S.mode, p1, S.position, 'split', lists);
    S.events.push(rq ? { ev: 'start', param: p1, kind: 'split', start: rq } : { ev: 'refused', param: p1, kind: 'split' });
    if (rq) out.started.push({ shell: S, start: rq });
  }
  pieces083(S, D, ctx, out, own);
  if (S.effect && !S.effect.gone) S.events.push({ ev: 'stop', param: 0, key: S.effect.key, flag: 1, reflight: true });
  const rq3 = S.mode.ef[p2] ? rockRequest(D, S.mode, p2, S.position, 'reflight', lists) : null;
  S.events.push(rq3 ? { ev: 'start', param: p2, kind: 'reflight', start: rq3 } : { ev: 'refused', param: p2, kind: 'reflight' });
  if (rq3){ out.started.push({ shell: S, start: rq3 }); S.effect = { param: 0, key: rq3.key, kind: 'flight', ef: p2 }; S.effects[p2].started = true; }
  else S.effect = null;
}""")
rep("""  const m = S.modeIndex, child = m === 0 ? 0 : m === 1 ? 1 : m === 2 ? 2 : m === 6 ? 41 : null;
  if (child == null) return 'keep';
  camera001(S, m === 0 ? 7 : 5);
  if (ctx.create) ctx.create(S, 'shell01', { mode: child, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });""",
"""  // (Elderfrost's 04_13 landing 0x1061d6c, table 0x1061dac: 0 / 1 / 2 the same, 3 nothing, 4 -> camera 5 + sp_01 34; id 0x168)
  const row = SNOW083C[S.cls].landing[S.modeIndex];
  if (!row) return 'keep';
  camera001(S, row[0]);
  if (ctx.create) ctx.create(S, 'shell01', { mode: row[1], position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });""")
rep("""function make083s13(state, D, m, J, own, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: 'base13',""",
"""function make083s13(state, D, m, J, own, ctx, action, frame, name = 'shell13'){
  const def = D.shells[name], mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return null;
  const S = { id: state.nextId++, monId: state.monId, shell: name, cls: def.cls, globalId: def.id, base: 'base13',""")
rep("  S.k = params083s13(def, mode, m, own);\n  if (!init083s13(S, J, own)) return null;",
    "  S.k = SNOW083C[def.cls].params(def, mode, m, own);\n  if (!init083s13(S, J, own)) return null;")
rep("    if (sp.shell === 'shell13'){ state.cb0c = 1; S = make083s13(state, D, sp.mode, J, own, ctx, a.action, sp.frame); }   // 0x10607f8 / 0x105b704",
    "    if (sp.shell === 'shell13' || sp.shell === 'shell13_02'){ state.cb0c = 1; S = make083s13(state, D, sp.mode, J, own, ctx, a.action, sp.frame, sp.shell); }   // 0x10607f8 / 0x105b704")
# stepOrb / LANDING13 / READER00 / LANDING
rep("  if (S.state === 1 && (S.cls === 'uShellEm061_sp_13' || S.cls === 'uShellEm083_sp_13')){",
    "  if (S.state === 1 && (S.cls === 'uShellEm061_sp_13' || SNOW083C[S.cls])){")
rep("    const r = (S.cls === 'uShellEm083_sp_13' ? hold083s13 : hold13r)(S, ctx, D, out, ctx.own001, ctx.shellState);",
    "    const r = (SNOW083C[S.cls] ? hold083s13 : hold13r)(S, ctx, D, out, ctx.own001, ctx.shellState);")
rep("  if (S.cls === 'uShellEm083_sp_13') post083s13(S, D, ctx, out, ctx.own001);",
    "  if (SNOW083C[S.cls]) post083s13(S, D, ctx, out, ctx.own001);   // (and Elderfrost's 04_13 0x106236c)")
rep("                    uShellEm083_sp_13: (S, D, ctx, out) => landing083s13(S, D, ctx, out) };",
    "                    uShellEm083_sp_13: (S, D, ctx, out) => landing083s13(S, D, ctx, out),\n"
    "                    uShellEm083_04_13: (S, D, ctx, out) => landing083s13(S, D, ctx, out) };")
rep("                   uShellEm083_sp_00_03: (def, mode) => params083s003(def, mode),",
    "                   uShellEm083_sp_00_03: (def, mode) => params083s003(def, mode),\n"
    "                   // Elderfrost's 04_00 0x1061084 (his pieces): sp_00_02's map; its +0x13c 0x106128c spreads the request's words by floats\n"
    "                   // 2..5 (random draws 0x3f76d8 when int 0 != 0) -- all 0 in his files, so the words stay (params083s040 refuses others)\n"
    "                   uShellEm083_04_00: (def, mode) => params083s040(def, mode),")
rep("                  uShellEm083_sp_00_02: (S, D, hit, ctx) => landing083s002(S, D, hit, ctx) };",
    "                  uShellEm083_sp_00_02: (S, D, hit, ctx) => landing083s002(S, D, hit, ctx),\n"
    "                  uShellEm083_04_00: (S, D, hit, ctx) => landing083s002(S, D, hit, ctx) };   // 0x1061158: the same, id 0x168")
rep("// sp_00_02's landing 0x1063148 (READ whole)",
"""function params083s040(def, mode){
  const fl = mode.sh.floats;
  if ([2, 3, 4, 5].some(i => fl[i])) throw new Error('shells.js: uShellEm083_04_00 with a word spread (0x106128c floats 2..5): not transcribed');
  return params083s002(def, mode);
}
// sp_00_02's landing 0x1063148 (READ whole)""")
# Elderfrost's data: the pieces and his snowball, the rows
rep("    // shell13: his sp_13 (L9 M8 mode 6;",
"""    // shell00_02: his snowball's pieces (uShellEm083_04_00, 0x166): u 54 / u 44 on them, sp_01 2 / 1 at a contact
    shell00_02: { id: 0x166, cls: 'uShellEm083_04_00', base: 'base00', reader: 0x1061084, folder: 'shell\\\\em\\\\em083_04_shell00_02',
      modes: {
@00_02@
      }, hitdata: [[0, 300], [0, 300], [0, 300]] },
    // shell13_02: his snowball (L2 M23 0 / 1 / 2 / 4; uShellEm083_04_13, 0x16b): u 31 / 41 / 51 / 150 on it; modes 1 / 2 split
    shell13_02: { id: 0x16b, cls: 'uShellEm083_04_13', base: 'base13', reader: 0x10619a0, folder: 'shell\\\\em\\\\em083_04_shell13_02',
      modes: {
@13_02@
      }, hitdata: [[0, 3000], [0, 3000], [0, 3000], [0, 3000], [0, 3000], [0, 3000]] },
    // shell13: his sp_13 (L9 M8 mode 6;""")
rep("""  act083v(0x1d, '2', 'Motion[23]', [UNBUILT083('shell13_02', 0, 220, SNOW083V4)], { also: [[7, 0x7a], [7, 0x7d]] }),
  act083v(0x1c, '2', 'Motion[23]', [UNBUILT083('shell13_02', 1, 220, SNOW083V4)], { also: [[7, 0x79], [7, 0x7c]] }),
  act083v(0x1b, '2', 'Motion[23]', [UNBUILT083('shell13_02', 2, 220, SNOW083V4)], { also: [[7, 0x78], [7, 0x7b]] }),
  act083v(0x7e, '2', 'Motion[23]', [UNBUILT083('shell13_02', 4, 220, SNOW083V4)]),""",
"""  // L2 M23 (0x10606f4's variant-4 arm: 0xb0974 at 220 -> e+0xcb0c = 1 and 0x105faec, the setups of 0x16b; 266 -> 2)
  act083v(0x1d, '2', 'Motion[23]', SNOW083V4(0), { also: [[7, 0x7a], [7, 0x7d]] }),
  act083v(0x1c, '2', 'Motion[23]', SNOW083V4(1), { also: [[7, 0x79], [7, 0x7c]] }),
  act083v(0x1b, '2', 'Motion[23]', SNOW083V4(2), { also: [[7, 0x78], [7, 0x7b]] }),
  act083v(0x7e, '2', 'Motion[23]', SNOW083V4(4)),""")
rep("const SNOW083V4 = 'uShellEm083_04_13 (0x16b: reader 0x10619a0, init 0x10622f4, +0x15c 0x1061ef4, +0x158 0x1062138, landing 0x1061d6c): not transcribed';",
    "const SNOW083V4 = m => [{ frame: 220, shell: 'shell13_02', mode: m }, { frame: 266, kind: 'release' }];")
rep("//   Gammoth's L2 M61 / M62 / M5 / M9 / M14 / M15 / M20 / M21 / M37 rows on his files; L2 M23 is his own snowball (0x105faec ->\n//   0x16b, its tests 0xb0974: (7, 0x7e) mode 4 too) -- NOT BUILT, refused by name;",
    "//   Gammoth's L2 M61 / M62 / M5 / M9 / M14 / M15 / M20 / M21 / M37 rows on his files; L2 M23 is his own snowball (0x105faec ->\n//   0x16b, its tests 0xb0974: (7, 0x7e) mode 4 too), held and thrown as Gammoth's, its split at every rank into 0x166 pieces;")
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
g = open(D + 'gen083_04.out').read()
def section(n):
    out, on = [], False
    for ln in g.splitlines():
        if ln.startswith('// shell'):
            on = (ln == '// shell' + n); continue
        if on: out.append(ln)
    return NL.join(out)
s = s.replace('@00_02@', section('00_02')).replace('@13_02@', section('13_02'))
assert '@' + '00_02@' not in s
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')
