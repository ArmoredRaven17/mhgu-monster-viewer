src = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-blangonga-check.mjs'
dst = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-rajang-check.mjs'
s = open(src, encoding='utf8').read()

def cut(a, b):
    i = s.index(a); j = s.index(b, i)
    return i, j

i = s.index('import { writeFileSync')
head = r'''// Rajang's (em023_00) and Furious Rajang's (em023_05) shells in render/shells.js against the ROM -- the ball (shell00) and its hit
// volume (shell01). Their beam (sp_02) is render/beam-spawns.js's (dev/beams/em023_00.md); sp_22 (base22, the carried rock) is not
// built yet.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers, the getters answered with em023_00.arc's / em023_05.arc's shell files, the owner's variant byte 0 / 5. The
//      setups are the class's OWN CODE run on the ROM: the L2 M8 ball 0xde82f8(e, 3) (phase 1, the frame-84 window 0xb0968
//      answering 1), the leap 0xde554c's phase 3 (L2 M12 frame 22), the L2 M5 0xde7e00 / L2 M22 0xdea2c0 phase 2 at 26. Each shell
//      is flown from the setup the ROM built, and the ball's floor contact's shell01 from the setup the ROM built for it; every init
//      / move / effect start compared bit for bit (float32) to the end.
//   2. The contract: the pick lists (L2 M8: the beams' then the ball's), the ids by variant.
//   3. CONTROLS: a wrong target, a wrong facing, a wrong joint, a moved floor must FAIL the comparison.
//
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the ball on L2 M8 / L2 M12 on both, its record started;
//      every exported shell record (u 230..232) starts and runs out with no refusal.
//
//   node dev/shells-rajang-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-rajang-check.mjs         (4: the viewer)
//
// Exit code 1 when anything fails.
'''
s = head + s[i:]

a, b = cut("  const OW = [0, 0x3000, 0]", "  for (const c of cases) c.folders = F022;")
cases = r'''  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const C = (name, mon, list, clip, variant, steps, x = {}) => Object.assign({ name, mon, list, clip, variant, steps, owner: OW,
    ownerPos: OP, target: TG, floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, len: 300, rank: 5, quest: 10, emVariant: mon === 'em023_05' ? 5 : 0,
    joints: { 0: J0, 4: J0b, 12: J140 } }, x);
  const fr = (fn, frames, x = {}) => frames.map(F => Object.assign({ fn, frame: F }, x));
  const F023 = { 0xa7: ['em023_00', '00'], 0xa8: ['em023_00', '01'], 0xab: ['em023_05', '00'], 0xac: ['em023_05', '01'] };
  const cases = [
    // L2 M8's ball: 0xde82f8(e, 3) phase 1, the frame-84 window (0xb0968 mode 1) -> sp_00 0, aimed (flag 1: base00's X aim)
    C('rj_ball_l2m8', 'em023_00', '2', 'Motion[8]', '7:0x05', [{ fn: 'de82f8', args: [3], phase: 1, win: 1, frame: 84 }], { len: 140 }),
    C('rj_ball_l2m8_far', 'em023_00', '2', 'Motion[8]', '7:0x0c', [{ fn: 'de82f8', args: [3], phase: 1, win: 1, frame: 84 }], { len: 140, target: [-300.0, 420.0, 600.0], owner: [0, 0xd000, 0] }),
    C('rj_ball_l2m8_v5', 'em023_05', '2', 'Motion[8]', '7:0x3b', [{ fn: 'de82f8', args: [3], phase: 1, win: 1, frame: 84 }], { len: 140, target: [1500.0, -200.0, 300.0], floorY: -250.0, ground: -250.0 }),
    // the leap 0xde554c's phase 3: L2 M12 frame 22 -> sp_00 1
    C('rj_ball_l2m12', 'em023_00', '2', 'Motion[12]', '7:0x07', fr('de554c', [22], { args: [0], phase: 3 }), { len: 100 }),
    C('rj_ball_l2m12_v5', 'em023_05', '2', 'Motion[12]', '1:0x0c', fr('de554c', [22], { args: [0], phase: 3 }), { len: 100, owner: [0, 0x8888, 0] }),
    // sp_01 1 at joint 12 on the ground: L2 M5 0xde7e00 / L2 M22 0xdea2c0, phase 2, frame 26
    C('rj_s01_l2m5', 'em023_00', '2', 'Motion[5]', '7:0x04', fr('de7e00', [26], { args: [0], phase: 2 }), { len: 60, ground: 3.5, floorY: 3.5 }),
    C('rj_s01_l2m22_v5', 'em023_05', '2', 'Motion[22]', '7:0x36', fr('dea2c0', [26], { args: [0], phase: 2 }), { len: 60 }),
  ];
'''
s = s[:a] + cases + s[b:].replace("  for (const c of cases) c.folders = F022;", "  for (const c of cases) c.folders = F023;", 1)
s = s.replace("mon: c.mon, folders: c.folders, variant: 0,", "mon: c.mon, folders: c.folders, variant: c.emVariant || 0,", 1)
s = s.replace("join(tmpdir(), 'blshells-')", "join(tmpdir(), 'rjshells-')", 1)
s = s.replace("const BASE = { 0xa4: 'base00', 0xa5: 'base01', 0xa6: 'base13' };", "const BASE = { 0xa7: 'base00', 0xa8: 'base01', 0xab: 'base00', 0xac: 'base01' };", 1)

