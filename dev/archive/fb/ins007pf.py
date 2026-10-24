p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'
BS = chr(92)
def rep(a, b):
    global s
    a = a.replace('\n', NL); b = b.replace('\n', NL)
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)

# 1. params007s01: the 0x70 (Diablos) map
rep("""function params007s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? 0 : i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
""", """function params007s01(sh, def){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? 0 : i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  // DIABLOS's 0x70 side (0xd468d8..0xd46978, READ; rom-map `0x70` map; shells agent 2026-10-19): int 0 -> bit 2 (0x4), int 1 -> bit 11
  // (0x800), int 2 -> bit 7 (0x80); float 0 -> the timer +0x15f0; vec 0 -> +0x1608. No joint (+0x15e4 the ctor's -1), no vec 1
  if (def && def.id === 0x70){
    const fl = (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 0x800 : 0) | (I(2) !== -1 ? 0x80 : 0);
    return { flags: fl, joint: -1, timer: F(0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), deg: [0, 0, 0],
             up: f(500.0), down: f(500.0), maxH: f(900.0),
             why: !sh ? 'uShellEm007_04_01 (0x70): a mode SHELL_DATA does not carry' : (fl & 0x800) ? 'uShellEm007_04_01 (0x70): base01 flag 0x800 not transcribed' : null,
             efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
  }
""")
rep("0xd46770: params007s01,", "0xd46770: (sh, def) => params007s01(sh, def),")

# 2. Bloodbath modes 10..12 + the rows
rep("""        7: { scale: 1.100000023841858, ef: [[0, 300]], hit: [8], sh: { ints: [-1, -1, -1, -1, -1], floats: [0.0], vecs: [[0, 0, 0], [0, 0, 0]] } },
      },
      hitdata: [[0, 20], [14, 10], [14, 10], [14, 10], [0, 30], [0, 30], [0, 30], [0, 20], [50, 10]],
    },""", """        7: { scale: 1.100000023841858, ef: [[0, 300]], hit: [8], sh: { ints: [-1, -1, -1, -1, -1], floats: [0.0], vecs: [[0, 0, 0], [0, 0, 0]] } },
        // (shells agent, 2026-10-19) the frame handler's dust (perFrame007): ef list 1 = em007_00c, c 0 / 2 / 1
        10: { scale: 1.0, ef: [[1, 0]], hit: [1], sh: { ints: [-1, 0, -1, -1, 0], floats: [0.0], vecs: [[0, 0, 100], [0, 0, 0]] } },
        11: { scale: 1.0, ef: [[1, 2]], hit: [2], sh: { ints: [-1, 0, -1, -1, 0], floats: [0.0], vecs: [[0, 0, 0], [0, 0, 0]] } },
        12: { scale: 1.0, ef: [[1, 1]], hit: [3], sh: { ints: [-1, 0, -1, -1, 0], floats: [0.0], vecs: [[0, 0, 0], [0, 0, 0]] } },
      },
      hitdata: [[0, 20], [14, 10], [14, 10], [14, 10], [0, 30], [0, 30], [0, 30], [0, 20], [50, 10]],
    },""")
