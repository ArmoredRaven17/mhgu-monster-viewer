src = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-congalala-check.mjs'
dst = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-blangonga-check.mjs'
s = open(src, encoding='utf8').read()

def cut(a, b):
    i = s.index(a); j = s.index(b, i)
    return i, j

# header
i = s.index('import { writeFileSync')
head = r'''// Blangonga's (em022_00) shells in render/shells.js against the ROM.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn after its static
//      initialisers (the Congalala harness's machine), the getters answered with em022_00.arc's shell files. The setups are the
//      class's OWN CODE run on the ROM at the row's frame (the frame test 0xb0974 answering 1 for that frame alone): the throw
//      0xddd6dc(e, kind, sub) (L2 M12 / M14 frame 100) and 0xddd840(e, sub) (L2 M8 frame 98). Each shell is flown from the setup the
//      ROM built (the class DTI's `new`, the base's init with the class's reader, the move) -- the shell13 lob through base13 to its
//      contact, and the three shell00 its landing 0xde1420 / burst 0xde14ac make from the setups the ROM built for them; every init /
//      move / effect start compared bit for bit (float32) to the end.
//   2. The contract: the pick lists, the named refusal of (7, 0x18)'s mode 14, the motion end of shell01.
//   3. CONTROLS: a wrong target height, a wrong facing, a wrong joint, a moved floor, a wrong owner point must FAIL the comparison.
//
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): L2 M12 / L2 M8 spawn their shells on the body's runtime
//      and start their records; every exported shell record (u 0, 10, 30..33, 40..43) starts and runs out with no refusal.
//
//   node dev/shells-blangonga-check.mjs                                   (1..3: the ROM comparison, no viewer)
//   node <scratchpad>/run-check.mjs dev/shells-blangonga-check.mjs         (4: the viewer)
//
// Exit code 1 when anything fails.
'''
s = head + s[i:]

# joints and cases
a, b = cut("  const OW = [0, 0x3000, 0]", "  for (const c of cases) c.folders = F021;")
cases = r'''  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const C = (name, mon, list, clip, variant, steps, x = {}) => Object.assign({ name, mon, list, clip, variant, steps, owner: OW,
    ownerPos: OP, target: TG, floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, len: 300, rank: 5, quest: 10,
    joints: { 0: J0, 130: J140 } }, x);
  const fr = (fn, frames, x = {}) => frames.map(F => Object.assign({ fn, frame: F }, x));
  const F022 = { 0xa4: ['em022_00', '00'], 0xa5: ['em022_00', '01'], 0xa6: ['em022_00', '13'] };
  const cases = [
    // the throw 0xddd6dc(e, kind, sub): kind 1 sub 0..2 -> 0..2, kind 2 -> 3..5, kind 4 sub 1 / 2 -> 8 / 9, kind 5 -> 12 / 13
    C('bl_lob_0', 'em022_00', '2', 'Motion[12]', '7:0x05', fr('ddd6dc', [100], { args: [1, 0], phase: 1 }), { len: 140 }),
    C('bl_lob_1', 'em022_00', '2', 'Motion[12]', '7:0x08', fr('ddd6dc', [100], { args: [1, 1], phase: 1 }), { len: 140, owner: [0, 0xb123, 0] }),
    C('bl_lob_2', 'em022_00', '2', 'Motion[12]', '7:0x09', fr('ddd6dc', [100], { args: [1, 2], phase: 1 }), { len: 140, target: [-700.0, 260.0, 1900.0] }),
    C('bl_lob_3', 'em022_00', '2', 'Motion[12]', '7:0x0d', fr('ddd6dc', [100], { args: [2, 0], phase: 1 }), { len: 140 }),
    C('bl_lob_4', 'em022_00', '2', 'Motion[12]', '7:0x0e', fr('ddd6dc', [100], { args: [2, 1], phase: 1 }), { len: 140, ownerPos: [-410.25, 60.5, 330.0] }),
    C('bl_lob_5', 'em022_00', '2', 'Motion[12]', '7:0x0f', fr('ddd6dc', [100], { args: [2, 2], phase: 1 }), { len: 140, owner: [0, 0x6a00, 0] }),
    C('bl_lob_8', 'em022_00', '2', 'Motion[12]', '7:0x1c', fr('ddd6dc', [100], { args: [4, 1], phase: 1 }), { len: 140 }),
    C('bl_lob_9', 'em022_00', '2', 'Motion[12]', '7:0x1d', fr('ddd6dc', [100], { args: [4, 2], phase: 1 }), { len: 140, target: [300.0, -20.0, 900.0] }),
    C('bl_lob_12', 'em022_00', '2', 'Motion[12]', '7:0x1e', fr('ddd6dc', [100], { args: [5, 1], phase: 1 }), { len: 140, owner: [0, 0xe400, 0] }),
    C('bl_lob_13', 'em022_00', '2', 'Motion[12]', '7:0x1f', fr('ddd6dc', [100], { args: [5, 2], phase: 1 }), { len: 140 }),
    // a tilted owner (the X / Z words turn the first point, 0x43ae70) and a target below the start (the drop not clamped)
    C('bl_lob_0_tilt', 'em022_00', '2', 'Motion[12]', '7:0x05', fr('ddd6dc', [100], { args: [1, 0], phase: 1 }), { len: 140, owner: [0x0400, 0x3000, 0xfe00], target: [900.0, -300.0, 2400.0], floorY: -350.0, ground: -350.0 }),
    // 0xddd840(e, sub) at L2 M8 98: sub 0 -> shell01 0, sub 2 -> 1
    C('bl_s01_0', 'em022_00', '2', 'Motion[8]', '7:0x07', fr('ddd840', [98], { args: [0], phase: 1 }), { len: 120 }),
    C('bl_s01_1', 'em022_00', '2', 'Motion[8]', '7:0x0c', fr('ddd840', [98], { args: [2], phase: 1 }), { len: 120, owner: [0, 0x7777, 0] }),
  ];
'''
s = s[:a] + cases + s[b:].replace("  for (const c of cases) c.folders = F021;", "  for (const c of cases) c.folders = F022;", 1)

