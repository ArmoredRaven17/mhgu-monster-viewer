import json, subprocess, sys
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + chr(92)
steps = lambda n, frames: '[' + ', '.join("{ fn: 'ec0a20', phase: 1, frame: %s, winFrames: [%s] }" % (fr, fr) for fr in frames) + ']'
TAIL = steps(0, ['143.0', '152.0', '160.0', '170.0'])
CHEST = steps(0, ['112.0'])
cases = [
  "    C('t03', 0x03, 1, 143.0, 0, Q('Motion[2]', 0x03, 200), { steps: %s })" % TAIL,
  "    C('t14', 0x14, 1, 143.0, 0, Q('Motion[2]', 0x03, 200), { steps: %s, owner: [0, 0x9123, 0] })" % TAIL,
  "    C('t31_low', 0x31, 1, 143.0, 0, Q('Motion[2]', 0x31, 200), { steps: %s, rank: 3 })" % TAIL,
  "    C('t03_lv1', 0x03, 1, 143.0, 0, Q('Motion[2]', 0x03, 200), { steps: %s, block_bytes: { '0x410': [1, 0] } })" % TAIL,
  "    C('t03_low', 0x03, 1, 143.0, 0, Q('Motion[2]', 0x03, 200), { steps: %s, rank: 3, none: 1 })" % TAIL,
  "    C('t03_cold', 0x03, 1, 143.0, 0, Q('Motion[2]', 0x03, 200), { steps: %s, cold: ['0xcace'], heat049: HOT({ tail: false }), none: 1 })" % TAIL,
  "    C('t03_broken', 0x03, 1, 143.0, 0, Q('Motion[2]', 0x03, 200), { steps: %s, block_bytes: { '0x410': [2, 0] }, heat049: HOT({ tailBroken: true }), none: 1 })" % TAIL,
  "    C('c05', 0x05, 1, 112.0, 0, Q('Motion[5]', 0x05, 150), { steps: %s })" % CHEST,
  "    C('c15', 0x15, 1, 112.0, 0, Q('Motion[5]', 0x05, 150), { steps: %s, owner: [0, 0x9123, 0] })" % CHEST,
  "    C('c32_low', 0x32, 1, 112.0, 0, Q('Motion[5]', 0x32, 150), { steps: %s, rank: 3 })" % CHEST,
  "    C('c05_lv2', 0x05, 1, 112.0, 0, Q('Motion[5]', 0x05, 150), { steps: %s, block_bytes: { '0x3c8': [2, 0] } })" % CHEST,
  "    C('c05_cold', 0x05, 1, 112.0, 0, Q('Motion[5]', 0x05, 150), { steps: %s, cold: ['0xcac2'], heat049: HOT({ chest: false }), none: 1 })" % CHEST,
  "    C('c05_broken', 0x05, 1, 112.0, 0, Q('Motion[5]', 0x05, 150), { steps: %s, block_bytes: { '0x3c8': [3, 0] }, heat049: HOT({ chestBroken: true }), none: 1 })" % CHEST,
]
spec = {
 "name": "agnaktor", "title": "Agnaktor", "mon": "em049_00", "main": "ec0a20", "variant": 0,
 "header": [
  "Agnaktor's (em049_00) lava drips in render/shells.js against the ROM -- uEm049_00's sp_01 (0xed, base01 through its reader 0xec43f4):",
  "L2 M2 (7, 3 / 0x14 / 0x31) four at the block plus tune vecs 0..3 turned by the facing, L2 M5 (7, 5 / 0x15 / 0x32) one at joint 16;",
  "each gated by its part's heat (e+0xcace tail / +0xcac2 chest != 0), its break level (0x9d36c(e, 7 / 1) below the .dtp row's G byte)",
  "and G rank unless (7, 0x31 / 0x32).",
  "",
  "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn, the class's action main",
  "     0xec0a20 with the action at e+0x73e0, the region heat at e+0xcac0 + 2k, the .dtp array at [[e+0x75f0]+0x64] (the file's values)",
  "     and the break levels at [e+0x1428]+0x3bc+12k; the frame tests answered one at a time (`winFrames`).",
  "     Cases marked none: the ROM makes nothing and the module neither (cold, broken, low rank).",
  "  2. The contract: the pick lists.",
  "  3. CONTROLS: a wrong joint, a wrong facing, a dropped gate must FAIL the comparison.",
  "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
  "",
  "  node dev/shells-agnaktor-check.mjs                                   (1..3: the ROM comparison, no viewer)",
  "  node <scratchpad>/run-check.mjs dev/shells-agnaktor-check.mjs         (4: the viewer)",
  "",
  "Exit code 1 when anything fails."],
 "folders": {"0xed": ["em049_00", "01"]},
 "owner_bytes": {},
 "bases": {"0xed": "base01"},
 "joints": "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 16: jointOf(0.9, -0.45, 0.25, [160.25, 160.5, 40.75]) };\n  const J16b = jointOf(-0.4, 0.3, 0.1, [150.0, 150.0, 30.0]);\n  const HOT = (o = {}) => Object.assign({ chest: true, tail: true, chestBroken: false, tailBroken: false }, o);\n  // .dtp em049_00_dtbparts A: (part, low-rank / G) 0 2/2, 1 2/3, 2..6 1/1, 7 1/2\n  const DTP = [[0, 2, 2], [1, 2, 3], [2, 1, 1], [3, 1, 1], [4, 1, 1], [5, 1, 1], [6, 1, 1], [7, 1, 2]].flatMap(r => r.concat([0]));",
 "cases": ',\n'.join(cases) + ',',
 "contract": "  ok(pv('em049_00', '2', 'Motion[2]') === '[\"7:0x03\",\"7:0x31\"]', 'L2 M2 picks its two drip actions', pv('em049_00', '2', 'Motion[2]'));\n  ok(pv('em049_00', '2', 'Motion[5]') === '[\"7:0x05\",\"7:0x32\"]', 'L2 M5 picks its two', pv('em049_00', '2', 'Motion[5]'));",
 "controls": "\n".join([
  "    ['c05', { joints: Object.assign({}, JOINTS, { 16: J16b }) }, 'another joint 16'],",
  "    ['t14', { owner: [0, 0x9124, 0] }, 'the facing one word off'],",
  "    ['t03', { ownerPos: [121.5, 15.25, -80.75] }, 'the block 1 over'],",
  "    ['t03', { heat049: HOT({ tail: false }) }, 'the tail read cold'],",
  "    ['c05', { heat049: HOT({ chestBroken: true }) }, 'the chest read broken'],",
  "    ['t03', { rank: 3 }, 'low rank on (7, 3)'],",
  "    ['t03_lv1', { heat049: HOT({ tailBroken: true }) }, 'level 1 read as broken (the low-rank byte)'],"]),
 "page": "\n".join([
  "  {",
  "    await pick('2', 'Motion[2]');",
  "    const w = await watch(240, x => x.some(y => y.shell === 'shell01'));",
  "    check(w.some(x => x.shell === 'shell01' && x.key === 100 && x.req), 'L2 M2 (G rank, tail hot): a drip, shell01, u 100 started', w);",
  "  }",
  "  {",
  "    await pick('2', 'Motion[5]');",
  "    const w = await watch(200, x => x.some(y => y.shell === 'shell01'));",
  "    check(w.some(x => x.shell === 'shell01' && x.key === 101 && x.req), 'L2 M5 (G rank, chest hot): the chest drip, shell01, u 101 started', w);",
  "  }",
  "  const S = body().schedule;",
  "  for (const key of [100, 101]){",
  "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em049_00u' && x.def.record.key === key);",
  "    if (!e){ check(false, 'em049_00u ' + key + ' exported as a shell record'); continue; }",
  "    let started = 0, maxRun = 0;",
  "    for (let rep = 0; rep < 2; rep++){",
  "      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }",
  "      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }",
  "    }",
  "    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });",
  "    if (body().failed) await open();",
  "  }"]),
}
json.dump(spec, open(D + 'spec_agnaktor.json', 'w', encoding='utf8'), indent=1)
print(subprocess.run([sys.executable, D + 'mk_plaincheck.py', D + 'spec_agnaktor.json'], capture_output=True, text=True).stdout)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-agnaktor-check.mjs'
s = open(P, encoding='utf8').read()
def rep(o, n):
    global s
    assert s.count(o) == 1, o
    s = s.replace(o, n)
# the heat / .dtp / break inputs: every case hot at both regions with the file's .dtp unless it says otherwise
rep("owner_bytes: Object.assign({ '0x73e0': [x.st == null ? 7 : x.st, n] }, {}), joints: JOINTS }, x);",
    "owner_bytes: Object.assign({ '0x73e0': [x.st == null ? 7 : x.st, n] }, ...[0xcac2, 0xcace].map(a => ({ ['0x' + a.toString(16)]: (x.cold || []).includes('0x' + a.toString(16)) ? [0, 0] : [3, 0] }))),\n    dtp: DTP, heat049: HOT(), joints: JOINTS }, x);")
rep("questLevel: x.quest, trunkSnow083: x.trunk });", "questLevel: x.quest, trunkSnow083: x.trunk, heat049: x.heat049 });")
rep("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;\n    o.dtp = c.dtp; if (c.block_bytes) o.block_bytes = c.block_bytes;")
open(P, 'w', encoding='utf8').write(s)
print('patched')
