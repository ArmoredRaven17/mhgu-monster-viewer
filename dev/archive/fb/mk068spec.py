# mk068spec.py: spec_najarala.json for mk_plaincheck.py, then the em068 patches of the generated dev/shells-najarala-check.mjs
import json, sys, subprocess
mon = 'em068_00'
le = lambda x: [x & 0xff, (x >> 8) & 0xff, 0, 0]
M = "{ list: '%s', clip: 'Motion[%d]', variant: '%s', len: %d }"
SEQ = lambda *xs: '[' + ', '.join(M % x for x in xs) + ']'
START = lambda n: "steps: [{ fn: 'f79d60', args: [7, %s] }]" % n
cases = [
  "    // the action start (vt+0x204 0xf79d60): L2 M60's throws -- (7, 0x17) modes 0 / 1, (7, 0x1c) 2 / 3, (7, 0x22) 4 / 5, (7, 0x24) 8",
  "    C('m17', 0x17, 0, null, 0, %s, { %s, frames: 300 })," % (SEQ(('2', 60, '7:0x17', 120)), START('0x17')),
  "    C('m1c_turned', 0x1c, 0, null, 0, %s, { %s, frames: 300, owner: [0, 0xa321, 0] })," % (SEQ(('2', 60, '7:0x1c', 120)), START('0x1c')),
  "    C('m22', 0x22, 0, null, 0, %s, { %s, frames: 300, owner: [0x0400, 0x5800, 0xfc00] })," % (SEQ(('2', 60, '7:0x22', 120)), START('0x22')),
  "    C('m24_low', 0x24, 0, null, 0, %s, { %s, frames: 300, floorY: -120.0, ground: -120.0 })," % (SEQ(('2', 60, '7:0x24', 120)), START('0x24')),
  "    // in the actions: (7, 0x26) L2 M62 f32 (mode 9, aimed) and f68 (mode 10, aimed); (7, 0x27) L2 M63 f104 (modes 0 / 1)",
  "    C('a26', 0x26, 1, null, 0, %s, { steps: [{ fn: 'f85ec4', phase: 1, frame: 32.0 }, { fn: 'f85ec4', phase: 1, frame: 68.0 }], frames: 300 })," % SEQ(('2', 62, '7:0x26', 120)),
  "    C('a3c_far', 0x3c, 1, null, 0, %s, { steps: [{ fn: 'f85ec4', phase: 1, frame: 32.0 }, { fn: 'f85ec4', phase: 1, frame: 68.0 }], frames: 300, target: [-2600.0, 0.0, 4100.0] })," % SEQ(('2', 62, '7:0x26', 120)),
  "    C('a27', 0x27, 1, 104.0, 0, %s, { frames: 300 })," % SEQ(('2', 63, '7:0x27', 160)),
  "    // THE RING: thrown, stuck, then L0 M50 (1, 0) f190 (r 5000): u 30, the delay 18 x (slot + 1) (rank 5) / 30 x (rank 3), the blast",
  "    // (sp_01 2, u 31) -- the ROM's block +0x14.. written before the move the module heard it on (the owner's frame), cleared the next",
  "    C('ring', 0x17, 0, null, 0, %s, { %s, frames: 420, ring: 1 })," % (SEQ(('2', 60, '7:0x17', 100), ('0', 50, '1:0x00', 300)), START('0x17')),
  "    C('ring_r3', 0x1c, 0, null, 0, %s, { %s, frames: 420, ring: 1, rank: 3 })," % (SEQ(('2', 60, '7:0x1c', 100), ('2', 61, '7:0x18', 200)), START('0x1c')),
  "    // THE CALL-OFF: L0 M36 (6, 0) f100 (mode 2): the count 0 -> the fade (sh int 0 frames), u 2, the end",
  "    C('calloff', 0x22, 0, null, 0, %s, { %s, frames: 420, ring: 2 })," % (SEQ(('2', 60, '7:0x22', 100), ('0', 36, '6:0x00', 200)), START('0x22')),
  "    // OUTSIDE THE RADIUS: L2 M61's ring (r 3500) with the owner moved 6000 away -- heard, the stored ring reset, still stuck",
  "    C('ring_out', 0x17, 0, null, 0, [{ list: '2', clip: 'Motion[60]', variant: '7:0x17', len: 100 }, { list: '2', clip: 'Motion[61]', variant: '7:0x18', len: 200, ownerPos: [6120.5, 15.25, -80.75] }], { " + START('0x17') + ", frames: 420, ring: 1 }),",
  "    // THE FLIGHT'S LIMIT: no floor in reach (y -1e6): at +0x1634 >= 600 the end (1) -- both flight handles at once, deleted -- and ef 6 (u 2)",
  "    C('limit', 0x22, 0, null, 0, " + SEQ(('2', 60, '7:0x22', 120)) + ", { " + START('0x22') + ", frames: 700, floorY: -1000000.0, ground: -1000000.0 }),",
  "    // THE RETIRE: four stuck, (7, 0x26)'s start at rank 5 marks the two oldest 3 -> the fade",
  "    C('retire', 0x17, 0, null, 0, %s, { steps: [{ fn: 'f79d60', args: [7, 0x17] }, { fn: 'f79d60', args: [7, 0x1c] }], frames: 420, marks: 1 })," % SEQ(('2', 60, '7:0x17', 100), ('2', 60, '7:0x1c', 100), ('2', 62, '7:0x26', 20)),
]
spec = {
  'name': 'najarala', 'title': 'Najarala', 'mon': mon, 'main': 'f85ec4', 'variant': 0,
  'header': [
    "Najarala's (em068_00) shells in render/shells.js against the ROM -- uEm068_00's sp_36 (0x126, the scales, NEW base36 through its",
    "reader 0xf88b6c) and their blast, sp_01 (0x125 mode 2, base01 through 0xf889b0). dev/snake-wyvern-shells-spec.md 1.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the class's action start vt+0x204 0xf79d60",
    "     (the maker 0xf7a4bc's slots in [e+0xcac0]+4..) or its action main 0xf85ec4 at the frame; every scale flown from the setup the",
    "     ROM built (slotSelf: the owner block's slot is the flown scale); the ring / call-off written into the block (+0x14 / +0x20 / +0x30)",
    "     before the move the module heard it on, the retire marks P+0x1bb before the move the module faded on; the blast flown as a child.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor, the rank one off (the ring's delay) must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the throw and the ring play; the records run out.",
    "",
    "  node dev/shells-najarala-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-najarala-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x125): [mon, '01'], hex(0x126): [mon, '36']},
  # the owner check 0x7fe88 (the scale's update): e+0xb5f9 != 0, e+0x7652 == 1 (0x70768), P+0x1a0 < 2 -- an owner present and active
  # and the area byte +0x1054 the scale's (the shell unit's is the base ctor's 0xff here, 0x538dfc: the same area -- the scale's state 2
  # compares the two, 0x419fbc)
  'owner_bytes': {'0xb5f9': [1], '0x7652': [1], '0x1054': [0xff]},
  'bases': {hex(0x125): 'base01', hex(0x126): 'base36'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[60]') === '[\"7:0x17\",\"7:0x1c\",\"7:0x22\",\"7:0x24\"]', 'L2 M60 picks its four throws', pv('%s', '2', 'Motion[60]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[62]') === '[\"7:0x26\"]', 'L2 M62 picks its aimed throws', pv('%s', '2', 'Motion[62]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[61]') === '[\"7:0x18\",\"7:0x1a\"]', 'L2 M61 picks its two rings', pv('%s', '2', 'Motion[61]'));" % (mon, mon),
    "  ok(pv('%s', '0', 'Motion[50]') === '[\"1:0x00\"]', 'L0 M50 picks its ring', pv('%s', '0', 'Motion[50]'));" % (mon, mon),
    "  ok(pv('%s', '0', 'Motion[138]') === '[\"2:0x44\"]' && pv('%s', '0', 'Motion[139]') === '[\"2:0x45\"]' && pv('%s', '0', 'Motion[105]') === '[]', 'L0 M138 / M139 carry the phase-2 ring of (2, 0x44..0x47); L0 M105 (phase 3) none');" % (mon, mon, mon)]),
  'controls': "\n".join([
    "    ['m1c_turned', { owner: [0, 0xa322, 0] }, 'the facing one word off'],",
    "    ['a26', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further (the aimed scales)'],",
    "    ['m17', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing)'],",
    "    ['ring', { rank: 3 }, 'the rank 3 (the ring step 30, not 18)'],",
    "    ['ring_r3', { rank: 5 }, 'the rank 5 (the ring step 18, not 30)'],"]),
  'page': "\n".join([
    "  {",
    "    // (a first play of L2 M60 takes its first pick, (7, 0x17): index.html rockInput)",
    "    await pick('2', 'Motion[60]');",
    "    const w = await watch(200, x => x.some(y => y.shell === 'shell36'));",
    "    check(w.some(x => x.shell === 'shell36' && x.key === 0 && x.req), 'L2 M60: a scale, shell36, u 0 started', w);",
    "    const st = body().schedule.shells.state, s36 = st.shells.find(s => s.shell === 'shell36');",
    "    const stuck = await until(() => s36 && s36.state === 2, 300);",
    "    check(stuck && s36.handles && !!s36.handles.h1680, 'L2 M60: the scale lands and starts u 1 (stuck)', s36 ? { state: s36.state } : null);",
    "    await pick('0', 'Motion[50]');",
    "    const rang = await until(() => s36 && s36.state >= 3 && s36.handles && !!s36.handles.h168c, 400);",
    "    check(rang, 'L0 M50 f190: the stuck scale rings, u 30 started', s36 ? { state: s36.state } : null);",
    "    const blast = await until(() => st.shells.some(s => s.shell === 'shell01' && s.modeIndex === 2 && s.request), 200);",
    "    check(blast, 'the ring\\'s delay out: the blast, shell01 mode 2, u 31 started');",
    "  }",
    "  check(await pick('0', 'Motion[138]') && await pick('0', 'Motion[139]'), 'L0 M138 / M139 (the phase-2 ring clips of (2, 0x44..0x47)) are clips he carries');",
    "  const S = body().schedule;",
    "  for (const key of [0, 1, 2, 3, 30, 31]){",
    "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === '%su' && x.def.record.key === key);" % mon,
    "    if (!e){ check(false, '%su ' + key + ' exported as a shell record'); continue; }" % mon,
    "    let started = 0, maxRun = 0;",
    "    for (let rep = 0; rep < 2; rep++){",
    "      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }",
    "      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }",
    "    }",
    "    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });",
    "    if (body().failed) await open();",
    "  }"]),
}
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
json.dump(spec, open(D + 'spec_najarala.json', 'w', encoding='utf8'), indent=1)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-najarala-check.mjs'
subprocess.check_call([sys.executable, D + 'mk_plaincheck.py', D + 'spec_najarala.json'])
s = open(P, encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
# the case's seq is its own list of { list, clip, variant, len }
# the ROM run: the slot is the scale; the ring / call-off / marks from the module's own run (the move it heard / faded on)
rep("ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },",
    "ownerPos: (P => ({ x: P[0], y: P[1], z: P[2] }))(q.ownerPos || x.ownerPos),")
rep("    if (c.precall) o.precall = c.precall;",
    "    if (c.precall) o.precall = c.precall;\n"
    "    o.slotSelf = 1;\n"
    "    o.rng0 = 1;   // (the init's draw 0x3f76d8 times +0x1614, the ctor's 0: answered 0)\n"
    "    o.block_bytes = { '0x1a0': [1] };   // (0x7fe88: P+0x1a0 below 2)\n"
    "    if (c.frames) o.frames = c.frames;\n"
    "    const f2 = x => [...new Uint8Array(new Float32Array([x]).buffer)];\n"
    "    const tops = [...J.info.values()].filter(I => I.S.base === 'base36');\n"
    "    if (c.ring){\n"
    "      const h = tops.map(I => I.S.log.find(e => e.ev === 'heard')).find(e => e);\n"
    "      if (h){\n"
    "        const B = c.ring === 1 ? (c.seq[1].ownerPos || c.ownerPos) : [0, 0, 0], r = c.ring === 1 ? (c.seq[1].clip === 'Motion[50]' ? 5000.0 : 3500.0) : -1.0;\n"
    "        o.pokes = { [h.move]: { '0x8d014': [c.ring], '0x8d020': [].concat(f2(B[0]), f2(B[1]), f2(B[2]), [0, 0, 0, 0]), '0x8d030': f2(r) },\n"
    "                    [h.move + 1]: { '0x8d014': [0], '0x8d030': f2(-1.0) } };\n"
    "      }\n"
    "    }\n"
    "    if (c.marks){\n"
    "      const L = tops.length ? J.snaps.get(tops[0].S.id) || [] : [], m4 = (L.find(x => x.state === 4) || {}).moves;\n"
    "      // (the block outlives a flight: each scale's run starts with the marks clear)\n"
    "      if (m4 != null) o.pokes = { 1: { '0x101bb': [0] }, [m4]: { '0x101bb': [0x0f] } };\n"
    "    }")
rep("    const romAtOnce = R.frames.some(x => x.log.some(e => e[0] === 'stop' && e[1] === 1));\n",
    "    if (base === 'base36'){\n"
    "      // the stops, in order with their mode (0x329c40(h, mode)); the timer +0x1634 and, in flight, the velocity, every move\n"
    "      const romStops = R.log.concat(...R.frames.map(x => x.log)).filter(e => e[0] === 'stop').map(e => e[1]);\n"
    "      const jsStops = S0.log.filter(e => e.ev === 'stop').map(e => e.mode);\n"
    "      if (JSON.stringify(romStops) !== JSON.stringify(jsStops)) return 'stops ' + JSON.stringify(jsStops) + ' vs ROM ' + JSON.stringify(romStops);\n"
    "      if (!eqv(S0.launch.velocity, R.spawn.vel)) return 'init velocity ' + JSON.stringify(S0.launch.velocity) + ' vs ROM ' + JSON.stringify(R.spawn.vel);\n"
    "      if (!eqv(S0.launch.gravity, R.spawn.acc)) return 'init gravity ' + JSON.stringify(S0.launch.gravity) + ' vs ROM ' + JSON.stringify(R.spawn.acc);\n"
    "      for (const fr of R.frames){\n"
    "        const q = L.find(x => x.moves === fr.k);\n"
    "        if (!q || fr.state === 0xff || q.state >= 0xfe) break;\n"
    "        if (!eq(f(q.timer), f(fr.timer))) return 'move ' + fr.k + ' timer ' + q.timer + ' vs ROM ' + fr.timer;\n"
    "        if (fr.state === 1 && !eqv(q.vel, fr.vel)) return 'move ' + fr.k + ' velocity ' + JSON.stringify(q.vel) + ' vs ROM ' + JSON.stringify(fr.vel);\n"
    "      }\n"
    "      return null;\n"
    "    }\n"
    "    const romAtOnce = R.frames.some(x => x.log.some(e => e[0] === 'stop' && e[1] === 1));\n")
# POSITIVELY: what each mechanism case must show in the ROM's own run (not only agree with the module)
rep("  // ---- 2. the contract ",
    "  {\n"
    "    const st = (n, i) => (ROM[n].shells[i].run.frames || []).map(x => x.state);\n"
    "    const starts = (n, i) => ROM[n].shells[i].run.frames.flatMap(x => x.log.filter(e => e[0] === 'start').map(e => e[2]));\n"
    "    const kids = n => ROM[n].shells.map(s => s.run.children.map(k => k.id + ':' + parseInt(k.run.setup.slice(16, 18), 16)));\n"
    "    ok(st('m17', 0).includes(2) && starts('m17', 0).join() === '1', 'm17: the ROM scale lands (state 2) and starts u 1, nothing more', starts('m17', 0).join());\n"
    "    ok(JSON.stringify(kids('ring')) === '[[\"293:2\"],[\"293:2\"]]' && starts('ring', 0).join() === '1,30', 'ring: the ROM scales ring (u 30) and each makes the blast sp_01 2', JSON.stringify(kids('ring')) + ' ' + starts('ring', 0).join());\n"
    "    const d = n => { const f0 = ROM[n].shells.map(s => s.run.frames), a = f0.map(F => (F.find(x => x.state === 3) || {}).k), b = f0.map(F => (F.find(x => x.state === 0xfe) || {}).k); return a.map((x, i) => b[i] - x); };\n"
    "    ok(JSON.stringify(d('ring')) === '[18,36]' && JSON.stringify(d('ring_r3')) === '[30,60]', 'the ring\\'s delay: 18 / 36 moves at rank 5, 30 / 60 at rank 3 (the slot + 1 times cmn float 6 / 5)', JSON.stringify(d('ring')) + ' ' + JSON.stringify(d('ring_r3')));\n"
    "    ok(st('calloff', 0).includes(4) && !st('calloff', 0).includes(3) && starts('calloff', 0).join() === '1,2', 'calloff: the ROM scale fades (state 4, never 3) and starts u 2', starts('calloff', 0).join());\n"
    "    ok(st('ring_out', 0).every(x => x !== 3) && st('ring_out', 1).every(x => x !== 3) && JS.get('ring_out').info.size === 2 && [...JS.get('ring_out').info.values()].every(I => I.S.log.some(e => e.ev === 'heard')), 'ring_out: heard, outside r 3500 -- the ROM scales never ring', JSON.stringify([...new Set(st('ring_out', 0))]));\n"
    "    { const F = ROM['limit'].shells[0].run.frames, last = F[F.length - 1], lg = F.flatMap(x => x.log.filter(e => e[0] === 'stop' || e[0] === 'start').map(e => e[0] + e[1] + (e[0] === 'start' ? ':' + e[2] : '')));\n"
    "      ok(!F.some(x => x.state === 2) && last.state === 0xff && last.k === 600 && lg.join() === 'stop1,stop1,start0:2', 'limit: the ROM scale flies 600 moves, then the end (1) -- both flight handles stopped at once -- and u 2', last.k + ' ' + lg.join()); }\n"
    "    ok(st('retire', 0).includes(4) && st('retire', 1).includes(4) && !st('retire', 2).includes(4) && !st('retire', 3).includes(4), 'retire: the marks fade slots 0 and 1, not 2 and 3');\n"
    "  }\n"
    "  // ---- 2. the contract ")
open(P, 'w', encoding='utf8').write(s)
print('patched', P)
