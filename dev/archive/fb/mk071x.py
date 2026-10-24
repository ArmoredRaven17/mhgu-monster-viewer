# mk071x.py <em071_05 | em072_00>: spec_<name>.json for mk_plaincheck.py (Chaotic Gore Magala / Shagaru Magala), then its patches
import json, sys, subprocess, re
BS = chr(92)
mon = sys.argv[1]
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
MAIN = 'faf780'
CFG = {'em071_05': dict(name='chaotic', title='Chaotic Gore Magala', variant=5, ids=(0x131, 0x132, 0x133, 0x134)),
       'em072_00': dict(name='shagaru', title='Shagaru Magala', variant=0, ids=(0x135, 0x136, 0x137, 0x138))}[mon]
IDS = CFG['ids']
# hit slot 0's life by 'id:mode' (delay + duration + 1): sp_01 by its mode's hit row (from the files, gen071)
out = subprocess.check_output([sys.executable, SPD + r'\gen071.py', mon], text=True, cwd=SPD)
blk = out.split('MODES 01')[1].split('MODES 03')[0]
HD = json.loads(blk.split('hitdata: ')[1].rstrip().rstrip('},').strip())
HIT = {int(m.group(1)): json.loads(m.group(2))[0] for m in re.finditer(r'\n\s+(\d+): m057\([^,]+, \[\[.*?\]\], (\[[-\d, ]+\])', blk)}
UNTIL = {'%d:%d' % (IDS[1], m): HD[h][0] + HD[h][1] + 1 for m, h in HIT.items() if h >= 0}
V = lambda st, n: '%d:0x%02x' % (st, n)
def Q(l, c, v, n): return "{ list: '%s', clip: '%s', variant: %s, len: %d }" % (l, c if isinstance(c, str) else 'Motion[%d]' % c, ("'%s'" % v) if v else 'null', n)
def ST(*s): return "steps: [" + ', '.join("{ fn: '%s', %s }" % (MAIN, x) for x in s) + "]"
cases = ["    // each row: the action main 0x%s at the phase its spawn is in, the frame test 0xb0974 answered for that frame alone" % MAIN]
def C(nm, st, n, seq, steps, extra='', first=()):
    U = dict(UNTIL); U.update({'%d:%d' % (IDS[1], m): UNTIL['%d:%d' % (IDS[1], m)] - 1 for m in first})
    x = ", hitLife: 1, slot0Until: %s, frames: 700, stubs: ['0x49710']" % json.dumps(U)
    cases.append("    C('%s', %d, 1, null, 0, [%s], { st: %d, %s%s%s })," % (nm, n, ', '.join(seq), st, steps, x, extra))
G = ", ctl: { '0x84': [0x00, 0x40, 0x9c, 0x46] }, gauge071: 20000.0"     # C+0x84 = 20000.0 (0x469c4000)
C('k2c', 7, 0x2c, [Q('2', 52, V(7, 0x2c), 179)], ST("phase: 1, frame: 84.0"))
C('k50', 7, 0x50, [Q('4', 1, V(7, 0x50), 325)], ST(*["phase: 1, frame: %.1f" % F for F in (104, 138, 192)]))
C('k55', 7, 0x55, [Q('4', 15, V(7, 0x55), 103)], ST("phase: 1, frame: 30.0"))
C('k56', 7, 0x56, [Q('4', 7, V(7, 0x56), 163)], ST("phase: 1, frame: 64.0"), first=(0,))
C('k08', 7, 0x08, [Q('2', 48, V(7, 8), 321)], ST("phase: 1, frame: 108.0"))
C('k52', 7, 0x52, [Q('2', 7, V(7, 0x52), 285)], ST("phase: 1, frame: 114.0"), first=(2,))
C('k300', 3, 0x00, [Q('1', 1, V(3, 0), 71)], ST("phase: 1, frame: 64.0"))
if mon == 'em071_05':
    C('k09', 7, 0x09, [Q('2', 4, V(7, 9), 181)], ST("phase: 1, frame: 76.0"))
    C('k32', 7, 0x32, [Q('2', 6, V(7, 0x32), 325)], ST(*["phase: 1, frame: %.1f" % F for F in (116, 148, 202)]))
    C('k2a', 7, 0x2a, [Q('2', 50, V(7, 0x2a), 361)], ST("phase: 1, frame: 138.0"))
    C('k64', 7, 0x64, [Q('4', 30, V(7, 0x64), 231)], ST("phase: 1, frame: 124.0"), first=(15,))
    C('k6b28', 7, 0x6b, [Q('4', 28, V(7, 0x6b), 355)], ST("phase: 0", "phase: 1, frame: 138.0"))
    C('k6b24', 7, 0x6b, [Q('4', 24, V(7, 0x6b), 355)], ST("phase: 0", "phase: 1, frame: 138.0"), ", target: [-900.0, 40.0, -2400.0]")
    C('k67', 7, 0x67, [Q('4', 22, V(7, 0x67), 335)], ST("phase: 1, frame: 160.0"), first=(5,))
    C('kf1c', 7, 0x1c, [Q('2', 31, V(7, 0x1c), 387)], ST("phase: 1, frame: 65.0"), G)
    C('kf2f', 7, 0x2f, [Q('2', 'Motion[25]', V(7, 0x2f), 60)], ST("phase: 1, frame: 1.0"), G)
    C('kf07', 7, 0x07, [Q('2', 33, V(7, 7), 305)], ST("phase: 1, frame: 60.0"), G)
