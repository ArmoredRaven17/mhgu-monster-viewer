# mk013spec.py: spec_fatalis.json for mk_plaincheck.py (Fatalis, em013_00 variant 0), then its patches
import json, sys, subprocess
mon = 'em013_00'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
M = lambda l, c, v, n: "[{ list: '%s', clip: 'Motion[%d]', variant: '%s', len: %d }]" % (l, c, v, n)
ST = lambda *s: "steps: [" + ', '.join("{ fn: 'd8a634', %s }" % x for x in s) + "]"
V = lambda st, n: '%d:0x%02x' % (st, n)
rows = [  # name, st, n, list, clip, len, steps
  ('s300', 3, 0x00, '1', 1, 152, ["phase: 1, ended: 1"]),
  ('s400', 4, 0x00, '1', 1, 152, ["phase: 1, ended: 1"]),
  ('s401', 4, 0x01, '1', 5, 12, ["phase: 1, win: 1, frame: 10.0"]),
  ('s02', 7, 0x02, '2', 7, 104, ["phase: 0", "phase: 1, win: 1, frame: 102.0"]),
  ('s03', 7, 0x03, '2', 8, 100, ["phase: 0", "phase: 1, win: 1, frame: 98.0"]),
  ('s05', 7, 0x05, '2', 10, 32, ["phase: 0", "phase: 2, win: 1, frame: 30.0"]),
  ('s07e', 7, 0x07, '2', 11, 72, ["phase: 1, ended: 1"]),
  ('s07', 7, 0x07, '2', 12, 22, ["phase: 2, win: 1, frame: 20.0"]),
  ('s08', 7, 0x08, '0', 31, 30, ["phase: 1, win: 1, frame: 28.0"]),
  ('s0d', 7, 0x0d, '2', 15, 52, ["phase: 4, win: 1, frame: 50.0"]),
  ('s22', 7, 0x22, '2', 39, 142, ["phase: 1, win: 1, frame: 140.0"]),
  ('s25', 7, 0x25, '2', 24, 92, ["phase: 0", "phase: 1, win: 1, frame: 90.0"], ', noTurn: 1'),
  ('s44', 7, 0x44, '2', 24, 92, ["phase: 0", "phase: 1, win: 1, frame: 90.0"], ', noTurn: 1'),
  ('s26', 7, 0x26, '2', 25, 148, ["phase: 1, win: 1, frame: 146.0"]),
  ('s2b', 7, 0x2b, '2', 40, 168, ["phase: 1, win: 1, frame: 166.0"]),
  ('s40', 7, 0x40, '2', 40, 168, ["phase: 1, win: 1, frame: 166.0"]),
  ('s2c', 7, 0x2c, '2', 43, 168, ["phase: 1, win: 1, frame: 166.0"]),
  ('s41', 7, 0x41, '2', 43, 168, ["phase: 1, win: 1, frame: 166.0"]),
  ('s2d', 7, 0x2d, '2', 16, 56, ["phase: 1, win: 1, frame: 54.0"]),
  ('s2e', 7, 0x2e, '2', 44, 32, ["phase: 0", "phase: 2, win: 1, frame: 30.0"]),
  ('s31', 7, 0x31, '2', 45, 32, ["phase: 0", "phase: 2, win: 1, frame: 30.0"]),
  ('s3ae', 7, 0x3a, '2', 11, 72, ["phase: 1, ended: 1"]),
  ('s3a', 7, 0x3a, '2', 12, 22, ["phase: 2, win: 1, frame: 20.0"]),
  ('s45', 7, 0x45, '2', 56, 4, ["phase: 0"]),
]
cases = ["    // each row: the action main 0xd8a634 at the phase its spawn is in (phase 0 first where the fire reads its aim word)"]
for r in rows:
    nm, st, n, l, c, ln, steps = r[:7]; xx = r[7] if len(r) > 7 else ''
    cases.append("    C('%s', %d, 1, null, 0, %s, { st: %d, %s, frames: 600%s })," % (nm, n, M(l, c, V(st, n), ln), st, ST(*steps), xx))
