# mk038.py (2026-10-19): dev/shells-ukanlos-check.mjs for mk_plaincheck.py -- Ukanlos's body shells against the ROM: the action main
# 0xe62984 (uEm038_00) at each maker's phase / frames (the ice falls one step per shot, P+0x1a2 carried by the ROM itself); the harness
# runs the static initialisers, so the arena tables 0x2128fb0 / 0x2129090 are the ROM's; e+0x73e8 0 (the viewer's H73E8_STANDIN)
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em038_00'
def OB(st, n): return "owner_bytes: Object.assign({ '0x73e0': [%d, 0x%02x] }, {})" % (st, n)
def Q(lst, clip, st, n, ln): return "{ list: '%s', clip: '%s', variant: '%d:0x%02x', len: %d }" % (lst, clip, st, n, ln)
def step(phase, F=None, win=None):
    return "{ fn: 'e62984', phase: %d, win: 0, %sframe: %s }" % (phase, ("winFrames: [%.1f], " % win) if win is not None else '', ('%.1f' % F) if F is not None else 'null')
def C(name, st, n, q, steps, extra=''):
    return "    C('%s', 0x%02x, 1, 0.0, 0, [%s], { st: %d, steps: [%s], %s, frames: 320%s })," % (name, n, q, st, ', '.join(steps), OB(st, n), extra)
ICE = [210, 246, 282, 318, 354, 390, 426, 462, 498, 534]
ICE2 = [210, 235, 260, 285, 310, 335, 360, 385, 400, 425, 450, 475, 500, 525]
cases = "\n".join([
  "    // the ice fall (1, 8) list 0 (offsets 0 1 2 3 25) and (1, 0x0c) list 4: one step per shot (210, 246, ..), y 6000",
  C('i08', 1, 0x08, Q('2', 'Motion[4]', 1, 0x08, 711), [step(1, F) for F in ICE[:5]]),
  C('i0c', 1, 0x0c, Q('2', 'Motion[4]', 1, 0x0c, 711), [step(1, F) for F in ICE]),
  "    // the arena ice falls (1, 0x15) / (1, 0x18): the static initialiser's world points",
  C('i15', 1, 0x15, Q('2', 'Motion[4]', 1, 0x15, 711), [step(1, F) for F in ICE2]),
  C('i18', 1, 0x18, Q('2', 'Motion[4]', 1, 0x18, 711), [step(1, F) for F in ICE2]),
  "    // (7, 3 / 0xe / 4 / 5) L2 M12 f152: mode 6 spreads from joint 1",
  C('s03', 7, 0x03, Q('2', 'Motion[12]', 7, 0x03, 407), [step(1, None, 152)]),
  C('s0e', 7, 0x0e, Q('2', 'Motion[12]', 7, 0x0e, 407), [step(1, None, 152)]),
  C('s04', 7, 0x04, Q('2', 'Motion[12]', 7, 0x04, 407), [step(1, None, 152)]),
  C('s05', 7, 0x05, Q('2', 'Motion[12]', 7, 0x05, 407), [step(1, None, 152)]),
  "    // (7, 0xb) L2 M33 f160: three mode 7 from joint 3",
  C('s0b', 7, 0x0b, Q('2', 'Motion[33]', 7, 0x0b, 359), [step(1, None, 160)]),
  "    // (7, 0x1d) phase 4 on L4 M7 at 60: the target within 2000 (23 + 24) and beyond (25 + 26)",
  C('s1d', 7, 0x1d, Q('4', 'Motion[7]', 7, 0x1d, 289), [step(4, 60)], ", target: [400.0, 40.0, 1200.0]"),
  C('s1dfar', 7, 0x1d, Q('4', 'Motion[7]', 7, 0x1d, 289), [step(4, 60)], ", target: [900.0, 40.0, 2400.0]"),
])
spec = {
  'name': 'ukanlos', 'title': 'Ukanlos shells', 'mon': mon, 'main': 'e62984', 'variant': 0,
  'header': [
    "Ukanlos's (em038_00) body shells in render/shells.js against the ROM -- uShellEm038_sp_00 (0xce, base00; reader 0xe63400) from the ice",
    "falls 0xe5c168 / 0xe5c790 ((1, 8..0x13 / 0x15 / 0x18) L2 M4), 0xe602dc ((7, 3 / 0xe / 4 / 5) L2 M12), 0xe612ec ((7, 0xb) L2 M33) and",
    "(7, 0x1d)'s phase 4 (L4 M7). dev/em038-shells-spec.md.",
    "",
    "  node dev/shells-ukanlos-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-ukanlos-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xce): [mon, '00']},
  'owner_bytes': {},
  'bases': {hex(0xce): 'base00'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 1: jointOf(0.1, 0.0, 0.0, [130.0, 260.0, 120.0]), 3: jointOf(0.15, -0.1, 0.05, [140.0, 420.0, 520.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[33]') === '[\"7:0x0b\"]', 'L2 M33: (7, 0xb)', pv('%s', '2', 'Motion[33]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['i08', { joints: Object.assign({}, JOINTS, { 1: jointOf(0.1, 0.0, 0.0, [131.0, 260.0, 120.0]) }) }, 'joint 1 one unit along x'],",
    "    ['s03', { owner: [0x100, 0x3000, 0] }, 'his X word 0x100'],",
    "    ['s1d', { target: [900.0, 40.0, 2400.0] }, 'the target beyond 2000'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[4]', 'shell00'], ['2', 'Motion[12]', 'shell00'], ['2', 'Motion[33]', 'shell00']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_ukanlos.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-ukanlos-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;" + N + "    o.frameStep = 1.0;"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
