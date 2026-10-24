import json, subprocess, sys
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + chr(92)
MAIN = 'ea8ad0'
def steps(phase, frames):
    return '[' + ', '.join("{ fn: '%s', phase: %d, frame: %s, winFrames: [%s] }" % (MAIN, phase, fr, fr) for fr in frames) + ']'
def C(name, n, phase, frames, clip, prim, ln, lst='4', extra=''):
    return "    C('%s', 0x%02x, %d, %s, 0, Q('%s', 0x%02x, %d, '%s'), { steps: %s%s })" % (
        name, n, phase, frames[0], clip, prim, ln, lst, steps(phase, frames), extra)
cases = [
  C('b36', 0x36, 1, ['98.0'], 'Motion[6]', 0x36, 160),
  C('b56', 0x56, 1, ['98.0'], 'Motion[6]', 0x36, 160, extra=", owner: [0, 0x9123, 0]"),
  C('b41', 0x41, 1, ['98.0'], 'Motion[6]', 0x41, 160),
  C('b41_tired', 0x41, 1, ['98.0'], 'Motion[6]', 0x41, 160, extra=", tired: true, block_bytes: { '0x505': [2] }"),
  C('b48', 0x48, 1, ['16.0'], 'Motion[15]', 0x48, 60),
  C('b72', 0x72, 3, ['96.0'], 'Motion[30]', 0x72, 160),
  C('b73', 0x73, 3, ['96.0'], 'Motion[30]', 0x73, 160),
  C('b74', 0x74, 3, ['96.0'], 'Motion[32]', 0x74, 160),
  C('b76', 0x76, 3, ['96.0'], 'Motion[32]', 0x76, 160, extra=", target: [-1400.0, 60.0, 1800.0]"),
  C('b7d', 0x7d, 1, ['60.0'], 'Motion[31]', 0x7d, 120),
  C('b81', 0x81, 1, ['60.0'], 'Motion[31]', 0x81, 120),
  C('b7e', 0x7e, 1, ['60.0'], 'Motion[33]', 0x7e, 120),
  C('b82', 0x82, 1, ['60.0'], 'Motion[33]', 0x82, 120),
  C('b83', 0x83, 1, ['14.0'], 'Motion[37]', 0x83, 60, '2'),
  C('b8e', 0x8e, 1, ['90.0'], 'Motion[36]', 0x8e, 140, '2', extra=", target: [300.0, 0.0, 900.0]"),
  C('z6e', 0x6e, 1, ['200.0', '260.0', '320.0'], 'Motion[2]', 0x6e, 340),
  C('z6e_turn', 0x6e, 1, ['200.0', '260.0', '320.0'], 'Motion[2]', 0x6e, 340, extra=", owner: [0, 0x9123, 0]"),
  C('z6f', 0x6f, 1, ['110.0', '160.0'], 'Motion[10]', 0x6f, 200),
  C('z70', 0x70, 1, ['110.0', '160.0'], 'Motion[10]', 0x70, 200, extra=", target: [-1400.0, 60.0, 1800.0]"),
  C('s6f_orbit', 0x6f, 1, ['110.0'], 'Motion[10]', 0x6f, 150, extra=", slot0: [0], slot0Ids: [0xea], slot0Modes: [0, 1], hitLife: true, slotsOnly: 'shell26'"),
  C('s70_orbit', 0x70, 1, ['110.0'], 'Motion[10]', 0x70, 150, extra=", slot0: [0], slot0Ids: [0xea], slot0Modes: [3, 4, 5], hitLife: true, slotsOnly: 'shell26', target: [-1400.0, 60.0, 1800.0]"),
  "    C('t68', 0x68, 1, 1.0, 0, Q('Motion[8]', 0x68, 40, '4'), { steps: [{ fn: 'ea8ad0', phase: 1, frame: 1.0 }, { fn: 'ea8ad0', phase: 1, frame: 2.0 }] })",
  "    C('t69', 0x69, 1, 1.0, 0, Q('Motion[8]', 0x69, 40, '4'), { steps: [{ fn: 'ea8ad0', phase: 1, frame: 1.0 }, { fn: 'ea8ad0', phase: 1, frame: 2.0 }], target: [-1400.0, 60.0, 1800.0], ownerPos: [300.0, 0.0, 200.0] })",
  "    C('t68_near', 0x68, 1, 1.0, 0, Q('Motion[8]', 0x68, 40, '4'), { steps: [{ fn: 'ea8ad0', phase: 1, frame: 1.0 }, { fn: 'ea8ad0', phase: 1, frame: 2.0 }], target: [400.0, 0.0, 300.0] })",
  C('z9a', 0x9a, 1, ['36.0'], 'Motion[36]', 0x9a, 80),
  C('z9b', 0x9b, 1, ['36.0'], 'Motion[36]', 0x9b, 80, extra=", size: [1.25, 1.1]"),
]
spec = {
 "name": "lagiacrus", "title": "Lagiacrus", "mon": "em046_00", "main": MAIN, "variant": 0,
 "header": [
  "Lagiacrus's (em046_00) shells in render/shells.js against the ROM -- uEm046_00: sp_00 (0xe6, the thunderballs, base00 through its",
  "reader 0xeaa5b4 and landing 0xeaa820), sp_01 (0xe7, the discharges, base01: reader 0xeaab48, end create 0xeaac6c), sp_11 (0xe8,",
  "base11: reader 0xeaaf38, create 0xeab080), sp_25 (0xe9, base25) and sp_26 (0xea, base26).",
  "",
  "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn, the class's action main",
  "     0xea8ad0 with the action at e+0x73e0, the phase and the frame tests answered one at a time (`winFrames`); every shell flown from",
  "     the setup the ROM built, its children from theirs.",
  "  2. The contract: the pick lists.",
  "  3. CONTROLS: a wrong joint, a wrong facing, a moved target, a moved floor, the tired child dropped must FAIL the comparison.",
  "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
  "",
  "  node dev/shells-lagiacrus-check.mjs                                   (1..3: the ROM comparison, no viewer)",
  "  node <scratchpad>/run-check.mjs dev/shells-lagiacrus-check.mjs         (4: the viewer)",
  "",
  "Exit code 1 when anything fails."],
 "folders": {"0xe6": ["em046_00", "00"], "0xe7": ["em046_00", "01"], "0xe8": ["em046_00", "11"], "0xe9": ["em046_00", "25"], "0xea": ["em046_00", "26"]},
 "owner_bytes": {},
 "bases": {"0xe6": "base00", "0xe7": "base01", "0xe8": "base11", "0xe9": "base25", "0xea": "base26"},
 "joints": "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.9, -0.45, 0.25, [160.25, 260.5, 40.75]) };\n  const J3b = jointOf(-0.4, 0.3, 0.1, [150.0, 250.0, 30.0]);",
 "cases": ',\n'.join(cases) + ',',
 "contract": "  ok(pv('em046_00', '4', 'Motion[6]') === '[\"7:0x36\",\"7:0x41\"]', 'L4 M6 picks its two balls', pv('em046_00', '4', 'Motion[6]'));\n  ok(pv('em046_00', '4', 'Motion[10]').startsWith('[\"7:0x6f\",\"7:0x70\"'), 'L4 M10 picks its two', pv('em046_00', '4', 'Motion[10]'));",
 "controls": "\n".join([
  "    ['b41', { joints: Object.assign({}, JOINTS, { 3: J3b }) }, 'another joint 3'],",
  "    ['b56', { owner: [0, 0x9124, 0] }, 'the facing one word off'],",
  "    ['b72', { target: [930.0, 40.0, 2400.0] }, 'the target 30 over (the X aim)'],",
  "    ['b76', { target: [-1400.0, 90.0, 1800.0] }, 'the target 30 higher (the Y aim)'],",
  "    ['b41_tired', { tired: false }, 'the tired child (14) dropped'],",
  "    ['z6e', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher'],",
  "    ['z9b', { size: [1.0, 1.0] }, 'the owner size dropped (0x800)'],",
  "    ['t68', { target: [930.0, 40.0, 2400.0] }, 'the target 30 over (the marks: their words and reach)'],",
  "    ['t68_near', { ownerPos: [121.5, 15.25, -80.75] }, 'the block 1 over (the marks)'],",
  "    ['s6f_orbit', { target: [930.0, 40.0, 2400.0] }, 'the target 30 over (the spiral\\'s yaw)'],",
  "    ['s70_orbit', { ownerPos: [120.5, 16.25, -80.75] }, 'the block 1 higher (the spiral\\'s height)'],"]),
 "page": "\n".join([
  "  {",
  "    await pick('4', 'Motion[6]');",
  "    const w = await watch(420);",
  "    check(w.some(x => x.shell === 'shell00' && x.req), 'L4 M6: a thunderball, shell00, started', w);",
  "    check(!body().failed, 'L4 M6 played out (the ball, its landing and its discharge lines): the runtime still up', body().failed ? String(body().failed) : null);",
  "    if (body().failed) await open();",
  "  }",
  "  {",
  "    await pick('4', 'Motion[2]');",
  "    const w = await watch(600);",
  "    check(w.some(x => x.shell === 'shell01' && x.req), 'L4 M2: the discharges, shell01, started', w);",
  "    check(!body().failed, 'L4 M2 played out (600 frames): the runtime still up', body().failed ? String(body().failed) : null);",
  "    if (body().failed) await open();",
  "  }",
  "  {",
  "    await pick('4', 'Motion[8]');",
  "    const w = await watch(600);",
  "    check(w.some(x => x.shell === 'shell25' && x.key === 90 && x.req), 'L4 M8: the strike marks, shell25, u 90 started', w);",
  "    check(!body().failed, 'L4 M8 played out (600 frames): the runtime still up', body().failed ? String(body().failed) : null);",
  "    if (body().failed) await open();",
  "  }",
  "  {",
  "    await pick('4', 'Motion[10]');",
  "    const w = await watch(600);",
  "    check(w.some(x => x.shell === 'shell26' && x.key === 120 && x.req), 'L4 M10: the spiral, shell26, u 120 started', w);",
  "    check(!body().failed, 'L4 M10 played out (600 frames): the runtime still up', body().failed ? String(body().failed) : null);",
  "    if (body().failed) await open();",
  "  }",
  "  const S = body().schedule;",
  "  for (const key of KEYS046){",
  "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em046_00u' && x.def.record.key === key);",
  "    if (!e){ check(false, 'em046_00u ' + key + ' exported as a shell record'); continue; }",
  "    let started = 0, maxRun = 0;",
  "    for (let rep = 0; rep < 2; rep++){",
  "      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }",
  "      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }",
  "    }",
  "    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });",
  "    if (body().failed) await open();",
  "  }"]),
}
json.dump(spec, open(D + 'spec_lagiacrus.json', 'w', encoding='utf8'), indent=1)
print(subprocess.run([sys.executable, D + 'mk_plaincheck.py', D + 'spec_lagiacrus.json'], capture_output=True, text=True).stdout)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-lagiacrus-check.mjs'
s = open(P, encoding='utf8').read()
def rep(o, n):
    global s
    assert s.count(o) == 1, o
    s = s.replace(o, n)
