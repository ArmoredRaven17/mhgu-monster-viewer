# mk033.py (2026-10-19): dev/shells-akantor-check.mjs for mk_plaincheck.py -- Akantor's burrow tell against the ROM: the action main
# 0xe3e098 (uEm033_00) at (6, 3) phase 1 with P+0x1bc poked to 24.0 (the countdown 0x7206c is the harness's stub) and P+0x1a2 0
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em033_00'
def C(name, n, extra=''):
    st = "steps: [{ fn: 'e3e098', phase: 1, win: 0, frame: 36.0, block: { '0x1bc': [0, 0, 192, 65], '0x1a2': [0] } }]"
    q = "{ list: '0', clip: 'Motion[2]', variant: '6:0x%02x', len: 479 }" % n
    ob = "owner_bytes: Object.assign({ '0x73e0': [6, 0x%02x] }, {})" % n
    return "    C('%s', 0x%02x, 1, 36.0, 0, [%s], { st: 6, %s, %s, hitLife: true, probe49aec: true, slot0Until: { '193:2': 161 }, frames: 300%s })," % (name, n, q, st, ob, extra)
cases = "\n".join([
  "    // (6, 3): at P+0x1bc <= 24 the tell, sp_01 0xc1 mode 2 (u 10) 600 ahead at the ground; life (60, 100) + 1",
  C('a03', 0x03),
  "    // turned (his Y word 0xa000) and the floor 40 lower",
  C('a03t', 0x03, ", owner: [0, 0xa000, 0], floorY: -40.0, ground: -40.0"),
])
spec = {
  'name': 'akantor', 'title': 'Akantor shells', 'mon': mon, 'main': 'e3e098', 'variant': 0,
  'header': [
    "Akantor's (em033_00) burrow tell in render/shells.js against the ROM -- (6, 3 / 0xc / 0xe / 0xf) 0xe3a73c phase 1: sp_01 0xc1 mode 2",
    "(base01; reader 0xe3e500) 600 ahead of him at the ground. dev/em033-shells-spec.md.",
    "",
    "  node dev/shells-akantor-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-akantor-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xc1): [mon, '01']},
  'owner_bytes': {},
  'bases': {hex(0xc1): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '0', 'Motion[2]') === '[\"6:0x03\"]', 'L0 M2: (6, 3)', pv('%s', '0', 'Motion[2]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['a03', { owner: [0, 0x3100, 0] }, 'his Y word 0x100 more'],",
    "    ['a03', { ownerPos: [121.5, 15.25, -80.75] }, 'his position 1 along x'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['0', 'Motion[2]_loop', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_akantor.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-akantor-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;" + N + "    if (c.probe49aec) o.probe49aec = 1;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N + "    o.frameStep = 1.0;"),
  ("        if (L.length && L[L.length - 1].moves === sh.moves) continue;",
   "        if ((sh.events || []).some(e => e.ev === 'stop' && e.flag === 1)) sh.atOnce032 = true;" + N + "        if (L.length && L[L.length - 1].moves === sh.moves) continue;"),
  ("    if (romAtOnce !== !!S0.split083) return",
   "    if (romAtOnce !== !!(S0.split083 || S0.atOnce032)) return"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
