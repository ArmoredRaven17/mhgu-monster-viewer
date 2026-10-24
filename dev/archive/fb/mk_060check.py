src = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-blangonga-check.mjs'
dst = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-redhelm-lagombi-check.mjs'
s = open(src, encoding='utf8').read()

def cut(a, b):
    i = s.index(a); j = s.index(b, i)
    return i, j
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:70])
    s = s.replace(a, b)

i = s.index('import { writeFileSync')
head = r'''// Redhelm Arzuros's (em060_04) and Lagombi's (em062_00) shells in render/shells.js against the ROM -- uEm060_00's spawners. (Arzuros,
// em060_00, ships no shell file: none.)
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers, the getters answered with em060_04.arc's / em062_00.arc's shell files. The setups are the class's OWN CODE run on
//      the ROM: Redhelm's throw 0xf1d284 (L9 M9 f122) and slam (L9 M1, (7, 0xff) 0xf1de18 at the window 116: the dust 0xf189d8 with its
//      ground probe 0x49a90 on the floor plane), Lagombi's 0xf1ff90(e, k) (L2 M28 / M37 at the window 68). Each shell flown from the
//      setup the ROM built; Lagombi's snowball (life = hit slot 0) with slot 0 held on (`slot0`, as input.hitLife has it), and the
//      shell01 its floor contact leaves from the setup the ROM built for it; every init / move / effect start bit for bit.
//   2. The contract: the pick lists, the quest-level dust, the once-a-play slam.
//   3. CONTROLS: a wrong target, a wrong facing, a wrong joint, a moved floor, a wrong owner point must FAIL the comparison.
//
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): Redhelm's L9 M9 / L9 M1 and Lagombi's L2 M28 spawn their
//      shells and start their records; every exported shell record starts and runs out with no refusal.
//
//   node dev/shells-redhelm-lagombi-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-redhelm-lagombi-check.mjs         (4: the viewer)
//
// Exit code 1 when anything fails.
'''
s = head + s[i:]

a, b = cut("  const OW = [0, 0x3000, 0]", "  for (const c of cases) c.folders = F022;")
cases = r'''  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const C = (name, mon, list, clip, variant, steps, x = {}) => Object.assign({ name, mon, list, clip, variant, steps, owner: OW,
    ownerPos: OP, target: TG, floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, len: 300, rank: 5, quest: 10, emVariant: mon === 'em060_04' ? 4 : 0,
    joints: { 0: J0, 5: J140 } }, x);
  const fr = (fn, frames, x = {}) => frames.map(F => Object.assign({ fn, frame: F }, x));
  const F060 = { 0x103: ['em060_04', '00'], 0x104: ['em060_04', '01'], 0x10d: ['em062_00', '00'], 0x10e: ['em062_00', '01'] };
  const cases = [
    // Redhelm: the throw (7, 0xf5) 0xf1d284 phase 1, L9 M9 f122 -> sp_00 0, aimed X and Y from his point (flags 1 | 2, joint -1)
    C('rh_throw', 'em060_04', '9', 'Motion[9]', null, fr('f1d284', [122], { phase: 1 }), { len: 200 }),
    C('rh_throw_side', 'em060_04', '9', 'Motion[9]', null, fr('f1d284', [122], { phase: 1 }), { len: 200, target: [-1500.0, 300.0, 600.0], owner: [0, 0xa234, 0] }),
    C('rh_throw_tilt', 'em060_04', '9', 'Motion[9]', null, fr('f1d284', [122], { phase: 1 }), { len: 200, owner: [0x0300, 0x3000, 0], target: [400.0, -600.0, 900.0], floorY: -700.0, ground: -700.0 }),
    // the slam: (7, 0xff) 0xf1de18 phase 1, the window (0xb0968 mode 1 at 116) -> 0xf189d8: quest 10 -> sp_01 4, quest 5 -> 1
    C('rh_slam_q10', 'em060_04', '9', 'Motion[1]', null, [{ fn: 'f1de18', phase: 1, win: 1, frame: 116 }], { len: 200 }),
    C('rh_slam_q5', 'em060_04', '9', 'Motion[1]', null, [{ fn: 'f1de18', phase: 1, win: 1, frame: 116 }], { len: 200, quest: 5, owner: [0, 0x5555, 0] }),
    // the probe from 200 above the point: the floor below it (the ground's y) / above it (no hit: the point's own y)
    C('rh_slam_high', 'em060_04', '9', 'Motion[1]', null, [{ fn: 'f1de18', phase: 1, win: 1, frame: 116 }], { len: 200, ownerPos: [40.0, 650.0, -20.0] }),
    C('rh_slam_buried', 'em060_04', '9', 'Motion[1]', null, [{ fn: 'f1de18', phase: 1, win: 1, frame: 116 }], { len: 200, floorY: 600.0, ground: 600.0 }),
    // Lagombi: 0xf1ff90(e, k) phase 1, the window (mode 0 at 68): k 0 / 1 / 2 -> sp_00 0 / 1 / 2 (L2 M28), 4 -> 3 (L2 M37, joint 5)
    ...[[0, 0, '7:0x56', {}], [1, 1, '7:0x57', { owner: [0, 0xc000, 0] }], [2, 2, '7:0x65', { ownerPos: [-300.0, 120.0, 500.0] }]].map(([k, m, v, x]) =>
      C('lg_ball_' + m, 'em062_00', '2', 'Motion[28]', v, [{ fn: 'f1ff90', args: [k], phase: 1, win: 1, frame: 68 }], Object.assign({ len: 180, slot0: true, hitLife: true }, x))),
    C('lg_ball_3', 'em062_00', '2', 'Motion[37]', null, [{ fn: 'f1ff90', args: [4], phase: 1, win: 1, frame: 68 }], { len: 180, slot0: true, hitLife: true }),
  ];
'''
s = s[:a] + cases + s[b:].replace("  for (const c of cases) c.folders = F022;", "  for (const c of cases) c.folders = F060;", 1)
rep("mon: c.mon, folders: c.folders, variant: 0,", "mon: c.mon, folders: c.folders, variant: c.emVariant || 0,")
rep("owner_bytes: c.owner_bytes || null, block: c.block || null,", "owner_bytes: c.owner_bytes || null, block: c.block || null, slot0: !!c.slot0,")
rep("join(tmpdir(), 'blshells-')", "join(tmpdir(), 'rhlgshells-')")
rep("const BASE = { 0xa4: 'base00', 0xa5: 'base01', 0xa6: 'base13' };", "const BASE = { 0x103: 'base00', 0x104: 'base01', 0x10d: 'base00', 0x10e: 'base01' };")
s = s.replace("hitLife: false, rank: x.rank, questLevel: x.quest, charged: !!x.charged,\n        action: x.action", "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, charged: !!x.charged,\n        action: x.action")