rep("SHELL_DATA.em007_04 = SHELL007;\n", """SHELL_DATA.em007_04 = SHELL007;
// DIABLOS (em007_00) AND BLOODBATH (em007_04) -- THE FRAME HANDLER'S DUST (shells agent, 2026-10-19; dev/em007-shells-spec.md 2f,
// dev/shells-diablos-check.mjs). uEm007_00's vt+0x208 0xd35a94 (READ: the rom-map `0xd35a94` row) switches on the motion id (0xb0944)
// and at a channel-0 crossing (0xb09a4(e, 0, F)) makes shell01 -- 0x70 (em007_00) / 0x71 (em007_04), literals -- through the helpers
// 0xd36a0c.. (0x3fa2bc(0x40): +8 the mode, +0x10.. the BLOCK's +0x40.., +0x30.. his words e+0xfe8.., +0x3c 0xffff; `b 0x48b884` at
// 0xd36ac8). No other gate (rage / tiredness / the action make no difference, emulated). Its default arm (ctl+0x24 != 0, status 6:
// the action-index table 0xd36510) only stops / clears an effect handle, ctl+0x24 -- no shell. Sites (pfgen, both variants alike):
const PERFRAME007 = [
  { ids: [0x018], frames: [58], mode: 11, site: 0xd362ac },          // L0 M24
  { ids: [0x021, 0x02b], frames: [2], mode: 12, site: 0xd35c90 },    // L0 M33 / M43
  { ids: [0x101], frames: [6, 76], mode: 10, site: 0xd36424 },       // L1 M1
  { ids: [0x104], frames: [2], mode: 10, site: 0xd36424 },           // L1 M4
  { ids: [0x111], frames: [2], mode: 11, site: 0xd36458 },           // L1 M17
  { ids: [0x113], frames: [2], mode: 11, site: 0xd36488 },           // L1 M19
];
SHELL007.perFrame007 = PERFRAME007;
SHELL_DATA.em007_00 = {
  name: 'Diablos',
  lists: { 0: { list: 'c', pel: 'em007_00c' } },
  actions: [],
  shells: {
    // shell01: global id 0x70, uShellEm007_04_01 (the same class as Bloodbath's 0x71; its reader 0xd46770's 0x70 map), base01. Files
    // em007_00.arc shell@@BS@@em@@BS@@em007_00_shell01 (13 entries, modes 10..12; EffectLists [em007_00c]); hitdata (14, 10) x 3
    shell01: {
      id: 0x70, cls: 'uShellEm007_04_01', base: 'base01', reader: 0xd46770, folder: 'shell@@BS@@@@BS@@em@@BS@@@@BS@@em007_00_shell01',
      lists: { 0: { list: 'c', pel: 'em007_00c' } },
      modes: {
        10: { scale: 1.0, ef: [[0, 0]], hit: [0], sh: { ints: [0, -1, 0], floats: [0.0], vecs: [[0, 0, 100]] } },
        11: { scale: 1.0, ef: [[0, 2]], hit: [1], sh: { ints: [0, -1, 0], floats: [0.0], vecs: [[0, 0, 0]] } },
        12: { scale: 1.0, ef: [[0, 1]], hit: [2], sh: { ints: [0, -1, 0], floats: [0.0], vecs: [[0, 0, 0]] } },
      },
      hitdata: [[14, 10], [14, 10], [14, 10]] },
  },
  perFrame007: PERFRAME007,
};
""".replace('@@BS@@@@BS@@', BS + BS).replace('@@BS@@', BS))

# 3. the handler
rep("function spawnDrip(state, D, a, m, J, ctx, got){", """// Diablos's / Bloodbath's frame handler 0xd35a94 (D.perFrame007): line 4, after the action -- shell01 at his point and words
function perFrame007(state, D, ctx, input, out, fresh){
  if (fresh || !state.hist) return;
  const mid = motionIdOf(input.list, input.clip);
  const row = mid == null ? null : D.perFrame007.find(r => r.ids.includes(mid));
  if (!row) return;
  for (const F of row.frames){
    if (!pass001(state, f(F))) continue;
    const own = ctx.own001, why = missing001(own, { facing: true, pos: true, ground: true });
    if (why){ out.refused.push({ perFrame: mid, shell: 'shell01', mode: row.mode, why }); continue; }
    const def = D.shells.shell01;
    const S = make001(state, D, 'shell01', { id: def.id, mode: row.mode, position: own.ownerPos.slice(), angles: ownerWords001(own), frame: F },
                      own, state.prevJoints || ctx.J, ctx, null);
    if (S){ S.perFrame = mid; state.shells.push(S); out.spawned.push(S); }
  }
}

function spawnDrip(state, D, a, m, J, ctx, got){""")
rep("  if (D.perFrame) perFrame003(state, D, ctx, input, out, fresh);",
    "  if (D.perFrame) perFrame003(state, D, ctx, input, out, fresh);\n  if (D.perFrame007) perFrame007(state, D, ctx, input, out, fresh);   // Diablos's / Bloodbath's dust (0xd35a94), line 4")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
