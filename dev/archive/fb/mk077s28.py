# mk077s28.py (2026-10-19): dev/shells-seregios28-check.mjs for mk_plaincheck.py -- Seregios's bladescales (shell28 0x13e, base28)
# against the ROM: the action main 0xfdb030 (uEm077_00) at each maker's phase, one step per frame (the frame tests answered at that
# frame alone), ctl+0x70.. poked as the action's phase 0 writes them; the frame handler 0xfddfcc (vt+0x208) by the motion id (e+0x4b4)
# at a channel-1 frame (0xb09b0). Hit slot 0 held through move 100 (hitdata (0, 99): delay + duration + 1), the module's hitLife
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em077_00'
DTP = 'dtp: [6, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 3, 4, 2, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]'
BRK4 = ", block_bytes: { '0x3ec': [2] }, parts077: { 4: 2 }"
BRK6 = ", block_bytes: { '0x404': [2] }, parts077: { 6: 2 }"
SU = "slot0Until: { %s }" % ', '.join("'318:%d': 100" % m for m in range(14))
LEN = {'Motion[4]': 139, 'Motion[3]': 139, 'Motion[26]': 165, 'Motion[21]': 187, 'Motion[20]': 207, 'Motion[34]': 171,
       'Motion[65]': 161, 'Motion[66]': 161, 'Motion[29]': 45, 'Motion[48]': 105}
def C(name, st, n, clip, phase, frames, extra=''):
    steps = ', '.join("{ fn: 'fdb030', phase: %d, win: 0, winFrames: [%.1f], frame: %.1f }" % (phase, F, F) for F in frames)
    q = "{ list: '2', clip: '%s', variant: '%d:0x%02x', len: %d }" % (clip, st, n, LEN[clip])
    ob = "owner_bytes: Object.assign({ '0x73e0': [%d, 0x%02x] }, {})" % (st, n)
    return "    C('%s', 0x%02x, %d, %.1f, 0, [%s], { st: %d, steps: [%s], %s, hitLife: true, %s, %s, frames: 160%s })," % (name, n, phase, frames[0], q, st, steps, ob, SU, DTP, extra)
def FH(name, n, clip, mid, frames, ctl, extra=''):
    steps = ', '.join("{ fn: 'fddfcc', frame2: %.1f, owner: { '0x4b4': [%d, %d] } }" % (F, mid & 0xff, mid >> 8) for F in frames)
    q = "{ list: '2', clip: '%s', variant: '7:0x%02x', len: %d }" % (clip, n, LEN[clip])
    ob = "owner_bytes: Object.assign({ '0x73e0': [7, 0x%02x] }, {})" % n
    c = "ctl: { '0x70': [%d, 0, 0, 0], '0x74': [%d, 0, 0, 0], '0x78': [%d, 0] }" % tuple(ctl)
    return "    C('%s', 0x%02x, 0, %.1f, 0, [%s], { st: 7, steps: [%s], %s, %s, hitLife: true, %s, %s, frames: 160%s })," % (name, n, frames[0], q, steps, ob, c, SU, DTP, extra)
