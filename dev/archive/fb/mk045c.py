# mk045c.py (2026-10-19): dev/shells-crystalbeard-check.mjs for mk_plaincheck.py -- Crystalbeard's shells against the ROM: the action
# main 0xe9bb88 (uEm045_00, variant 4) at each maker's phase and frame; ids at e+0xcb10..+0xcb1c; the crystals (base32) with the case's
# `base32` (emu_fb: the height probe 0x18154c by the floor plane, the registry answered)
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em045_04'
SU = "slot0Until: { '227:8': 19, '227:4': 10, '227:5': 10, '227:9': 10, '227:10': 100 }"
OBX = "{ '0xcb10': [0xe2, 0, 0, 0], '0xcb14': [0xe3, 0, 0, 0], '0xcb18': [0xe4, 0, 0, 0], '0xcb1c': [0xe5, 0, 0, 0] }"
LEN = {('2', 'Motion[1]'): 449, ('2', 'Motion[4]'): 417, ('2', 'Motion[10]'): 441, ('2', 'Motion[16]'): 417, ('9', 'Motion[1]'): 301, ('9', 'Motion[2]'): 301}
def C(name, n, lst, clip, steps, frames=300, extra=''):
    st = ', '.join("{ fn: 'e9bb88', phase: %d, win: 0, winFrames: [%.1f], frame: %.1f }" % (ph, F, F) for ph, F in steps)
    q = "{ list: '%s', clip: '%s', variant: '7:0x%02x', len: %d }" % (lst, clip, n, LEN[(lst, clip)])
    ob = "owner_bytes: Object.assign({ '0x73e0': [7, 0x%02x] }, %s)" % (n, OBX)
    return "    C('%s', 0x%02x, %d, %.1f, 0, [%s], { st: 7, steps: [%s], %s, hitLife: true, %s, emVariant: 4, base32: true, frames: %d%s })," % (name, n, steps[0][0], steps[0][1], q, st, ob, SU, frames, extra)
cases = "\n".join([
  "    // sp_01 mode 8 (u 200) at joint 3; sp_13 0 (u 50) thrown, its landing's sp_01 4",
  C('c00', 0x00, '2', 'Motion[1]', [(1, 180)]),
  C('c8e', 0x8e, '2', 'Motion[16]', [(1, 202)]),
  "    // sp_00 (base00, flags 5: the X aim from the shell's point) from joint 4 on L9 M1 / M2 at 114",
  C('ce6', 0xe6, '9', 'Motion[1]', [(1, 114)]),
  C('cea', 0xea, '9', 'Motion[1]', [(1, 114)], extra=", owner: [0, 0x6000, 0]"),
  C('ce7', 0xe7, '9', 'Motion[2]', [(1, 114)], extra=", target: [300.0, 1500.0, 900.0]"),
  C('ceb', 0xeb, '9', 'Motion[2]', [(1, 114)]),
  "    // THE CRYSTALS (base32): one (7, 0xf8: mode 4), (7, 0xfe: 10), (7, 0xff: 37 -- its period 360: the mode-10 children), three (7, 0xf4)",
  C('cf8', 0xf8, '2', 'Motion[4]', [(1, 202)], frames=1700),
  C('cfe', 0xfe, '2', 'Motion[4]', [(1, 202)], frames=1700, extra=", owner: [0, 0x3000, 0]"),
  C('cff', 0xff, '2', 'Motion[4]', [(1, 202)], frames=1700),
  C('cf4', 0xf4, '2', 'Motion[4]', [(1, 202)], frames=1700, extra=", slot0Until: { '227:5': 11 }"),
  "    // (7, 0xe5) on L2 M10: the joint-less crystals 26 / 24 at 100 / 110, then sp_01 8 at 226",
  C('ce5', 0xe5, '2', 'Motion[10]', [(2, 100), (2, 110), (5, 226)], frames=1700, extra=", slot0Until: { '227:8': 19, '227:9': 11 }"),
])
spec = {
  'name': 'crystalbeard', 'title': 'Crystalbeard shells', 'mon': mon, 'main': 'e9bb88', 'variant': 4,
  'header': [
    "Crystalbeard Uragaan's (em045_04) shells in render/shells.js against the ROM -- sp_00 0xe2 (base00), sp_01 0xe3 (base01), sp_13 0xe4",
    "(base13) and the crystals sp_32 0xe5 (base32 0x415010..0x416290: two hops, the settle, the burst and the periodic children).",
    "dev/em045-shells-spec.md 4.",
    "",
    "  node dev/shells-crystalbeard-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-crystalbeard-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xe2): [mon, '00'], hex(0xe3): [mon, '01'], hex(0xe4): [mon, '13'], hex(0xe5): [mon, '32']},
  'owner_bytes': {},
  'bases': {hex(0xe2): 'base00', hex(0xe3): 'base01', hex(0xe4): 'base13', hex(0xe5): 'base32'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, -0.2, 0.05, [60.0, 310.0, 420.0]), 4: jointOf(-0.1, 0.1, 0.0, [40.0, 280.0, 300.0]), 143: jointOf(-0.3, 0.2, 0.0, [-20.0, 260.0, 480.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[10]') === '[\"7:0x8a\",\"7:0xe5\"]', 'L2 M10: (7, 0x8a / 0xe5)', pv('%s', '2', 'Motion[10]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['cf8', { joints: Object.assign({}, JOINTS, { 143: jointOf(-0.3, 0.2, 0.0, [-19.0, 260.0, 480.0]) }) }, 'joint 143 one unit along x'],",
    "    ['cfe', { owner: [0, 0x3100, 0] }, 'his Y word 0x100 more'],",
    "    ['ce6', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[4]', 'shell32'], ['9', 'Motion[1]', 'shell00'], ['2', 'Motion[1]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(500, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_crystalbeard.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-crystalbeard-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N + "    if (c.base32) o.base32 = 1;" + N + "    o.frameStep = 1.0;"),
  ("  const FULL = new Set(['base00', 'base13']);", "  const FULL = new Set(['base00', 'base13', 'base32']);"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
