# mk018.py <em018_00 | em018_04> (2026-10-20): dev/shells-garuga-check.mjs / dev/shells-deadeye-check.mjs for mk_plaincheck.py --
# uEm018_00 (main 0xdb0a2c) against the ROM; ids poked at e+0xcac4 / +0xcac8 / +0xcacc
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = sys.argv[1]
NL = chr(10)
DE = mon == 'em018_04'
VAR = 4 if DE else 0
IDS = (0x96, 0x97, 0x98) if DE else (0x94, 0x95, 0x19d)
name = 'deadeye' if DE else 'garuga'
OB = "{ '0xcac4': [%d, %d, 0, 0], '0xcac8': [%d, %d, 0, 0], '0xcacc': [%d, %d, 0, 0] }" % (IDS[0] & 0xff, IDS[0] >> 8, IDS[1] & 0xff, IDS[1] >> 8, IDS[2] & 0xff, IDS[2] >> 8)
LEN = {('4', 'Motion[52]'): 377, ('4', 'Motion[29]'): 69, ('4', 'Motion[68]'): 227, ('4', 'Motion[51]'): 227, ('9', 'Motion[8]'): 203}
SU = "slot0Until: { '%d:0': 108, '%d:1': 20, '%d:2': 20, '%d:3': 180 }" % ((IDS[1],) * 4)
def C(nm, n, lst, clip, steps, extra=''):
    st = ', '.join("{ fn: 'db0a2c', phase: %d, win: 0, winFrames: [%.1f], frame: %.1f }" % (ph, F, F) for ph, F in steps)
    q = "{ list: '%s', clip: '%s', variant: '7:0x%02x', len: %d }" % (lst, clip, n, LEN[(lst, clip)])
    return "    C('%s', 0x%02x, %d, %.1f, 0, [%s], { st: 7, steps: [%s], owner_bytes: Object.assign({ '0x73e0': [7, 0x%02x] }, %s), hitLife: true, %s, emVariant: %d, frames: 400%s })," % (nm, n, steps[0][0], steps[0][1], q, st, n, OB, SU, VAR, extra)
rows = [
  "    // sp_00 (joint 3; modes 10 aim X at the target within +-45): L4 M52 at 120 / 164, L4 M29 at 40, L4 M68 at 60, L4 M51 at 62; landing ->",
  "    // sp_01 1 and 3 (ground) or 2 (wall); (7, 0x11 / 0x13) sp_01 0 at joint 3",
  C('r0a', 0x0a, '4', 'Motion[52]', [(1, 78), (1, 120), (1, 164)]).replace(SU, "slot0Until: { '%d:1': [20, 21, 21], '%d:3': [180, 181, 181] }" % (IDS[1], IDS[1])),
  C('r15', 0x15, '4', 'Motion[52]', [(1, 78), (1, 120), (1, 164)], ", owner: [0, 0x6000, 0]"),
  C('r10', 0x10, '4', 'Motion[29]', [(2, 40)]),
  C('r12', 0x12, '4', 'Motion[68]', [(1, 60)], ", target: [-900.0, 300.0, 1400.0]"),
  C('r23', 0x23, '4', 'Motion[51]', [(1, 62)]),
  C('r11', 0x11, '4', 'Motion[29]', [(2, 40)]),
  C('r13', 0x13, '4', 'Motion[68]', [(1, 60)]),
]
if DE:
    rows += [
  "    // Deadeye: L4 M51 at 62 ((7, 0x30 / 0x32): mode 0 aimed), L9 M8 at 40 (15: joint -1, nothing on landing), (7, 0xcc) with 04_07 0 / 1 / 2",
  C('r30', 0x30, '4', 'Motion[51]', [(1, 62)]),
  C('r32', 0x32, '4', 'Motion[51]', [(1, 62)], ", target: [400.0, 0.0, 2600.0]"),
  C('rca', 0xca, '9', 'Motion[8]', [(3, 40)]),
  C('rcc', 0xcc, '9', 'Motion[8]', [(4, 40), (4, 42), (4, 44)]),
    ]
cases = NL.join(rows)
spec = {
  'name': name, 'title': ('Deadeye' if DE else 'Garuga') + ' shells', 'mon': mon, 'main': 'db0a2c', 'variant': VAR,
  'header': [
    "%s's (%s) shells in render/shells.js against the ROM -- uEm018_00 (main 0xdb0a2c): sp_00 0x%x (base00), sp_01 0x%x (base01)%s." % ('Deadeye Yian Garuga' if DE else 'Yian Garuga', mon, IDS[0], IDS[1], ', 04_07 0x98 (base07)' if DE else ''),
    "dev/em018-shells-spec.md.",
    "",
    "  node dev/shells-%s-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-%s-check.mjs" % (name, name),
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': dict([(hex(IDS[0]), [mon, '00']), (hex(IDS[1]), [mon, '01'])] + ([(hex(IDS[2]), [mon, '07'])] if DE else [])),
  'owner_bytes': {},
  'bases': dict([(hex(IDS[0]), 'base00'), (hex(IDS[1]), 'base01')] + ([(hex(IDS[2]), 'base07')] if DE else [])),
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(-0.1, 0.1, 0.05, [40.0, 380.0, 300.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '4', 'Motion[52]') === '[\"7:0x0a\",\"7:0x15\"]', 'L4 M52: (7, 0xa / 0x15)', pv('%s', '4', 'Motion[52]'));" % (mon, mon),
  'controls': NL.join([
    "    ['r0a', { joints: Object.assign({}, JOINTS, { 3: jointOf(-0.1, 0.1, 0.05, [41.0, 380.0, 300.0]) }) }, 'joint 3 one unit along x'],",
    "    ['r12', { target: [-870.0, 300.0, 1400.0] }, 'the target 30 aside'],",
    "    ['r23', { owner: [0, 0x3100, 0] }, 'his Y word 0x100 more'],"]),
  'page': NL.join([
    "  for (const [list, clip, sh] of [['4', 'Motion[52]', 'shell00'], ['4', 'Motion[51]', 'shell00']" + (", ['9', 'Motion[8]', 'shell07']" if DE else "") + "]){",
    "    await pick(list, clip);",
    "    const w = await watch(600, x => x.some(y => y.shell === sh));",
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
reps = [("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;" + NL + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + NL + "    o.frameStep = 1.0;")]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
