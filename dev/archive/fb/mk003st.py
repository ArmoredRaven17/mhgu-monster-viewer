# mk003st.py (2026-10-19): dev/shells-khezu-st-check.mjs for mk_plaincheck.py -- Khezu's shell01 makers in his actions against the ROM:
# the action main 0xd1f658 (uEm003_00): the ground patch 0xd13e98 ((7, 0x40 / 0x4c) L2 M64 f96 mode 3; (3, 0x41 / 0x4e / 0x57) L0 M46 f96
# mode 4) and the status-3 drops ((3, 0x18 / 0x23 / 0x5b) phase 1 with L5 M2 ended; (3, 0x1a) phase 2 landed). Owner +0xcac8 = 0x66 (the
# loader 0xd20544 not run). Hit slot 0 held through move 25 (hitdata (14, 10): delay + duration + 1), the module's hitLife
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em003_00'
SU = "slot0Until: { '102:3': 25, '102:4': 25 }"
def C(name, st, n, lst, clip, ln, step, extra=''):
    q = "{ list: '%s', clip: '%s', variant: '%d:0x%02x', len: %d }" % (lst, clip, st, n, ln)
    ob = "owner_bytes: Object.assign({ '0x73e0': [%d, 0x%02x] }, { '0xcac8': [0x66, 0, 0, 0] })" % (st, n)
    return "    C('%s', 0x%02x, 1, 0.0, 0, [%s], { st: %d, steps: [%s], %s, hitLife: true, %s, frames: 60%s })," % (name, n, q, st, step, ob, SU, extra)
P96 = "{ fn: 'd1f658', phase: 1, win: 0, winFrames: [96.0], frame: 96.0 }"
END1 = "{ fn: 'd1f658', phase: 1, ended: 1, frame: null }"
LAND2 = "{ fn: 'd1f658', phase: 2, landed: 1, frame: null }"
cases = "\n".join([
  "    // the ground patch 0xd13e98 at 96: (7, 0x40) L2 M64 mode 3 (c 30); (3, 0x41 / 0x4e) L0 M46 mode 4 (c 31) -- at his feet",
  C('p40', 7, 0x40, '2', 'Motion[64]', 210, P96),
  C('p40t', 7, 0x40, '2', 'Motion[64]', 210, P96, ", owner: [0, 0x5000, 0]"),
  C('p41', 3, 0x41, '0', 'Motion[46]', 200, P96, ", owner: [0, 0xa000, 0]"),
  C('p4e', 3, 0x4e, '0', 'Motion[46]', 200, P96),
  "    // the status-3 drops: (3, 0x18) at L5 M8's start (L5 M2 ended), (3, 0x1a) at L5 M3's (landed) -- his point and words",
  C('d18', 3, 0x18, '5', 'Motion[8]_start', 15, END1, ", owner: [0x100, 0x6000, 0]"),
  C('d5b', 3, 0x5b, '5', 'Motion[8]_start', 15, END1),
  C('d1a', 3, 0x1a, '5', 'Motion[3]', 204, LAND2, ", owner: [0, 0x2000, 0]"),
  "    // ...he stands 40 above his ground",
  C('d1aup', 3, 0x1a, '5', 'Motion[3]', 204, LAND2, ", ownerPos: [120.5, 55.25, -80.75]"),
])
spec = {
  'name': 'khezu-st', 'title': 'Khezu shell01 makers', 'mon': mon, 'main': 'd1f658', 'variant': 0,
  'header': [
    "Khezu's (em003_00) shell01 makers in render/shells.js against the ROM -- uShellEm003_sp_01 (0x66, base01; reader 0xd218c4): the ground",
    "patch 0xd13e98 (L2 M64 / L0 M46 at 96) and the status-3 drops (0xd129d8.. L5 M8, 0xd12ea8.. L5 M3). dev/em003-shells-spec.md.",
    "",
    "  node dev/shells-khezu-st-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-khezu-st-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x66): [mon, '01']},
  'owner_bytes': {},
  'bases': {hex(0x66): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '5', 'Motion[8]_start') === '[\"3:0x18\",\"3:0x23\",\"3:0x5b\"]', 'L5 M8: (3, 0x18 / 0x23 / 0x5b)', pv('%s', '5', 'Motion[8]_start'));" % (mon, mon),
  'controls': "\n".join([
    "    ['p40t', { owner: [0, 0x5100, 0] }, 'his Y word 0x100 more'],",
    "    ['d18', { ownerPos: [121.5, 15.25, -80.75] }, 'his position 1 along x'],",
    "    ['d1a', { owner: [0, 0x2100, 0] }, 'his Y word 0x100 more'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['0', 'Motion[46]', 'shell01'], ['5', 'Motion[3]', 'shell01'], ['2', 'Motion[64]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_khezu_st.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-khezu-st-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N + "    o.frameStep = 1.0;"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
