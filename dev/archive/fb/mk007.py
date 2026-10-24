# mk007.py (2026-10-19): dev/shells-bloodbath-check.mjs for mk_plaincheck.py -- Bloodbath Diablos's (em007_04) action shells against the
# ROM: the action main 0xd32ce0 (uEm007_00, variant 4) at each maker's phase and frame (the frame test answered there alone): shell01 0x71
# (base01, reader 0xd46770) from (7, 0x62) / (7, 0xa0 / 0xa1) / (7, 0xa2 / 0xa3) / (7, 0xc8) / (7, 0xb8), shell07 0x72 (base07, reader
# 0xd46a94) from (7, 0x77 / 0x79). Hit slot 0 held through delay + duration + 1 (the module's hitLife)
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em007_04'
SU = "slot0Until: { '113:0': 21, '113:5': 31, '113:6': 31, '113:7': 61 }"
LEN = {('9', 'Motion[16]'): 383, ('9', 'Motion[22]'): 371, ('9', 'Motion[23]'): 371, ('9', 'Motion[30]'): 263, ('9', 'Motion[10]'): 301,
       ('2', 'Motion[19]'): 225}
def C(name, n, lst, clip, phase, frames, extra=''):
    steps = ', '.join("{ fn: 'd32ce0', phase: %d, win: 0, winFrames: [%.1f], frame: %.1f }" % (phase, F, F) for F in frames)
    q = "{ list: '%s', clip: '%s', variant: '7:0x%02x', len: %d }" % (lst, clip, n, LEN[(lst, clip)])
    ob = "owner_bytes: Object.assign({ '0x73e0': [7, 0x%02x] }, {})" % n
    return "    C('%s', 0x%02x, %d, %.1f, 0, [%s], { st: 7, steps: [%s], %s, hitLife: true, %s, emVariant: 4, frames: 260%s })," % (name, n, phase, frames[0], q, steps, ob, SU, extra)
cases = "\n".join([
  "    // shell01 0x71 at his point and words: (7, 0x62) L9 M16 f116 mode 0 (u 100); (7, 0xa0 / 0xa1) L9 M22 / M23 f154 modes 5 / 6 (u 120)",
  C('s62', 0x62, '9', 'Motion[16]', 1, [116]),
  C('s62t', 0x62, '9', 'Motion[16]', 1, [116], ", owner: [0x200, 0x9000, 0x100]"),
  C('sa0', 0xa0, '9', 'Motion[22]', 1, [154]),
  C('sa1', 0xa1, '9', 'Motion[23]', 1, [154], ", owner: [0, 0xc000, 0]"),
  "    // (7, 0xc8) phase 4 L9 M30 f10 mode 7 (u 300); (7, 0xb8) phase 2 L2 M19 f24 mode 7 (the second u 300 site 0xd3d1a0)",
  C('sc8', 0xc8, '9', 'Motion[30]', 4, [10]),
  C('sb8', 0xb8, '2', 'Motion[19]', 2, [24]),
  C('sb8t', 0xb8, '2', 'Motion[19]', 2, [24], ", owner: [0, 0x4000, 0], ownerPos: [300.0, 15.25, 900.0]"),
  "    // shell07 0x72: (7, 0x77) / (7, 0x79) L9 M10 f128 / 132 / 134, modes 0..2 / 6..8 (3..5 / 9..11 severed)",
  C('d77', 0x77, '9', 'Motion[10]', 1, [128, 132, 134]),
  C('d79', 0x79, '9', 'Motion[10]', 1, [128, 132, 134], ", owner: [0, 0x6000, 0]"),
  C('d77s', 0x77, '9', 'Motion[10]', 1, [128, 132, 134], ", severed: true"),
])
spec = {
  'name': 'bloodbath', 'title': 'Bloodbath shells', 'mon': mon, 'main': 'd32ce0', 'variant': 4,
  'header': [
    "Bloodbath Diablos's (em007_04) action shells in render/shells.js against the ROM -- shell01 0x71 (uShellEm007_04_01, base01; reader",
    "0xd46770) from L9 M16 / M22 / M23 / M30 and L2 M19, shell07 0x72 (uShellEm007_04_07, base07; reader 0xd46a94) from L9 M10.",
    "dev/em007-shells-spec.md, dev/em007-base07-spec.md.",
    "",
    "  node dev/shells-bloodbath-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-bloodbath-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x71): [mon, '01'], hex(0x72): [mon, '07']},
  'owner_bytes': {},
  'bases': {hex(0x71): 'base01', hex(0x72): 'base07'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[19]') === '[\"7:0xb8\"]', 'L2 M19: (7, 0xb8)', pv('%s', '2', 'Motion[19]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['s62t', { owner: [0x200, 0x9100, 0x100] }, 'his Y word 0x100 more'],",
    "    ['sb8', { ownerPos: [121.5, 15.25, -80.75] }, 'his position 1 along x'],",
    "    ['d77s', { severed: false }, 'the tail not severed'],",
    "    ['d79', { owner: [0, 0x6100, 0] }, 'his Y word 0x100 more'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[19]', 'shell01'], ['9', 'Motion[16]', 'shell01'], ['9', 'Motion[10]', 'shell07']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_bloodbath.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-bloodbath-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N + "    if (c.severed) o.severed = 1;" + N + "    o.frameStep = 1.0;"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, tailSevered: !!x.severed });"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
