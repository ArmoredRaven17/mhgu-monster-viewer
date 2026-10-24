# mk013spec.py: spec_old.json for mk_plaincheck.py (Fatalis, em013_00 variant 0), then its patches
import json, sys, subprocess
mon = 'em013_02'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
M = lambda l, c, v, n: "[{ list: '%s', clip: 'Motion[%d]', variant: '%s', len: %d }]" % (l, c, v, n)
ST = lambda *s: "steps: [" + ', '.join("{ fn: 'd8a634', %s }" % x for x in s) + "]"
V = lambda st, n: '%d:0x%02x' % (st, n)
rows = [  # name, st, n, list, clip, len, steps
  ('s300', 3, 0x00, '1', 1, 152, ["phase: 1, ended: 1"]),
  ('s401', 4, 0x01, '1', 5, 12, ["phase: 1, win: 1, frame: 10.0"]),
  ('s02', 7, 0x02, '2', 7, 104, ["phase: 0", "phase: 1, win: 1, frame: 102.0"]),
  ('s03', 7, 0x03, '2', 8, 100, ["phase: 0", "phase: 1, win: 1, frame: 98.0"]),
  ('s05', 7, 0x05, '2', 10, 32, ["phase: 0", "phase: 2, win: 1, frame: 30.0"]),
  ('s07e', 7, 0x07, '2', 11, 72, ["phase: 1, ended: 1"]),
  ('s07', 7, 0x07, '2', 12, 22, ["phase: 2, win: 1, frame: 20.0"]),
  ('s0d', 7, 0x0d, '2', 15, 52, ["phase: 4, win: 1, frame: 50.0"]),
  ('m0e', 7, 0x0e, '2', 2, 322, ["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (80, 140, 200, 260, 320)]),
  ('m12', 7, 0x12, '2', 2, 322, ["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (80, 140, 200, 260, 320)]),
  ('m23', 7, 0x23, '2', 21, 542, ["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (180, 240, 300, 360, 420, 480, 540)]),
  ('s25', 7, 0x25, '2', 24, 92, ["phase: 0", "phase: 1, win: 1, frame: 90.0"], ', noTurn: 1'),
  ('s26b', 7, 0x02, '2', 7, 104, ["phase: 0", "phase: 1, win: 1, frame: 102.0"], ', target: [400.0, 0.0, 900.0]'),
  ('s2d', 7, 0x2d, '2', 16, 56, ["phase: 1, win: 1, frame: 54.0"]),
  ('s2e', 7, 0x2e, '2', 44, 32, ["phase: 0", "phase: 2, win: 1, frame: 30.0"]),
  ('s3ae', 7, 0x3a, '2', 11, 72, ["phase: 1, ended: 1"]),
  ('s3a', 7, 0x3a, '2', 12, 22, ["phase: 2, win: 1, frame: 20.0"]),
  ('s46', 7, 0x46, '4', 7, 227, ["phase: 1, win: 1, frame: 225.0"], ', noTurn: 1'),
  ('s50', 7, 0x50, '4', 1, 72, ["phase: 1, ended: 1"]),
  ('s53', 7, 0x53, '4', 11, 168, ["phase: 1, win: 1, frame: 166.0"], ', noTurn: 1'),
  ('s54', 7, 0x54, '4', 12, 168, ["phase: 1, win: 1, frame: 166.0"], ', noTurn: 1'),
  ('s55', 7, 0x55, '2', 43, 168, ["phase: 1, win: 1, frame: 166.0"], ', noTurn: 1'),
  ('s56', 7, 0x56, '2', 40, 168, ["phase: 1, win: 1, frame: 166.0"], ', noTurn: 1'),
]
cases = ["    // each row: the action main 0xd8a634 at the phase its spawn is in (phase 0 first where the fire reads its aim word)"]
for r in rows:
    nm, st, n, l, c, ln, steps = r[:7]; xx = r[7] if len(r) > 7 else ''
    cases.append("    C('%s', %d, 1, null, 0, %s, { st: %d, %s, frames: 600%s })," % (nm, n, M(l, c, V(st, n), ln), st, ST(*steps), xx))
cases.append("    C('m0e_r', 0x0e, 1, null, 0, %s, { %s, frames: 600, target: [-700.0, 120.0, 1900.0], owner: [0, 0x9abc, 0] })," % (M('2', 2, '7:0x0e', 322), ST(*(["phase: 0"] + ["phase: 1, win: 1, frame: %d.0" % F for F in (80, 140, 200, 260, 320)]))))
cases.append("    C('s56_r', 0x56, 1, null, 0, %s, { %s, frames: 600, target: [-2500.0, 300.0, 1800.0], owner: [0, 0x7654, 0], noTurn: 1 })," % (M('2', 40, '7:0x56', 168), ST("phase: 1, win: 1, frame: 166.0")))
spec = {
  'name': 'old-fatalis', 'title': 'Old Fatalis', 'mon': mon, 'main': 'd8a634', 'variant': 2,
  'header': [
    "Old Fatalis's (em013_02) shells in render/shells.js against the ROM -- uEm013_00 variant 2: sp_00 (0x8a, base00 through 0xd8cf8c, its",
    "landing 0xd8d08c making sp_01 / sp_11), sp_01 (0x8b, base01 through 0xd8d41c: strikes, dust, the meteors' lightning), sp_11 (0x8d) and sp_51 (0x8e,",
    "base51 through 0xd8dfa8: the sweep about its point). dev/elder-dragon-shells-spec.md 3c.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xd8a634 at each spawn's phase",
    "     (phase 0 first where the fire reads the aim word it stored), every shell flown from the setup the ROM built, children included.",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-old-fatalis-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-old-fatalis-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x8a): [mon, '00'], hex(0x8b): [mon, '01'], hex(0x8d): [mon, '11'], hex(0x8e): [mon, '51']},
  'owner_bytes': {},
  'bases': {hex(0x8a): 'base00', hex(0x8b): 'base01', hex(0x8d): 'base01', hex(0x8e): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, 0.25, 0.05, [30.0, 610.0, 420.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[2]') === '[\"7:0x0e\",\"7:0x0f\",\"7:0x10\",\"7:0x11\",\"7:0x12\",\"7:0x16\",\"7:0x17\",\"7:0x18\"]', 'L2 M2: his eight lightning actions', pv('%s', '2', 'Motion[2]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[40]') === '[\"7:0x56\"]' && pv('%s', '4', 'Motion[11]') === '[\"7:0x53\"]', 'L2 M40 / L4 M11: his sweeps');" % (mon, mon)]),
  'controls': "\n".join([
    "    ['m0e_r', { owner: [0, 0x9abd, 0] }, 'the facing one word off (the lightning)'],",
    "    ['s56_r', { target: [-2500.0, 300.0, 1830.0] }, 'the target 30 further (the sweep reach)'],",
    "    ['s300', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the dust)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh, key] of [['2', 'Motion[7]', 'shell00', 0], ['2', 'Motion[40]', 'shell51', 30]]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    check(w.some(x => x.shell === sh && x.key === key && x.req), 'L' + list + ' ' + clip + ': ' + sh + ', u ' + key + ' started', w);",
    "  }",
    "  const S = body().schedule;",
    "  for (const [pel, key] of [['em013_02u', 0], ['em013_02u', 1], ['em013_02u', 2], ['em013_02u', 11], ['em013_02u', 12], ['em013_02u', 13], ['em013_02u', 103], ['em013_02u', 111], ['em013_02u', 30], ['em013_02u', 31], ['em013_02u', 32], ['em013_02u', 33]]){   // (em013_00c 30, the dust: not exported -- its draw refuses at 0xa5846c, L_a583c4)",
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
P = SPD + r'\spec_old.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-old-fatalis-check.mjs'
s = open(out, encoding='utf8').read()
a = "    if (c.precall) o.precall = c.precall;"
assert s.count(a) == 1
s = s.replace(a, a + "\n    if (c.stepsRaw) o.steps = c.stepsRaw;")
open(out, 'w', encoding='utf8').write(s)
print('patched')
