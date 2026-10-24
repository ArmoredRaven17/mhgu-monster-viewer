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

# READER00: sp_00's reader takes the mode and the request (its mode-4 arm writes the request's words)
rep("uShellEm083_sp_00: (def, mode) => params083s00(def, mode),",
    "uShellEm083_sp_00: (def, mode, m, got) => params083s00(def, mode, m, got),")

# params083s00: the variant-4 mode-4 arm
rep("""function params083s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = 4 | (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 8 : 0);
  return { joint: I(0), flags, degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(7), vy: f(0), flight: F(6),
           xLo: F(2), xHi: F(3), yLo: F(4), yHi: F(5), vec: V(0), from: ZERO3.slice(), aimOff: V(1), gravity: ZERO3.slice() };
}""",
"""function params083s00(def, mode, m, got){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  let flags = 4 | (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 8 : 0);
  const k = { joint: I(0), flags, degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(7), vy: f(0), flight: F(6),
              xLo: F(2), xHi: F(3), yLo: F(4), yHi: F(5), vec: V(0), from: ZERO3.slice(), aimOff: V(1), gravity: ZERO3.slice() };
  // MODE 4 (0x1062d30..0x1062ee0, READ; Elderfrost's L9 M15 shot): flags (f & ~0x3b) | 0x38 -- the request's point and words, the
  // offset turned by them; then THE READER AIMS THE REQUEST (setup +0x136c, the owner active): from its point +0x10 at the target
  // (block +0x1d0) plus the aim offset [+0x1618]: the Y word +0x24 = uxth(Y + the clamp of (aim's Y - Y) to [+0x1608, +0x160c]),
  // the X word +0x20 = X + uxth(the clamp of (aim's pitch - X) to [+0x1600, +0x1604]) (the clamp 0x3f9e80's; uxth / uxtah)
  if (m === 4){
    k.flags = (flags & ~0x3b) | 0x38;
    if (got && got.requestPos && got.requestAngles && got.target){
      const R = got.requestPos, T = got.target, o = k.aimOff, A = got.requestAngles.map(w => w >>> 0);
      const tx = f(T[0] + o[0]), tz = f(T[2] + o[2]), ty = f(T[1] + o[1]);
      const yw = s32(mla(0.5, atan2f(f(tx - R[0]), f(tz - R[2])), RAD_TO_U16));
      const clamp = (v, lo, hi, base) => {
        const r = u16(hi - lo), d = u16(v - base - lo);
        return d <= r ? (v - base) : ((0x8000 | (r >>> 1)) > d ? hi : lo);
      };
      const ylo = s32(mla(0.5, k.yLo, DEG_TO_U16)), yhi = s32(mla(0.5, k.yHi, DEG_TO_U16));
      A[1] = u16(clamp(yw, ylo, yhi, A[1]) + A[1]);
      const dx = f(tx - R[0]), dz = f(tz - R[2]), dy = f(ty - R[1]);
      const h = sqrtf(mla(f(dz * dz), dx, dx));
      const pw = s32(mla(0.5, atan2f(f(-dy), h), RAD_TO_U16));
      const xlo = s32(mla(0.5, k.xLo, DEG_TO_U16)), xhi = s32(mla(0.5, k.xHi, DEG_TO_U16));
      A[0] = (A[0] + u16(clamp(pw, xlo, xhi, A[0]))) >>> 0;
      got.requestAngles = A;
    }
  }
  return k;
}""")

# params083s13: the split is variant 0's
rep("           vec: (sh.vecs[0] || ZERO3).map(f), centre: (sh.vecs[1] || ZERO3).map(f), split: g && m <= 2 ? m + 1 : 0 };",
    "           vec: (sh.vecs[0] || ZERO3).map(f), centre: (sh.vecs[1] || ZERO3).map(f), split: g && m <= 2 && !def.v4 ? m + 1 : 0 };")