else:
    C('kf07', 7, 0x07, [Q('2', 33, V(7, 7), 305)], ST("phase: 1, frame: 60.0"))
    C('kf1b', 7, 0x1b, [Q('2', 30, V(7, 0x1b), 177)], ST("phase: 1, frame: 1.0"))
    C('kf2f', 7, 0x2f, [Q('2', 'Motion[25]', V(7, 0x2f), 60)], ST("phase: 1, frame: 1.0", "phase: 1, frame: 16.0"))
    # the scatter (scatter071): vt+0x204 0xfadfa0 with (7, 0x53), then vt+0x1dc 0xfae824 once a frame -- once for each of the module's 7870 steps (162 + 402 + tail 7306): the whole life, 78 shells (240 + 90 k <= 7200), the last flown 700
    SC = "stepsRaw: [{ fn: 'fadfa0', args: [7, 0x53], owner: { '0x73e8': [0x67, 0x2b] } }].concat(Array.from({ length: 162 + 402 + 7306 }, () => ({ fn: 'fae824' }))), stubs: ['0x49710', '0x276290', '0x27482c', '0xc6d58', '0xc8280'], unstub: ['0x7206c'], dtp: [0, 1, 1, 0, 0, 2, 2, 1, 2, 1, 1, 3, 3, 1, 1, 2]"
    cases.append("    C('ksc', 0x53, 1, null, 0, [%s, %s], { st: 7, steps: [], %s, hitLife: 1, slot0Until: %s, frames: 700, tail: 7306 })," % (
        Q('4', 2, V(7, 0x53), 161), Q('4', 11, None, 401), SC, json.dumps(UNTIL)))
    C('kf5a', 7, 0x5a, [Q('4', 13, V(7, 0x5a), 205)], ST("phase: 1, frame: 1.0"))
contract = ("  ok(pv('%s', '2', 'Motion[7]') === '[\"7:0x52\",\"7:0x58\",\"7:0x59\",\"7:0x5b\"]', 'L2 M7: the burst rows', pv('%s', '2', 'Motion[7]'));" % (mon, mon))
controls = [
    "    ['k55', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside (the landing children face it)'],",
    "    ['k56', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the ball lands, its burst)'],",
    "    ['k50', { owner: [0, 0x3001, 0] }, 'the facing one word off (the lines: his words + the fan)'],",
    "    ['k2c', { joints: Object.assign({}, JOINTS, { 3: jointOf(0.1, 0.25, 0.05, [130.0, 440.0, 120.0]) }) }, 'joint 3 30 higher (the ball)'],",
    "    ['kf07', { owner: [0, 0x3001, 0] }, 'the facing one word off (the footfall dust)'],",
    "    ['kf07', { rank: 4 }, 'quest rank 4 (no footfall dust)'],"]
if mon == 'em071_05':
    controls += ["    ['kf1c', { gauge071: 19999.0 }, 'the counter 19999 (no dust)'],",
                 "    ['k64', { floorY: -600.0, ground: -600.0 }, 'the floor 600 lower (no sp_11 6)'],",
                 "    ['k32', { owner: [0, 0x3001, 0] }, 'the facing one word off (the lines ahead)'],"]
