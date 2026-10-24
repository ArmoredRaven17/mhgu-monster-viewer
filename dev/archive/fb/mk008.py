# mk008.py (2026-10-20): dev/shells-kutku-check.mjs for mk_plaincheck.py -- Yian Kut-Ku's shells against the ROM: the action main 0xd4fdd8
# (uEm008_00) at each maker's phase and frame; the frame handler 0xd4ffa4 (vt+0x208) by the motion id at a channel-0 crossing (0xb0974,
# the step's `frame`); (7, 0x02)'s hover dust with the clock [e+0xcac0]+0x10 primed (the step's ctl)
import json, sys, subprocess, struct
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em008_00'
NL = chr(10)
LEN = {('2', 'Motion[1]'): 453, ('2', 'Motion[2]'): 92, ('2', 'Motion[3]'): 105, ('2', 'Motion[21]'): 175, ('0', 'Motion[24]'): 27,
       ('0', 'Motion[27]'): 27, ('0', 'Motion[30]'): 23, ('1', 'Motion[4]'): 39, ('1', 'Motion[14]'): 55, ('1', 'Motion[17]'): 107,
       ('1', 'Motion[19]'): 49, ('1', 'Motion[102]'): 158, ('1', 'Motion[105]'): 104, ('1', 'Motion[106]'): 115}
def C(name, n, clip, steps, frames=300, extra='', lst='2'):
    st = ', '.join("{ fn: 'd4fdd8', phase: %d, win: 0, winFrames: [%.1f], frame: %.1f }" % (ph, F, F) for ph, F in steps)
    q = "{ list: '%s', clip: '%s', variant: '7:0x%02x', len: %d }" % (lst, clip, n, LEN[(lst, clip)])
    return "    C('%s', 0x%02x, %d, %.1f, 0, [%s], { st: 7, steps: [%s], owner_bytes: { '0x73e0': [7, 0x%02x] }, hitLife: true, %s, emVariant: 0, frames: %d%s })," % (name, n, steps[0][0], steps[0][1], q, st, n, SU1 if len(steps) == 1 else SU3, frames, extra)
def FH(name, lst, clip, mid, F, extra=''):
    q = "{ list: '%s', clip: '%s', variant: null, len: %d }" % (lst, clip, LEN[(lst, clip)])
    st = "steps: [{ fn: 'd4ffa4', frame: %.1f, owner: { '0x4b4': [%d, %d] } }]" % (F, mid & 0xff, mid >> 8)
    return "    C('%s', 0x00, 0, %.1f, 0, [%s], { st: 7, %s, hitLife: true, %s, emVariant: 0, frames: 120%s })," % (name, F, q, st, SUP, extra)
