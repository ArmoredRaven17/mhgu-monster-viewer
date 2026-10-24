# mk080h.py (2026-10-20, from mk080.py): dev/shells-hellblade-check.mjs for mk_plaincheck.py -- Hellblade Glavenus's shells against the
# ROM: the action main 0xffe7fc (uEm080_00, variant 4) at each maker's phase and frame; ids at e+0xcbe0 / +0xcbe4 / +0xcbe8 = 0x149..0x14b
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em080_04'; VAR = 4
IDS = (0x149, 0x14a, 0x14b)
OBX = "{ '0xcbe0': [%d, %d, 0, 0], '0xcbe4': [%d, %d, 0, 0], '0xcbe8': [%d, %d, 0, 0] }" % (IDS[0] & 0xff, IDS[0] >> 8, IDS[1] & 0xff, IDS[1] >> 8, IDS[2] & 0xff, IDS[2] >> 8)
LEN = {'Motion[1]': 165, 'Motion[2]': 237, 'Motion[9]': 383, 'Motion[10]': 249, 'Motion[11]': 333, 'Motion[13]': 303, 'Motion[14]': 317,
       'Motion[15]': 181, 'Motion[17]': 181, 'Motion[18]': 109, 'Motion[36]': 84, 'Motion[37]': 303, 'Motion[55]': 205, 'Motion[57]': 205,
       'Motion[7]': 221}
def C(name, n, clip, steps, frames=300, extra='', lst='2'):
    st = ', '.join("{ fn: 'ffe7fc', phase: %d, win: 0, winFrames: [%.1f], frame: %.1f }" % (ph, F, F) for ph, F in steps)
    q = "{ list: '%s', clip: '%s', variant: '7:0x%02x', len: %d }" % (lst, clip, n, LEN[clip])
    ob = "owner_bytes: Object.assign({ '0x73e0': [7, 0x%02x] }, %s)" % (n, OBX)
    return "    C('%s', 0x%02x, %d, %.1f, 0, [%s], { st: 7, steps: [%s], %s, hitLife: true, emVariant: %d, frames: %d%s })," % (name, n, steps[0][0], steps[0][1], q, st, ob, VAR, frames, extra)
NL = chr(10)
cases = NL.join([
  "    // sp_03 from joint 0: L2 M2 at 122 (9 / 10 / 11; 41 / 42 / 43 -> shell01 12 at their end), L2 M11 at 132 (44 / 45 / 46 -> 13)",
  C('h02', 0x02, 'Motion[2]', [(1, 122)]),
  C('hf0', 0xf0, 'Motion[2]', [(1, 122)]),
  C('hea', 0xea, 'Motion[11]', [(1, 132)], extra=", owner: [0, 0x5000, 0]"),
  "    // sp_00: L2 M9 phase 2 at 70 / 120 / 168, L2 M10 phase 2 at 92, L2 M55 / M57 at 56, L2 M15 / M1 / M17 / M18, L9 M7 (tune 22 / 32)",
  C('h97', 0x97, 'Motion[9]', [(2, 70), (2, 120), (2, 168)]),
  C('hf3', 0xf3, 'Motion[9]', [(2, 70), (2, 120), (2, 168)]),
  C('hd4', 0xd4, 'Motion[10]', [(2, 92)]),
  C('hf4', 0xf4, 'Motion[10]', [(2, 92)], extra=", owner: [0, 0x3000, 0]"),
  C('hfe', 0xfe, 'Motion[55]', [(1, 56)]),
  C('hff', 0xff, 'Motion[57]', [(1, 56)], extra=", target: [-900.0, 300.0, 1400.0]"),
  C('heb', 0xeb, 'Motion[15]', [(1, 10), (1, 40)]),
  C('hee', 0xee, 'Motion[1]', [(1, 48)]),
  C('hf9', 0xf9, 'Motion[17]', [(1, 58)]),
  C('hfa', 0xfa, 'Motion[18]', [(1, 40)]),
  C('he6', 0xe6, 'Motion[7]', [(7, 22), (7, 32)], lst='9'),
  "    // sp_01 at joint 145: L2 M14 phase 2 at 120 (25), L2 M14 at 102 (4 / 5), L2 M13 at 100, L2 M37 at 66, L2 M36 phase 3 at 20",
  C('h8e', 0x8e, 'Motion[14]', [(2, 120)]),
  C('hf7', 0xf7, 'Motion[14]', [(1, 102)]),
  C('hf6', 0xf6, 'Motion[13]', [(1, 100)]),
  C('he8', 0xe8, 'Motion[37]', [(1, 66)]),
  C('hfc', 0xfc, 'Motion[36]', [(3, 20)]),
])
Q = chr(34)
contract_ok = "[" + ",".join(Q + "7:0x%02x" % n + Q for n in (0x0a, 0x0c, 0xd4, 0xdb, 0xf4)) + "]"
spec = {
  'name': 'hellblade', 'title': 'Hellblade shells', 'mon': mon, 'main': 'ffe7fc', 'variant': VAR,
  'header': [
    "Hellblade Glavenus's (em080_04) shells in render/shells.js against the ROM -- sp_00 0x149 (base00), sp_01 0x14a (base01: his",
    "action-made ones at joint 145, the landing children and their end chain, sp_03's end children), sp_03 0x14b (base03).",
    "dev/em080-shells-spec.md 5.",
    "",
    "  node dev/shells-hellblade-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-hellblade-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(IDS[0]): [mon, '00'], hex(IDS[1]): [mon, '01'], hex(IDS[2]): [mon, '03']},
  'owner_bytes': {},
  'bases': {hex(IDS[0]): 'base00', hex(IDS[1]): 'base01', hex(IDS[2]): 'base03'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, -0.2, 0.05, [60.0, 310.0, 420.0]), 4: jointOf(-0.1, 0.1, 0.0, [40.0, 280.0, 300.0]), 145: jointOf(0.3, 0.6, -0.1, [-30.0, 260.0, -700.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[10]') === '%s', 'L2 M10: (7, 0xa / 0xc / 0xd4 / 0xdb / 0xf4)', pv('%s', '2', 'Motion[10]'));" % (mon, contract_ok, mon),
  'controls': NL.join([
    "    ['h8e', { joints: Object.assign({}, JOINTS, { 145: jointOf(0.3, 0.6, -0.1, [-29.0, 260.0, -700.0]) }) }, 'joint 145 one unit along x'],",
    "    ['hea', { owner: [0, 0x5100, 0] }, 'his Y word 0x100 more'],",
    "    ['hfe', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside'],"]),
  'page': NL.join([
    "  for (const [list, clip, sh] of [['2', 'Motion[2]', 'shell03'], ['2', 'Motion[10]', 'shell00'], ['2', 'Motion[14]', 'shell01'], ['9', 'Motion[7]', 'shell00'], ['2', 'Motion[36]', 'shell01'], ['2', 'Motion[18]', 'shell00']]){",
    "    await pick(list, clip);",
    "    const w = await watch(500, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_hellblade.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-hellblade-check.mjs'
s = open(outp, encoding='utf8').read()
reps = [("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;" + NL + "    if (c.slot0Until) o.slot0Until = c.slot0Until;" + NL + "    o.frameStep = 1.0;")]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
