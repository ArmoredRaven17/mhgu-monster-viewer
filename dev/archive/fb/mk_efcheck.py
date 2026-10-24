import re
src = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-gammoth-check.mjs', encoding='utf8').read()
def cut(a, b, new):
    global src
    i = src.index(a); j = src.index(b, i)
    src = src[:i] + new + src[j:]
head = """// Elderfrost Gammoth's (em083_04) shells in render/shells.js against the ROM -- uEm083_00 with the variant byte 4: sp_00 (0x165: the
// aimed shot, and L9 M15's mode 4 the reader aims itself, turned by the action setter's e+0xcb10), sp_01 (0x168) and sp_13 (0x16a:
// L9 M8's held and thrown ball, no split). His own snowball (0x16b), sp_00_03 (0x167) and the beam (0x169) are refused by name.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides), as dev/shells-gammoth-check.mjs; L9 M15's cases call the
//      setter's arm 0x1051ebc(e, 0, 1, r3) first (`precall`), which computes e+0xcb10 from joint 102, the target and the tune ints.
//   2. The contract: the pick lists, the named refusals.
//   3. CONTROLS: a wrong joint, a moved target, a moved floor must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.
//
//   node dev/shells-elderfrost-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-elderfrost-check.mjs         (4: the viewer)
//
// Exit code 1 when anything fails.
"""
i = src.index('import { writeFileSync')
src = head + src[i:]
cut("  const J157b = ", "  const v = n =>", """  JOINTS[100] = jointOf(0.3, 0.1, 0.0, [60.0, 190.5, 120.25]); JOINTS[102] = jointOf(-0.2, 0.2, 0.1, [180.5, 195.25, 110.0]);
  JOINTS[2] = jointOf(0.4, -0.3, 0.2, [125.25, 210.5, -70.75]);
  const J157b = jointOf(-0.4, 0.3, 0.1, [150.0, 250.0, -30.0]), J2b = jointOf(0.1, 0.2, 0.3, [110.0, 205.0, -60.0]);
  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const F083 = { 0x165: ['em083_04', '00'], 0x166: ['em083_04', '00_02'], 0x167: ['em083_04', '00_03'], 0x168: ['em083_04', '01'],
                 0x169: ['em083_04', '02'], 0x16a: ['em083_04', '13'], 0x16b: ['em083_04', '13_02'] };
""")
src = src.replace("Object.assign({ name, mon: 'em083_00', n,", "Object.assign({ name, mon: 'em083_04', n,")
src = src.replace("rank: 5, quest: 10, emVariant: 0, hitLife: false,", "rank: 5, quest: 10, emVariant: 4, hitLife: false,")
src = src.replace("'0xcae0': [0x61, 1, 0, 0], '0xcae4': [0x63, 1, 0, 0], '0xcae8': [0x64, 1, 0, 0]", "'0xcae0': [0x65, 1, 0, 0], '0xcae4': [0x68, 1, 0, 0], '0xcae8': [0x6a, 1, 0, 0]")
src = src.replace("const Q = (clip, n, len) => [{ list: '2', clip, variant: v(n), len }];", "const Q = (clip, n, len, list = '2') => [{ list, clip, variant: v(n), len }];")
cut("  const cases = [", "  for (const c of cases) c.folders = F083;", """  const cases = [
    // Gammoth's aimed shot on his files: L2 M61 f26 mode 0, L2 M62 f18 mode 2
    C('e00_c9', 0xc9, 1, 26.0, 1, Q('Motion[61]', 0xc9, 60)),
    C('e00_d4', 0xd4, 1, 18.0, 1, Q('Motion[62]', 0xd4, 50), { owner: [0, 0xa123, 0] }),
    // L9 M15 f95: sp_00 4 from joint 157 (y the owner's + 100), turned by e+0xcb10 (clamped to 15 / 90), aimed by its reader
    C('e00_77', 0x77, 1, 95.0, 0, Q('Motion[15]', 0x77, 110, '9'), { precall: [{ fn: '1051ebc', args: [0, 1, 1] }] }),
    C('e00_81', 0x81, 1, 95.0, 0, Q('Motion[15]', 0x81, 110, '9'), { precall: [{ fn: '1051ebc', args: [0, 1, 0] }] }),
    C('e00_81_side', 0x81, 1, 95.0, 0, Q('Motion[15]', 0x81, 110, '9'), { precall: [{ fn: '1051ebc', args: [0, 1, 0] }], target: [-2400.0, 300.0, 600.0], owner: [0, 0xd000, 0] }),
    // L9 M6's start: sp_01 16 / 18 on joint 2 (the zero point, the owner's words)
    C('e01_6f', 0x6f, 0, null, 0, Q('Motion[6]', 0x6f, 20, '9')),
    // L9 M8: sp_13 6 at 30, held, thrown at 100 (no split: variant 4)
    C('e13_72', 0x72, 1, 30.0, 0, Q('Motion[8]', 0x72, 140, '9'), { snow: 1 }),
    // sp_01 30 / 31 / 26 / 27 and L2 M5's 7
    C('e01_70', 0x70, 1, 30.0, 0, Q('Motion[11]', 0x70, 40, '9')),
    C('e01_71', 0x71, 1, 30.0, 0, Q('Motion[14]', 0x71, 40, '9')),
    C('e01_75', 0x75, 1, 120.0, 0, Q('Motion[19]', 0x75, 130, '9')),
    C('e01_76', 0x76, 1, 120.0, 0, Q('Motion[23]', 0x76, 130, '9')),
    C('e01_04', 0x04, 1, 245.0, 1, Q('Motion[5]', 0x04, 260)),
  ];
""")
src = src.replace("    if (c.slot0){", "    if (c.precall) o.precall = c.precall;\n    if (c.slot0){")
src = src.replace("const BASE = { 0x161: 'base00', 0x162: 'base00', 0x163: 'base01', 0x164: 'base13' };", "const BASE = { 0x165: 'base00', 0x168: 'base01', 0x16a: 'base13' };")
cut("  const pv = (m, l, c) =>", "  // ---- 3. CONTROLS", """  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  ok(pv('em083_04', '9', 'Motion[15]') === '["7:0x77","7:0x81"]', 'L9 M15 picks its two turned shots', pv('em083_04', '9', 'Motion[15]'));
  ok(pv('em083_04', '2', 'Motion[23]') === '["7:0x1d","7:0x1c","7:0x1b","7:0x7e"]', 'L2 M23 picks his four snowballs', pv('em083_04', '2', 'Motion[23]'));
  {
    // the rows not built refuse by name, and make nothing
    const st = S.createShellState('em083_04'); const why = [];
    const inp = (list, clip, variant, frame) => ({ monId: 'em083_04', list, clip, frame, joints: g => JOINTS[g] || JOINTS[0],
      rock: { variant, target: { x: TG[0], y: TG[1], z: TG[2] }, floorY: 0 }, owner: { x: 0, y: 0x3000, z: 0 },
      ownerPos: { x: OP[0], y: OP[1], z: OP[2] }, ground: 0, size: [1, 1], baseScale: 1, rank: 5 });
    let made = 0;
    for (const [list, clip, variant, n] of [['2', 'Motion[23]', '7:0x1d', 230], ['9', 'Motion[7]', '7:0x6f', 60], ['9', 'Motion[17]', '7:0x6c', 120]]){
      for (let i = 0; i <= n; i++){ const o = S.stepShells(st, inp(list, clip, variant, i)); made += o.spawned.length; for (const r of o.refused) why.push(r.why); }
    }
    ok(made === 0 && why.some(w => /0x16b/.test(w)) && why.some(w => /0x1063568/.test(w)) && why.some(w => /0x106170c/.test(w)),
       'his snowball, sp_00_03 and the beam refuse by name', made + ' made; ' + JSON.stringify([...new Set(why)]));
  }

""")
cut("  const controls = [", "  const CR = runEmu", """  const controls = [
    ['e00_c9', { joints: Object.assign({}, JOINTS, { 157: J157b }) }, 'another joint 157'],
    ['e00_81', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further (the turn and the aim)'],
    ['e13_72', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher'],
    ['e01_6f', { joints: Object.assign({}, JOINTS, { 2: J2b }) }, 'another joint 2'],
  ];
""")
# the page check
cut("  const MON = 'em083_00';", "  const open = async", "  const MON = 'em083_04';\n")
src = src.replace("'Gammoth shells: '", "'Elderfrost shells: '")
cut("  check(await open(), 'his runtime is up');", "  return out;\n}", """  check(await open(), 'his runtime is up');
  {
    await pick('9', 'Motion[8]');
    const w = await watch(260, x => x.some(y => y.shell === 'shell01'));
    check(w.some(x => x.shell === 'shell13' && x.mode === 6 && x.req), 'L9 M8: the ball, shell13 6, its flight started', w);
    check(w.some(x => x.shell === 'shell01' && x.mode === 41), 'L9 M8: it bursts into shell01 41', w);
  }
  {
    await pick('9', 'Motion[15]');
    const w = await watch(200, x => x.some(y => y.shell === 'shell00'));
    check(w.some(x => x.shell === 'shell00' && x.mode === 4 && x.req), 'L9 M15: the turned shot, shell00 4', w);
  }
  const S = body().schedule;
  for (const key of [1, 2, 41, 42, 43, 60, 62, 70, 80, 110]){
    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em083_04u' && x.def.record.key === key);
    if (!e){ check(false, 'em083_04u ' + key + ' exported as a shell record'); continue; }
    let started = 0, maxRun = 0;
    for (let rep = 0; rep < 2; rep++){
      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }
      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }
    }
    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });
    if (body().failed) await open();
  }
""")
open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-elderfrost-check.mjs', 'w', encoding='utf8').write(src)
print('ok')
