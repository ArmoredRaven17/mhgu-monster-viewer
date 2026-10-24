# mk014.py <em016_00 | em034_00> (2026-10-20): dev/shells-iodrome-check.mjs / dev/shells-giadrome-check.mjs for mk_plaincheck.py -- the
# dromes' shells (class uEm014_00, main 0xd956e0) against the ROM
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = sys.argv[1]
NL = chr(10)
IOD = mon == 'em016_00'
IDS = (0x8f, 0x90, 0x91) if IOD else (0xc3, 0xc4, 0xc5)
name = 'iodrome' if IOD else 'giadrome'
LEN = {'Motion[1]': 247, 'Motion[2]': 199, 'Motion[3]': 235}
SU = "slot0Until: { '%d:0': 120, '%d:1': 120, '%d:2': 120, '%d:3': 120 }" % ((IDS[1],) * 4)
def C(nm, n, clip, ph, F, extra=''):
    q = "{ list: '4', clip: '%s', variant: '7:0x%02x', len: %d }" % (clip, n, LEN[clip])
    st = "{ fn: 'd956e0', phase: %d, win: 0, winFrames: [%.1f], frame: %.1f }" % (ph, F, F)
    return "    C('%s', 0x%02x, %d, %.1f, 0, [%s], { st: 7, steps: [%s], owner_bytes: { '0x73e0': [7, 0x%02x] }, hitLife: true, %s, emVariant: 0, frames: 400%s })," % (nm, n, ph, F, q, st, n, SU, extra)
rows = [(0x06, 'Motion[2]', 88), (0x0e, 'Motion[3]', 108), (0x28, 'Motion[1]', 120), (0x2a, 'Motion[2]', 84)] if IOD else \
       [(0x3c, 'Motion[2]', 88), (0x3e, 'Motion[3]', 108), (0x40, 'Motion[1]', 120), (0x42, 'Motion[2]', 84)]
cases = NL.join([C('d%02x' % n, n, clip, 1, F) for n, clip, F in rows] +
                [C('d%02xt' % rows[0][0], rows[0][0], rows[0][1], 1, rows[0][2], ", owner: [0, 0x9000, 0]"),
                 C('d%02xt' % rows[3][0], rows[3][0], rows[3][1], 1, rows[3][2], ", target: [-600.0, 0.0, 700.0]")])
spec = {
  'name': name, 'title': ('Iodrome' if IOD else 'Giadrome') + ' shells', 'mon': mon, 'main': 'd956e0', 'variant': 0,
  'header': [
    "%s's (%s) shells in render/shells.js against the ROM -- the dromes' class uEm014_00 (main 0xd956e0): sp_00 0x%x (base00), its" % ('Iodrome' if IOD else 'Giadrome', mon, IDS[0]),
    "landing's sp_01 0x%x (base01), sp_13 0x%x (base13). dev/em014-shells-spec.md." % (IDS[1], IDS[2]),
    "",
    "  node dev/shells-%s-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-%s-check.mjs" % (name, name),
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(IDS[0]): [mon, '00'], hex(IDS[1]): [mon, '01'], hex(IDS[2]): [mon, '13']},
  'owner_bytes': {},
  'bases': {hex(IDS[0]): 'base00', hex(IDS[1]): 'base01', hex(IDS[2]): 'base13'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 2: jointOf(-0.1, 0.1, 0.05, [40.0, 380.0, 300.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '4', 'Motion[2]') === '[\"7:0x%02x\",\"7:0x%02x\"]', 'L4 M2: the spit and the lob', pv('%s', '4', 'Motion[2]'));" % (mon, rows[0][0], rows[3][0], mon),
  'controls': NL.join([
    "    ['d%02x', { joints: Object.assign({}, JOINTS, { 2: jointOf(-0.1, 0.1, 0.05, [41.0, 380.0, 300.0]) }) }, 'joint 2 one unit along x']," % rows[0][0],
    "    ['d%02x', { owner: [0, 0x3100, 0] }, 'his Y word 0x100 more']," % rows[3][0]]),
  'page': NL.join([
    "  for (const [list, clip, sh] of [['4', 'Motion[2]', 'shell00'], ['4', 'Motion[1]', 'shell00']]){",
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
