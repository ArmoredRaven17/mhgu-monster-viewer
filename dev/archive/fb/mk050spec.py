# mk050spec.py: spec_alatreon.json for mk_plaincheck.py (Alatreon, em050_00), then its patches
import json, sys, subprocess
mon = 'em050_00'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
MAIN = 'eccc1c'
V = lambda st, n: '%d:0x%02x' % (st, n)
# hit slot 0's life by 'id:mode' (delay + duration + 1): sp_00 (239) (0, 99) -> its flight's; sp_01 (240) records 0..7
# (8,36) (8,36) (70,40) (70,40) (60,20) (60,20) (30,10) (0,10); sp_11 none
UNTIL = {'240:%d' % m: d + u + 1 for m, (d, u) in enumerate([(8, 36), (8, 36), (70, 40), (70, 40), (60, 20), (60, 20), (30, 10), (0, 10)])}
X = ", hitLife: 1, slot0Until: %s, frames: 700" % json.dumps(UNTIL)
def Q(l, c, v, n): return "{ list: '%s', clip: 'Motion[%d]', variant: %s, len: %d }" % (l, c, ("'%s'" % v) if v else 'null', n)
def ST(*s): return "steps: [" + ', '.join("{ fn: '%s', %s }" % (MAIN, x) for x in s) + "]"
W = lambda ph, F: "phase: %d, winFrames: [%.1f]" % (ph, F)
cases = ["    // each row: the action main 0x%s at the phase its spawn is in, the frame test 0xb0968 answered for that frame alone (winFrames)" % MAIN]
def C(nm, st, n, seq, steps, extra=''):
    cases.append("    C('%s', %d, 1, null, 0, [%s], { st: %d, %s%s%s })," % (nm, n, ', '.join(seq), st, steps, X, extra))
# (the landing's sp_01: made by the ball as it ends -- the last unit of line 18 -- so its slot is counted before its first move: trap 107)
LAST = ", slot0Until: %s" % json.dumps(dict(UNTIL, **{'240:0': [UNTIL['240:0'] - 1], '240:1': [UNTIL['240:1'] - 1]}))
C('s09', 4, 0x09, [Q('1', 11, V(4, 9), 60)], ST(W(2, 6)), LAST)
C('s0f', 4, 0x0f, [Q('1', 9, V(4, 0xf), 60)], ST(W(2, 6)), LAST)
C('b02', 7, 0x02, [Q('2', 6, V(7, 2), 120)], ST(W(1, 76)), LAST)
C('b21', 7, 0x21, [Q('2', 6, V(7, 0x21), 120)], ST(W(1, 76)), LAST)
C('d06', 7, 0x06, [Q('2', 3, V(7, 6), 60)], ST(W(3, 2)))
C('c18', 7, 0x18, [Q('2', 5, V(7, 0x18), 200)], ST(W(1, 170)))
C('e0d', 7, 0x0d, [Q('2', 9, V(7, 0xd), 60)], ST(W(2, 24), W(2, 26), W(2, 30)))
C('e40', 7, 0x40, [Q('2', 9, V(7, 0x40), 60)], ST(W(2, 24), W(2, 26), W(2, 30)))
C('f19', 7, 0x19, [Q('2', 21, V(7, 0x19), 60)], ST("phase: 0"))
C('g1a', 7, 0x1a, [Q('0', 14, V(7, 0x1a), 300)], ST(W(1, 164), W(1, 224), W(1, 284)))
# (the line's first strike: the lone sp_11 is the last unit of line 18 as it makes it -- trap 107)
LINE11 = ", slot0Until: %s" % json.dumps(dict(UNTIL, **{'240:4': [UNTIL['240:4'] - 1, UNTIL['240:4']]}))
C('h36', 7, 0x36, [Q('2', 6, V(7, 0x36), 120)], ST(W(1, 74)), LINE11)
C('h37', 7, 0x37, [Q('2', 6, V(7, 0x37), 120)], ST(W(1, 74)), LINE11)
C('i38', 7, 0x38, [Q('2', 7, V(7, 0x38), 200)], ST(W(1, 164)), LINE11)
C('i39', 7, 0x39, [Q('2', 7, V(7, 0x39), 200)], ST(W(1, 164)), LINE11)
C('i3f', 7, 0x3f, [Q('2', 7, V(7, 0x3f), 200)], ST(W(1, 96), W(1, 164)))
# the timers: the frame step once, then the main every step (P+0x1bc += the step)
C('k20', 7, 0x20, [Q('2', 7, V(7, 0x20), 700)], ST(W(1, 130), *(["phase: 1"] * 540)), ", frames: 420")
for n in (0x35, 0x3a, 0x3e):
    C('j%02x' % n, 7, n, [Q('2', 28, V(7, n), 260)], ST(W(1, 158), *(["phase: 1"] * 120)))