cases.append("    C('s02_far', 2, 1, null, 0, %s, { %s, frames: 600, target: [-900.0, 300.0, 3200.0], owner: [0, 0x2345, 0] })," % (M('2', 7, '7:0x02', 104), ST("phase: 0", "phase: 1, win: 1, frame: 102.0")))
cases.append("    C('s40_r', 0x40, 1, null, 0, %s, { %s, frames: 600, target: [1500.0, -200.0, 2000.0], owner: [0, 0xc000, 0], size: [1.2, 1.1] })," % (M('2', 40, '7:0x40', 168), ST("phase: 1, win: 1, frame: 166.0")))
cases.append("    C('s08_r', 8, 1, null, 0, %s, { %s, frames: 600, owner: [0, 0x8123, 0], size: [1.15, 1.05] })," % (M('0', 31, '7:0x08', 30), ST("phase: 1, win: 1, frame: 28.0")))
spec = {
  'name': 'fatalis', 'title': 'Fatalis', 'mon': mon, 'main': 'd8a634', 'variant': 0,
  'header': [
    "Fatalis's (em013_00) shells in render/shells.js against the ROM -- uEm013_00 variant 0: sp_00 (0x82, base00 through 0xd8b6f8, its",
    "landing 0xd8b7f8 making sp_01), sp_01 (0x83, base01 through 0xd8baa4: the landings' fire, the dust 0xd7ffcc makes) and sp_51 (0x85,",
    "base51 through 0xd8c0a0: the sweep). dev/elder-dragon-shells-spec.md 3.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xd8a634 at each spawn's phase",
    "     (phase 0 first where the fire reads the aim word it stored), every shell flown from the setup the ROM built, children included.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-fatalis-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-fatalis-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x82): [mon, '00'], hex(0x83): [mon, '01'], hex(0x85): [mon, '51']},
  'owner_bytes': {},
  'bases': {hex(0x82): 'base00', hex(0x83): 'base01', hex(0x85): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, 0.25, 0.05, [30.0, 610.0, 420.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[24]') === '[\"7:0x25\",\"7:0x44\"]', 'L2 M24: (7, 0x25) / (7, 0x44)', pv('%s', '2', 'Motion[24]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[40]') === '[\"7:0x2b\",\"7:0x40\"]' && pv('%s', '2', 'Motion[43]') === '[\"7:0x2c\",\"7:0x41\"]', 'L2 M40 / M43: the sweeps, plain and aimed');" % (mon, mon),
    "  ok(pv('%s', '1', 'Motion[1]') === '[\"3:0x00\",\"4:0x00\"]', 'L1 M1: the two landings (3, 0) / (4, 0)', pv('%s', '1', 'Motion[1]'));" % (mon, mon)]),
  'controls': "\n".join([
    "    ['s02_far', { owner: [0, 0x2346, 0] }, 'the facing one word off'],",
    "    ['s02_far', { target: [-900.0, 300.0, 3230.0] }, 'the target 30 further (the aim)'],",
    "    ['s40_r', { target: [1500.0, -200.0, 2030.0] }, 'the target 30 further (the sweep\\'s aim)'],",
    "    ['s26', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing)'],",
    "    ['s08_r', { size: [1.15, 1.06] }, 'the size off (the dust)'],",
    "    ['s25', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further (the turn yaw)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh, key] of [['2', 'Motion[7]', 'shell00', 0], ['2', 'Motion[40]', 'shell51', 30]]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    check(w.some(x => x.shell === sh && x.key === key && x.req), 'L' + list + ' ' + clip + ': ' + sh + ', u ' + key + ' started', w);",
    "  }",
    "  const S = body().schedule;",
    "  for (const [pel, key] of [['em013_00u', 0], ['em013_00u', 2], ['em013_00u', 11], ['em013_00u', 1], ['em013_00u', 30], ['em013_00u', 31]]){   // (em013_00c 30, the dust: not exported -- its draw refuses at 0xa5846c, L_a583c4)",
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
P = SPD + r'\spec_fatalis.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-fatalis-check.mjs'
s = open(out, encoding='utf8').read()
a = "    if (c.precall) o.precall = c.precall;"
assert s.count(a) == 1
s = s.replace(a, a + "\n    if (c.stepsRaw) o.steps = c.stepsRaw;")
open(out, 'w', encoding='utf8').write(s)
print('patched')
