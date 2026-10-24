# mk087spec.py: spec_neset.json for mk_plaincheck.py (Ahtal-Neset, em087_00): his action main (7, 4) and the EVENT WALKER 0x6c590 run
# natively with e+0xcacc = the selector's table entry (0x1803de8 + 8 n), e+0x4b4 the motion, vt+0x480 his 0x10ab6c0; then its patches
import json, sys, subprocess, struct
BS = chr(92)
mon = 'em087_00'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
MAIN = '10a5740'
TAB = 0x1803de8
V = lambda st, n: '%d:0x%02x' % (st, n)
HD = [[60, 8], [0, 8], [0, 8], [16, 8], [10, 8], [0, 8], [30, 8]]
HIT = {0: 0, 1: 1, 2: 2, 4: 3, 5: 4, 6: 5, 8: 3, 9: 4, 10: 5, 12: 6}
UNTIL = {'%d:%d' % (0x177, m): HD[h][0] + HD[h][1] + 1 for m, h in HIT.items()}
def Q(l, c, v, n): return "{ list: '%s', clip: 'Motion[%d]', variant: %s, len: %d }" % (l, c, ("'%s'" % v) if v else 'null', n)
cases = ["    // (7, 4): the action main at its phases; the event rows: the walker 0x6c590 once per frame test, its kind-1 test answered for that frame"]
def C(nm, st, n, seq, steps, extra=''):
    x = ", hitLife: 1, slot0Until: %s, frames: 700" % json.dumps(UNTIL)
    cases.append("    C('%s', %d, 1, null, 0, [%s], { st: %d, stepsRaw: [%s]%s%s })," % (nm, n, ', '.join(seq), st, ', '.join(steps), x, extra))
def W(idx, mot, frames):
    ob = {'0xcacc': list(struct.pack('<I', TAB + 8 * idx)), '0x4b4': list(struct.pack('<H', mot))}
    return ["{ fn: '6c590', winFrames: [%s], owner: %s }" % ('%.1f' % F, json.dumps(ob)) for F in frames]