cases = "\n".join([
  "    // L2 M4 / M3 at 55 / 60 / 65 (G rank only): mode 6 (12 severed), the degree index 52.. / 51.., aim 0 -- his words plus the degrees",
  C('g17', 1, 0x17, 'Motion[4]', 1, [55, 60, 65]),
  C('g17s', 1, 0x17, 'Motion[4]', 1, [55, 60, 65], ", severed: true"),
  C('g0b', 7, 0x0b, 'Motion[3]', 1, [55, 60, 65], ", owner: [0x200, 0xa000, 0x100]"),
  "    // ...and none below G rank (questRank 4)",
  C('g17r4', 1, 0x17, 'Motion[4]', 1, [55, 60, 65], ", rank: 4, none: true"),
  "    // phase 2 on L2 M26: mode 9 at 70 / 73 / 76 / 79 (index 6..9; (7, 0x3b) 10..13)",
  C('c19', 1, 0x19, 'Motion[26]', 2, [70, 73, 76, 79]),
  C('c3b', 7, 0x3b, 'Motion[26]', 2, [70, 73, 76, 79], ", owner: [0, 0x5000, 0]"),
  "    // ...with part 4 at its .dtp row's level 2: mode 9",
  C('c19b', 1, 0x19, 'Motion[26]', 2, [70, 73, 76, 79], BRK4),
  C('c19br3', 1, 0x19, 'Motion[26]', 2, [70, 73, 76, 79], BRK4 + ", rank: 3"),
  "    // L2 M21 at 69 / 74 / 80: AIMED (aim 1, clamps 2 / 3 / 4); (7, 0x11): ctl+0x70 1 -> mode 7",
  C('a04', 7, 0x04, 'Motion[21]', 1, [69, 74, 80]),
  C('a04up', 7, 0x04, 'Motion[21]', 1, [69, 74, 80], ", target: [300.0, 2600.0, 600.0]"),
  C('a04side', 7, 0x04, 'Motion[21]', 1, [69, 74, 80], ", target: [-2400.0, -300.0, -200.0], owner: [0x300, 0x2000, 0]"),
  C('a11', 7, 0x11, 'Motion[21]', 1, [69, 74, 80], ", ctl: { '0x70': [1, 0, 0, 0] }"),
  "    // L2 M20 at 62 .. 100: aimed, clamp 5; ctl+0x70 0 -> 6 / severed 5, 1 -> 13 / severed 12",
  C('a05', 7, 0x05, 'Motion[20]', 1, [62, 67, 72, 90, 95, 100]),
  C('a05s', 7, 0x05, 'Motion[20]', 1, [62, 67, 72, 90, 95, 100], ", severed: true"),
  C('a12', 7, 0x12, 'Motion[20]', 1, [62, 67, 72, 90, 95, 100], ", ctl: { '0x70': [1, 0, 0, 0] }"),
  C('a12s', 7, 0x12, 'Motion[20]', 1, [62, 67, 72, 90, 95, 100], ", ctl: { '0x70': [1, 0, 0, 0] }, severed: true"),
  "    // phase 2 on L2 M34: mode 8 at 76 / 79 / 82 / 85 (index 14.. / 18.. / 22..)",
  C('b08', 7, 0x08, 'Motion[34]', 2, [76, 79, 82, 85]),
  C('b3f', 7, 0x3f, 'Motion[34]', 2, [76, 79, 82, 85]),
  C('b40', 7, 0x40, 'Motion[34]', 2, [76, 79, 82, 85]),
  C('b08b', 7, 0x08, 'Motion[34]', 2, [76, 79, 82, 85], BRK4),
  "    // L2 M65 / M66 at 85 / 91 (G rank only): mode 7, index 47 / 49 or 48 / 50",
  C('d2d', 7, 0x2d, 'Motion[65]', 1, [85, 91]),
  C('d2e', 7, 0x2e, 'Motion[66]', 1, [85, 91]),
  "    // ...with the head (part 6) at its row's level: mode 7",
  C('d2db', 7, 0x2d, 'Motion[65]', 1, [85, 91], BRK6),
  "    // the floor 150 up (the first shots cross it)",
  C('c19floor', 1, 0x19, 'Motion[26]', 2, [70, 73, 76, 79], ", floorY: 150.0, ground: 150.0"),
  "    // THE FRAME HANDLER 0xfddfcc: L2 M29 at 8 / 13, L2 M48 at 66 / 71, two a crossing, modes and index by the action's ctl",
  FH('f09', 0x09, 'Motion[29]', 0x21d, [8, 13], [0, 0, 0]),
  FH('f1b', 0x1b, 'Motion[29]', 0x21d, [8, 13], [1, 1, 1]),
  FH('f14', 0x14, 'Motion[29]', 0x21d, [8, 13], [0, 1, 0]),
  FH('f23', 0x23, 'Motion[48]', 0x230, [66, 71], [0, 0, 0]),
  FH('f26', 0x26, 'Motion[48]', 0x230, [66, 71], [1, 1, 0]),
])
spec = {
  'name': 'seregios28', 'title': 'Seregios bladescales', 'mon': mon, 'main': 'fdb030', 'variant': 0,
  'header': [
    "Seregios's (em077_00) bladescales in render/shells.js against the ROM -- shell28 0x13e (uShellEm077_sp_28, base28 0x4111b0..; his reader",
    "0xfeef90, landing 0xfef178) from the action main 0xfdb030 (L2 M3 / M4 / M20 / M21 / M26 / M34 / M65 / M66) and the frame handler 0xfddfcc",
    "(L2 M29 / M48). dev/em077-shells-spec.md.",
    "",
    "  node dev/shells-seregios28-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-seregios28-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x13e): [mon, '28']},
  'owner_bytes': {},
  'bases': {hex(0x13e): 'base28'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, -0.2, 0.05, [60.0, 310.0, 420.0]), 18: jointOf(-0.3, 0.1, 0.0, [40.0, 280.0, 300.0]), 22: jointOf(0.3, 0.1, -0.1, [200.0, 280.0, 300.0]), 144: jointOf(0.0, 0.4, 0.1, [-70.0, 260.0, -350.0]), 145: jointOf(0.5, -0.1, 0.2, [90.0, 255.0, -340.0]), 160: jointOf(-0.6, 0.2, 0.0, [-150.0, 330.0, 150.0]), 161: jointOf(0.6, 0.2, 0.1, [150.0, 330.0, 150.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[21]') === '[\"7:0x04\",\"7:0x11\"]', 'L2 M21: (7, 4 / 0x11)', pv('%s', '2', 'Motion[21]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['g17', { joints: Object.assign({}, JOINTS, { 145: jointOf(0.5, -0.1, 0.2, [91.0, 255.0, -340.0]) }) }, 'joint 145 one unit along x (its y is not read: int 2 = 0, the height from his)'],",
    "    ['a04', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside'],",
    "    ['c19', { owner: [0, 0x3100, 0] }, 'his Y word 0x100 more'],",
    "    ['g17s', { severed: false }, 'the tail not severed'],",
    "    ['f09', { seq: [{ list: '2', clip: 'Motion[29]', variant: '7:0x13', len: 45 }] }, 'the module playing (7, 0x13) (ctl+0x70 1)'],",
    "    ['c19floor', { floorY: 100.0 }, 'the module floor 50 lower'],",
    "    ['c19b', { parts077: { 4: 1 } }, 'the module part 4 at level 1'],",
    "    ['d2db', { parts077: {} }, 'the module head unbroken'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[26]', 'shell28'], ['2', 'Motion[21]', 'shell28'], ['2', 'Motion[34]', 'shell28'], ['2', 'Motion[29]', 'shell28']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_seregios28.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-seregios28-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N + "    if (c.ctl) o.ctl = c.ctl;" + N + "    if (c.severed) o.severed = 1;" + N + "    if (c.dtp) o.dtp = c.dtp;" + N + "    if (c.block_bytes) o.block_bytes = c.block_bytes;" + N + "    o.frameStep = 1.0;"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, tailSevered: !!x.severed, parts077: x.parts077 });"),
  ("  const FULL = new Set(['base00', 'base13']);", "  const FULL = new Set(['base00', 'base13', 'base28']);"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
