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
SHELL_DATA.em011_00 = {
  name: 'Kirin',
  lists: { 0: { list: 'u', pel: 'em011_00u' } },
  shells: {
    // shell01: the bolts (u 31 modes 0 / 1, u 30 2 / 3, u 90 4)
    shell01: { id: 0x7e, cls: 'uShellEm011_sp_01', base: 'base01', reader: 0xd74704, folder: 'shell\\em\\em011_00_shell01', modes: {
  0: m057(1.0, [[0, 31]], [0], [0, 0, -1], [2500.0, 2500.0], [[0.0, 0.0, 0.0]]),
  1: m057(1.0, [[0, 31]], [1], [0, 0, -1], [2500.0, 2500.0], [[0.0, 0.0, 0.0]]),
  2: m057(1.0, [[0, 30]], [2], [0, 0, -1], [2500.0, 2500.0], [[0.0, 0.0, 0.0]]),
  3: m057(1.0, [[0, 30]], [3], [0, 0, -1], [2500.0, 2500.0], [[0.0, 0.0, 0.0]]),
  4: m057(1.0, [[0, 90]], [4], [0, 0, -1], [2500.0, 2500.0], [[0.0, 0.0, 650.0]]),
    }, hitdata: [[32, 12], [32, 12], [16, 12], [16, 12], [24, 26]] },
    // shell11: the strike timer (no EffectParam; its +0x168 makes the bolts)
    shell11: { id: 0x7f, cls: 'uShellEm011_sp_11', base: 'base11', reader: 0xd74a00, folder: 'shell\\em\\em011_00_shell11', modes: {
  0: m057(1.0, [], [], [3, 0, 0], [32.0, 64.0, 96.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  1: m057(1.0, [], [], [5, 0, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 0.0], [[150.0, 0.0, 400.0], [-150.0, 0.0, 400.0], [0.0, 0.0, 520.0], [260.0, 0.0, 800.0], [-260.0, 0.0, 800.0], [0.0, 0.0, 0.0]]),
  2: m057(1.0, [], [], [6, 0, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 192.0], [[300.0, 0.0, 300.0], [-300.0, 0.0, 300.0], [500.0, 0.0, 0.0], [-500.0, 0.0, 0.0], [300.0, 0.0, -300.0], [-300.0, 0.0, -300.0]]),
  3: m057(1.0, [], [], [4, 0, -1], [16.0, 32.0, 48.0, 64.0, 0.0, 0.0], [[0.0, 0.0, 400.0], [50.0, 0.0, 800.0], [-100.0, 0.0, 1200.0], [150.0, 0.0, 1600.0], [-200.0, 0.0, 2000.0], [0.0, 0.0, 0.0]]),
  4: m057(1.0, [], [], [5, 0, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 0.0], [[0.0, 0.0, 400.0], [350.0, 0.0, 200.0], [-350.0, 0.0, 200.0], [250.0, 0.0, -250.0], [-250.0, 0.0, -250.0], [0.0, 0.0, 0.0]]),
  5: m057(1.0, [], [], [5, 0, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 0.0], [[-150.0, 0.0, -200.0], [150.0, 0.0, -200.0], [0.0, 0.0, -450.0], [-200.0, 0.0, -600.0], [200.0, 0.0, -600.0], [0.0, 0.0, 0.0]]),
  6: m057(1.0, [], [], [3, -1, 0], [32.0, 64.0, 96.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  7: m057(1.0, [], [], [5, -1, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 0.0], [[150.0, 0.0, 400.0], [-150.0, 0.0, 400.0], [0.0, 0.0, 520.0], [260.0, 0.0, 800.0], [-260.0, 0.0, 800.0], [0.0, 0.0, 0.0]]),
  8: m057(1.0, [], [], [6, -1, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 192.0], [[300.0, 0.0, 300.0], [-300.0, 0.0, 300.0], [500.0, 0.0, 0.0], [-500.0, 0.0, 0.0], [300.0, 0.0, -300.0], [-300.0, 0.0, -300.0]]),
  9: m057(1.0, [], [], [4, -1, -1], [16.0, 32.0, 48.0, 64.0, 0.0, 0.0], [[0.0, 0.0, 400.0], [50.0, 0.0, 800.0], [-100.0, 0.0, 1200.0], [150.0, 0.0, 1600.0], [-200.0, 0.0, 2000.0], [0.0, 0.0, 0.0]]),
  10: m057(1.0, [], [], [5, -1, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 0.0], [[0.0, 0.0, 400.0], [350.0, 0.0, 200.0], [-350.0, 0.0, 200.0], [250.0, 0.0, -250.0], [-250.0, 0.0, -250.0], [0.0, 0.0, 0.0]]),
  11: m057(1.0, [], [], [5, -1, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 0.0], [[-150.0, 0.0, -200.0], [150.0, 0.0, -200.0], [0.0, 0.0, -450.0], [-200.0, 0.0, -600.0], [200.0, 0.0, -600.0], [0.0, 0.0, 0.0]]),
  12: m057(1.0, [], [], [1, 0, 0], [32.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  13: m057(1.0, [], [], [1, -1, 0], [32.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  14: m057(1.0, [], [], [6, 0, -1], [16.0, 32.0, 48.0, 64.0, 80.0, 96.0], [[0.0, 0.0, 400.0], [50.0, 0.0, 700.0], [-100.0, 0.0, 1000.0], [150.0, 0.0, 1300.0], [-200.0, 0.0, 1600.0], [200.0, 0.0, 1900.0]]),
  15: m057(1.0, [], [], [6, -1, -1], [16.0, 32.0, 48.0, 64.0, 80.0, 96.0], [[0.0, 0.0, 400.0], [50.0, 0.0, 700.0], [-100.0, 0.0, 1000.0], [150.0, 0.0, 1300.0], [-200.0, 0.0, 1600.0], [200.0, 0.0, 1900.0]]),
  16: m057(1.0, [], [], [5, 0, -1], [16.0, 32.0, 48.0, 64.0, 80.0, 0.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  17: m057(1.0, [], [], [5, -1, -1], [16.0, 32.0, 48.0, 64.0, 80.0, 0.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  18: m057(1.0, [], [], [6, 0, -1], [16.0, 32.0, 48.0, 64.0, 80.0, 96.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  19: m057(1.0, [], [], [6, -1, -1], [16.0, 32.0, 48.0, 64.0, 80.0, 96.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  20: m057(1.0, [], [], [6, 0, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 192.0], [[150.0, 0.0, 400.0], [-150.0, 0.0, 400.0], [260.0, 0.0, 800.0], [-260.0, 0.0, 800.0], [300.0, 0.0, 100.0], [-300.0, 0.0, 100.0]]),
  21: m057(1.0, [], [], [6, -1, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 192.0], [[150.0, 0.0, 400.0], [-150.0, 0.0, 400.0], [260.0, 0.0, 800.0], [-260.0, 0.0, 800.0], [300.0, 0.0, 100.0], [-300.0, 0.0, 100.0]]),
  22: m057(1.0, [], [], [6, 0, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 192.0], [[-150.0, 0.0, -200.0], [150.0, 0.0, -200.0], [-200.0, 0.0, -600.0], [200.0, 0.0, -600.0], [300.0, 0.0, 0.0], [-300.0, 0.0, 0.0]]),
  23: m057(1.0, [], [], [6, -1, 0], [32.0, 64.0, 96.0, 128.0, 160.0, 192.0], [[-150.0, 0.0, -200.0], [150.0, 0.0, -200.0], [-200.0, 0.0, -600.0], [200.0, 0.0, -600.0], [300.0, 0.0, 0.0], [-300.0, 0.0, 0.0]]),
  24: m057(1.0, [], [], [2, 0, -1], [16.0, 32.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  25: m057(1.0, [], [], [2, -1, -1], [16.0, 32.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  26: m057(1.0, [], [], [6, 0, 0], [16.0, 32.0, 48.0, 64.0, 80.0, 96.0], [[300.0, 0.0, 300.0], [-300.0, 0.0, 300.0], [500.0, 0.0, 0.0], [-500.0, 0.0, 0.0], [300.0, 0.0, -300.0], [-300.0, 0.0, -300.0]]),
  27: m057(1.0, [], [], [5, 0, 0], [16.0, 32.0, 48.0, 64.0, 80.0, 96.0], [[0.0, 0.0, 400.0], [350.0, 0.0, 200.0], [-350.0, 0.0, 200.0], [250.0, 0.0, -250.0], [-250.0, 0.0, -250.0], [0.0, 0.0, 0.0]]),
  28: m057(1.0, [], [], [6, -1, 0], [16.0, 32.0, 48.0, 64.0, 80.0, 96.0], [[300.0, 0.0, 300.0], [-300.0, 0.0, 300.0], [500.0, 0.0, 0.0], [-500.0, 0.0, 0.0], [300.0, 0.0, -300.0], [-300.0, 0.0, -300.0]]),
  29: m057(1.0, [], [], [5, -1, 0], [16.0, 32.0, 48.0, 64.0, 80.0, 96.0], [[0.0, 0.0, 400.0], [350.0, 0.0, 200.0], [-350.0, 0.0, 200.0], [250.0, 0.0, -250.0], [-250.0, 0.0, -250.0], [0.0, 0.0, 0.0]]),
  30: m057(1.0, [], [], [1, 0, 0], [32.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  31: m057(1.0, [], [], [1, -1, 0], [32.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 400.0], [-100.0, 0.0, 600.0], [100.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  32: m057(1.0, [], [], [1, 0, 0], [32.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
  33: m057(1.0, [], [], [1, -1, 0], [32.0, 0.0, 0.0, 0.0, 0.0, 0.0], [[0.0, 0.0, 800.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
    } },
  },
  actions: [
    actPlain(7, 0x03, '2', 'Motion[4]', [{ frame: 22, shell: 'shell11', mode: 0, pos0: true, words0: true }]),
    actPlain(7, 0x04, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 1, pos0: true, words0: true }]),
    actPlain(7, 0x05, '4', 'Motion[7]', [{ frame: 72, shell: 'shell11', mode: 2, pos0: true, words0: true }]),
    actPlain(7, 0x06, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 3, pos0: true, words0: true }]),
    actPlain(7, 0x07, '4', 'Motion[7]', [{ frame: 72, shell: 'shell11', mode: 4, pos0: true, words0: true }]),
    actPlain(7, 0x08, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 5, pos0: true, words0: true }]),
    actPlain(7, 0x09, '2', 'Motion[4]', [{ frame: 22, shell: 'shell11', mode: 6, pos0: true, words0: true }]),
    actPlain(7, 0x0a, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 7, pos0: true, words0: true }]),
    actPlain(7, 0x0b, '4', 'Motion[7]', [{ frame: 72, shell: 'shell11', mode: 8, pos0: true, words0: true }]),
    actPlain(7, 0x0c, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 9, pos0: true, words0: true }]),
    actPlain(7, 0x0d, '4', 'Motion[7]', [{ frame: 72, shell: 'shell11', mode: 10, pos0: true, words0: true }]),
    actPlain(7, 0x0e, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 11, pos0: true, words0: true }]),
    actPlain(7, 0x11, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 14, pos0: true, words0: true }]),
    actPlain(7, 0x12, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 15, pos0: true, words0: true }]),
    actPlain(7, 0x14, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 20, pos0: true, words0: true }]),
    actPlain(7, 0x15, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 21, pos0: true, words0: true }]),
    actPlain(7, 0x16, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 22, pos0: true, words0: true }]),
    actPlain(7, 0x17, '2', 'Motion[4]', [{ frame: 10, shell: 'shell11', mode: 23, pos0: true, words0: true }]),
    actPlain(7, 0x18, '4', 'Motion[4]', [{ frame: 62, shell: 'shell11', mode: 12, pos0: true, words0: true }]),
    actPlain(7, 0x19, '4', 'Motion[4]', [{ frame: 62, shell: 'shell11', mode: 13, pos0: true, words0: true }]),
    actPlain(7, 0x2d, '4', 'Motion[7]', [{ frame: 72, shell: 'shell11', mode: 26, pos0: true, words0: true }]),
    actPlain(7, 0x2e, '4', 'Motion[7]', [{ frame: 72, shell: 'shell11', mode: 27, pos0: true, words0: true }]),
    actPlain(7, 0x2f, '4', 'Motion[7]', [{ frame: 72, shell: 'shell11', mode: 28, pos0: true, words0: true }]),
    actPlain(7, 0x30, '4', 'Motion[7]', [{ frame: 72, shell: 'shell11', mode: 29, pos0: true, words0: true }]),
    actPlain(7, 0x3a, '4', 'Motion[4]', [{ frame: 62, shell: 'shell11', mode: 30, pos0: true, words0: true }]),
    actPlain(7, 0x3b, '4', 'Motion[4]', [{ frame: 62, shell: 'shell11', mode: 31, pos0: true, words0: true }]),
    actPlain(7, 0x40, '4', 'Motion[30]', [{ frame: 62, shell: 'shell11', mode: 33, pos0: true, words0: true }], { also: [[7, 0x41], [7, 0x42]] }),
    actPlain(7, 0x43, '4', 'Motion[31]', [{ frame: 62, shell: 'shell11', mode: 33, pos0: true, words0: true }], { also: [[7, 0x44], [7, 0x45]] }),
    actPlain(7, 0x46, '4', 'Motion[30]', [{ frame: 62, shell: 'shell11', mode: 32, pos0: true, words0: true }], { also: [[7, 0x47], [7, 0x48]] }),
    actPlain(7, 0x49, '4', 'Motion[31]', [{ frame: 62, shell: 'shell11', mode: 32, pos0: true, words0: true }], { also: [[7, 0x4a], [7, 0x4b]] }),
    actPlain(7, 0x1b, '4', 'Motion[9]', [{ frame: 115, shell: 'shell01', mode: 4 }]),
    actPlain(1, 0x0a, '0', 'Motion[3]', [{ at: 'start', shell: 'shell11', mode: 12, pos0: true, words0: true }]),
    actPlain(1, 0x0b, '0', 'Motion[3]', [{ at: 'start', shell: 'shell11', mode: 13, pos0: true, words0: true }]),
  ],
};