OV = ", ownvt: { '0x480': '0x10ab6c0', '0x47c': '0x10ab32c', '0x484': '0x6d594', '0x488': '0x6d598' }"
C('n04', 7, 0x04, [Q('2', 3, V(7, 4), 707)], ["{ fn: '%s', phase: 0 }" % MAIN, "{ fn: '%s', phase: 1, frame: 204.0, win: 1 }" % MAIN])
C('e02', 7, 0x02, [Q('2', 3, V(7, 2), 707)], W(2, 0x203, [184, 192]), OV)
C('e08', 7, 0x08, [Q('2', 30, V(7, 8), 183)], W(8, 0x21e, [134]), OV)
C('e0d', 7, 0x0d, [Q('2', 41, V(7, 0xd), 595)], W(13, 0x229, [238, 242]), OV)
C('e1a', 7, 0x1a, [Q('2', 57, V(7, 0x1a), 639)], W(26, 0x239, [106, 110, 130, 250, 270, 454]), OV)
# sp_58 (type 11, base58): (7, 0x12) selector 18 on L2 M64 (0x240) at f2, three beams; (2, 4) selector 69 on L0 M12 (0x00c): f12 mode 1, f20 / f30 mode 0
B58 = ", activate: ['0x179'], coreVt: 1, stubs: ['0x4342ac']"
C('e12', 7, 0x12, [Q('2', 64, V(7, 0x12) + '/s18', 181)], W(18, 0x240, [2]), OV + B58)
C('w204', 2, 0x04, [Q('0', 12, V(2, 4), 249)], W(69, 0x00c, [12, 20, 30]), OV + B58)
# sp_48 (type 9, base48): (7, 0x12) selector 18 on L2 M70 (0x246) f60 mode 0 / f80 mode 1; (1, 1) selector 68 on L0 M3 (0x003) f60 mode 0 / f80 mode 4
C('m70', 7, 0x12, [Q('2', 70, V(7, 0x12) + '/s18', 431)], W(18, 0x246, [60, 80]), OV)
C('o103', 1, 0x01, [Q('0', 3, V(1, 1) + '/s68', 121)], W(68, 0x003, [60, 80]), OV)
spec = {
  'name': 'neset', 'title': 'Ahtal-Neset', 'mon': mon, 'main': MAIN, 'variant': 0,
  'header': [
    "Ahtal-Neset's (em087_00) shells in render/shells.js against the ROM -- uEm087_00: sp_01 (0x177, base01 through 0x10c229c; its",
    "+0x150 0x10c2344 the delay chain) from (7, 4) and from his EVENT rows (the walker 0x6c590, type 10). dev/ahtal-neset-shells-spec.md.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn; children flown from the setups the ROM built.",
    "  2. The contract. 3. CONTROLS must FAIL. 4. The viewer (pageCheck).",
    "",
    "  node dev/shells-neset-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-neset-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x177): [mon, '01'], hex(0x179): [mon, '58'], hex(0x178): [mon, '48']},
  'owner_bytes': {},
  'bases': {hex(0x177): 'base01', hex(0x179): 'base58', hex(0x178): 'base48'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 4: jointOf(0.1, 0.2, 0.0, [-60.0, 900.0, 300.0]), 13: jointOf(0.05, 0.1, 0.0, [420.0, 120.0, 650.0]), 17: jointOf(-0.05, 0.1, 0.0, [-430.0, 125.0, 640.0]), 14: jointOf(0.1, -0.2, 0.05, [310.0, 420.0, 520.0]), 143: jointOf(-0.1, 0.3, 0.0, [-150.0, 1350.0, 200.0]), 21: jointOf(0.0, 0.0, 0.1, [500.0, 300.0, -200.0]) };",
  'cases': '\n'.join(cases),
  'contract': "  ok(pv('%s', '2', 'Motion[3]') === '[\"7:0x04\",\"7:0x01\",\"7:0x02\"]', 'L2 M3: (7, 1) / (7, 2) / (7, 4)', pv('%s', '2', 'Motion[3]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['e02', { owner: [0, 0x3001, 0] }, 'the facing one word off (the pillar line)'],",
    "    ['e12', { owner: [0, 0x3001, 0] }, 'the facing one word off (the ground beam: sp_58)'],",
    "    ['w204', { floorY: 1.0 }, 'the floor one unit up (the beam meets the ground elsewhere)'],",
    "    ['m70', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside (the mortar: sp_48)'],",
    "    ['o103', { joints: Object.assign({}, JOINTS, { 143: jointOf(-0.1, 0.3, 0.0, [-150.0, 1351.0, 200.0]) }) }, 'joint 143 one unit up'],",
    "    ['e08', { joints: Object.assign({}, JOINTS, { 4: jointOf(0.1, 0.2, 0.0, [-30.0, 900.0, 300.0]) }) }, 'joint 4 30 aside'],",
    "    ['n04', { joints: Object.assign({}, JOINTS, { 13: jointOf(0.05, 0.1, 0.0, [450.0, 120.0, 650.0]) }) }, 'joint 13 30 aside (the f204 pillar)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[3]', 'shell01'], ['2', 'Motion[64]', 'shell58'], ['2', 'Motion[70]', 'shell48']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = SPD + r'\spec_neset.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-neset-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("  const FULL = new Set(['base00', 'base13']);", "  const FULL = new Set(['base00', 'base13', 'base48']);"),
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;" + N + "    if (c.stepsRaw) o.steps = c.stepsRaw;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N +
   "    if (c.ownvt) o.ownvt = c.ownvt;" + N + "    if (c.activate) o.activate = c.activate;" + N + "    if (c.coreVt) o.coreVt = 1;" + N + "    if (c.stubs) o.stubs = c.stubs;" + N + "    o.frameStep = 1.0;"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, loopStart: q.loopStart });"),
  ("    if (romAtOnce !== !!S0.split083)",
   "    if (romAtOnce !== !!(S0.split083 || (S0.switched && S0.switched.from != null)))"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
