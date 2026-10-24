# mk086spec.py: spec_gore.json for mk_plaincheck.py (Valstrax, em086_00), then its patches
import json, sys, subprocess
BS = chr(92)
mon = 'em071_00'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
MAIN = 'faf780'
V = lambda st, n: '%d:0x%02x' % (st, n)
# hit slot 0's life by 'id:mode' (delay + duration + 1): sp_01 (0x12e = 302) by its mode's hit row
HD = [[32, 20], [30, 20], [28, 20], [0, 10], [0, 20], [0, 99], [0, 99], [0, 99], [0, 99], [14, 10], [40, 20], [30, 20], [30, 20], [14, 10], [0, 10]]
HIT = {2: 0, 3: 1, 4: 2, 5: 10, 6: 11, 7: 12, 8: 5, 9: 6, 10: 7, 11: 8, 12: 9, 13: 13, 14: 14}
UNTIL = {'302:%d' % m: HD[h][0] + HD[h][1] + 1 for m, h in HIT.items()}
X = ", hitLife: 1, slot0Until: %s, frames: 700" % json.dumps(UNTIL)
def Q(l, c, v, n): return "{ list: '%s', clip: 'Motion[%d]', variant: %s, len: %d }" % (l, c, ("'%s'" % v) if v else 'null', n)
def ST(*s): return "steps: [" + ', '.join("{ fn: '%s', %s }" % (MAIN, x) for x in s) + "]"
cases = ["    // each row: the action main 0x%s at the phase its spawn is in, the frame test 0xb0974 answered for that frame alone" % MAIN]
def C(nm, st, n, seq, steps, extra='', first=()):
    # first: the modes an sp_11 makes at its first move, while it is the LAST unit of line 18 -- the child is not moved in that step
    # but its slot is counted (the module's slot order, INFERRED: slotStep): one move less than delay + duration + 1
    U = dict(UNTIL); U.update({'302:%d' % m: UNTIL['302:%d' % m] - 1 for m in first})
    x = ", hitLife: 1, slot0Until: %s, frames: 700" % json.dumps(U)
    cases.append("    C('%s', %d, 1, null, 0, [%s], { st: %d, %s%s%s })," % (nm, n, ', '.join(seq), st, steps, x, extra))
C('s2c', 7, 0x2c, [Q('2', 52, V(7, 0x2c), 179)], ST("phase: 1, frame: 84.0"))
C('s212', 2, 0x12, [Q('1', 8, V(2, 0x12), 103)], ST("phase: 1, frame: 90.0"))
C('s300', 3, 0x00, [Q('1', 1, V(3, 0), 71)], ST("phase: 1, frame: 64.0"))
C('s09', 7, 0x09, [Q('2', 4, V(7, 9), 181)], ST("phase: 1, frame: 76.0"))
C('s09near', 7, 0x09, [Q('2', 4, V(7, 9), 181)], ST("phase: 1, frame: 76.0"), ", target: [300.0, 0.0, 900.0]")
C('s32', 7, 0x32, [Q('2', 6, V(7, 0x32), 325)], ST(*["phase: 1, frame: %.1f" % F for F in (116, 148, 202)]))
C('s08', 7, 0x08, [Q('2', 48, V(7, 8), 321)], ST("phase: 1, frame: 108.0"))
C('s2a', 7, 0x2a, [Q('2', 50, V(7, 0x2a), 361)], ST("phase: 1, frame: 138.0"))
C('s52', 7, 0x52, [Q('2', 7, V(7, 0x52), 285)], ST("phase: 1, frame: 114.0"), first=(2,))
C('s5b', 7, 0x5b, [Q('2', 7, V(7, 0x5b), 285)], ST("phase: 1, frame: 114.0"), first=(5,))
spec = {
  'name': 'gore', 'title': 'Gore Magala', 'mon': mon, 'main': MAIN, 'variant': 0,
  'header': [
    "Gore Magala's (em071_00) shells in render/shells.js against the ROM -- uEm071_00 (the Gore line's class): sp_00 (0x12d, base00:",
    "the frenzy ball, its landing 0xfc2034), sp_01 (0x12e, base01 through 0xfc2500: the frenzy bursts and the slams' dust), sp_03 (0x12f,",
    "base03 with the target arms: the ground lines that turn at the target) and sp_11 (0x130, base11 through 0xfc333c / 0xfc38b8: the",
    "rows of bursts). dev/gore-line-shells-spec.md.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xfaf780 at each spawn's phase,",
    "     the frame test answered for that frame alone; every shell flown from its setup, children included.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor, a moved joint must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells.",
    "",
    "  node dev/shells-gore-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-gore-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x12d): [mon, '00'], hex(0x12e): [mon, '01'], hex(0x12f): [mon, '03'], hex(0x130): [mon, '11']},
  'owner_bytes': {'0xcac4': [0x2d, 1, 0, 0], '0xcac8': [0x2e, 1, 0, 0], '0xcacc': [0x2f, 1, 0, 0], '0xcad0': [0x30, 1, 0, 0]},
  'bases': {hex(0x12d): 'base00', hex(0x12e): 'base01', hex(0x12f): 'base03', hex(0x130): 'base11'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, 0.25, 0.05, [130.0, 410.0, 120.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[7]') === '[\"7:0x52\",\"7:0x58\",\"7:0x59\",\"7:0x5b\"]', 'L2 M7: the burst rows', pv('%s', '2', 'Motion[7]'));" % (mon, mon)]),
  'controls': "\n".join([
    "    ['s32', { owner: [0, 0x3001, 0] }, 'the facing one word off (the lines ahead)'],",
    "    ['s2c', { target: [900.0, 70.0, 2400.0] }, 'the target 30 higher (the aimed ball)'],",
    "    ['s09', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside (the line turns at it)'],",
    "    ['s212', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the burst on the ground)'],",
    "    ['s52', { floorY: -600.0, ground: -600.0 }, 'the floor 600 lower (the ground ahead out of reach: no row)'],",
    "    ['s2c', { joints: Object.assign({}, JOINTS, { 3: jointOf(0.1, 0.25, 0.05, [130.0, 440.0, 120.0]) }) }, 'joint 3 30 higher (the ball)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[52]', 'shell00'], ['2', 'Motion[6]', 'shell03'], ['2', 'Motion[48]', 'shell11'], ['1', 'Motion[1]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = SPD + r'\spec_gore.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-gore-check.mjs'
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
