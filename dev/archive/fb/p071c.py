P = [r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js', 'gore.js']
a = """      if (h == null || !(f(O[1] - h) < f(500.0))) continue;
    }
    if (sp.shell === 'shell00'){
      const S = make00n(state, D, sp.mode, J, Object.assign({}, own, { requestPos: [0, 0, 0], requestAngles: [0, 0, 0] }), ctx, a.action, sp.frame);"""
b = """      if (h == null || !(f(O[1] - h) < f(500.0))) continue;
    }
    if (sp.foot){ foot071(state, D, a, sp, own, J, ctx, out); continue; }
    if (sp.shell === 'shell00'){
      const S = make00n(state, D, sp.mode, J, Object.assign({}, own, { requestPos: [0, 0, 0], requestAngles: [0, 0, 0] }), ctx, a.action, sp.frame);"""
c = """const act071 = """
d = """// THE FOOTFALL DUST 0xfb700c(e, joint, frame s0, x s1, z s2) (READ whole; its callers' gates READ): the frame test alone (0xb0974);
// the point = joint's position (0xc164c; joint 0: the block's +0x40) + (x cos Y + z sin Y, 0, z cos Y - x sin Y), Y the block's word
// +0x54; the ray 0x183664 down from it (ground022); a hit with block +0x44 - the ground < 1000 -> sp_01 (e+0xcac8) mode 1 at (x, the
// ground, z), +0x20 and the words the GOT zeros, +0x3c 0xffff. The callers (0xfb63d0 and the rest): quest rank >= 5 (0x3a8430; the
// rank's meaning INFERRED: owner001's), then Shagaru (em 0x48, variant 0) always; Chaotic (em 0x47, variant 5) only with the class
// block's counter C+0x84 at or past the table 0x16a1294's three tiers [rank class] (5000 / 10000 / 20000 for every class; the class 2
// for rank 4..6, 1 for 2..3, else 0) -- input.gauge071, default 0 (its writers: the per-frame 0xfae824..0xfaee44 and 0xfadc58, the
// reset (7, n) 0xfbc4ec -- NOT TRANSCRIBED: the viewer takes the value as an input); Gore (variant 0) never (his file has no mode 1)
const GAUGE071 = [[5000, 5000, 5000], [10000, 10000, 10000], [20000, 20000, 20000]].map(r => r.map(f));
function foot071(state, D, a, sp, own, J, ctx, out){
  if (!pass001(state, f(sp.frame))) return;
  if (!(own.rank >= 5)) return;
  if (sp.foot.gauge){
    const r = own.rank, c = ((r - 4) >>> 0) < 3 ? 2 : ((r - 2) >>> 0) <= 1 ? 1 : 0, g = f(ctx.gauge071 || 0);
    if (!(g >= GAUGE071[0][c]) || !(g >= GAUGE071[1][c]) || !(g >= GAUGE071[2][c])) return;
  }
  const [joint, x, z] = sp.foot.at;
  let B;
  if (joint !== 0){ const M = jointMatrix(J, joint); if (!M){ out.refused.push({ action: a.action, shell: 'shell01', mode: 1, why: 'no joint ' + joint }); return; } B = [f(M[12]), f(M[13]), f(M[14])]; }
  else B = own.ownerPos.slice();
  const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const px = f(B[0] + mla(f(cs * f(x)), sn, f(z))), pz = f(B[2] + mls(f(cs * f(z)), sn, f(x)));
  const p = [px, f(B[1] + f(0.0)), pz];
  const h = ground022(p, ctx.stage);
  if (h == null || !(f(own.ownerPos[1] - h) < f(1000.0))) return;
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: 1, position: [px, h, pz], angles: [0, 0, 0], action: a.action, frame: sp.frame }, own, J, ctx, null);
  if (S){ state.shells.push(S); out.spawned.push(S); }
}
const act071 = """
for p in P:
    s = open(p, encoding='utf8').read()
    assert s.count(a) == 1 and s.count(c) == 1, p
    s = s.replace(a, b).replace(c, d)
    open(p, 'w', encoding='utf8').write(s)
print('ok')