a, b = cut("  // ---- 2. the contract", "  console.log(`\\n${pass} passed")
mid = r'''  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  const byName = n => cases.find(c => c.name === n);
  for (const m of ['em023_00', 'em023_05']){
    ok(pv(m, '2', 'Motion[8]') === '["7:0x06","7:0x0a","7:0x05","7:0x0c","7:0x3b"]', m + ' L2 M8 picks the beams, then the ball', pv(m, '2', 'Motion[8]'));
    ok(pv(m, '2', 'Motion[12]') === '["7:0x07","1:0x0c"]', m + ' L2 M12 picks the leap\'s two', pv(m, '2', 'Motion[12]'));
  }
  {
    // a beam pick on L2 M8 makes no ball (and a ball pick no beam: the beam rows filter on the pick)
    const J = runJS(Object.assign({}, byName('rj_ball_l2m8'), { variant: '7:0x06' }));
    ok(![...J.info.values()].some(I => I.S.shell === 'shell00'), 'L2 M8 (7, 6): no ball', [...J.info.values()].map(I => I.S.shell));
  }

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  for (const [n, over, what] of [
    ['rj_ball_l2m8', { target: [900.0, 140.0, 2400.0] }, 'the target 100 higher (the X aim)'],
    ['rj_ball_l2m8', { owner: [0, 0x3001, 0] }, 'the facing one word off'],
    ['rj_ball_l2m12', { joints: { 0: J0, 4: J50, 12: J140 } }, 'another joint 4'],
    ['rj_ball_l2m8_v5', { floorY: -247.0, ground: -247.0 }, 'the floor 3 higher (the contact, the shell01)'],
    ['rj_s01_l2m5', { joints: { 0: J0, 4: J0b, 12: J50 } }, 'another joint 12'],
  ]){
    const { why } = compare(byName(n), over);
    ok(!!why, 'CONTROL ' + n + ' with ' + what + ' fails', why || 'it matched');
  }

'''
s = s[:a] + mid + s[b:]

a = s.index("  check(await open(), 'his runtime is up');")
b = s.index("  for (const key of [0, 10, 30")
page = r'''  for (const mon of ['em023_00', 'em023_05']){
    MON = mon;
    check(await open(), mon + ': the runtime is up');
    {
      // L2 M8's picks run beam, beam, ball, ball, ball: five plays
      const got = [];
      for (let play = 0; play < 5; play++){
        await pick('2', 'Motion[8]_start');
        const w = await watch(150, x => x.some(y => y.shell === 'shell00'));
        got.push(w.filter(x => x.shell === 'shell00' && x.key === 230 && x.req).length);
      }
      check(got.filter(n => n === 1).length === 3, mon + ' L2 M8: the ball (u 230) on three plays of five', got);
    }
    {
      await pick('2', 'Motion[12]');
      const w = await watch(120, x => x.some(y => y.shell === 'shell00'));
      check(w.some(x => x.shell === 'shell00' && x.mode === 1 && x.key === 230 && x.req), mon + ' L2 M12: the leap\'s ball, shell00 1, u 230 started', w);
    }
  }
  MON = 'em023_00';
  await open();
'''
s = s[:a] + page + s[b:]
s = s.replace("  for (const key of [0, 10, 30, 31, 32, 33, 40, 41, 42, 43]){", "  for (const key of [230, 231, 232]){", 1)
s = s.replace("x.def.record.pel === 'em022_00u'", "x.def.record.pel === 'em023_00u'", 1)
s = s.replace("'Blangonga shells: '", "'Rajang shells: '", 1)
s = s.replace("const MON = 'em022_00';", "let MON = 'em022_00';", 1)
open(dst, 'w', encoding='utf8').write(s)
print('ok')