# the case serialiser: pass block too
s = s.replace("owner_bytes: c.owner_bytes || null,", "owner_bytes: c.owner_bytes || null, block: c.block || null,", 1)
s = s.replace("join(tmpdir(), 'fbshells-')", "join(tmpdir(), 'blshells-')", 1)

# the module side: base13's life in the snapshots
s = s.replace("anchor: sh.anchor && sh.anchor.slice(), ang: sh.angles && sh.angles.map(w => w >>> 0), timer: sh.timer });",
              "anchor: sh.anchor && sh.anchor.slice(), ang: sh.angles && sh.angles.map(w => w >>> 0), timer: sh.base === 'base13' ? sh.lifetime : sh.timer });", 1)
s = s.replace("const BASE = { 0xa1: 'base00', 0xa2: 'base01', 0xa3: 'base04' };", "const BASE = { 0xa4: 'base00', 0xa5: 'base01', 0xa6: 'base13' };", 1)
# base13's init and moves compared like base00's (velocity, acceleration, words, the life)
s = s.replace("    if (base === 'base00'){\n      const ln = S0.launch;", "    if (base === 'base00' || base === 'base13'){\n      const ln = S0.launch;", 1)
s = s.replace("      if (!eq(f(ln.timer), f(sp.timer))) return 'init timer ' + ln.timer + ' vs ' + sp.timer;",
              "      if (!eq(f(base === 'base13' ? ln.life : ln.timer), f(sp.timer))) return 'init timer ' + (base === 'base13' ? ln.life : ln.timer) + ' vs ' + sp.timer;", 1)
s = s.replace("      if (!eqv(ln.angles.map(w => w & 0xffff), sp.ang.map(w => w & 0xffff)))",
              "      if (!eqv((ln.angles || S0.angles0 || [0, 0, 0]).map(w => w & 0xffff), sp.ang.map(w => w & 0xffff)))", 1)
s = s.replace("      if (base === 'base00'){\n        if (!eqv(s.vel, fr.vel))", "      if (base === 'base00' || base === 'base13'){\n        if (!eqv(s.vel, fr.vel))", 1)
s = s.replace("        if (!eq(f(s.timer), f(fr.timer)) && s.state === 1) return",
              "        if (!eq(f(s.timer), f(fr.timer)) && (s.state === 1 || (base === 'base13' && s.state === 2))) return", 1)
s = s.replace("const isLive = s => !!s.run && !!s.run.init && s.run.spawn.state === 1;",
              "const isLive = s => !!s.run && !!s.run.init && (s.run.spawn.state === 1 || s.run.spawn.state === 2);", 1)

