# mk086spec.py: spec_valstrax.json for mk_plaincheck.py (Valstrax, em086_00), then its patches
import json, sys, subprocess
BS = chr(92)
mon = 'em086_00'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
MAIN = '109f650'
V = lambda st, n: '%d:0x%02x' % (st, n)
# hit slot 0's life by 'id:mode' (delay + duration + 1): sp_01 (373) by its mode's hit row
HD = [[0, 20], [0, 20], [0, 20], [0, 20], [14, 10], [30, 20], [6, 10], [8, 20], [0, 20], [10, 10], [0, 20]]
HIT = {0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 5, 8: 6, 9: 6, 10: 8, 11: 7, 12: 9, 13: 9, 14: 10}
UNTIL = {'373:%d' % m: HD[h][0] + HD[h][1] + 1 for m, h in HIT.items()}
X = ", hitLife: 1, slot0Until: %s, frames: 700" % json.dumps(UNTIL)
def Q(l, c, v, n): return "{ list: '%s', clip: 'Motion[%d]', variant: %s, len: %d }" % (l, c, ("'%s'" % v) if v else 'null', n)
def ST(*s): return "steps: [" + ', '.join("{ fn: '%s', %s }" % (MAIN, x) for x in s) + "]"
cases = ["    // each row: the action main 0x%s at the phase its spawn is in, the frame test 0xb0974 answered for that frame alone" % MAIN]
def C(nm, st, n, seq, steps, extra=''):
    cases.append("    C('%s', %d, 1, null, 0, [%s], { st: %d, %s%s%s })," % (nm, n, ', '.join(seq), st, steps, X, extra))
FR = [50, 52, 62, 64, 72, 74]
C('a08', 7, 0x08, [Q('2', 32, V(7, 8), 426)], ST(*["phase: 1, frame: %.1f" % F for F in FR]))
# (7, 0xc8): phase 0 keeps the target in the cone (his world matrix: the enemy's own vt+0x54 0xc156c(-1) = +0xb0)
C('c8', 7, 0xc8, [Q('2', 32, V(7, 0xc8), 426)], ST("phase: 0", *["phase: 1, frame: %.1f" % F for F in FR]), ", ownvt54: 1")
C('c8far', 7, 0xc8, [Q('2', 32, V(7, 0xc8), 426)], ST("phase: 0", *["phase: 1, frame: %.1f" % F for F in FR]), ", ownvt54: 1, target: [3900.0, 1200.0, 300.0]")
C('s09', 7, 0x09, [Q('2', 36, V(7, 9), 594)], ST("phase: 1, frame: 120.0"))
C('s0a', 7, 0x0a, [Q('2', 37, V(7, 0xa), 200)], ST("phase: 2, frame: 65.0"))
C('s30', 7, 0x30, [Q('2', 63, V(7, 0x30), 54)], ST("phase: 2, frame: 6.0"))
C('s31', 7, 0x31, [Q('2', 67, V(7, 0x31), 190)], ST("phase: 2, frame: 48.0"), ", owner_bytes: { '0x73e0': [7, 0x31], '0xcac0': [0, 0, 0, 0], '0xcac4': [0, 0x30, 0, 0], '0xcac8': [0, 0, 0, 0] }")
C('s34', 7, 0x34, [Q('2', 71, V(7, 0x34), 200)], ST("phase: 1, ended: 1"))
spec = {
  'name': 'valstrax', 'title': 'Valstrax', 'mon': mon, 'main': MAIN, 'variant': 0,
  'header': [
    "Valstrax's (em086_00) shells in render/shells.js against the ROM -- uEm086_00: sp_56 (0x174, BASE56: the homing shots, their contact",
    "0x10a28bc) and sp_01 (0x175, base01 through 0x10a25b0: his blasts, the 0x20 switch's u 500). dev/elder-dragon-shells-spec.md 9.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0x109f650 at each spawn's phase,",
    "     the frame test answered for that frame alone; every shell flown from its setup, children included.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved owner, a moved target, a moved floor, a moved joint must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells.",
    "",
    "  node dev/shells-valstrax-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-valstrax-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x174): [mon, '00'], hex(0x175): [mon, '01']},
  'owner_bytes': {},
  'bases': {hex(0x174): 'base56', hex(0x175): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 165: jointOf(0.1, 0.25, 0.05, [30.0, 610.0, 420.0]), 175: jointOf(-0.1, 0.3, 0.05, [-40.0, 600.0, 400.0]), 166: jointOf(0.05, 0.2, -0.1, [60.0, 560.0, 300.0]), 176: jointOf(0.0, -0.2, 0.1, [-70.0, 540.0, 310.0]), 167: jointOf(0.2, 0.1, 0.0, [90.0, 500.0, 200.0]), 177: jointOf(-0.2, 0.1, 0.0, [-90.0, 505.0, 210.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[32]') === '[\"7:0x08\",\"7:0x1c\",\"7:0xc8\",\"7:0xc9\"]', 'L2 M32: the homing shots', pv('%s', '2', 'Motion[32]'));" % (mon, mon)]),
  'controls': "\n".join([
    "    ['a08', { owner: [0, 0x3001, 0] }, 'the facing one word off (the shots)'],",
    "    ['c8', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside (the coned shots)'],",
    "    ['c8far', { target: [3900.0, 1230.0, 300.0] }, 'a far target 30 higher (the cone cuts it)'],",
    "    ['a08', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the shots land)'],",
    "    ['s09', { ownerPos: [120.5, 15.25, -50.75] }, 'the owner 30 further (the blasts)'],",
    "    ['a08', { joints: Object.assign({}, JOINTS, { 165: jointOf(0.1, 0.25, 0.05, [30.0, 640.0, 420.0]) }) }, 'joint 165 30 higher (the first shot)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[32]', 'shell56'], ['2', 'Motion[36]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = SPD + r'\spec_valstrax.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-valstrax-check.mjs'
s = open(out, encoding='utf8').read()
N = BS + 'n'
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;\n    if (c.stepsRaw) o.steps = c.stepsRaw;\n    if (c.block) o.block = c.block;\n    if (c.slot0Until) o.slot0Until = c.slot0Until;\n    if (c.unstub) o.unstub = c.unstub;\n    if (c.ownvt54) o.ownvt54 = 1;\n    o.frameStep = 1.0;"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, loopStart: q.loopStart, ownerMatrix: yawM(x.owner[1], x.ownerPos) });"),
  ("  function emuCase(c, J){",
   "  // the unit's world matrix +0xb0 as emu_fb's owner_setup builds it: the yaw turn and the point\n"
   "  function yawM(oY, P){ const r = f(f(oY & 0xffff) * f(9.58738019107841e-05)), sn = f(Math.sin(r)), cs = f(Math.cos(r));\n"
   "    return [cs, 0, f(-sn), 0, 0, 1, 0, 0, sn, 0, cs, 0, P[0], P[1], P[2], 1]; }\n"
   "  function emuCase(c, J){"),
  ("    if (romAtOnce !== !!S0.split083)",
   "    // (the at-once stops: Gammoth's split, base01's 0x20 switch when it had a handle to stop: 0x43b058 on none does nothing)\n    if (romAtOnce !== !!(S0.split083 || (S0.switched && S0.switched.from != null)))"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(out, 'w', encoding='utf8').write(s)
print('patched')