rep("|| [...clipSel.options].find(x => x.value === name + '_start');", "|| [...clipSel.options].find(x => x.value === name + '_start') || [...clipSel.options].find(x => x.value === name + '_loop');")
rep("questLevel: x.quest, trunkSnow083: x.trunk });", "questLevel: x.quest, trunkSnow083: x.trunk, tired: !!x.tired });")
rep("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;\n    if (c.block_bytes) o.block_bytes = c.block_bytes;\n    o.treeDepth = 3;   // (sp_00 -> sp_01 -> sp_11 -> sp_01: the grandchildren's children)\n    if (c.slot0Ids) o.slot0Ids = c.slot0Ids;\n    if (c.slot0Modes) o.slot0Modes = c.slot0Modes;")
rep("      for (const sh of out.spawned) info.set(sh.id, { S: sh, step: k, starts: [], children: [] });",
    "      // (slotsOnly: the ROM run holds hit slot 0 of that shell alone -- the module's others are given none, as the run's)\n      if (x.slotsOnly) for (const sh of out.spawned) if (sh.shell !== x.slotsOnly) sh.slots = null;\n      for (const sh of out.spawned) info.set(sh.id, { S: sh, step: k, starts: [], children: [] });")
rep("  const S = body().schedule;\n  for (const key of KEYS046){", "  const S = body().schedule;\n  // (u 61, L4 M10's discharge: exported again 2026-10-18 once the effects lane read construct.js generatorFlags' 0xae997c arm)\n  for (const key of [0, 1, 2, 3, 4, 10, 11, 60, 61, 70, 80, 81, 82, 90, 91, 120, 301, 311]){")
open(P, 'w', encoding='utf8').write(s)
print('patched')
s = open(P, encoding='utf8').read()
o = "    const sp = R.spawn;\n"
assert s.count(o) == 1
s = s.replace(o, o + "    // the unit's size after the init (+0x60: 0x43ab74 at base01's init end -- 1.0, not ShellScale, unless flag 0x800: the owner's size)\n    if (base === 'base01' || base === 'base11'){ const us = S0.unitScale != null ? S0.unitScale : f(1.0); if (!eq(f(us), f(sp.scale))) return 'unit size ' + us + ' vs ROM ' + sp.scale; }\n")
open(P, 'w', encoding='utf8').write(s)
print('scale cmp')
