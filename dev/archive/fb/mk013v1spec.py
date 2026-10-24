# mk013spec.py: spec_crimson.json for mk_plaincheck.py (Fatalis, em013_00 variant 0), then its patches
import json, sys, subprocess
mon = 'em013_01'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
M = lambda l, c, v, n: "[{ list: '%s', clip: 'Motion[%d]', variant: '%s', len: %d }]" % (l, c, v, n)
ST = lambda *s: "steps: [" + ', '.join("{ fn: 'd8a634', %s }" % x for x in s) + "]"
V = lambda st, n: '%d:0x%02x' % (st, n)
rows = [  # name, st, n, list, clip, len, steps
  ('s300', 3, 0x00, '1', 1, 152, ["phase: 1, ended: 1"]),
  ('s400', 4, 0x00, '1', 1, 152, ["phase: 1, ended: 1"]),
  ('s401', 4, 0x01, '1', 5, 12, ["phase: 1, win: 1, frame: 10.0"]),
  ('s403', 4, 0x03, '1', 6, 38, ["phase: 1, win: 1, frame: 36.0"]),
  ('s03', 7, 0x03, '2', 8, 100, ["phase: 0", "phase: 1, win: 1, frame: 98.0"]),
  ('s05', 7, 0x05, '2', 10, 32, ["phase: 0", "phase: 2, win: 1, frame: 30.0"]),
  ('s0a', 7, 0x0a, '2', 10, 32, ["phase: 0", "phase: 2, win: 1, frame: 30.0"]),
  ('s07e', 7, 0x07, '2', 11, 72, ["phase: 1, ended: 1"]),
  ('s07', 7, 0x07, '2', 12, 22, ["phase: 2, win: 1, frame: 20.0"]),
  ('s0c', 7, 0x0c, '2', 13, 56, ["phase: 1, win: 1, frame: 54.0"]),
  ('s0d', 7, 0x0d, '2', 15, 52, ["phase: 4, win: 1, frame: 50.0"]),
  ('m0e', 7, 0x0e, '2', 2, 322, ["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (80, 140, 200, 260, 320)]),
  ('m10', 7, 0x10, '2', 2, 322, ["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (80, 140, 200, 260, 320)]),
  ('m18', 7, 0x18, '2', 2, 322, ["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (80, 140, 200, 260, 320)]),
  ('m23', 7, 0x23, '2', 21, 542, ["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (180, 240, 300, 360, 420, 480, 540)]),
  ("m24", 7, 0x24, "2", 28, 422, ["phase: 0", "phase: 1, ended: 1"] + ["phase: 2, win: 1, frame: %d.0" % F for F in (60, 120, 180, 240, 300, 360, 420)]),
  ('s22', 7, 0x22, '2', 39, 142, ["phase: 1, win: 1, frame: 140.0"]),
  ('s25', 7, 0x25, '2', 24, 92, ["phase: 0", "phase: 1, win: 1, frame: 90.0"], ', noTurn: 1'),
  ('s26', 7, 0x26, '2', 25, 148, ["phase: 1, win: 1, frame: 146.0"]),
  ('s2b', 7, 0x2b, '2', 40, 168, ["phase: 1, win: 1, frame: 166.0"]),
  ('s2c', 7, 0x2c, '2', 43, 168, ["phase: 1, win: 1, frame: 166.0"]),
  ('s2d', 7, 0x2d, '2', 16, 56, ["phase: 1, win: 1, frame: 54.0"]),
  ('s2e', 7, 0x2e, '2', 44, 32, ["phase: 0", "phase: 2, win: 1, frame: 30.0"]),
  ('s3b', 7, 0x3b, '2', 5, 82, ["phase: 1, win: 1, frame: 80.0"]),
  ('s3c', 7, 0x3c, '2', 6, 82, ["phase: 1, win: 1, frame: 80.0"]),
  ('s3d', 7, 0x3d, '2', 53, 56, ["phase: 1, win: 1, frame: 54.0"]),
]
cases = ["    // each row: the action main 0xd8a634 at the phase its spawn is in (phase 0 first where the fire reads its aim word)"]
for r in rows:
    nm, st, n, l, c, ln, steps = r[:7]; xx = r[7] if len(r) > 7 else ''
    cases.append("    C('%s', %d, 1, null, 0, %s, { st: %d, %s, frames: 600%s })," % (nm, n, M(l, c, V(st, n), ln), st, ST(*steps), xx))
cases.append("    C('m0e_r', 0x0e, 1, null, 0, %s, { %s, frames: 600, target: [-700.0, 120.0, 1900.0], owner: [0, 0x9abc, 0] })," % (M('2', 2, '7:0x0e', 322), ST(*(["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (80, 140, 200, 260, 320)]))))
cases.append("    C('s3b_r', 0x3b, 1, null, 0, %s, { %s, frames: 600, owner: [0, 0x4567, 0], size: [1.2, 1.1] })," % (M('2', 5, '7:0x3b', 82), ST("phase: 1, win: 1, frame: 80.0")))
spec = {
  'name': 'crimson-fatalis', 'title': 'Crimson Fatalis', 'mon': mon, 'main': 'd8a634', 'variant': 1,
  'header': [
    "Crimson Fatalis's (em013_01) shells in render/shells.js against the ROM -- uEm013_00 variant 1: sp_00 (0x86, base00 through 0xd8c254 / 0xd8c3bc, its",
    "landing 0xd8c52c making sp_01; the meteors 0xd80e74), sp_01 (0x87, base01 through 0xd8c7f4) and sp_51 (0x89,",
    "base51 through 0xd8cdf0: the sweep). dev/elder-dragon-shells-spec.md 3b.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xd8a634 at each spawn's phase",
    "     (phase 0 first where the fire reads the aim word it stored), every shell flown from the setup the ROM built, children included.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-crimson-fatalis-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-crimson-fatalis-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x86): [mon, '00'], hex(0x87): [mon, '01'], hex(0x89): [mon, '51']},
  'owner_bytes': {},
  'bases': {hex(0x86): 'base00', hex(0x87): 'base01', hex(0x89): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, 0.25, 0.05, [30.0, 610.0, 420.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[2]') === '[\"7:0x0e\",\"7:0x0f\",\"7:0x10\",\"7:0x11\",\"7:0x16\",\"7:0x17\",\"7:0x18\"]', 'L2 M2: his seven meteor actions', pv('%s', '2', 'Motion[2]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[7]') === '[]', 'L2 M7: no (7, 2) -- the Fatalis one, not his', pv('%s', '2', 'Motion[7]'));" % (mon, mon)]),
  'controls': "\n".join([
    "    ['m0e_r', { owner: [0, 0x9abd, 0] }, 'the facing one word off (the meteors)'],",
    "    ['m0e_r', { target: [-700.0, 120.0, 1930.0] }, 'the target 30 further (the fifth meteor)'],",
    "    ['m0e', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the ground mark, the landings)'],",
    "    ['s3b_r', { size: [1.2, 1.12] }, 'the size off (the side burst)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh, key] of [['2', 'Motion[2]', 'shell00', 100], ['2', 'Motion[40]', 'shell51', 30]]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    check(w.some(x => x.shell === sh && x.key === key && x.req), 'L' + list + ' ' + clip + ': ' + sh + ', u ' + key + ' started', w);",
    "  }",
    "  const S = body().schedule;",
    "  for (const [pel, key] of [['em013_01u', 0], ['em013_01u', 2], ['em013_01u', 11], ['em013_01u', 1], ['em013_01u', 30], ['em013_01u', 31], ['em013_01u', 100], ['em013_01u', 101], ['em013_01u', 103], ['em013_01u', 130]]){   // (em013_00c 30, the dust: not exported -- its draw refuses at 0xa5846c, L_a583c4)",
    "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === pel && x.def.record.key === key);",
    "    if (!e){ check(false, pel + ' ' + key + ' exported as a shell record'); continue; }",
    "    let started = 0, maxRun = 0;",
    "    for (let rep = 0; rep < 2; rep++){",
    "      try { S.start(e); started++; } catch (err){ check(false, pel + ' ' + key + ' start', String(err)); }",
    "      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }",
    "    }",
    "    check(!body().failed && started === 2, 'record ' + pel + ' ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = SPD + r'\spec_crimson.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-crimson-fatalis-check.mjs'
s = open(out, encoding='utf8').read()
a = "    if (c.precall) o.precall = c.precall;"
assert s.count(a) == 1
s = s.replace(a, a + "\n    if (c.stepsRaw) o.steps = c.stepsRaw;")
open(out, 'w', encoding='utf8').write(s)
print('patched')
