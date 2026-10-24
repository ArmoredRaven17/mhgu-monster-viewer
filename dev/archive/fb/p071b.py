# p071b.py (2026-10-19): the Gore line's Chaotic / Shagaru deltas in shells.js (and the scratch gore.js): readers by id, sp_00's landing
# children (0xfc2114), sp_11's mode 0 / 6 creates, base03's request arm (base00's 0x10 / 0x20), the footfall dust 0xfb700c
P = [r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js',
     r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\gore.js']
R = []
# ---- sp_00's landing: the children first (0xfc2094 bl 0xfc2114), then the effect
R.append(("""  if ((t | 2) === 2 && ((m - 1) >>> 0) < 2) return 'keep';
  const param = t === 0 ? 1 : t === 2 ? 3 : t === 1 ? 2 : 0;
  if (param) contactStart(S, D, param, hit.point, 'landing');
}
""", """  if ((t | 2) === 2 && ((m - 1) >>> 0) < 2) return 'keep';
  if (t === 1) child071s00(S, hit, ctx);                 // 0xfc2094: the children before the effect
  const param = t === 0 ? 1 : t === 2 ? 3 : t === 1 ? 2 : 0;
  if (param) contactStart(S, D, param, hit.point, 'landing');
}
// 0xfc2114(shell, &contact, &result) (READ whole): the owner active; mode 1 -> sp_11 (e+0xcad0) mode 0 with +0x3c = the shell's
// +0x13dc, mode 2 -> sp_01 (e+0xcac8) mode 0 with +0x3c 0xffff; at the contact, +0x20 the GOT zero vector, the words +0x30 =
// u32(asinf(n.z)) and +0x38 = u32(acosf(n.y / sqrt(0 + n.x^2 + n.z^2))) -- the RADIANS converted as they are (vcvt.u32, no scale:
// 0 on a floor, n.y / 0 -> NaN -> 0) -- and +0x34 = u16(s32(0.5 + atan2(T.x - c.x, T.z - c.z) x 10430.38)), T = +0x1640 (base00's
// init: the target copy, block +0x1d0 -- the viewer's target, which does not move)
function child071s00(S, hit, ctx){
  const m = S.modeIndex;
  if ((m !== 1 && m !== 2) || !ctx.create) return;
  const T = ctx.own001 && ctx.own001.target;
  if (!T){ ctx.out.refused.push({ shell: S.shell, mode: m, id: S.id, why: 'sp_00 landing child (0xfc2114): no target (input.rock.target)' }); return; }
  const n = hit.normal || [0, 1, 0], c = hit.point;
  const X = cvtU32(asinf(n[2]));
  const h = sqrtf(mla(mla(f(0.0), n[0], n[0]), n[2], n[2]));
  const Z = cvtU32(acosf(f(n[1] / h)));
  const Y = u16(s32(mla(f(0.5), atan2f(f(T[0] - c[0]), f(T[2] - c[2])), RAD_TO_U16)));
  ctx.create(S, m === 1 ? 'shell11' : 'shell01', { mode: 0, position: c.slice(), angles: [X >>> 0, Y, Z >>> 0] });
}
"""))
# ---- sp_03's reader by id
R.append(("""function params071s03(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), ground: I(4) !== -1 ? 0 : -1, fanDeg: F(0), speed: F(1), life: F(2), vec: (sh.vecs[0] || ZERO3).map(f),
           flags: I(1) !== -1 ? 0x30 : 0, reach: f(500.0), follow: f(250.0), reachUp: F(6), reachDown: F(7), slope: false,
           turn: I(2) !== -1, fromTarget: I(3) !== -1, turnDeg: F(5), tMin: F(3), tMax: F(4), ef1660: true };
}""", """// The arms by id (0xfc2ad8): Chaotic's 0xfc2d60 the same ints, its floats 8 / 6 / 7 / 3 / 4 -> +0x1668 / +0x166c / +0x1670 / +0x1674 /
// +0x1678; Shagaru's 0xfc2f94 (READ whole): ef 0, hit 0, joint int 0, floats 0 / 1 / 2 the fan / speed / life, +0x15e8 0x10 and 0x20
// by int 1, vec 0, ef 1 -> +0x1660, floats 3 / 4 -> +0x1674 / +0x1678 -- no +0x1664 bit (no turn, no timer from the target, the
// follow path, no slope step). +0x15e8 0x10 / 0x20 (int 1): base00's REQUEST arm -- the setup's point and words (init03r)
function params071s03(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const id = def ? def.id : 0x12f, base = { joint: I(0), fanDeg: F(0), speed: F(1), life: F(2), vec: (sh.vecs[0] || ZERO3).map(f),
           flags: I(1) !== -1 ? 0x30 : 0, reach: f(500.0), follow: f(250.0), slope: false, ef1660: true };
  if (id === 0x137) return Object.assign(base, { ground: -1, reachUp: F(3), reachDown: F(4) });
  const chaotic = id === 0x133;
  return Object.assign(base, { ground: I(4) !== -1 ? 0 : -1, turn: I(2) !== -1, fromTarget: I(3) !== -1,
           turnDeg: F(chaotic ? 8 : 5), tMin: F(chaotic ? 6 : 3), tMax: F(chaotic ? 7 : 4), reachUp: F(chaotic ? 3 : 6), reachDown: F(chaotic ? 4 : 7) });
}"""))
# ---- base03's init: the request arm
R.append(("""function init03(S, def, J, got, ctx){
  const k = S.k = (READER03[S.cls] || params03)(def, S.mode);   // (a class's own reader: Duramboros's sp_19)
""", """function init03(S, def, J, got, ctx){
  const k = S.k = (READER03[S.cls] || params03)(def, S.mode);   // (a class's own reader: Duramboros's sp_19)
  if (k.flags & 0x10) return init03r(S, k, got, ctx);   // base00's request arm (the Gore line's int 1: Chaotic's / Shagaru's mode 7)
"""))
R.append(("""// the ground under the shell, every move: 0x3fdf18 with the flags' bit 0 clear""", """// base03's init with base00's REQUEST arm (+0x15e8 0x10, 0x3f8cb8 -> 0x3f8d88): the point = the setup's +0x10.. plus the offset
// (bit 3 clear; x the size with 0x80), the words = the setup's +0x30.. with 0x20 (0x3f8c9c; else the owner's X, Y, 0), + the degree
// offsets (X 0, Y the fan); then base03's own ground step and timer arm, as init03
function init03r(S, k, got, ctx){
  if (!got.requestPos) return false;
  let o = k.vec.slice();
  if (k.flags & 0x80){ const sz = size001(got); o = o.map(x => f(x * sz)); }
  const p = [f(got.requestPos[0] + o[0]), f(got.requestPos[1] + o[1]), f(got.requestPos[2] + o[2])];
  const W = (k.flags & 0x20) ? (got.requestAngles || [0, 0, 0]).map(w => w >>> 0) : [got.ownerX >>> 0, got.ownerY >>> 0, 0];
  const dX = u16(s32(mla(0.5, 0.0, DEG_TO_U16))), dY = u16(s32(mla(0.5, k.fanDeg, DEG_TO_U16)));
  S.angles = [(W[0] + dX) >>> 0, (W[1] + dY) >>> 0, W[2]];
  S.timer = k.life;
  S.position = p; S.anchor = p.slice(); S.gravity = ZERO3.slice();
  S.velocity = launchVelocity(0.0, k.speed, S.angles);
  const A = [p[0], f(p[1] - (k.reachDown != null ? k.reachDown : k.reach)), p[2]], B = [p[0], f(p[1] + (k.reachUp != null ? k.reachUp : k.reach)), p[2]];
  const hit = stageQuery(A, B, ctx.stage, 0x10);
  S.launch = { point: p.slice(), angles: S.angles.slice(), query: [A, B], ground: hit ? hit.point.slice() : null };
  if (!hit) return false;
  S.position = [p[0], hit.point[1], p[2]];
  S.anchor = S.position.slice();
  if (k.fromTarget) timer03(S);
  S.velocity = launchVelocity(0.0, k.speed, [0, S.angles[1], S.angles[2]]);
  S.launchVelocity = S.velocity.slice();
  S.launch.velocity = S.velocity.slice();
  return true;
}

// the ground under the shell, every move: 0x3fdf18 with the flags' bit 0 clear"""))
# ---- make071s03: a request (the sp_11 create's sp_03 7)
R.append(("""function make071s03(state, D, m, target, own, J, ctx, action, frame){""",
          """function make071s03(state, D, m, target, own, J, ctx, action, frame, req = null){"""))
R.append(("""  if (!init03(S, def, J, own, ctx)) return null;
  S.prevPosition = S.position.slice();
  // ef 0 at base00's point""", """  if (!init03(S, def, J, req ? Object.assign({}, own, { requestPos: req.position, requestAngles: req.angles }) : own, ctx)) return null;
  S.prevPosition = S.position.slice();
  // ef 0 at base00's point"""))
# ---- sp_11's reader by id
R.append(("""function params071s11(def, mode, got, J, modeIndex){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const n = I(0) >= 1 ? I(0) : 0, table = [];
  for (let k = 0; k < n; k++) table.push(F(k + 4));
  return { flags: I(1) !== -1 ? 4 : 0, joint: -1, timer: 0, f1600: 0, f15fc: f(1.0), vec: sh.vecs[4] ? sh.vecs[4].map(f) : [0, 0, 0],""",
"""// (Chaotic's arm 0xfc3540: vec 8 -> +0x1608 and the times float (k + 8); Shagaru's 0xfc36fc: Gore's)
function params071s11(def, mode, got, J, modeIndex){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const n = I(0) >= 1 ? I(0) : 0, table = [], b = def && def.id === 0x134 ? 8 : 4;
  for (let k = 0; k < n; k++) table.push(F(k + b));
  return { flags: I(1) !== -1 ? 4 : 0, joint: -1, timer: 0, f1600: 0, f15fc: f(1.0), vec: sh.vecs[b] ? sh.vecs[b].map(f) : [0, 0, 0],"""))
# ---- sp_11's create: the tables as the ROM lays them, mode 0's sp_03 7
R.append(("""const T071S11 = { 1: [2, 3, 4, 0], 2: [5, 6, 7, 0], 3: [8, 9, 10, 11], 4: [8, 9, 10, 11], 5: [8, 9, 10, 11], 6: [15, 16, 16, 16] };""",
"""// (the tables 0x16a1564 / 0x16a1580 / 0x16a159c / 0x16a15b8, read to their next table: mode 6's seven are 15, 16 x 6)
const T071S11 = { 1: [2, 3, 4, 0], 2: [5, 6, 7, 0], 3: [8, 9, 10, 11], 4: [8, 9, 10, 11], 5: [8, 9, 10, 11], 6: [15, 16, 16, 16, 16, 16, 16] };"""))
R.append(("""  const m = S.modeIndex, T = T071S11[m];
  if (!T) return;                                        // (mode 0: sp_03 7 -- no Gore file)
  const at = [f(ox + P[0]), f(v[1] + P[1]), f(oz + P[2])];""", """  const m = S.modeIndex, T = T071S11[m];
  const at = [f(ox + P[0]), f(v[1] + P[1]), f(oz + P[2])];
  // mode 0 (0xfc3acc): sp_03 (e+0xcacc) 7 from a 0x50 setup (0x3fd7e0): the point at +0x10, the words at +0x20 (base00's request
  // arm reads them there), byte +0x2c 0 and byte +0x40 0 (the target: block +0x1d0), +0x2e the shell's +0x1588
  if (m === 0){
    const st = ctx.shellState, own = ctx.own001;
    if (!D.shells.shell03 || !D.shells.shell03.modes[7] || !own.target) return;
    const S2 = make071s03(st, D, 7, own.target, own, ctx.J, ctx, S.action, null, { position: at, angles: A });
    S.events.push({ ev: 'create', stepped: true, shell: 'shell03', id: D.shells.shell03.id, mode: 7, position: at.slice(), angles: A.slice(),
                    child: S2 ? S2.id : null, deleted: !S2 });
    if (S2){ S2.creator = S.id; st.shells.push(S2); ctx.out.spawned.push(S2); }
    return;
  }
  if (!T) return;"""))
for p in P:
    s = open(p, encoding='utf8').read()
    for a, b in R:
        n = s.count(a)
        if 'gore.js' in p and ('init03(S, def, J, got, ctx){' in a or 'the ground under the shell, every move' in a): continue
        assert n == 1, (p, n, a[:60])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf8').write(s)
print('ok')