# spawn083: the start rows, the turn setter, the mode-4 shot, the zero-point sp_01, named refusals
rep("""function spawn083(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.kind === 'release'){ state.cb0c = 2; continue; }               // 0x1060828: e+0xcb0c = 2
""",
"""// 0x1051ebc(e, r1, r2, r3) (READ whole; the action setter's arms for (7, 0x69 / 0x77 / 0x80 / 0x81), table 0x1051944): e+0xcb10 =
// the bearing in degrees from joint 102 (r2 = 1; else 100) to the target (block +0x1d0) against the owner's Y word, wrapped to
// [-180, 180), clamped to +-min(r2 ? 90 : 30, tune int r3 ? 0x35 : 0x36); r1 = 1 also zeroes e+0xcb14 (the turn's)
function turn083(state, D, own, J, r1, r2, r3){
  const n = r3 ? D.tune083.i35 : D.tune083.i36, lim = Math.min(r2 ? 90 : 30, n);
  const M = jointMatrix(J, r2 === 1 ? 102 : 100), T = own.target;
  if (!M || !T){ state.cb10 = f(0.0); return; }
  const w = s32(mla(0.5, atan2f(f(T[0] - M[12]), f(T[2] - M[14])), RAD_TO_U16));
  let d = f(f(u16(w - own.ownerY)) * f(0.0054931640625));
  if (d >= f(180.0)) d = f(d + f(-360.0));
  state.cb10 = d >= f(lim) ? f(lim) : d <= f(-lim) ? f(-lim) : d;
  if (r1 === 1) state.cb14 = f(0.0);
}
function spawn083(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001;
  if (fresh){
    if (a.turn083) turn083(state, D, own, ctx.J, ...a.turn083);
    // a row made at the action's start (phase 0: Elderfrost's L9 M6 sp_01 16 / 18, 0x1060d4c)
    for (const sp of a.spawns) if (sp.at === 'start') make083row(state, D, a, ctx, out, own, state.prevJoints || ctx.J, sp);
    return;
  }
  if (!state.hist || !state.prevJoints) return;
  const J = state.prevJoints;
  for (const sp of a.spawns){
    if (sp.at === 'start' || !pass001(state, f(sp.frame))) continue;
    make083row(state, D, a, ctx, out, own, J, sp);
  }
}
function make083row(state, D, a, ctx, out, own, J, sp){
  {
    if (sp.kind === 'release'){ state.cb0c = 2; return; }                // 0x1060828 / 0x105b730: e+0xcb0c = 2
    if (sp.kind === 'unbuilt'){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why: sp.why }); return; }
""")
rep("""    const why = missing001(own, { facing: true, pos: sp.shell === 'shell01', target: sp.shell === 'shell13' || sp.shell === 'shell00' });
    if (why){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why }); continue; }
    let S = null;
    if (sp.shell === 'shell13'){ state.cb0c = 1; S = make083s13(state, D, sp.mode, J, own, ctx, a.action, sp.frame); }   // 0x10607f8
    else if (sp.shell === 'shell00') S = make00n(state, D, sp.mode, J, own, ctx, a.action, sp.frame);
    else {
      const def = D.shells.shell01;
      S = make001(state, D, 'shell01', { id: def.id, mode: sp.mode, position: own.ownerPos.slice(), angles: ownerWords001(own),
                                         action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S) S.motionId = ctx.ownerMotion;                                 // base01's init: +0x1620 = the owner's +0x4b4
    }
    if (S){ state.shells.push(S); out.spawned.push(S); }
  }
}""",
"""    const why = missing001(own, { facing: true, pos: sp.shell === 'shell01' || sp.kind === 'turnShot', target: sp.shell === 'shell13' || sp.shell === 'shell00' });
    if (why){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why }); return; }
    let S = null;
    if (sp.shell === 'shell13'){ state.cb0c = 1; S = make083s13(state, D, sp.mode, J, own, ctx, a.action, sp.frame); }   // 0x10607f8 / 0x105b704
    else if (sp.kind === 'turnShot'){
      // 0x1060aa4 (READ whole; Elderfrost's L9 M15 at 95): sp_00 4 at joint 157's world point (0xc164c) with y = the owner's + 100,
      // the words (0, uxth(s32(0.5 + e+0xcb10 x 182.04) + the owner's Y word), 0) -- the zero vector's x / z; the reader aims them
      const M = jointMatrix(J, 157);
      if (!M){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why: 'no joint 157' }); return; }
      const pt = [f(M[12]), f(own.ownerPos[1] + f(100.0)), f(M[14])];
      const yw = u16(s32(mla(0.5, state.cb10 || f(0.0), DEG_TO_U16)) + (own.ownerY >>> 0));
      S = make00n(state, D, sp.mode, J, Object.assign({}, own, { requestPos: pt, requestAngles: [0, yw, 0] }), ctx, a.action, sp.frame);
    }
    else if (sp.shell === 'shell00') S = make00n(state, D, sp.mode, J, own, ctx, a.action, sp.frame);
    else {
      const def = D.shells.shell01;
      // (0x1060d4c, `zero`: the zero vector's point, the owner's block words +0x50.. whole; else 0x105f4ac's point and low halves)
      S = make001(state, D, 'shell01', { id: def.id, mode: sp.mode, position: sp.zero ? [0, 0, 0] : own.ownerPos.slice(),
                                         angles: sp.zero ? [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0] : ownerWords001(own),
                                         action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S) S.motionId = ctx.ownerMotion;                                 // base01's init: +0x1620 = the owner's +0x4b4
    }
    if (S){ state.shells.push(S); out.spawned.push(S); }
  }
}""")

# Elderfrost's data and rows, after Gammoth's
blk = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\elderfrost.js', encoding='utf8').read()
anchor = "  act083(0x5c, 'Motion[37]', [{ frame: 172, shell: 'shell01', mode: 38 }], { also: [[7, 0x5d]] }),\n];\n"
rep(anchor, anchor + blk)
# the dispatch: the setter's clear for both variants
rep("  if (fresh && state.monId === 'em083_00' && !snow083(a)) state.cb0c = 0;",
    "  if (fresh && (state.monId === 'em083_00' || state.monId === 'em083_04') && !snow083(a)) state.cb0c = 0;")
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')
