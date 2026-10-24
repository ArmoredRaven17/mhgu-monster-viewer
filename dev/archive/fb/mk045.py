# mk045.py (2026-10-19): dev/shells-uragaan-check.mjs for mk_plaincheck.py -- Uragaan's shell01 0xdf / shell13 0xe0 against the ROM: the
# action main 0xe9bb88 (uEm045_00) at each maker's phase and frame; the ids at e+0xcb14 / +0xcb18 (the loader not run)
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em045_00'
SU = "slot0Until: { '223:0': 5, '223:4': 10 }"
OBX = "{ '0xcb14': [0xdf, 0, 0, 0], '0xcb18': [0xe0, 0, 0, 0] }"
def C(name, n, clip, ln, phase, F, extra=''):
    steps = "{ fn: 'e9bb88', phase: %d, win: 0, winFrames: [%.1f], frame: %.1f }" % (phase, F, F)
    q = "{ list: '2', clip: '%s', variant: '7:0x%02x', len: %d }" % (clip, n, ln)
    ob = "owner_bytes: Object.assign({ '0x73e0': [7, 0x%02x] }, %s)" % (n, OBX)
    return "    C('%s', 0x%02x, %d, %.1f, 0, [%s], { st: 7, steps: [%s], %s, hitLife: true, %s, frames: 300%s })," % (name, n, phase, F, q, steps, ob, SU, extra)
cases = "\n".join([
  "    // shell01 mode 0 (u 200) at joint 3: (7, 0) L2 M1 at 180, (7, 0x8a) L2 M10 phase 4 at 226",
  C('u00', 0x00, 'Motion[1]', 449, 1, 180),
  C('u00t', 0x00, 'Motion[1]', 449, 1, 180, ", owner: [0x100, 0x7000, 0x80]"),
  C('u8a', 0x8a, 'Motion[10]', 441, 4, 226),
  "    // shell13 mode 0 (u 50) from joint 143, thrown at the target; its landing's shell01 mode 4 (u 30)",
  C('u8e', 0x8e, 'Motion[16]', 417, 1, 202),
  C('u8efar', 0x8e, 'Motion[16]', 417, 1, 202, ", target: [3000.0, 40.0, 6000.0]"),
  C('u8enear', 0x8e, 'Motion[16]', 417, 1, 202, ", target: [150.0, 40.0, 300.0], owner: [0, 0x2000, 0]"),
])
spec = {
  'name': 'uragaan', 'title': 'Uragaan shells', 'mon': mon, 'main': 'e9bb88', 'variant': 0,
  'header': [
    "Uragaan's (em045_00) shells in render/shells.js against the ROM -- uShellEm045_sp_01 (0xdf, base01; reader 0xe9dec8) from L2 M1 f180",
    "and L2 M10 f226, uShellEm045_sp_13 (0xe0, base13; reader 0xe9e1f8, landing 0xe9e380 -> sp_01 4) from L2 M16 f202. dev/em045-shells-spec.md.",
    "",
    "  node dev/shells-uragaan-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-uragaan-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xdf): [mon, '01'], hex(0xe0): [mon, '13']},
  'owner_bytes': {},
  'bases': {hex(0xdf): 'base01', hex(0xe0): 'base13'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, -0.2, 0.05, [60.0, 310.0, 420.0]), 143: jointOf(-0.3, 0.2, 0.0, [-20.0, 260.0, 480.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[16]') === '[\"7:0x8e\"]', 'L2 M16: (7, 0x8e)', pv('%s', '2', 'Motion[16]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['u00', { joints: Object.assign({}, JOINTS, { 3: jointOf(0.1, -0.2, 0.05, [61.0, 310.0, 420.0]) }) }, 'joint 3 one unit along x'],",
    "    ['u8e', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside'],",
    "    ['u8e', { joints: Object.assign({}, JOINTS, { 143: jointOf(-0.3, 0.2, 0.0, [-20.0, 261.0, 480.0]) }) }, 'joint 143 one unit up'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[1]', 'shell01'], ['2', 'Motion[16]', 'shell13']]){",
    "    await pick(list, clip);",
    "    const w = await watch(500, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_uragaan.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-uragaan-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N + "    o.frameStep = 1.0;")]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
