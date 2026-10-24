# mk009.py (2026-10-20): dev/shells-gypceros-check.mjs for mk_plaincheck.py -- Gypceros's shells against the ROM: the action main 0xd5d424
# (uEm009_00); the frame handler 0xd5d508 (vt+0x208) by the motion id at a channel-1 crossing (0xb09b0, the step's frame2); the clock
# [e+0xcac0]+0 primed through the step's ctl (emu_fb stubs 0x7264c). The bases 44 / 53 read hit slot 0's delay / duration: slot0Timer
import json, sys, subprocess, struct
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em009_00'
NL = chr(10)
LEN = {('4', 'Motion[4]'): 92, ('4', 'Motion[6]'): 105, ('2', 'Motion[21]'): 27, ('1', 'Motion[1]'): 133, ('1', 'Motion[4]'): 39,
       ('1', 'Motion[5]'): 75, ('1', 'Motion[14]'): 55, ('1', 'Motion[17]'): 107, ('1', 'Motion[19]'): 49, ('1', 'Motion[102]'): 158,
       ('1', 'Motion[103]'): 113, ('1', 'Motion[105]'): 104, ('1', 'Motion[106]'): 115}
SU = "slot0Until: { '119:0': 8, '119:1': 25, '119:2': 25, '119:3': 25, '119:4': 25 }"
ST = "slot0Timer: { '121:0': [6, 70, 1], '121:1': [6, 70, 1], '122:0': [6, 30, 1], '123:0': [6, 300, 1] }"
def C(name, st_, n, lst, clip, steps, frames=400, extra=''):
    st = ', '.join("{ fn: 'd5d424', phase: %d, win: 0, winFrames: [%.1f], frame: %.1f }" % (ph, F, F) for ph, F in steps)
    q = "{ list: '%s', clip: '%s', variant: '%d:0x%02x', len: %d }" % (lst, clip, st_, n, LEN[(lst, clip)])
    return "    C('%s', 0x%02x, %d, %.1f, 0, [%s], { st: %d, steps: [%s], owner_bytes: { '0x73e0': [%d, 0x%02x] }, hitLife: true, %s, %s, emVariant: 0, frames: %d%s })," % (name, n, steps[0][0], steps[0][1], q, st_, st, st_, n, SU, ST, frames, extra)
def FH(name, clip, mid, F, extra=''):
    q = "{ list: '1', clip: '%s', variant: null, len: %d }" % (clip, LEN[('1', clip)])
    st = "steps: [{ fn: 'd5d508', frame2: %.1f, owner: { '0x4b4': [%d, %d] } }]" % (F, mid & 0xff, mid >> 8)
    return "    C('%s', 0x00, 0, %.1f, 0, [%s], { st: 7, %s, hitLife: true, %s, emVariant: 0, frames: 120%s })," % (name, F, q, st, SU, extra)