SU1 = "slot0Until: { '116:0': 26, '116:1': 26 }"
SU3 = "slot0Until: { '116:0': 27, '116:1': 27 }"
SUP = "slot0Until: { '116:3': 25, '116:4': 25, '116:5': 25, '116:6': 25 }"
CTL15 = "ctl: { '0x10': [%s] }" % ', '.join(str(b) for b in struct.pack('<f', 16.0))
cases = NL.join([
  "    // sp_00 (base00, the velocity x float 3, the gravity x its square): L2 M2 phase 2 at 26 / 48 / 86 (0 / 1 / 0), L2 M3 at 32 (2 / 19: joint",
  "    // -1, his point), L2 M1 at 78 / 150 / 240 / 296",
  C('k12', 0x12, 'Motion[2]', [(2, 26), (2, 48), (2, 86)]).replace(SU3, "slot0Until: { '116:0': [27, 27, 26] }"),
  C('k19', 0x19, 'Motion[3]', [(1, 32)]),
  C('k49', 0x49, 'Motion[3]', [(1, 32)], extra=", owner: [0, 0x6000, 0]"),
  C('k2d', 0x2d, 'Motion[1]', [(1, 78), (1, 150), (1, 240), (1, 296)]).replace(SU3, "slot0Until: { '116:1': [26, 26, 26, 26] }"),
  C('k38', 0x38, 'Motion[1]', [(1, 78), (1, 150), (1, 240), (1, 296)], extra=", owner: [0, 0xc000, 0]").replace(SU3, "slot0Until: { '116:1': [26, 26, 26, 26] }"),
  "    // sp_13 (base13, flags 0x70: from his block point along his facing): L2 M3 at 32 (0 / 1, x 1.0 / 1.15)",
  C('k23', 0x23, 'Motion[3]', [(1, 32)], frames=400),
  C('k4c', 0x4c, 'Motion[3]', [(1, 32)], frames=400, extra=", target: [1500.0, 0.0, -900.0]"),
  "    // the frame handler 0xd4ffa4: sp_01 3 / 4 / 5 at his point and words when he is no more than 900 above his ground",
  FH('p018', '0', 'Motion[24]', 0x018, 2.0),
  FH('p01e', '0', 'Motion[30]', 0x01e, 2.0, ", owner: [0, 0x7000, 0]"),
  FH('p104', '1', 'Motion[4]', 0x104, 2.0),
  FH('p10e', '1', 'Motion[14]', 0x10e, 52.0),
  FH('p111', '1', 'Motion[17]', 0x111, 2.0),
  FH('p113', '1', 'Motion[19]', 0x113, 2.0, ", ownerPos: [300.0, 15.25, 900.0]"),
  FH('p166', '1', 'Motion[102]', 0x166, 2.0),
  FH('p169', '1', 'Motion[105]', 0x169, 2.0),
  FH('p16a', '1', 'Motion[106]', 0x16a, 2.0),
  "    // (7, 0x02) phase 2 on L2 M21 from frame 10: the clock +0x10 (15 + dt) reaches 16 -> sp_01 6 at (his x, his ground, his z)",
  "    C('k02', 0x02, 2, 10.0, 0, [{ list: '2', clip: 'Motion[21]', variant: '7:0x02', len: 14 }], { st: 7, steps: [{ fn: 'd4fdd8', phase: 2, win: 1, winFrames: [10.0], frame: 0.0 }], owner_bytes: { '0x73e0': [7, 0x02] }, " + CTL15 + ", hitLife: true, " + SUP + ", emVariant: 0, frames: 120 }),",
])
spec = {
  'name': 'kutku', 'title': 'Kut-Ku shells', 'mon': mon, 'main': 'd4fdd8', 'variant': 0,
  'header': [
    "Yian Kut-Ku's (em008_00) shells in render/shells.js against the ROM -- sp_00 0x73 (base00), sp_01 0x74 (base01: the landings' children,",
    "the frame handler's 0xd4ffa4, (7, 0x02)'s hover clock), sp_13 0x75 (base13). dev/em008-shells-spec.md.",
    "",
    "  node dev/shells-kutku-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-kutku-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {'0x73': [mon, '00'], '0x74': [mon, '01'], '0x75': [mon, '13']},
  'owner_bytes': {},
  'bases': {'0x73': 'base00', '0x74': 'base01', '0x75': 'base13'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 4: jointOf(-0.1, 0.1, 0.05, [40.0, 380.0, 300.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[3]') === '[\"7:0x19\",\"7:0x49\",\"7:0x23\",\"7:0x4c\"]', 'L2 M3: (7, 0x19 / 0x49 / 0x23 / 0x4c)', pv('%s', '2', 'Motion[3]'));" % (mon, mon),
  'controls': NL.join([
    "    ['k12', { joints: Object.assign({}, JOINTS, { 4: jointOf(-0.1, 0.1, 0.05, [41.0, 380.0, 300.0]) }) }, 'joint 4 one unit along x'],",
    "    ['k23', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside'],",
    "    ['p01e', { owner: [0, 0x7100, 0] }, 'his Y word 0x100 more'],",
    "    ['k02', { ground: 1.0 }, 'his ground 1 higher'],"]),
  'page': NL.join([
    "  for (const [list, clip, sh] of [['2', 'Motion[1]', 'shell00'], ['2', 'Motion[3]', 'shell00'], ['1', 'Motion[4]', 'shell01'], ['2', 'Motion[21]', 'shell01'], ['2', 'Motion[2]', 'shell00'], ['1', 'Motion[102]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(600, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_kutku.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-kutku-check.mjs'
s = open(outp, encoding='utf8').read()
reps = [("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;" + NL + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + NL + "    if (c.ctl) o.ctl = c.ctl;" + NL + "    o.frameStep = 1.0;")]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
