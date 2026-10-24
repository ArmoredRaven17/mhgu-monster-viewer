# mk044.py (2026-10-19): dev/shells-barroth-check.mjs for mk_plaincheck.py -- Barroth's mud against the ROM: the action main 0xe8c7b0
# (uEm044_00) at phase 1, one step per frame (0xb0968 answered there alone by winFrames); his sp_00 0xdd (base00 + its own init
# 0xe8e614, reader 0xe8e930, landing 0xe8ebc0) and the landing's sp_01 0xde (base01, reader 0xe8eeb0). e+0x73e8 0 (H73E8_STANDIN)
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em044_00'
SU = "slot0Until: { %s, '222:0': 15 }" % ', '.join("'221:%d': 100" % m for m in range(6))
def C(name, n, clip, ln, frames, extra=''):
    steps = ', '.join("{ fn: 'e8c7b0', phase: 1, win: 0, winFrames: [%.1f], frame: %.1f }" % (F, F) for F in frames)
    q = "{ list: '2', clip: '%s', variant: '7:0x%02x', len: %d }" % (clip, n, ln)
    ob = "owner_bytes: Object.assign({ '0x73e0': [7, 0x%02x] }, {})" % n
    return "    C('%s', 0x%02x, 1, %.1f, 0, [%s], { st: 7, steps: [%s], %s, hitLife: true, %s, frames: 200%s })," % (name, n, frames[0], q, steps, ob, SU, extra)
cases = "\n".join([
  "    // L2 M12 at 102 / 106: mode 2 / 1 / 3 from joint 4 / 2, his Y word + the site's offset, the spread by the site's byte",
  C('m00', 0x00, 'Motion[12]', 120, [102, 106]),
  C('m03', 0x03, 'Motion[12]', 120, [102, 106], ", owner: [0x200, 0x6000, 0x100]"),
  C('m0e', 0x0e, 'Motion[12]', 120, [102, 106]),
  C('m0f', 0x0f, 'Motion[12]', 120, [102, 106], ", owner: [0, 0xb000, 0]"),
  "    // L2 M17 at 132: mode 5, its X word aimed at the target from the shell's point, clamped to [300, 60] degrees",
  C('m31', 0x31, 'Motion[17]', 317, [132]),
  C('m31up', 0x31, 'Motion[17]', 317, [132], ", target: [300.0, 3000.0, 900.0]"),
  C('m31low', 0x31, 'Motion[17]', 317, [132], ", target: [200.0, -40.0, 400.0]"),
  "    // the floor 200 up",
  C('m00floor', 0x00, 'Motion[12]', 120, [102, 106], ", floorY: 200.0, ground: 200.0"),
])
spec = {
  'name': 'barroth', 'title': 'Barroth shells', 'mon': mon, 'main': 'e8c7b0', 'variant': 0,
  'header': [
    "Barroth's (em044_00) mud in render/shells.js against the ROM -- uShellEm044_00_00 (0xdd, base00 with its own init 0xe8e614: the",
    "spread; reader 0xe8e930, landing 0xe8ebc0) from L2 M12 f102 / f106 ((7, 0 / 3 / 0xe / 0xf)) and L2 M17 f132 ((7, 0x31)), its landing's",
    "uShellEm044_00_01 (0xde, base01; reader 0xe8eeb0). dev/em044-shells-spec.md.",
    "",
    "  node dev/shells-barroth-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-barroth-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xdd): [mon, '00'], hex(0xde): [mon, '01']},
  'owner_bytes': {},
  'bases': {hex(0xdd): 'base00', hex(0xde): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 2: jointOf(0.3, -0.1, 0.05, [60.0, 330.0, 410.0]), 4: jointOf(-0.2, 0.15, 0.1, [-40.0, 300.0, 380.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[17]') === '[\"7:0x31\"]', 'L2 M17: (7, 0x31)', pv('%s', '2', 'Motion[17]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['m00', { joints: Object.assign({}, JOINTS, { 2: jointOf(0.3, -0.1, 0.05, [61.0, 330.0, 410.0]) }) }, 'joint 2 (modes 2 / 3) one unit along x'],",
    "    ['m03', { owner: [0x200, 0x6100, 0x100] }, 'his Y word 0x100 more'],",
    "    ['m31', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside'],",
    "    ['m00floor', { floorY: 150.0 }, 'the module floor 50 lower'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[17]', 'shell00']]){",
    "    await pick(list, clip);",
    "    const w = await watch(500, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_barroth.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-barroth-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N + "    o.frameStep = 1.0;")]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
