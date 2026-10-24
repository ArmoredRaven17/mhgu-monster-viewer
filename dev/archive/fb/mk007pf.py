# mk007pf.py (2026-10-19): dev/shells-diablos-check.mjs for mk_plaincheck.py -- Diablos's (em007_00) and Bloodbath's (em007_04) frame
# handler dust against the ROM: uEm007_00 vt+0x208 0xd35a94 by the motion id (e+0x4b4) at a channel-0 crossing (emu_fb `frame3`: 0xb09a4
# answered at that frame alone); shell01 0x70 / 0x71 modes 10 / 11 / 12 at the block's point and his words. Hit slot 0 held through
# move 25 (hitdata (14, 10)), the module's hitLife
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
MON = sys.argv[1] if len(sys.argv) > 1 else 'em007_00'
VAR = 4 if MON == 'em007_04' else 0
SID = 0x71 if MON == 'em007_04' else 0x70
SU = "slot0Until: { '%d:10': 25, '%d:11': 25, '%d:12': 25 }" % (SID, SID, SID)
def FH(name, lst, clip, ln, mid, F, extra=''):
    Fs = F if isinstance(F, list) else [F]
    q = "{ list: '%s', clip: '%s', variant: null, len: %d }" % (lst, clip, ln)
    st = "steps: [%s]" % ', '.join("{ fn: 'd35a94', frame3: %.1f, owner: { '0x4b4': [%d, %d] } }" % (x, mid & 0xff, mid >> 8) for x in Fs)
    return "    C('%s', 0x00, 0, %.1f, 0, [%s], { st: 7, %s, hitLife: true, %s, emVariant: %d, frames: 60%s })," % (name, Fs[0], q, st, SU, VAR, extra)
cases = "\n".join([
  "    // 0xd35a94 by motion: L0 M24 f58 mode 11; L0 M33 / M43 f2 mode 12; L1 M1 f6 / f76, L1 M4 f2 mode 10; L1 M17 / M19 f2 mode 11",
  FH('f018', '0', 'Motion[24]', 149, 0x018, 58.0),
  FH('f021', '0', 'Motion[33]', 23, 0x021, 2.0, ", owner: [0, 0x7000, 0]"),
  FH('f02b', '0', 'Motion[43]', 55, 0x02b, 2.0),
  FH('f101', '1', 'Motion[1]_loop', 114, 0x101, [6.0, 76.0]),
  FH('f101t', '1', 'Motion[1]_loop', 114, 0x101, [6.0, 76.0], ", owner: [0x100, 0xb000, 0]"),
  FH('f104', '1', 'Motion[4]', 39, 0x104, 2.0),
  FH('f111', '1', 'Motion[17]', 107, 0x111, 2.0),
  FH('f113', '1', 'Motion[19]', 49, 0x113, 2.0, ", ownerPos: [300.0, 15.25, 900.0]"),
])
name = 'diablos' if MON == 'em007_00' else 'bloodbath-dust'
spec = {
  'name': name, 'title': ('Diablos' if VAR == 0 else 'Bloodbath') + ' dust', 'mon': MON, 'main': 'd32ce0', 'variant': VAR,
  'header': [
    "%s's (%s) frame-handler dust in render/shells.js against the ROM -- uEm007_00 vt+0x208 0xd35a94 by the motion id: shell01 0x%x" % ('Diablos' if VAR == 0 else 'Bloodbath Diablos', MON, SID),
    "(uShellEm007_04_01, base01; reader 0xd46770, its 0x%x map) modes 10 / 11 / 12 at his point and words. dev/em007-shells-spec.md 2f." % SID,
    "",
    "  node dev/shells-%s-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-%s-check.mjs" % (name, name),
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(SID): [MON, '01']},
  'owner_bytes': {},
  'bases': {hex(SID): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '0', 'Motion[24]') === '[]', 'L0 M24: no pick (the frame handler, any action)', pv('%s', '0', 'Motion[24]'));" % (MON, MON),
  'controls': "\n".join([
    "    ['f021', { owner: [0, 0x7100, 0] }, 'his Y word 0x100 more'],",
    "    ['f113', { ownerPos: [301.0, 15.25, 900.0] }, 'his position 1 along x'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['1', 'Motion[4]', 'shell01'], ['1', 'Motion[17]', 'shell01'], ['1', 'Motion[19]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
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
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;" + N + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + N + "    o.frameStep = 1.0;"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