else:
    controls += ["    ['kf1b', { joints: Object.assign({}, JOINTS, { 63: jointOf(0.0, 0.1, 0.0, [-200.0, 300.0, 330.0]) }) }, 'joint 63 30 aside (the dust)'],",
                 "    ['ksc', { ownerPos: [150.5, 15.25, -80.75] }, 'his point 30 aside (the scatter centre)'],",
                 "    ['ksc', { rank: 4 }, 'quest rank 4 (every fourth at the centre, not the no-hunter point)'],"]
page = "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[52]', 'shell00'], ['4', 'Motion[1]', 'shell03'], ['2', 'Motion[48]', 'shell11'], ['4', 'Motion[7]', 'shell01']].concat(MON === 'em072_00' ? [['4', 'Motion[2]', 'shell01']] : [])){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"])
spec = {
  'name': CFG['name'], 'title': CFG['title'], 'mon': mon, 'main': MAIN, 'variant': CFG['variant'],
  'header': [
    "%s's (%s) shells in render/shells.js against the ROM -- uEm071_00 (the Gore line's class; ids 0x%x..0x%x)." % (CFG['title'], mon, IDS[0], IDS[3]),
    "dev/gore-line-shells-spec.md.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xfaf780 at each spawn's phase,",
    "     the frame test answered for that frame alone; every shell flown from its setup, children included.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: each must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells.",
    "",
    "  node dev/shells-%s-check.mjs                                   (1..3: the ROM comparison, no viewer)" % CFG['name'],
    "  node <scratchpad>/run-check.mjs dev/shells-%s-check.mjs         (4: the viewer)" % CFG['name'],
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(IDS[0]): [mon, '00'], hex(IDS[1]): [mon, '01'], hex(IDS[2]): [mon, '03'], hex(IDS[3]): [mon, '11']},
  'owner_bytes': {'0xcac4': [IDS[0] & 0xff, 1, 0, 0], '0xcac8': [IDS[1] & 0xff, 1, 0, 0], '0xcacc': [IDS[2] & 0xff, 1, 0, 0], '0xcad0': [IDS[3] & 0xff, 1, 0, 0]},
  'bases': {hex(IDS[0]): 'base00', hex(IDS[1]): 'base01', hex(IDS[2]): 'base03', hex(IDS[3]): 'base11'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, 0.25, 0.05, [130.0, 410.0, 120.0]), 63: jointOf(0.0, 0.1, 0.0, [-230.0, 300.0, 330.0]), 73: jointOf(0.05, 0.0, 0.1, [240.0, 320.0, 310.0]) };",
  'cases': '\n'.join(cases), 'contract': contract, 'controls': '\n'.join(controls), 'page': page,
}
P = SPD + r'\spec_%s.json' % CFG['name']
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-%s-check.mjs' % CFG['name']
s = open(outp, encoding='utf8').read()
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;\n    if (c.stepsRaw) o.steps = c.stepsRaw;\n    if (c.block) o.block = c.block;\n    if (c.slot0Until) o.slot0Until = c.slot0Until;\n    if (c.unstub) o.unstub = c.unstub;\n    if (c.ownvt54) o.ownvt54 = 1;\n    if (c.ctl) o.ctl = c.ctl;\n    if (c.stubs) o.stubs = c.stubs;\n    if (c.dtp) o.dtp = c.dtp;\n    o.frameStep = 1.0;"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, loopStart: q.loopStart, ownerMatrix: yawM(x.owner[1], x.ownerPos), gauge071: x.gauge071 });"),
  ("  function emuCase(c, J){",
   "  // the unit's world matrix +0xb0 as emu_fb's owner_setup builds it: the yaw turn and the point\n"
   "  function yawM(oY, P){ const r = f(f(oY & 0xffff) * f(9.58738019107841e-05)), sn = f(Math.sin(r)), cs = f(Math.cos(r));\n"
   "    return [cs, 0, f(-sn), 0, 0, 1, 0, 0, sn, 0, cs, 0, P[0], P[1], P[2], 1]; }\n"
   "  function emuCase(c, J){"),
  ("    if (romAtOnce !== !!S0.split083)",
   "    // (the at-once stops: Gammoth's split, base01's 0x20 switch when it had a handle to stop: 0x43b058 on none does nothing)\n    if (romAtOnce !== !!(S0.split083 || (S0.switched && S0.switched.from != null)))"),
]
reps.append(("    for (let i = 0; i < (x.frames || 460) + 500; i++) steps.push", "    for (let i = 0; i < (x.tail != null ? x.tail : (x.frames || 460) + 500); i++) steps.push"))
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched', HIT, UNTIL)