# (2026-10-19) the chain-reached 0xec91f0 actions: phase 2 L2 M14, f28 sp_01 6 / f38 sp_01 7 (k >= 5; flag 0x400: the ground)
C('m48', 7, 0x48, [Q('2', 14, V(7, 0x48), 60)], ST(W(2, 28)))
C('m4d', 7, 0x4d, [Q('2', 14, V(7, 0x4d), 60)], ST(W(2, 28), W(2, 38)))
C('m51', 7, 0x51, [Q('2', 14, V(7, 0x51), 60)], ST(W(2, 28), W(2, 38)))
spec = {
  'name': 'alatreon', 'title': 'Alatreon', 'mon': mon, 'main': MAIN, 'variant': 0,
  'header': [
    "Alatreon's (em050_00) shells in render/shells.js against the ROM -- uEm050_00: sp_00 (0xef, base00 through 0xecf594, its landing",
    "0xecf6e4 and sp_01 child), sp_01 (0xf0, base01 through 0xecf990), sp_11 (0xf2, base11 through 0xecff90, its strikes 0xed0140) and",
    "sp_41 (0xf3, BASE41: held, flown and landed meteors). The breath beam sp_02 is render/beam-spawns.js's (its own check).",
    "dev/elder-dragon-shells-spec.md 7.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xeccc1c at each spawn's phase,",
    "     the frame test answered for that frame alone; the timer makers called every step; every shell flown from its setup, children",
    "     included.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved owner, a moved target, a moved floor, a moved joint must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-alatreon-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-alatreon-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xef): [mon, '00'], hex(0xf0): [mon, '01'], hex(0xf2): [mon, '11'], hex(0xf3): [mon, '41']},
  'owner_bytes': {},
  'bases': {hex(0xef): 'base00', hex(0xf0): 'base01', hex(0xf2): 'base11', hex(0xf3): 'base41'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, 0.25, 0.05, [30.0, 610.0, 420.0]), 9: jointOf(-0.15, 0.2, 0.1, [-60.0, 180.0, 330.0]), 14: jointOf(0.05, -0.3, 0.2, [140.0, 420.0, 510.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[28]') === '[\"7:0x35\",\"7:0x3a\",\"7:0x3b\",\"7:0x3c\",\"7:0x3d\",\"7:0x3e\"]', 'L2 M28: the rains', pv('%s', '2', 'Motion[28]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[7]') === '[\"7:0x38\",\"7:0x39\",\"7:0x3f\",\"7:0x20\"]', 'L2 M7: the lines, the strikes and the drops', pv('%s', '2', 'Motion[7]'));" % (mon, mon)]),
  'controls': "\n".join([
    "    ['c18', { owner: [0, 0x3001, 0] }, 'the facing one word off (the blast behind him)'],",
    "    ['g1a', { ownerPos: [120.5, 15.25, -50.75] }, 'the owner 30 further (the blasts round him)'],",
    "    ['i3f', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further (the strikes)'],",
    "    ['s09', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the ball\\'s landing)'],",
    "    ['f19', { ownerPos: [120.5, 15.25, -50.75] }, 'the owner 30 further (the held meteors)'],",
    "    ['k20', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside (the drops)'],",
    "    ['m4d', { floorY: 3.0, ground: 3.0 }, 'the ground 3 higher (sp_01 7: flag 0x400)'],",
    "    ['m48', { joints: Object.assign({}, JOINTS, { 14: jointOf(0.05, -0.3, 0.2, [170.0, 420.0, 510.0]) }) }, 'joint 14 30 aside (sp_01 6)'],",
    "    ['e40', { joints: Object.assign({}, JOINTS, { 3: jointOf(0.1, 0.25, 0.05, [30.0, 640.0, 420.0]) }) }, 'joint 3 30 higher (the meteors)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[6]', 'shell00'], ['2', 'Motion[21]', 'shell41'], ['0', 'Motion[14]', 'shell01'], ['2', 'Motion[9]_loop', 'shell41'], ['2', 'Motion[28]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null, state: V.state.list + '|' + V.state.clip });",
    "    if (body().failed) await open();",
    "  }",
    "  const S = body().schedule;",
    "  for (const key of [0, 1, 2, 90, 91, 150, 180, 182, 183, 184, 185, 210, 211, 212, 214, 215]){",
    "    const pel = 'em050_00u', e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === pel && x.def.record.key === key);",
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
P = SPD + r'\spec_alatreon.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-alatreon-check.mjs'
s = open(out, encoding='utf8').read()
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;\n    if (c.stepsRaw) o.steps = c.stepsRaw;\n    if (c.block) o.block = c.block;\n    if (c.slot0Until) o.slot0Until = c.slot0Until;\n    if (c.unstub) o.unstub = c.unstub;\n    o.frameStep = 1.0;"),
  ("    if (romAtOnce !== !!S0.split083)",
   "    // (the at-once stops: Gammoth's split, base01's 0x20 switch, base41's hold)\n    if (romAtOnce !== !!(S0.split083 || S0.switched || S0.atOnce041))"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, loopStart: q.loopStart });"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(out, 'w', encoding='utf8').write(s)
print('patched')
