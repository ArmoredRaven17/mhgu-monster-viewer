// ---- KIRIN (em011_00): uEm011_00's lightning -- sp_11 0x7f (base11, the strike timer) and its bolts sp_01 0x7e (base01) ----------------
// READ 2026-10-18 (dev/elder-dragon-shells-spec.md 1). Ids immediates (vt+0x158 0xd6d010; the makers' `mov #0x7f` / `mov #0x7e`). Census
// (cengen11, all 16 statuses, the .dtp filled; clips fb/motqx.py): the actions' phase 1 at a frame, (1, 0xa / 0xb) at their phase 0 (the
// play's start) -- the sp_11 setups' point and words GOT zero vectors (0xd70c00..0xd70c3c), (7, 0x1b)'s sp_01 4 the block point and words.
// sp_01's reader 0xd74704 (READ whole): ef 0; hit 0; +0x15ec 4 int 0, 8 int 1, 1 int 2; floats 0 / 1 -> the snap's reach +0x15f4 / +0x15f8;
// vec 0 -> +0x1608; the timer the ctor's 0. Its +0x150 0xd74808 (modes <= 3: +0x1000 = +0x40 plus constants) is the hit side's: not visual
function params011s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { flags: (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0) | (I(2) !== -1 ? 1 : 0), joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0),
           vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0], up: F(0), down: F(1), maxH: f(900.0),
           why: !sh ? 'uShellEm011_sp_01: a mode its files do not carry' : null, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xd74704] = sh => params011s01(sh);
// sp_11's reader 0xd74a00 (READ whole): the count +0x1658 = int 0 (>= 1) and the times +0x1654[k] = float k; +0x165c = int 2 (0: base11's
// init divides the times by the owner's motion speed); byte +0x168c = int 1 != -1; +0x1670.. = the owner's block point +0x40, +0x167c = 0,
// +0x1680..+0x1688 = the block's words +0x50... No base01 field (flags 0, timer 0, vec the zero vector)
function params011s11(def, mode, got){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const n = I(0) >= 1 ? I(0) : 0, table = [];
  for (let k = 0; k < n; k++) table.push(F(k));
  if (!got.ownerPos) return { why: 'no owner position' };
  return { flags: 0, joint: -1, timer: 0, f1600: 0, f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0), table,
           i165c: I(2), b168c: I(1) !== -1, base: got.ownerPos.slice(), words: [got.ownerX >>> 0, got.ownerY >>> 0, got.ownerZ >>> 0] };
}
READERS11[0xd74a00] = (def, mode, got) => params011s11(def, mode, got);
// sp_11's +0x168 0xd74bf4(shell, k) (READ whole): the owner active (always here); the point = +0x1670 + sh vec k turned by the kept Y word
// +0x1684 (x cos + z sin, z cos - x sin); then by the mode (0x4a0ee4): in 0x030f0000 (16..19, 24, 25) +0x1670 = the owner's CURRENT
// block point, +0x167c = 0 (the next strike's base); in 0x3000 (12, 13) the point = the target block +0x1d0; in 0xc0000000 (30, 31)
// the target with y + 20, then the floor query 0x183490 from the target up to it (mask 0x10): a hit -> y = the hit's. Then sp_01 0x7e
// mode: in 0x030f0000 (<= 0x19) byte +0x168c ? 2 : 3, else ? 0 : 1 -- +0x10 the point, +0x30 0 / +0x34 the kept Y word / +0x38 0
function create011s11(S, idx, ctx, D){
  const k = S.k, sh = S.mode.sh, v = idx < sh.vecs.length ? sh.vecs[idx].map(f) : [0, 0, 0], m = S.modeIndex;
  const Y = k.words[1], r = f(u16(Y) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), B = k.base;
  let p = [f(B[0] + mla(f(v[0] * cs), v[2], sn)), f(v[1] + B[1]), f(mls(f(v[2] * cs), v[0], sn) + B[2])];
  const bit = x => m <= 0x1f && ((x >>> m) & 1);
  const own = ctx.own001;
  if (bit(0x030f0000)){ if (own.ownerPos) k.base = own.ownerPos.slice(); }
  else if (bit(0x3000)){
    if (!own.target){ ctx.out.refused.push({ shell: 'shell11', mode: m, why: 'no target (input.rock.target)' }); return; }
    p = own.target.slice();
  } else if (bit(0xc0000000)){
    if (!own.target){ ctx.out.refused.push({ shell: 'shell11', mode: m, why: 'no target (input.rock.target)' }); return; }
    const T = own.target, up = [T[0], f(T[1] + f(20.0)), T[2]];
    p = up.slice();
    const q = stageQuery(T, up, ctx.stage, 0x10);
    if (q) p[1] = q.point[1];
  }
  const child = (m <= 0x19 && bit(0x030f0000)) ? (k.b168c ? 2 : 3) : (k.b168c ? 0 : 1);
  ctx.create(S, 'shell01', { mode: child, angles: [0, Y >>> 0, 0], position: p });
}
CREATE11.uShellEm011_sp_11 = (S, idx, ctx, D) => create011s11(S, idx, ctx, D);
