# mk032g.py (2026-10-19): dev/shells-grimclaw-check.mjs for mk_plaincheck.py -- Grimclaw Tigrex's (em032_04) shells against the ROM:
# the action main 0xe343f8 (uEm032_00, variant 4) at each maker's phase / frame, and the frame handler 0xe21294 by the motion id;
# owner +0xcac8 = 0xbf (sp_00), +0xcac4 = 0xc0 (sp_01); hitLife on (his shell00 flight is 0.0: it lives while its hit slot does)
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em032_04'
def OB(n, st=7): return "owner_bytes: Object.assign({ '0x73e0': [%d, 0x%02x] }, { '0xcac8': [0xbf, 0, 0, 0], '0xcac4': [0xc0, 0, 0, 0] })" % (st, n)
def Q(lst, clip, n, ln, extra=''):
    return "{ list: '%s', clip: '%s', variant: %s, len: %d%s }" % (lst, clip, ("'7:0x%02x'" % n) if n is not None else 'null', ln, extra)
def steps(ss): return "steps: [" + ", ".join(ss) + "]"
def act(n, phase, F, win=None): return "{ fn: 'e343f8', phase: %d, win: 0, %sframe: %s }" % (phase, ("winFrames: [%.1f], " % win) if win is not None else '', ('%.1f' % F) if F is not None else 'null')
def C(name, n, q, st, extra='', s=7):
    return "    C('%s', 0x%02x, 1, 0.0, 0, [%s], { st: %d, %s, %s, hitLife: true, slot0Until: SU%s })," % (name, n, q, s, st, OB(n, s), extra)
def FH(name, mid, F, lst, clip, ln, extra=''):
    q = Q(lst, clip, None, ln, ', loopStart: 76' if (lst, clip) == ('2', 'Motion[10]') else '')
    Fs = F if isinstance(F, list) else [F]; F = Fs[0]
    st = steps(["{ fn: 'e21294', frame: %.1f, owner: { '0x4b4': [%d, %d] } }" % (x, mid & 0xff, mid >> 8) for x in Fs])
    return "    C('%s', 0x00, 0, %.1f, 0, [%s], { st: 0, %s, %s, hitLife: true, slot0Until: SU, frames: 400, dtp: Array(32).fill(1)%s })," % (name, F, q, st, OB(0, 0), extra)
