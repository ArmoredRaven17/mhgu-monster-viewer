# mk067spec.py: spec_zamtrios.json for mk_plaincheck.py, then dev/shells-zamtrios-check.mjs patched for his inputs
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
DTP = [0, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 3, 3, 1, 1, 3, 6, 1, 1, 4]
HOPS = "[" + ", ".join("{ fn: 'f75e20', phase: 1, frame: 140.0 }" for _ in range(9)) + "]"
cases = [
  "    // L2 M12 f58: sp_13 4 at the target, (7, 0x21) also sp_13 3 at its two points (the target's height)",
  "    C('m21', 0x21, 1, 58.0, 0, Q('Motion[12]', 0x21, 140, '2')),",
  "    C('m36_side', 0x36, 1, 58.0, 0, Q('Motion[12]', 0x21, 140, '2'), { target: [-2400.0, 80.0, 300.0], owner: [0x0400, 0xd000, 0x0200], size: [1.15, 1.0] }),",
  "    C('m22', 0x22, 1, 58.0, 0, Q('Motion[12]', 0x22, 140, '2'), { target: [300.0, 0.0, 250.0] }),",
  "    // L4 M37: nine passes of f140, one shot each (P+0x1a2 1..9: mode 1 on 1 / 4 / 7, its point P+0x1a2 - 1)",
  "    C('h18', 0x18, 1, 140.0, 0, Array.from({ length: 9 }, () => Q('Motion[37]', 0x18, 160, '4')[0]), { steps: " + HOPS + " }),",
  "    C('h18_turned', 0x18, 1, 140.0, 0, Array.from({ length: 9 }, () => Q('Motion[37]', 0x18, 160, '4')[0]), { steps: " + HOPS + ", owner: [0, 0x7123, 0], size: [1.2, 1.1] }),",
]
spec = {
  'name': 'zamtrios', 'title': 'Zamtrios', 'mon': 'em067_00', 'main': 'f75e20', 'variant': 0,
  'header': [
    "Zamtrios's (em067_00) shells in render/shells.js against the ROM -- uEm067_00's sp_13 (0x124, his balls, base13 through its reader",
    "0xf78934, its target vt+0x170 0xf79090 off the ShellCmnParam's points, its landing 0xf78ed0) and their children sp_01 (0x122, hit",
    "volumes). His beams (sp_02 0x123) are render/beam-spawns.js's. dev/amphibian-shells-spec.md 2.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py (env FB_EMU overrides) -- the whole executable on unicorn, the class's action main",
    "     0xf75e20 with the action at e+0x73e0 and the .dtp array filled; L4 M37's nine passes as nine calls (P+0x1a2 counted by the ROM);",
    "     every shell flown from the setup the ROM built, its children from theirs.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor, another size must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-zamtrios-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-zamtrios-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {'0x122': ['em067_00', '01'], '0x124': ['em067_00', '13']},
  'owner_bytes': {},
  'bases': {'0x122': 'base01', '0x124': 'base13'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('em067_00', '2', 'Motion[12]') === '[\"7:0x21\",\"7:0x22\"]', 'L2 M12 picks its two throws', pv('em067_00', '2', 'Motion[12]'));",
    "  ok(pv('em067_00', '4', 'Motion[37]') === '[\"7:0x18\"]', 'L4 M37 picks its hops', pv('em067_00', '4', 'Motion[37]'));"]),
  'controls': "\n".join([
    "    ['m21', { owner: [0, 0x3001, 0] }, 'the facing one word off'],",
    "    ['m21', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further'],",
    "    ['m22', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher'],",
    "    ['h18_turned', { size: [1.2, 1.0] }, 'another size (the points, the clamps)'],",
    "    ['h18', { owner: [0x0001, 0x3000, 0] }, 'the X word one off (the points turn by all three)'],"]),
  'page': "\n".join([
    "  {",
    "    await pick('2', 'Motion[12]');",
    "    const w = await watch(200, x => x.some(y => y.shell === 'shell13'));",
    "    check(w.some(x => x.shell === 'shell13' && (x.key === 10 || x.key === 0) && x.req), 'L2 M12: a ball, shell13, u 10 / 0 started', w);",
    "  }",
    "  {",
    "    await pick('4', 'Motion[37]_loop');   // (the _loop: f140 is its start, passed at every wrap -- 0x7294c)",
    "    const w = await watch(700, x => x.filter(y => y.shell === 'shell13').length >= 3);",
    "    check(w.filter(x => x.shell === 'shell13' && x.req).length >= 3, 'L4 M37_loop: a ball a pass, three passes', w);",
    "  }",
    "  const S = body().schedule;",
    "  for (const key of [0, 1, 10, 11]){",
    "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em067_00u' && x.def.record.key === key);",
    "    if (!e){ check(false, 'em067_00u ' + key + ' exported as a shell record'); continue; }",
    "    let started = 0, maxRun = 0;",
    "    for (let rep = 0; rep < 2; rep++){",
    "      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }",
    "      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }",
    "    }",
    "    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });",
    "    if (body().failed) await open();",
    "  }"]),
}
json.dump(spec, open(D + 'spec_zamtrios.json', 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + 'mk_plaincheck.py', D + 'spec_zamtrios.json'])
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-zamtrios-check.mjs'
s = open(P, encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
rep("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;\n    o.dtp = %s;" % json.dumps(DTP))
open(P, 'w', encoding='utf8').write(s)
print('patched', P)
