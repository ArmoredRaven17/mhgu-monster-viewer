# mk058spec.py: spec_amatsu.json for mk_plaincheck.py (Amatsu, em058_00), then its patches
import json, sys, subprocess, struct
mon = 'em058_00'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
MAIN = 'f07584'
V = lambda st, n: '%d:0x%02x' % (st, n)
# hit slot 0's life by 'id:mode' (delay + duration + 1): sp_01 (253) records 0..8
HD = [(0, 30), (30, 999), (0, 60), (16, 40), (6, 18), (14, 10), (0, 10), (2, 10), (16, 570)]
UNTIL = {'253:%d' % m: d + u + 1 for m, (d, u) in enumerate(HD)}
X = ", hitLife: 1, slot0Until: %s, frames: 700" % json.dumps(UNTIL)
def Q(l, c, v, n): return "{ list: '%s', clip: 'Motion[%d]', variant: %s, len: %d }" % (l, c, ("'%s'" % v) if v else 'null', n)
def ST(*s): return "steps: [" + ', '.join("{ fn: '%s', %s }" % (MAIN, x) for x in s) + "]"
# his phase is e+0x15e1 (the step's `owner`); the frame test 0xb0968 answered for that frame alone
W = lambda ph, F: "phase: 0, owner: { '0x15e1': [%d] }, winFrames: [%.1f]" % (ph, F)
cases = ["    // each row: the action main 0x%s at the phase its spawn is in (e+0x15e1), the frame test 0xb0968 answered for that frame alone" % MAIN]
def C(nm, st, n, seq, steps, extra=''):
    cases.append("    C('%s', %d, 1, null, 0, [%s], { st: %d, %s%s%s })," % (nm, n, ', '.join(seq), st, steps, X, extra))
# (the landing's sp_01 7: made by the ball as it ends -- the last unit of line 18: trap 107)
C('b09', 7, 0x09, [Q('2', 17, V(7, 9), 200)], ST(W(1, 110)), ", slot0Until: %s" % json.dumps(dict(UNTIL, **{'253:7': [UNTIL['253:7'] - 1]})))
C('t0b', 7, 0x0b, [Q('2', 19, V(7, 0xb), 300)], ST(W(2, 220)))
# (7, 0xc): f206 sp_01 8, then the hold run out (P+0x1bc 0.5, 0x7206c native) -> L2 M23 and sp_01 1 (its end makes sp_01 2)
HOLD = list(struct.pack('<f', 0.5))
C('c0c', 7, 0x0c, [Q('2', 22, V(7, 0xc), 220), Q('2', 23, V(7, 0xc), 300)],
  ST(W(2, 206) + ", block: { '0x1bc': %s }" % json.dumps(list(struct.pack('<f', 806.0))), "phase: 0, owner: { '0x15e1': [2] }, block: { '0x1bc': %s }" % json.dumps(HOLD)), ", unstub: ['0x7206c']")
C('s01', 7, 0x01, [Q('2', 14, V(7, 1), 200)], ST(W(1, 102)))
C('s02', 7, 0x02, [Q('2', 15, V(7, 2), 200)], ST(W(2, 130)))
# (2026-10-19) the water lines: phase 0 sets the line (e+0xcb40.. / +0xcb50..), phase 1 makes sp_42 at its frame; the walker's activation
# (vt+0x18 0x420ac8) runs before its first move (emu `activate`)
for nm, n, clip, F in (('w19', 0x19, 27, 18), ('w1a', 0x1a, 28, 20), ('w1b', 0x1b, 29, 22)):
    C(nm, 7, n, [Q('2', clip, V(7, n), 120)], ST("phase: 0, owner: { '0x15e1': [0] }", W(1, F)), ", activate: ['0x102'], stubs: ['0x420fe0']")
