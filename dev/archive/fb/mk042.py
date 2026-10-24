# mk042.py (2026-10-19): dev/shells-barioth-check.mjs for mk_plaincheck.py -- Barioth's ice balls against the ROM: the action main 0xe701d4
# (uEm042_00) at phase 1 with the frame test answered at 106 / 84 alone; the landing's shell01 0xd2 as the child
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em042_00'
LEN12, LEN5 = 267, 115
def C(name, n, clip, ln, F, extra=''):
    st = "steps: [{ fn: 'e701d4', phase: 1, win: 0, winFrames: [%.1f], frame: null }]" % F
    q = "{ list: '2', clip: '%s', variant: '7:0x%02x', len: %d }" % (clip, n, ln)
    ob = "owner_bytes: Object.assign({ '0x73e0': [7, 0x%02x] }, {})" % n
    return "    C('%s', 0x%02x, 1, %.1f, 0, [%s], { st: 7, %s, %s, hitLife: true, slot0Until: { '210:0': 46 }%s })," % (name, n, F, q, st, ob, extra)
cases = "\n".join([
  "    // L2 M12 at 106: X 0xa00 / 0x500 / 0x200 (absolute), his Y; joint 4 + (0, -20, 50); the landing's shell01 (u 30)",
  C('b02', 0x02, 'Motion[12]', LEN12, 106.0),
  C('b2c', 0x2c, 'Motion[12]', LEN12, 106.0),
  C('b2d', 0x2d, 'Motion[12]', LEN12, 106.0),
  "    // L2 M5 at 84: X 0x2000",
  C('b15', 0x15, 'Motion[5]', LEN5, 84.0),
  C('b2e', 0x2e, 'Motion[5]', LEN5, 84.0, ", owner: [0, 0xa000, 0]"),
])
spec = {
  'name': 'barioth', 'title': 'Barioth shells', 'mon': mon, 'main': 'e701d4', 'variant': 0,
  'header': [
    "Barioth's (em042_00) ice balls in render/shells.js against the ROM -- shell00 0xd1 (uShellEm042_00_00, base00; reader 0xe72190, +0x150",
    "0xe722bc) from L2 M12 f106 ((7, 2 / 0x2c / 0x2d)) and L2 M5 f84 ((7, 0x15 / 0x2e)), its landing's shell01 0xd2. dev/em042-shells-spec.md.",
    "",
    "  node dev/shells-barioth-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-barioth-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xd1): [mon, '00'], hex(0xd2): [mon, '01']},
  'owner_bytes': {},
  'bases': {hex(0xd1): 'base00', hex(0xd2): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 4: jointOf(0.1, -0.2, 0.05, [60.0, 310.0, 420.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[5]') === '[\"7:0x15\",\"7:0x2e\"]', 'L2 M5: (7, 0x15 / 0x2e)', pv('%s', '2', 'Motion[5]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['b02', { joints: Object.assign({}, JOINTS, { 4: jointOf(0.1, -0.2, 0.05, [60.0, 311.0, 420.0]) }) }, 'joint 4 one unit up'],",
    "    ['b02', { owner: [0, 0x3100, 0] }, 'his Y word 0x100 more'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[12]', 'shell00'], ['2', 'Motion[5]', 'shell00']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_barioth.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-barioth-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N + "    o.frameStep = 1.0;")]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
