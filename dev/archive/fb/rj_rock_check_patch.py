p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-rajang-check.mjs'
s = open(p, encoding='utf8').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (s.count(a), a[:70])
    s = s.replace(a, b)

# the rock's folders and cases
rep("  const F023 = { 0xa7: ['em023_00', '00'], 0xa8: ['em023_00', '01'], 0xab: ['em023_05', '00'], 0xac: ['em023_05', '01'] };",
    "  const F023 = { 0xa7: ['em023_00', '00'], 0xa8: ['em023_00', '01'], 0xaa: ['em023_00', '22'], 0xab: ['em023_05', '00'], 0xac: ['em023_05', '01'], 0xae: ['em023_05', '22'] };")
rep("""    C('rj_s01_l2m22_v5', 'em023_05', '2', 'Motion[22]', '7:0x36', fr('dea2c0', [26], { args: [0], phase: 2 }), { len: 60 }),
  ];""", """    C('rj_s01_l2m22_v5', 'em023_05', '2', 'Motion[22]', '7:0x36', fr('dea2c0', [26], { args: [0], phase: 2 }), { len: 60 }),
    // THE ROCK (sp_22, base22): made at (1, 0x39)'s start by vt+0x204 0xde220c(e, 1, 0x39) with ctl+0x15 the dig's mode; held on
    // joint 12 through L2 M29, thrown at L2 M28 56 (or dropped on another motion), flown to its contacts. The owner's motion and the
    // window 0x72714 mode 2 the ROM run reads each move are the module's own run's (`track`, from the rock's trace)
    ...[['rj_rock_0', 'em023_00', '1:0x36', 0, {}], ['rj_rock_1', 'em023_00', '1:0x37', 1, { target: [-600.0, 300.0, 1700.0] }],
        ['rj_rock_2', 'em023_00', '1:0x38', 2, { owner: [0, 0x9000, 0] }], ['rj_rock_3_v5', 'em023_05', '1:0x3f', 3, { target: [400.0, -120.0, 2600.0], floorY: -180.0, ground: -180.0 }],
        ['rj_rock_1_v5_far', 'em023_05', '1:0x37', 1, { target: [2900.0, 40.0, 3900.0], owner: [0, 0x2400, 0] }]].map(([n, mon, v, m, x]) =>
      C(n, mon, '2', 'Motion[29]', v, [{ fn: 'de220c', args: [1, 0x39] }], Object.assign({ ctl: { '0x15': [m] }, rockSeg: 'throw' }, x))),
    // dropped: L2 M29 gives way to L2 M9 while it is held (0xde3734 -> 2)
    C('rj_rock_drop', 'em023_00', '2', 'Motion[29]', '1:0x36', [{ fn: 'de220c', args: [1, 0x39] }], { ctl: { '0x15': [0] }, rockSeg: 'drop' }),
    C('rj_rock_drop_v5', 'em023_05', '2', 'Motion[29]', '1:0x38', [{ fn: 'de220c', args: [1, 0x39] }], { ctl: { '0x15': [2] }, rockSeg: 'drop', owner: [0, 0xc321, 0] }),
  ];
  // the clips a rock case plays: L2 M29 0..324 (the rock at 200), then L2 M28 from 40 (the throw at 56) and on, or L2 M9 (the drop)
  const SEGS = { throw: [['2', 'Motion[29]', 0, 324], ['2', 'Motion[28]', 40, 182], ['2', 'Motion[9]', 0, 400]],
                 drop: [['2', 'Motion[29]', 0, 260], ['2', 'Motion[9]', 0, 500]] };
  for (const c of cases) if (c.rockSeg) c.segments = SEGS[c.rockSeg];""")
# the ROM run's ctl and track
rep("owner_bytes: c.owner_bytes || null, block: c.block || null,",
    "owner_bytes: c.owner_bytes || null, block: c.block || null, ctl: c.ctl || null, track: c.segments ? trackOf(c) : null,")