spec = {
  'name': 'amatsu', 'title': 'Amatsu', 'mon': mon, 'main': MAIN, 'variant': 0,
  'header': [
    "Amatsu's (em058_00) shells in render/shells.js against the ROM -- uEm058_00: sp_00 (0xfc, base00 through 0xf0f3a0, its landing",
    "0xf0f4bc), sp_01 (0xfd, base01 through 0xf0f794 -- flags 0x200 / 0x400 -- its end create 0xf0fa28) and sp_30 (0x101, BASE30: the",
    "whirlwinds). The beam sp_02 is render/beam-spawns.js's. dev/elder-dragon-shells-spec.md 8.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xf07584 with his phase byte",
    "     e+0x15e1 written per step, the frame test answered for that frame alone; every shell flown from its setup, children included.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved owner, a moved floor, a moved joint must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-amatsu-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-amatsu-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xfc): [mon, '00'], hex(0xfd): [mon, '01'], hex(0x101): [mon, '30'], hex(0x102): [mon, '42']},
  'owner_bytes': {},
  'bases': {hex(0xfc): 'base00', hex(0xfd): 'base01', hex(0x101): 'base30', hex(0x102): 'base42'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 1: jointOf(-0.1, 0.3, 0.05, [40.0, 300.0, 250.0]), 3: jointOf(0.1, 0.25, 0.05, [30.0, 610.0, 420.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[19]') === '[\"7:0x0b\"]', 'L2 M19: the whirlwinds', pv('%s', '2', 'Motion[19]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[23]') === '[\"7:0x0c\"]', 'L2 M23: the burst', pv('%s', '2', 'Motion[23]'));" % (mon, mon)]),
  'controls': "\n".join([
    "    ['t0b', { owner: [0, 0x3001, 0] }, 'the facing one word off (the whirlwinds)'],",
    "    ['t0b', { floorY: 3.0, ground: 3.0 }, 'the ground 3 higher (the whirlwinds)'],",
    "    ['c0c', { ownerPos: [120.5, 15.25, -50.75] }, 'the owner 30 further (the burst)'],",
    "    ['b09', { joints: Object.assign({}, JOINTS, { 3: jointOf(0.1, 0.25, 0.05, [30.0, 640.0, 420.0]) }) }, 'joint 3 30 higher (the ball)'],",
    "    ['w1a', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside (the side line)'],",
    "    ['w19', { joints: Object.assign({}, JOINTS, { 3: jointOf(0.1, 0.25, 0.05, [30.0, 640.0, 420.0]) }) }, 'joint 3 30 higher (the near line: no move change -- the start point)'],",
    "    ['w1b', { owner: [0, 0x3001, 0] }, 'the facing one word off (the far line)'],",
    "    ['s02', { joints: Object.assign({}, JOINTS, { 1: jointOf(-0.1, 0.3, 0.05, [70.0, 300.0, 250.0]) }) }, 'joint 1 30 aside (the strike)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[19]', 'shell30'], ['2', 'Motion[17]', 'shell00'], ['2', 'Motion[23]', 'shell01'], ['2', 'Motion[27]', 'shell42'], ['2', 'Motion[28]', 'shell42']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }",
    "  const S = body().schedule;",
    "  for (const key of [10, 20, 22, 30, 31, 50, 51]){",
    "    const pel = 'em058_00u', e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === pel && x.def.record.key === key);",
    "    if (!e){ check(false, pel + ' ' + key + ' exported as a shell record'); continue; }",
    "    let started = 0, maxRun = 0;",
    "    for (let rep = 0; rep < 2; rep++){",
    "      try { S.start(e); started++; } catch (err){ check(false, pel + ' ' + key + ' start', String(err)); }",
    "      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }",
    "    }",
    "    check(!body().failed && started === 2, 'record ' + pel + ' ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = SPD + r'\spec_amatsu.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-amatsu-check.mjs'
s = open(out, encoding='utf8').read()
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;\n    if (c.stepsRaw) o.steps = c.stepsRaw;\n    if (c.block) o.block = c.block;\n    if (c.slot0Until) o.slot0Until = c.slot0Until;\n    if (c.unstub) o.unstub = c.unstub;\n    if (c.activate) o.activate = c.activate;\n    if (c.stubs) o.stubs = c.stubs;\n    o.frameStep = 1.0;"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, loopStart: q.loopStart });"),
  ("    if (romAtOnce !== !!S0.split083)",
   "    // (the at-once stops: Gammoth's split, base01's 0x20 switch)\n    if (romAtOnce !== !!(S0.split083 || S0.switched))"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(out, 'w', encoding='utf8').write(s)
print('patched')
