# mk080.py (2026-10-20): dev/shells-glavenus-check.mjs for mk_plaincheck.py -- Glavenus's shells against the ROM: the action main 0xffe7fc
# (uEm080_00) at each maker's phase and frame; ids at e+0xcbe0 / +0xcbe4 / +0xcbe8 (the loader not run)
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = sys.argv[1] if len(sys.argv) > 1 else 'em080_00'
VAR = 4 if mon == 'em080_04' else 0
IDS = (0x149, 0x14a, 0x14b) if VAR == 4 else (0x146, 0x147, 0x148)
OBX = "{ '0xcbe0': [%d, %d, 0, 0], '0xcbe4': [%d, %d, 0, 0], '0xcbe8': [%d, %d, 0, 0] }" % (IDS[0] & 0xff, IDS[0] >> 8, IDS[1] & 0xff, IDS[1] >> 8, IDS[2] & 0xff, IDS[2] >> 8)
LEN = {'Motion[2]': 237, 'Motion[9]': 383, 'Motion[10]': 249, 'Motion[11]': 333, 'Motion[55]': 205, 'Motion[57]': 205}
def C(name, n, clip, steps, frames=300, extra=''):
    st = ', '.join("{ fn: 'ffe7fc', phase: %d, win: 0, winFrames: [%.1f], frame: %.1f }" % (ph, F, F) for ph, F in steps)
    q = "{ list: '2', clip: '%s', variant: '7:0x%02x', len: %d }" % (clip, n, LEN[clip])
    ob = "owner_bytes: Object.assign({ '0x73e0': [7, 0x%02x] }, %s)" % (n, OBX)
    return "    C('%s', 0x%02x, %d, %.1f, 0, [%s], { st: 7, steps: [%s], %s, hitLife: true, emVariant: %d, frames: %d%s })," % (name, n, steps[0][0], steps[0][1], q, st, ob, VAR, frames, extra)
cases = "\n".join([
  "    // sp_03 (base03 with bit 3: the offset turned by the words x his size) from joint 0: L2 M2 at 122 (9 / 10 / 11), L2 M11 at 132",
  C('g02', 0x02, 'Motion[2]', [(1, 122)]),
  C('g02t', 0x02, 'Motion[2]', [(1, 122)], extra=", owner: [0, 0x7000, 0]"),
  C('g0b', 0x0b, 'Motion[11]', [(1, 132)]),
  "    // sp_00 (base00): L2 M9 phase 2 at 70 / 120 / 168 (7 / 8 / 9, the X aim), L2 M10 at 92 (0 / 6), L2 M55 / M57 at 56 (4 / 5: X and Y aimed)",
  C('g09', 0x09, 'Motion[9]', [(2, 70), (2, 120), (2, 168)]),
  C('g0a', 0x0a, 'Motion[10]', [(2, 92)]),
  C('g0c', 0x0c, 'Motion[10]', [(2, 92)], extra=", owner: [0, 0xa000, 0]"),
  C('g5c', 0x5c, 'Motion[55]', [(1, 56)]),
  C('g5d', 0x5d, 'Motion[57]', [(1, 56)], extra=", target: [-900.0, 300.0, 1400.0]"),
])
name = 'glavenus' if VAR == 0 else 'hellblade'
spec = {
  'name': name, 'title': ('Glavenus' if VAR == 0 else 'Hellblade') + ' shells', 'mon': mon, 'main': 'ffe7fc', 'variant': VAR,
  'header': [
    "%s's (%s) shells in render/shells.js against the ROM -- sp_00 0x%x (base00), sp_01 0x%x (base01; the landing children and their" % ('Glavenus' if VAR == 0 else 'Hellblade Glavenus', mon, IDS[0], IDS[1]),
    "end chain), sp_03 0x%x (base03). dev/em080-shells-spec.md." % IDS[2],
    "",
    "  node dev/shells-%s-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-%s-check.mjs" % (name, name),
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(IDS[0]): [mon, '00'], hex(IDS[1]): [mon, '01'], hex(IDS[2]): [mon, '03']},
  'owner_bytes': {},
  'bases': {hex(IDS[0]): 'base00', hex(IDS[1]): 'base01', hex(IDS[2]): 'base03'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, -0.2, 0.05, [60.0, 310.0, 420.0]), 4: jointOf(-0.1, 0.1, 0.0, [40.0, 280.0, 300.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[10]') === '[\"7:0x0a\",\"7:0x0c\"]', 'L2 M10: (7, 0xa / 0xc)', pv('%s', '2', 'Motion[10]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['g02', { joints: Object.assign({}, JOINTS, { 0: jointOf(0.2, 0.0, 0.0, [119.0, 210.5, -60.25]) }) }, 'joint 0 one unit along x'],",
    "    ['g0c', { owner: [0, 0xa100, 0] }, 'his Y word 0x100 more'],",
    "    ['g5c', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[2]', 'shell03'], ['2', 'Motion[10]', 'shell00'], ['2', 'Motion[55]', 'shell00']]){",
    "    await pick(list, clip);",
    "    const w = await watch(500, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_%s.json' % name
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-%s-check.mjs' % name
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N + "    o.frameStep = 1.0;")]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
