# mk070spec.py: spec_nerscylla.json for mk_plaincheck.py, then the em070 patches of the generated dev/shells-nerscylla-check.mjs
import json, sys, subprocess
mon = 'em070_00'
M = "{ list: '%s', clip: 'Motion[%d]', variant: '%s', len: %d }"
SEQ = lambda *xs: '[' + ', '.join(M % x for x in xs) + ']'
ST = lambda *fr: "steps: [" + ', '.join("{ fn: 'fab3d8', phase: 1, frame: %s }" % F for F in fr) + "]"
cases = [
  "    // L2 M41 (7, 4) f20 / f42: sp_00, the tier's mode (0 / 5 / 10) and that plus 1 + (e+0x73e8 & 3) -- the stand-in 0",
  "    C('s04', 4, 1, null, 0, %s, { %s })," % (SEQ(('2', 41, '7:0x04', 80)), ST('20.0', '42.0')),
  "    C('s04_r3', 4, 1, null, 0, %s, { %s, rank: 3, owner: [0, 0x6123, 0] })," % (SEQ(('2', 41, '7:0x04', 80)), ST('20.0', '42.0')),
  "    C('s04_r1', 4, 1, null, 0, %s, { %s, rank: 1, size: [1.15, 1.05] })," % (SEQ(('2', 41, '7:0x04', 80)), ST('20.0', '42.0')),
  "    // L2 M31 (7, 7 / 9) f6: sp_00 15 / 16 / 17 from joint 0 (no X aim on 17: int 1 0, int 2 0 -> 0x800)",
  "    C('s07', 7, 1, null, 0, %s, { %s })," % (SEQ(('2', 31, '7:0x07', 40)), ST('6.0')),
  "    C('s07_r1', 7, 1, null, 0, %s, { %s, rank: 1, target: [-1500.0, -1900.0, 1900.0] })," % (SEQ(('2', 31, '7:0x07', 40)), ST('6.0')),
  "    // L2 M13 (7, 0x32) f36 / f52 / f66: sp_00 18.. / 21.. / 24.. (no X aim: int 1 -1)",
  "    C('s32', 0x32, 1, null, 0, %s, { %s })," % (SEQ(('2', 13, '7:0x32', 90)), ST('36.0', '52.0', '66.0')),
  "    // L2 M57 (7, 0x34) f64 / f82 / f96: sp_00 27.. / 30.. / 33..; (7, 5) f66 / f82 / f98: sp_13 0.. / 3.. / 6..",
  "    C('s34', 0x34, 1, null, 0, %s, { %s, owner: [0, 0xd000, 0] })," % (SEQ(('2', 57, '7:0x34', 110)), ST('64.0', '82.0', '96.0')),
  "    C('t05', 5, 1, null, 0, %s, { %s })," % (SEQ(('2', 57, '7:0x05', 110)), ST('66.0', '82.0', '98.0')),
  "    C('t05_near', 5, 1, null, 0, %s, { %s, rank: 3, target: [300.0, 0.0, 250.0] })," % (SEQ(('2', 57, '7:0x05', 110)), ST('66.0', '82.0', '98.0')),
  "    C('t05_far', 5, 1, null, 0, %s, { %s, rank: 1, target: [-4000.0, 120.0, 3100.0] })," % (SEQ(('2', 57, '7:0x05', 110)), ST('66.0', '82.0', '98.0')),
  "    // THE DRIP 0xfa280c (status 3's walks, phase 1): the countdown at 0 fires at once in the ROM's call; the module's first fire is",
  "    // phase 1's 20th step (phase 0's 20.0) -- one drip each, sp_00_02 0 / 1 by rank, and its landing's sp_01 6 / 7",
  "    C('drip', 0x0c, 1, null, 0, %s, { st: 3, steps: [{ fn: 'fa280c' }], unstub: ['0x7206c'] })," % SEQ(('0', 8, '3:0x0c', 30), ('0', 1, '0:0x00', 0)),
  "    C('drip_r3', 0x0e, 1, null, 0, %s, { st: 3, steps: [{ fn: 'fa280c' }], unstub: ['0x7206c'], rank: 3, owner: [0, 0x2345, 0] })," % SEQ(('0', 6, '3:0x0e', 30), ('0', 1, '0:0x00', 0)),
  "    // THE BACK GATE: P+0x3b5 bit 5 (P+0x3b4 0x2000: the Back at its second level) -> no drip; bit 6 (0x4000: its first) drips",
  "    C('drip_back2', 0x0c, 1, null, 0, %s, { st: 3, steps: [{ fn: 'fa280c' }], unstub: ['0x7206c'], back070: 2, none: 1 })," % SEQ(('0', 8, '3:0x0c', 30), ('0', 1, '0:0x00', 0)),
  "    C('drip_back1', 0x0c, 1, null, 0, %s, { st: 3, steps: [{ fn: 'fa280c' }], unstub: ['0x7206c'], back070: 1 })," % SEQ(('0', 8, '3:0x0c', 30), ('0', 1, '0:0x00', 0)),
]
spec = {
  'name': 'nerscylla', 'title': 'Nerscylla', 'mon': mon, 'main': 'fab3d8', 'variant': 0,
  'header': [
    "Nerscylla's (em070_00) shells in render/shells.js against the ROM -- uEm070_00's sp_00 (0x129, base00 through 0xfac410, its landing",
    "0xfac5e8), sp_00_02 (0x12a, the drip, base00 through 0xfac844 / 0xfac9e4), sp_01 (0x12b, base01 through 0xfacc70: the webs and puddles",
    "the landings make) and sp_13 (0x12c, base13 through 0xface88 / 0xfad064). dev/temnoceran-shells-spec.md.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the class's action main 0xfab3d8 at each frame",
    "     test, the drip 0xfa280c with its countdown native; every shell flown from the setup the ROM built, the landings' sp_01 as children.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor, the rank one tier off must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-nerscylla-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-nerscylla-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x129): [mon, '00'], hex(0x12a): [mon, '00_02'], hex(0x12b): [mon, '01'], hex(0x12c): [mon, '13']},
  'owner_bytes': {},
  'bases': {hex(0x129): 'base00', hex(0x12a): 'base00', hex(0x12b): 'base01', hex(0x12c): 'base13'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 144: jointOf(0.1, 0.3, 0.05, [40.0, 380.0, 220.0]), 145: jointOf(0.0, 0.2, 0.0, [-30.0, 420.0, -150.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[41]') === '[\"7:0x04\"]', 'L2 M41 picks its spit', pv('%s', '2', 'Motion[41]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[57]') === '[\"7:0x05\",\"7:0x34\"]', 'L2 M57 picks its balls and its spits', pv('%s', '2', 'Motion[57]'));" % (mon, mon),
    "  ok(pv('%s', '0', 'Motion[8]') === '[\"3:0x0c\"]' && pv('%s', '0', 'Motion[6]') === '[\"3:0x0e\"]', 'L0 M8 / M6 carry the drip');" % (mon, mon)]),
  'controls': "\n".join([
    "    ['s04_r3', { owner: [0, 0x6124, 0] }, 'the facing one word off'],",
    "    ['t05_far', { target: [-4000.0, 120.0, 3130.0] }, 'the target 30 further (the balls)'],",
    "    ['s07_r1', { target: [-1500.0, -1900.0, 1930.0] }, 'the target 30 further (the X aim)'],",
    "    ['s04', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing)'],",
    "    ['s04', { rank: 3 }, 'the rank one tier down'],",
    "    ['drip', { rank: 1 }, 'the drip at rank 1 (mode 0, not 1)'],",
    "    ['drip_back2', { back070: 1 }, 'the Back one level down (it drips)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh, key] of [['2', 'Motion[41]', 'shell00', 0], ['2', 'Motion[13]', 'shell00', 0], ['0', 'Motion[8]', 'shell00_02', 100]]){   // (the viewer's rank 5: the drip's mode 1, u 100)",
    "    await pick(list, clip);",
    "    const w = await watch(240, x => x.some(y => y.shell === sh));",
    "    check(w.some(x => x.shell === sh && x.key === key && x.req), 'L' + list + ' ' + clip + ': ' + sh + ', u ' + key + ' started', w);",
    "  }",
    "  const S = body().schedule;",
    "  for (const key of [0, 2, 90, 91, 100, 101]){",
    "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === '%su' && x.def.record.key === key);" % mon,
    "    if (!e){ check(false, '%su ' + key + ' exported as a shell record'); continue; }" % mon,
    "    let started = 0, maxRun = 0;",
    "    for (let rep = 0; rep < 2; rep++){",
    "      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }",
    "      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }",
    "    }",
    "    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });",
    "    if (body().failed) await open();",
    "  }"]),
}
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
json.dump(spec, open(D + 'spec_nerscylla.json', 'w', encoding='utf8'), indent=1)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-nerscylla-check.mjs'
subprocess.check_call([sys.executable, D + 'mk_plaincheck.py', D + 'spec_nerscylla.json'])
s = open(P, encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
rep("    if (c.precall) o.precall = c.precall;",
    "    if (c.precall) o.precall = c.precall;\n    if (c.unstub) o.unstub = c.unstub;\n    if (c.frames) o.frames = c.frames;\n"
    "    o.ownvt = { '0x9c': '0x6bb20' };\n    if (c.back070) o.block = Object.assign({}, o.block, { '0x3b5': [c.back070 >= 2 ? 0x20 : 0x40] });\n    o.owner_bytes = Object.assign({}, o.owner_bytes, { '0x1053': [0xff] });")
rep("trunkSnow083: x.trunk });", "trunkSnow083: x.trunk, back070: x.back070 || 0 });")
open(P, 'w', encoding='utf8').write(s)
print('patched', P)