rep("  // ---- the module ---------------------------------------------------------------------------------------------------------------\n",
    """  // ---- the module ---------------------------------------------------------------------------------------------------------------
  // a rock case's owner track for the ROM run: the module's own rock's [motion, window answer] a move (move k = trace[k - 1])
  function trackOf(c){
    const J = runJS(c), I = [...J.info.values()].find(x => x.S.shell === 'shell22');
    const tr = I ? I.S.trace : [];
    return Object.fromEntries(tr.map((t, i) => [i + 1, t]));
  }
""")
# runJS: segments
rep("""    const pre = new Set(st.shells.map(sh => sh.id));
    for (let k = 0; k <= x.len + 460; k++){
      const out = S.stepShells(st, { monId: x.mon, list: x.list, clip: x.clip, frame: x.loop ? k % (x.len + 1) : Math.min(k, x.len), joints: J, rage: !!x.rage,""",
    """    const pre = new Set(st.shells.map(sh => sh.id));
    const steps = x.segments ? x.segments.flatMap(([l, c, a, b]) => Array.from({ length: b - a + 1 }, (_, i) => [l, c, a + i]))
                             : Array.from({ length: x.len + 461 }, (_, k) => [x.list, x.clip, x.loop ? k % (x.len + 1) : Math.min(k, x.len)]);
    for (const [L0, C0, F0] of steps){
      const out = S.stepShells(st, { monId: x.mon, list: L0, clip: C0, frame: F0, joints: J, rage: !!x.rage,""")
rep("const BASE = { 0xa7: 'base00', 0xa8: 'base01', 0xab: 'base00', 0xac: 'base01' };",
    "const BASE = { 0xa7: 'base00', 0xa8: 'base01', 0xaa: 'base22', 0xab: 'base00', 0xac: 'base01', 0xae: 'base22' };")
# base22's init and moves: the point, the velocity, the words, the life (state 1)
rep("""    for (const fr of R.frames){
      const s = L.find(x => x.moves === fr.k);""", """    if (base === 'base22'){
      if (!eqv(S0.launch.position, sp.pos)) return 'init position ' + JSON.stringify(S0.launch.position) + ' vs ROM ' + JSON.stringify(sp.pos);
      if (!eq(f(S0.launch.life), f(sp.timer))) return 'init life ' + S0.launch.life + ' vs ' + sp.timer;
    }
    for (const fr of R.frames){
      const s = L.find(x => x.moves === fr.k);""")
rep("""      if (base === 'base00' || base === 'base13'){
        if (!eqv(s.vel, fr.vel))""", """      if (base === 'base22'){
        if (!eqv(s.vel, fr.vel)) return 'move ' + fr.k + ' velocity ' + JSON.stringify(s.vel) + ' vs ROM ' + JSON.stringify(fr.vel);
        if (s.state === 1 && !eq(f(s.timer), f(fr.timer))) return 'move ' + fr.k + ' life ' + s.timer + ' vs ' + fr.timer;
      }
      if (base === 'base00' || base === 'base13'){
        if (!eqv(s.vel, fr.vel))""")
rep("timer: sh.base === 'base13' ? sh.lifetime : sh.timer });", "timer: (sh.base === 'base13' || sh.base === 'base22') ? sh.lifetime : sh.timer });")
# contract: the dig picks; controls
rep("""    ok(pv(m, '2', 'Motion[12]') === '["7:0x07","1:0x0c"]', m + ' L2 M12 picks the leap\\'s two', pv(m, '2', 'Motion[12]'));""",
    """    ok(pv(m, '2', 'Motion[12]') === '["7:0x07","1:0x0c"]', m + ' L2 M12 picks the leap\\'s two', pv(m, '2', 'Motion[12]'));
    ok(pv(m, '2', 'Motion[29]') === '["1:0x36","1:0x37","1:0x38","1:0x3f"]', m + ' L2 M29 picks the four digs', pv(m, '2', 'Motion[29]'));""")
rep("""    ['rj_s01_l2m5', { joints: { 0: J0, 4: J0b, 12: J50 } }, 'another joint 12'],""",
    """    ['rj_s01_l2m5', { joints: { 0: J0, 4: J0b, 12: J50 } }, 'another joint 12'],
    ['rj_rock_0', { joints: { 0: J0, 4: J0b, 12: J50 } }, 'another joint 12 (the hand)'],
    ['rj_rock_1', { target: [-600.0, 330.0, 1700.0] }, 'the target 30 higher (the throw\\'s aim)'],
    ['rj_rock_2', { owner: [0, 0x9001, 0] }, 'the facing one word off (the throw point, the yaw)'],
    ['rj_rock_3_v5', { floorY: -177.0, ground: -177.0 }, 'the floor 3 higher (the bounce)'],
    ['rj_rock_drop', { owner: [0, 0x0001, 0] }, 'the facing one word off (the drop)'],""")
open(p, 'w', encoding='utf8').write(s)
print('ok')
