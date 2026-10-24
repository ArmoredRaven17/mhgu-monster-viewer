# mk011spec.py: spec_kirin.json for mk_plaincheck.py -> dev/shells-kirin-check.mjs
import json, sys, subprocess
mon = 'em011_00'
M = "{ list: '%s', clip: 'Motion[%d]', variant: '%s', len: %d }"
SEQ = lambda *xs: '[' + ', '.join(M % x for x in xs) + ']'
ST = lambda F: "steps: [{ fn: 'd737f8', phase: 1, frame: %s }]" % F
cases = [
  "    // the strike timers (sp_11) at their action's frame; each makes its bolts (sp_01) at its times",
  "    C('k03', 3, 1, null, 0, %s, { %s, frames: 300 })," % (SEQ(('2', 4, '7:0x03', 60)), ST('22.0')),
  "    C('k09', 9, 1, null, 0, %s, { %s, frames: 300, owner: [0, 0x6123, 0] })," % (SEQ(('2', 4, '7:0x09', 60)), ST('22.0')),
  "    C('k05', 5, 1, null, 0, %s, { %s, frames: 300, ownerPos: [-400.0, 30.0, 650.0] })," % (SEQ(('4', 7, '7:0x05', 100)), ST('72.0')),
  "    C('k18', 0x18, 1, null, 0, %s, { %s, frames: 300 })," % (SEQ(('4', 4, '7:0x18', 90)), ST('62.0')),
  "    C('k3a', 0x3a, 1, null, 0, %s, { %s, frames: 300, target: [600.0, -10.0, 1800.0] })," % (SEQ(('4', 4, '7:0x3a', 90)), ST('62.0')),
  "    C('k40', 0x40, 1, null, 0, %s, { %s, frames: 300 })," % (SEQ(('4', 30, '7:0x40', 90)), ST('62.0')),
  "    C('k46', 0x46, 1, null, 0, %s, { %s, frames: 300, owner: [0, 0xb000, 0] })," % (SEQ(('4', 30, '7:0x46', 90)), ST('62.0')),
  "    C('k2d', 0x2d, 1, null, 0, %s, { %s, frames: 300 })," % (SEQ(('4', 7, '7:0x2d', 100)), ST('72.0')),
  "    C('k1b', 0x1b, 1, null, 0, %s, { %s, frames: 300 })," % (SEQ(('4', 9, '7:0x1b', 140)), ST('115.0')),
  "    // (1, 0xa): at the play's start (phase 0)",
  "    C('k10a', 0x0a, 0, null, 0, %s, { st: 1, steps: [{ fn: 'd737f8', phase: 0 }], frames: 300 })," % SEQ(('0', 3, '1:0x0a', 60)),
]
spec = {
  'name': 'kirin', 'title': 'Kirin', 'mon': mon, 'main': 'd737f8', 'variant': 0,
  'header': [
    "Kirin's (em011_00) shells in render/shells.js against the ROM -- uEm011_00's sp_11 (0x7f, base11 through 0xd74a00, its bolts' +0x168",
    "0xd74bf4) and sp_01 (0x7e, base01 through 0xd74704). dev/elder-dragon-shells-spec.md 1.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the action main 0xd737f8 at the phase / frame; every shell and its children flown.",
    "  2. The contract.   3. CONTROLS: facing, owner, target, floor must FAIL.   4. IN THE VIEWER: the records run out.",
    "",
    "  node dev/shells-kirin-check.mjs                                   (1..3)",
    "  node <scratchpad>/run-check.mjs dev/shells-kirin-check.mjs         (4)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x7e): [mon, '01'], hex(0x7f): [mon, '11']},
  'owner_bytes': {},
  'bases': {hex(0x7e): 'base01', hex(0x7f): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[4]').includes('7:0x03') && pv('%s', '4', 'Motion[9]') === '[\"7:0x1b\"]', 'L2 M4 / L4 M9 carry the strikes');" % (mon, mon)]),
  'controls': "\n".join([
    "    ['k09', { owner: [0, 0x6124, 0] }, 'the facing one word off'],",
    "    ['k05', { ownerPos: [-400.0, 30.0, 680.0] }, 'the owner 30 off'],",
    "    ['k18', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further (the target strikes)'],",
    "    ['k03', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the bolts snap)'],"]),
  'page': "\n".join([
    "  {",
    "    await pick('2', 'Motion[4]');",
    "    const w = await watch(240, x => x.some(y => y.shell === 'shell01'));",
    "    check(w.some(x => x.shell === 'shell01' && (x.key === 31 || x.key === 30) && x.req), 'L2 M4: a bolt, shell01, u 30 / 31 started', w);",
    "  }",
    "  const S = body().schedule;",
    "  for (const key of [30, 31, 90]){",
    "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === '%su' && x.def.record.key === key);" % mon,
    "    if (!e){ check(false, '%su ' + key + ' exported as a shell record'); continue; }" % mon,
    "    let started = 0;",
    "    for (let rep = 0; rep < 2; rep++){ try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); } for (let i = 0; i < 240; i++){ await frames(1); if (body().failed) break; } }",
    "    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + chr(92)
json.dump(spec, open(D + 'spec_kirin.json', 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + 'mk_plaincheck.py', D + 'spec_kirin.json'])
