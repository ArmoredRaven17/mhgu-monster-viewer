src = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-redhelm-lagombi-check.mjs'
dst = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-duramboros-check.mjs'
s = open(src, encoding='utf8').read()
def cut(a, b):
    i = s.index(a); j = s.index(b, i)
    return i, j
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:70])
    s = s.replace(a, b)

i = s.index('import { writeFileSync')
head = r'''// Duramboros's (em061_00) shells in render/shells.js against the ROM -- uEm061_00's sp_00 (base00), sp_01 and sp_19 (base19, the
// rolling ball). Rustrum (em061_04: sp_13, sp_24, the variant-4 readers) is not built yet.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers, the getters answered with em061_00.arc's shell files (sp_19's cmn FUP by its type). The setups are the class's
//      OWN CODE: its action main 0xf32798 with the action (7, n) at e+0x73e0, the id fields e+0xcac8..+0xcad8 as vt+0x158 0xf23ec0
//      writes them, the phase, and the frame tests answered (0xb0968's window, 0xb0974's frame). Each shell is flown from the setup
//      the ROM built, its children (sp_01 from a lump's contact) from theirs; every init / move / effect start bit for bit.
//   2. The contract: the pick lists, the modes his file lacks (7 / 8: nothing made).
//   3. CONTROLS: a wrong joint, a wrong facing, a moved floor must FAIL the comparison.
//
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): L2 M28 / L2 M46 spawn their shells and start their records;
//      every exported shell record starts and runs out with no refusal.
//
//   node dev/shells-duramboros-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-duramboros-check.mjs         (4: the viewer)
//
// Exit code 1 when anything fails.
'''
s = head + s[i:]
a, b = cut("  const OW = [0, 0x3000, 0]", "  for (const c of cases) c.folders = F060;")
cases = r'''  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const IDS = { '0xcac8': [5, 1, 0, 0], '0xcacc': [6, 1, 0, 0], '0xcad0': [0x9d, 1, 0, 0], '0xcad4': [7, 1, 0, 0], '0xcad8': [0x9d, 1, 0, 0] };
  const C = (name, list, clip, n, F, x = {}) => Object.assign({ name, mon: 'em061_00', list, clip, variant: '7:0x' + n.toString(16).padStart(2, '0'),
    steps: [{ fn: 'f32798', phase: 1, win: x.win ? 1 : 0, frame: F }], owner: OW, ownerPos: OP, target: TG, floorY: 0.0, ground: 0.0,
    size: [1.0, 1.0], base: 1.0, len: 300, rank: 5, quest: 10, emVariant: 0, owner_bytes: Object.assign({ '0x73e0': [7, n] }, IDS),
    joints: { 0: J0, 9: J0b, 14: J140 } }, x);
  const F061 = { 0x105: ['em061_00', '00'], 0x106: ['em061_00', '01'], 0x107: ['em061_00', '19'] };
  const cases = [
    // sp_00 at the window (0xb0968 mode 0): L2 M28 120 / L2 M22 120 / L2 M21 50 / L2 M23 50; L2 M56 110 the lumps 4..6
    C('dm_rock_46', '2', 'Motion[28]', 0x46, 120, { win: 1, len: 200 }),
    C('dm_rock_49', '2', 'Motion[22]', 0x49, 120, { win: 1, len: 200, owner: [0, 0xa000, 0] }),
    C('dm_rock_47', '2', 'Motion[21]', 0x47, 50, { win: 1, len: 200 }),
    C('dm_rock_4f', '2', 'Motion[28]', 0x4f, 120, { win: 1, len: 200, ownerPos: [-300.0, 60.0, 400.0] }),
    C('dm_rock_96', '2', 'Motion[22]', 0x96, 120, { win: 1, len: 200 }),
    C('dm_rock_e6', '2', 'Motion[28]', 0xe6, 120, { len: 200 }),
    C('dm_lump_ad', '2', 'Motion[56]', 0xad, 110, { win: 1, len: 200 }),
    C('dm_lump_af', '2', 'Motion[56]', 0xaf, 110, { win: 1, len: 200, owner: [0, 0x5000, 0] }),
    // sp_19 the ball: L2 M46 f94 (mode 0), L2 M56 f110 (mode 1)
    C('dm_ball_6f', '2', 'Motion[46]', 0x6f, 94, { len: 200 }),
    C('dm_ball_6f_turned', '2', 'Motion[46]', 0x6f, 94, { len: 200, owner: [0, 0xc321, 0] }),
    C('dm_ball_7d', '2', 'Motion[56]', 0x7d, 110, { len: 200 }),
  ];
'''
s = s[:a] + cases + s[b:].replace("  for (const c of cases) c.folders = F060;", "  for (const c of cases) c.folders = F061;", 1)
rep("join(tmpdir(), 'rhlgshells-')", "join(tmpdir(), 'dmshells-')")
rep("const BASE = { 0x103: 'base00', 0x104: 'base01', 0x10d: 'base00', 0x10e: 'base01' };", "const BASE = { 0x105: 'base00', 0x106: 'base01', 0x107: 'base19' };")
# base19 compared as base00 (its launch / moves); the life is +0x162c
rep("    if (base === 'base00' || base === 'base13'){\n      const ln = S0.launch;", "    if (base === 'base00' || base === 'base13' || base === 'base19'){\n      const ln = S0.launch;")
rep("      if (base === 'base00' || base === 'base13'){\n        if (!eqv(s.vel, fr.vel))", "      if (base === 'base00' || base === 'base13' || base === 'base19'){\n        if (!eqv(s.vel, fr.vel))")
a, b = cut("  // ---- 2. the contract", "  console.log(`\\n${pass} passed")
mid = r'''  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  const byName = n => cases.find(c => c.name === n);
  ok(pv('em061_00', '2', 'Motion[28]') === '["7:0x46","7:0x4d","7:0x4f","7:0xe6"]', 'L2 M28 picks its four', pv('em061_00', '2', 'Motion[28]'));
  ok(pv('em061_00', '2', 'Motion[56]') === '["7:0xad","7:0xae","7:0xaf","7:0x7d"]', 'L2 M56 picks the lumps and the ball', pv('em061_00', '2', 'Motion[56]'));

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  for (const [n, over, what] of [
    ['dm_rock_46', { joints: { 0: J0, 9: J0b, 14: J50 } }, 'another joint 14'],
    ['dm_rock_49', { owner: [0, 0xa001, 0] }, 'the facing one word off'],
    ['dm_lump_ad', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the contact, the shell01)'],
    ['dm_ball_6f', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the ball rides the ground)'],
    ['dm_ball_7d', { joints: { 0: J0, 9: J0b, 14: J50 } }, 'another joint 14 (the ball)'],
  ]){
    const { why } = compare(byName(n), over);
    ok(!!why, 'CONTROL ' + n + ' with ' + what + ' fails', why || 'it matched');
  }

'''
s = s[:a] + mid + s[b:]
a = s.index("  MON = 'em060_04';")
b = s.index("  for (const [mon, keys] of [")
page = r'''  MON = 'em061_00';
  check(await open(), 'Duramboros: his runtime is up');
  {
    await pick('2', 'Motion[28]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && x.key === 0 && x.req), 'L2 M28: a rock, shell00, u 0 started', w);
  }
  {
    await pick('2', 'Motion[46]');
    const w = await watch(200, x => x.some(y => y.shell === 'shell19'));
    check(w.some(x => x.shell === 'shell19' && x.mode === 0 && x.key === 13 && x.req), 'L2 M46: the ball, shell19 0, u 13 started', w);
  }
'''
s = s[:a] + page + s[b:]
rep("  for (const [mon, keys] of [['em060_04', [20, 30, 40, 50, 0, 10]], ['em062_00', [0, 1, 2]]]){", "  for (const [mon, keys] of [['em061_00', [0, 1, 2, 10, 11, 12, 13]]]){")
rep("'Redhelm / Lagombi shells: '", "'Duramboros shells: '")
rep("let MON = 'em060_04';", "let MON = 'em061_00';")
open(dst, 'w', encoding='utf8').write(s)
print('ok')