# contract + controls
a, b = cut("  // ---- 2. the contract", "  console.log(`\\n${pass} passed")
mid = r'''  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  const byName = n => cases.find(c => c.name === n);
  const shells = (c, over) => [...runJS(c, over).info.values()].map(I => I.S.shell + ':' + I.S.modeIndex);
  ok(pv('em022_00', '2', 'Motion[12]') === '["7:0x05","7:0x08","7:0x09","7:0x0d","7:0x0e","7:0x0f","7:0x1c","7:0x1d","7:0x1e","7:0x1f"]',
     'L2 M12 picks the ten lobs', pv('em022_00', '2', 'Motion[12]'));
  ok(pv('em022_00', '2', 'Motion[8]') === '["7:0x07","7:0x0c"]', 'L2 M8 picks shell01 0 / 1', pv('em022_00', '2', 'Motion[8]'));
  {
    // (7, 0x18): L2 M14's lob is mode 14, past the file's 14 modes -- refused by name, nothing made
    const J = runJS(Object.assign({}, byName('bl_lob_0'), { list: '2', clip: 'Motion[14]', variant: null }));
    ok(J.info.size === 0 && J.refused.length === 1 && /past the file's 14 modes/.test(J.refused[0].why), 'L2 M14 (7, 0x18): mode 14 refused by name', J.refused);
  }
  {
    // shell01's +0x150 0xde1138: it ends on the move its owner's motion is no longer L2 M8 (hit slots on, so only the motion ends it)
    const st = S.createShellState('em022_00'), Jf = g => (g === 130 ? J140 : J0);
    const inp = (clip, k) => ({ monId: 'em022_00', list: '2', clip, frame: k, joints: Jf, rock: { variant: '7:0x07', target: { x: 0, y: 0, z: 1500 }, floorY: 0 },
      owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, hitLife: true });
    let made = null, endedAt = null;
    for (let k = 0; k <= 110; k++){ const o = S.stepShells(st, inp('Motion[8]', k)); if (o.spawned.length) made = o.spawned[0]; }
    for (let k = 0; k < 5 && endedAt == null; k++){ const o = S.stepShells(st, inp('Motion[9]', k)); if (made && o.ended.includes(made)) endedAt = k; }
    ok(made && made.shell === 'shell01' && made.modeIndex === 0 && endedAt === 0, 'shell01 0 ends on the first move after L2 M8 gives way to L2 M9', { made: !!made, endedAt });
  }

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  for (const [n, over, what] of [
    ['bl_lob_0', { target: [900.0, 41.0, 2400.0] }, 'the target 1 higher (the thrown point\'s height)'],
    ['bl_lob_1', { owner: [0, 0xb124, 0] }, 'the facing one word off'],
    ['bl_lob_4', { ownerPos: [-410.25, 61.5, 330.0] }, 'the owner 1 higher'],
    ['bl_lob_0', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the contact, the burst)'],
    ['bl_s01_0', { joints: { 0: J0, 130: J50 } }, 'another joint 130'],
    ['bl_lob_0_tilt', { owner: [0x0401, 0x3000, 0xfe00] }, 'the X word one off (the first point\'s turn)'],
  ]){
    const { why } = compare(byName(n), over);
    ok(!!why, 'CONTROL ' + n + ' with ' + what + ' fails', why || 'it matched');
  }

'''
s = s[:a] + mid + s[b:]

# pageCheck
a = s.index("  check(await open(), 'his runtime is up');")
b = s.index("  for (const key of [0, 100, 130")
page = r'''  check(await open(), 'his runtime is up');
  {
    await pick('2', 'Motion[12]');
    const w = await watch(300, x => x.some(y => y.shell === 'shell00'));
    const lob = w.find(x => x.shell === 'shell13'), kids = w.filter(x => x.shell === 'shell00' && x.child);
    check(lob && lob.key !== undefined && lob.req, 'L2 M12: a lob, shell13, its record started', w);
    check(kids.length === 3 && kids.every(x => x.req), 'its contact bursts into three shell00, their records started', kids);
  }
  {
    await pick('2', 'Motion[8]');
    const w = await watch(240, x => x.some(y => y.shell === 'shell01'));
    check(w.some(x => x.shell === 'shell01' && (x.mode === 0 || x.mode === 1) && x.req), 'L2 M8: shell01 0 / 1 (u 0 / u 10) started', w);
  }
'''
s = s[:a] + page + s[b:]
s = s.replace("  for (const key of [0, 100, 130, 140, 150, 160, 200, 210, 220, 300, 310, 320, 330]){", "  for (const key of [0, 10, 30, 31, 32, 33, 40, 41, 42, 43]){", 1)
s = s.replace("x.def.record.pel === 'em021_00u'", "x.def.record.pel === 'em022_00u'", 1)
s = s.replace("'Congalala shells: '", "'Blangonga shells: '", 1)
s = s.replace("const MON = 'em021_00';", "const MON = 'em022_00';", 1)
open(dst, 'w', encoding='utf8').write(s)
print('ok')