CTL = lambda v: "ctl: { '0x0': [%s] }" % ', '.join(str(b) for b in struct.pack('<f', v))
cases = NL.join([
  "    // sp_00: L4 M4 at 48 / 74 (10 / 11 -> sp_01 0 where they land), L4 M6 at 32 (0 / 3 -> the puddle sp_44), at 31 (12..14, joint 3 ->",
  "    // sp_52, which makes sp_53 at its delay)",
  C('y0b', 2, 0x0b, '4', 'Motion[4]', [(2, 48), (2, 74)]),
  C('y1b', 7, 0x1b, '4', 'Motion[4]', [(1, 48), (1, 74)], extra=", owner: [0, 0x6000, 0]"),
  C('y1a', 7, 0x1a, '4', 'Motion[6]', [(1, 32)]),
  C('y19', 7, 0x19, '4', 'Motion[6]', [(1, 32)], extra=", rank: 3"),
  C('y46', 7, 0x46, '4', 'Motion[6]', [(1, 31)]),
  C('y48', 7, 0x48, '4', 'Motion[6]', [(1, 31)], extra=", owner: [0, 0xa000, 0]"),
  "    // sp_13 (joint -1, flag 8 the size, aim his facing, the thrown point + (0, 0, 350), vy capped at 35) -> the puddle",
  C('y17', 7, 0x17, '4', 'Motion[6]', [(1, 32)]),
  "    // the frame handler 0xd5d508: sp_01 3 / 4 at the block's point and words; L1 M1 the clock (primed 100) -> 2",
  FH('p104', 'Motion[4]', 0x104, 2.0),
  FH('p105', 'Motion[5]', 0x105, 46.0, ", owner: [0, 0x7000, 0]"),
  FH('p10e', 'Motion[14]', 0x10e, 52.0),
  FH('p111', 'Motion[17]', 0x111, 2.0),
  FH('p113', 'Motion[19]', 0x113, 2.0, ", ownerPos: [300.0, 15.25, 900.0]"),
  FH('p166', 'Motion[102]', 0x166, 2.0),
  FH('p167', 'Motion[103]', 0x167, 2.0),
  FH('p169', 'Motion[105]', 0x169, 2.0),
  FH('p16a', 'Motion[106]', 0x16a, 2.0),
  "    C('p101', 0x00, 0, 0.0, 0, [{ list: '1', clip: 'Motion[1]', variant: null, len: 133 }], { st: 7, steps: [{ fn: 'd5d508', owner: { '0x4b4': [1, 1] } }], " + CTL(100.0) + ", hitLife: true, " + SU + ", emVariant: 0, frames: 120 }),",
  "    // (7, 0x02) phase 2 on L2 M21 from 10: the clock (primed 16) -> sp_01 1 at (his x, his ground, his z)",
  "    C('y02', 0x02, 2, 10.0, 0, [{ list: '2', clip: 'Motion[21]', variant: '7:0x02', len: 27 }], { st: 7, steps: [{ fn: 'd5d424', phase: 2, win: 1, winFrames: [10.0], frame: 0.0 }], owner_bytes: { '0x73e0': [7, 0x02] }, " + CTL(16.0) + ", hitLife: true, " + SU + ", emVariant: 0, frames: 120 }),",
])
spec = {
  'name': 'gypceros', 'title': 'Gypceros shells', 'mon': mon, 'main': 'd5d424', 'variant': 0,
  'header': [
    "Gypceros's (em009_00) shells in render/shells.js against the ROM -- sp_00 0x76 (base00), sp_01 0x77 (base01), sp_13 0x78 (base13), and",
    "the three bases first transcribed here: sp_44 0x79 (base44, the puddle), sp_52 0x7a (base52), sp_53 0x7b (base53). dev/em009-shells-spec.md.",
    "",
    "  node dev/shells-gypceros-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-gypceros-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {'0x76': [mon, '00'], '0x77': [mon, '01'], '0x78': [mon, '13'], '0x79': [mon, '44'], '0x7a': [mon, '52'], '0x7b': [mon, '53']},
  'owner_bytes': {},
  'bases': {'0x76': 'base00', '0x77': 'base01', '0x78': 'base13', '0x79': 'base44', '0x7a': 'base52', '0x7b': 'base53'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(-0.1, 0.1, 0.05, [40.0, 380.0, 300.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '4', 'Motion[6]') === '[\"7:0x19\",\"7:0x1a\",\"7:0x17\",\"7:0x46\",\"7:0x4a\",\"7:0x47\",\"7:0x4b\",\"7:0x48\",\"7:0x4c\"]', 'L4 M6: the nine', pv('%s', '4', 'Motion[6]'));" % (mon, mon),
  'controls': NL.join([
    "    ['y46', { joints: Object.assign({}, JOINTS, { 3: jointOf(-0.1, 0.1, 0.05, [41.0, 380.0, 300.0]) }) }, 'joint 3 one unit along x'],",
    "    ['y17', { owner: [0, 0x3100, 0] }, 'his Y word 0x100 more (the aim is his facing; the distance is past far)'],",
    "    ['y1a', { owner: [0, 0x100, 0] }, 'his Y word 0x100'],",
    "    ['p105', { owner: [0, 0x7100, 0] }, 'his Y word 0x100 more'],"]),
  'page': NL.join([
    "  for (const [list, clip, sh] of [['4', 'Motion[6]', 'shell00'], ['4', 'Motion[4]_loop', 'shell00'], ['1', 'Motion[4]', 'shell01'], ['2', 'Motion[21]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(600, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_gypceros.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-gypceros-check.mjs'
s = open(outp, encoding='utf8').read()
reps = [("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;" + NL + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + NL + "    if (c.slot0Timer) o.slot0Timer = c.slot0Timer;" + NL + "    if (c.ctl) o.ctl = c.ctl;" + NL + "    o.frameStep = 1.0;")]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