a, b = cut("  // ---- 2. the contract", "  console.log(`\\n${pass} passed")
mid = r'''  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  const byName = n => cases.find(c => c.name === n);
  const shells = (c, over) => [...runJS(c, over).info.values()].map(I => I.S.shell + ':' + I.S.modeIndex);
  ok(pv('em062_00', '2', 'Motion[28]') === '["7:0x56","7:0x57","7:0x65"]', 'Lagombi L2 M28 picks the three balls', pv('em062_00', '2', 'Motion[28]'));
  ok(shells(byName('rh_slam_q10')).join() === 'shell01:4' && shells(byName('rh_slam_q5')).join() === 'shell01:1', 'the slam\'s dust: 4 above quest level 8, 1 at or below');
  {
    const J = runJS(Object.assign({}, byName('rh_slam_q10'), { quest: null }));
    ok(J.info.size === 0 && J.refused.length === 1 && /quest level/.test(J.refused[0].why), 'no quest level: the slam refused by name', J.refused);
  }

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  for (const [n, over, what] of [
    ['rh_throw', { target: [900.0, 140.0, 2400.0] }, 'the target 100 higher (the X aim)'],
    ['rh_throw_side', { target: [-1490.0, 300.0, 600.0] }, 'the target 10 aside (the Y aim)'],
    ['rh_slam_q10', { owner: [0, 0x3001, 0] }, 'the facing one word off (the dust point)'],
    ['rh_slam_high', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the probe)'],
    ['lg_ball_3', { joints: { 0: J0, 5: J50 } }, 'another joint 5'],
    ['lg_ball_0', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the contact, the shell01)'],
  ]){
    const { why } = compare(byName(n), over);
    ok(!!why, 'CONTROL ' + n + ' with ' + what + ' fails', why || 'it matched');
  }

'''
s = s[:a] + mid + s[b:]

a = s.index("  check(await open(), 'his runtime is up');")
b = s.index("  for (const key of [0, 10, 30")
page = r'''  MON = 'em060_04';
  check(await open(), 'Redhelm: his runtime is up');
  {
    await pick('9', 'Motion[9]');
    const w = await watch(200, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && x.mode === 0 && x.key === 30 && x.req), 'Redhelm L9 M9: the lump, shell00 0, u 30 started', w);
  }
  {
    await pick('9', 'Motion[1]');
    const w = await watch(200, x => x.some(y => y.shell === 'shell01'));
    check(w.some(x => x.shell === 'shell01' && (x.mode === 1 || x.mode === 4) && x.key === 20 && x.req), 'Redhelm L9 M1: the slam\'s dust, shell01 1 / 4, u 20 started', w);
  }
  MON = 'em062_00';
  check(await open(), 'Lagombi: her runtime is up');
  {
    await pick('2', 'Motion[28]');
    const w = await watch(160, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && [0, 1, 2].includes(x.mode) && x.key === 0 && x.req), 'Lagombi L2 M28: a snowball, shell00 0 / 1 / 2, u 0 started', w);
  }
  for (const [mon, keys] of [['em060_04', [20, 30, 40, 50, 0, 10]], ['em062_00', [0, 1, 2]]]){
  MON = mon; await open();
  for (const key of keys){
'''
s = s[:a] + page + s[b:]
rep("  for (const key of [0, 10, 30, 31, 32, 33, 40, 41, 42, 43]){\n", "")
rep("x.def.record.pel === 'em022_00u'", "x.def.record.pel === mon + 'u'")
rep("    if (body().failed) await open();\n  }\n  return out;", "    if (body().failed) await open();\n  }\n  }\n  return out;")
rep("'Blangonga shells: '", "'Redhelm / Lagombi shells: '")
rep("const MON = 'em022_00';", "let MON = 'em060_04';")
open(dst, 'w', encoding='utf8').write(s)
print('ok')