LEN = {'M26': 177, 'M27': 177, 'L9M4': 233, 'L9M19': 143, 'L9M15': 301, 'L9M6': 169, 'L9M9': 181, 'L9M12': 233, 'L2M10': 146, 'L2M15': 137}
cases = "\n".join([
  "    // the volley 0xe2aacc on his files: (7, 0x07) L2 M5, (7, 0x69) L2 M26, (7, 0x6a) L2 M27 (joint 40, mirrored)",
  C('g07', 0x07, Q('2', 'Motion[5]', 0x07, 175), steps([act(0x07, 1, None, F) for F in (68, 72, 76)])),
  C('g69', 0x69, Q('2', 'Motion[26]', 0x69, LEN['M26']), steps([act(0x69, 1, F) for F in (70, 74, 78)])),
  C('g6a', 0x6a, Q('2', 'Motion[27]', 0x6a, LEN['M27']), steps([act(0x6a, 1, F) for F in (68, 72, 76)])),
  "    // (7, 0x5d) L9 M4 f106 0xe305cc: calm (mode 20) and enraged (21), side 0 (joint 50, Y + 20)",
  C('g5d', 0x5d, Q('9', 'Motion[4]', 0x5d, LEN['L9M4']), steps([act(0x5d, 1, 106)])),
  C('g5dr', 0x5d, Q('9', 'Motion[4]', 0x5d, LEN['L9M4']), steps(["{ fn: 'e21294', frame: 16.0, owner: { '0x4b4': [4, 9] } }", act(0x5d, 1, 106)]), ", rage: true, dtp: Array(32).fill(1)"),
  "    // (7, 0x77) phase 2 on L9 M19 at 50 (0xe313a4): mode 23 (calm) / 45 (enraged) -- the landing's children: shell00 24 / 46, shell01 2 / 3",
  C('g77', 0x77, Q('9', 'Motion[19]', 0x77, LEN['L9M19']), steps([act(0x77, 2, None, 50)])),
  C('g77r', 0x77, Q('9', 'Motion[19]', 0x77, LEN['L9M19']), steps([act(0x77, 2, None, 50)]), ", rage: true"),
  "    // the quest's number 12 (0x49930 - 11 <= 5): the two extra shell00 (57 / 58)",
  C('g77q', 0x77, Q('9', 'Motion[19]', 0x77, LEN['L9M19']), steps([act(0x77, 2, None, 50)]), ", quest: 12, slot0Until: SUQ"),
  "    // (7, 0x7a) L9 M15 f20 (0xe32018): shell01 mode 8 at joint 50's ground, then its waves 14 / 15 (+0x150 0xe35e00, 20 moves each)",
  C('g7a', 0x7a, Q('9', 'Motion[15]', 0x7a, LEN['L9M15']), steps([act(0x7a, 1, 20)]), ", frames: 400"),
  "    // (7, 0x5f) 0xe30998: phase 0 (the bearing, the blend), A f18 shell01 11, B f42 shell01 4 / 6",
  C('g5f', 0x5f, Q('9', 'Motion[6]', 0x5f, LEN['L9M6']), steps([act(0x5f, 0, None), act(0x5f, 1, 18), act(0x5f, 1, 42)]), ", frames: 400, target: [2072.5, 40.0, 352.25]"),
  C('g5fr', 0x5f, Q('9', 'Motion[9]', 0x5f, LEN['L9M9']), steps([act(0x5f, 0, None), act(0x5f, 1, 22), act(0x5f, 1, 50)]), ", rage: true, frames: 400"),
  "    // the frame handler 0xe21294 -> 0xe221ac, enraged: shell01 10 (u 120) at a joint's ground",
  FH('f20a', 0x20a, [66.0, 98.0, 134.0], '2', 'Motion[10]', LEN['L2M10'], ", rage: true"),
  FH('f210', 0x210, [74.0, 96.0, 132.0], '2', 'Motion[16]', LEN['L2M15'], ", rage: true"),
  FH('f20f', 0x20f, [74.0, 96.0, 132.0], '2', 'Motion[15]', LEN['L2M15'], ", rage: true"),
  FH('f904', 0x904, 16.0, '9', 'Motion[4]', LEN['L9M4'], ", rage: true"),
  FH('f90c', 0x90c, 16.0, '9', 'Motion[12]', LEN['L9M12'], ", rage: true"),
  "    // calm: none",
  FH('f904calm', 0x904, 16.0, '9', 'Motion[4]', LEN['L9M4'], ", none: true"),
])
spec = {
  'name': 'grimclaw', 'title': 'Grimclaw shells', 'mon': mon, 'main': 'e343f8', 'variant': 4,
  'header': [
    "Grimclaw Tigrex's (em032_04) shells in render/shells.js against the ROM -- uEm032_00 at variant 4: the volley 0xe2aacc ((7, 0x07 /",
    "0x69 / 0x6a)), 0xe305cc ((7, 0x5d)), 0xe313a4 ((7, 0x77)) and its landing children, 0xe32018 ((7, 0x7a)) and the waves, 0xe30998",
    "((7, 0x5f)), the frame handler's 0xe221ac. dev/em032-shells-spec.md 9.",
    "",
    "  node dev/shells-grimclaw-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-grimclaw-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xbf): [mon, '00'], hex(0xc0): [mon, '01']},
  'owner_bytes': {},
  'bases': {hex(0xbf): 'base00', hex(0xc0): 'base01'},
  'joints': "  const SU = " + open(D + r'\su032g.json').read() + ";\n  const SUQ = " + open(D + r'\su032gq.json').read() + ";\n  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 50: jointOf(0.3, -0.1, 0.05, [60.0, 180.0, 310.0]), 40: jointOf(-0.25, 0.05, -0.1, [-70.0, 175.0, 300.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '9', 'Motion[19]') === '[\"7:0x77\"]', 'L9 M19: (7, 0x77)', pv('%s', '9', 'Motion[19]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['g5d', { joints: Object.assign({}, JOINTS, { 50: jointOf(0.3, -0.1, 0.05, [60.0, 181.0, 310.0]) }) }, 'joint 50 one unit up'],",
    "    ['g7a', { joints: Object.assign({}, JOINTS, { 50: jointOf(0.3, -0.1, 0.05, [61.0, 180.0, 310.0]) }) }, 'joint 50 one unit along x (the wave)'],",
    "    ['g5f', { target: [1807.5, 40.0, 993.25] }, 'the target 10 degrees to his other side (the bearing)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[5]', 'shell00'], ['9', 'Motion[19]', 'shell00'], ['9', 'Motion[15]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_grimclaw.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-grimclaw-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;" + N + "    if (c.dtp) o.dtp = c.dtp;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N +"    if (c.ctl) o.ctl = c.ctl;" + N + "    if (c.rage) o.rage = 1;" + N + "    o.frameStep = 1.0;"),
  ("        if (L.length && L[L.length - 1].moves === sh.moves) continue;",
   "        if ((sh.events || []).some(e => e.ev === 'stop' && e.flag === 1)) sh.atOnce032 = true;" + N + "        if (L.length && L[L.length - 1].moves === sh.moves) continue;"),
  ("    if (romAtOnce !== !!S0.split083) return",
   "    if (romAtOnce !== !!(S0.split083 || S0.atOnce032)) return"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, rage: !!x.rage, floorFlags: x.floorFlags, floorAttr: x.floorAttr });"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
