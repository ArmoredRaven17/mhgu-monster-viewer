# mk019spec.py: spec_carapaceons.json for mk_plaincheck.py -> dev/shells-carapaceons-check.mjs (Daimyo, Stonefist, Rustrazor)
import json, sys, subprocess
M = "{ list: '%s', clip: 'Motion[%d]', variant: '%s', len: %d }"
SEQ = lambda *xs: '[' + ', '.join(M % x for x in xs) + ']'
D19 = "steps: [{ fn: 'dc0788', phase: 3, winFrames: [16.0] }], owner_bytes: { '0x73e0': [7, 0xf2], '0xcac8': [%s, 0, 0, 0] }"
D20 = "steps: [{ fn: 'dc4474', phase: 3, landed: 1 }], owner_bytes: { '0x73e0': [7, %s], '0xcad8': [0xa0, 0, 0, 0], '0xcadc': [0x9f, 0, 0, 0] }"
cases = [
  "    // Daimyo / Stonefist (7, 0xf2): L9 M13 f16 (0xb0968 mode 1): sp_01 0 at the owner's block point, his words (u 30 of em019_00c)",
  "    C('d_f2', 0xf2, 3, null, 0, %s, { mon: 'em019_04', emVariant: 4, %s })," % (SEQ(('9', 13, '7:0xf2', 40)), D19 % '0x9b'),
  "    C('d_f2_turned', 0xf2, 3, null, 0, %s, { mon: 'em019_04', emVariant: 4, %s, owner: [0x0100, 0x9321, 0x0200], ownerPos: [-300.0, 40.0, 500.0] })," % (SEQ(('9', 13, '7:0xf2', 40)), D19 % '0x9b'),
  "    C('s_f2', 0xf2, 3, null, 0, %s, { mon: 'em019_04', emVariant: 4, %s, size: [1.2, 1.1] })," % (SEQ(('9', 13, '7:0xf2', 40)), D19 % '0x9b'),
  "    // Rustrazor (7, 0xa ..): the landing that sets L9 M36 makes sp_01 0x9f mode 0 (joint -1: the block point; u 31 of em020_00c)",
  "    C('r_0a', 0x0a, 3, null, 0, %s, { mon: 'em020_04', emVariant: 4, %s })," % (SEQ(('9', 36, '7:0x0a', 40)), D20 % '0x0a'),
  "    C('r_4d', 0x4d, 3, null, 0, %s, { mon: 'em020_04', emVariant: 4, %s, owner: [0, 0x4567, 0], ownerPos: [800.0, -20.0, -900.0] })," % (SEQ(('9', 36, '7:0x0a', 40)), D20 % '0x4d'),
]
spec = {
  'name': 'carapaceons', 'title': 'Carapaceons', 'mon': 'em019_04', 'main': 'dc0788', 'variant': 0,
  'header': [
    "The Carapaceons' drawing shells (beside their beams, render/beam-spawns.js) in render/shells.js against the ROM: Daimyo / Stonefist",
    "Hermitaur's sp_01 0x99 / 0x9b (base01 through 0xdcd998) on L9 M13 f16 and Rustrazor Ceanataur's sp_01 0x9f (base01 through 0xdcde78,",
    "the joint -1 arm 0x3fa8e4) on L9 M36's landing. dev/carapaceon-shells-spec.md.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the class's action main (uEm019_00 0xdc0788, uEm020_00 0xdc4474) at the phase,",
    "     the frame window / the landing answered; every shell flown from the setup the ROM built.",
    "  2. The contract: the pick lists.   3. CONTROLS: a wrong facing, a moved owner must FAIL.",
    "  4. IN THE VIEWER (pageCheck, run-check.mjs): the records run out.",
    "",
    "  node dev/shells-carapaceons-check.mjs                                   (1..3)",
    "  node <scratchpad>/run-check.mjs dev/shells-carapaceons-check.mjs         (4)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x99): ['em019_00', '01'], hex(0x9b): ['em019_04', '01'], hex(0x9f): ['em020_04', '01']},
  'owner_bytes': {},
  'bases': {hex(0x99): 'base01', hex(0x9b): 'base01', hex(0x9f): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('em019_00', '9', 'Motion[13]') === '[]' && pv('em019_04', '9', 'Motion[13]') === '[\"7:0xf2\"]', 'L9 M13 carries the slam (Stonefist; Daimyo has no L9)');",
    "  ok(pv('em020_04', '9', 'Motion[36]') === '[\"7:0x0a\"]', 'L9 M36 carries the landing (Rustrazor)');"]),
  'controls': "\n".join([
    "    ['d_f2_turned', { owner: [0x0100, 0x9322, 0x0200] }, 'the facing one word off'],",
    "    ['d_f2', { ownerPos: [120.5, 18.25, -80.75] }, 'the owner 3 higher (Stonefist)'],",
    "    ['r_4d', { ownerPos: [800.0, -20.0, -930.0] }, 'the owner 30 off (Rustrazor)'],"]),
  'page': "\n".join([
    "  const S = body().schedule;",
    "  for (const [mon, pel, key] of [['em019_04', 'em019_00c', 30]]){",
    "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === pel && x.def.record.key === key);",
    "    if (!e){ check(false, pel + ' ' + key + ' exported as a shell record'); continue; }",
    "    let started = 0;",
    "    for (let rep = 0; rep < 2; rep++){ try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); } for (let i = 0; i < 240; i++){ await frames(1); if (body().failed) break; } }",
    "    check(!body().failed && started === 2, mon + ': record ' + pel + ' ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null });",
    "  }",
    "  {",
    "    await pick('9', 'Motion[13]');",
    "    const w = await watch(240, x => x.some(y => y.shell === 'shell01'));",
    "    check(w.some(x => x.shell === 'shell01' && x.key === 30 && x.req), 'Stonefist L9 M13 f16: shell01, u 30 (em019_00c) started', w);",
    "  }"]),
}
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
json.dump(spec, open(D + 'spec_carapaceons.json', 'w', encoding='utf8'), indent=1)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-carapaceons-check.mjs'
subprocess.check_call([sys.executable, D + 'mk_plaincheck.py', D + 'spec_carapaceons.json'])
s = open(P, encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
open(P, 'w', encoding='utf8').write(s)
print('patched', P)
