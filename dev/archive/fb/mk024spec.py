# mk024spec.py: spec_kushala.json for mk_plaincheck.py (Kushala Daora, em024_00), then its patches
import json, sys, subprocess
mon = 'em024_00'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
MAIN = 'dfc6f0'
def M(l, c, v, n, loops=1, ls=None):
    one = "{ list: '%s', clip: 'Motion[%d]', variant: '%s', len: %d%s }" % (l, c, v, n, '' if ls is None else ', loopStart: %d' % ls)
    return '[' + ', '.join([one] * loops) + ']'
def ST(*s): return "steps: [" + ', '.join("{ fn: '%s', %s }" % (MAIN, x) for x in s) + "]"
V = lambda st, n: '%d:0x%02x' % (st, n)
B = lambda **kw: '{ ' + ', '.join("'0x%x': [%d]" % (int(k[1:], 16), v) for k, v in kw.items()) + ' }'
# name, n, clip motion, len, loops, loopStart, steps, aura, frames
rows = [
  ('s00', 0x00, 10, 131, 1, None, ["phase: 1, win: 1, frame: 54.0"], 2, 600),
  ('s01', 0x01, 11, 131, 1, None, ["phase: 1, win: 1, frame: 54.0"], 3, 600),
  ('s02', 0x02, 7, 163, 1, None, ["phase: 1, win: 1, frame: 78.0"], 0, 600),
  ('s03', 0x03, 7, 163, 1, None, ["phase: 1, win: 1, frame: 78.0"], 0, 600),
  ('s0f', 0x0f, 9, 72, 1, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 0, 600),
  ('s10', 0x10, 9, 72, 2, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [2] }", "phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 0, 600),
  ('s11', 0x11, 9, 72, 1, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 0, 600),
  ('s2c', 0x2c, 9, 72, 2, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [2] }", "phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 0, 600),
  ('s2d', 0x2d, 9, 72, 1, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 0, 1400),
  ('s2d3', 0x2d, 9, 72, 1, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 3, 1400),
  ('s2e', 0x2e, 9, 72, 2, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [2] }", "phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 0, 600),
  ('s2f', 0x2f, 9, 72, 1, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 0, 600),
  ('s36', 0x36, 9, 72, 1, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 0, 1100),
  ('s363', 0x36, 9, 72, 1, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 3, 1100),
  ('s42', 0x42, 9, 72, 1, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 0, 600),
  ('s28', 0x28, 21, 95, 1, None, ["phase: 1, win: 1, frame: 76.0"], 0, 600),
  ('s283', 0x28, 21, 95, 1, None, ["phase: 1, win: 1, frame: 76.0"], 2, 600),
  ('s29', 0x29, 21, 95, 1, None, ["phase: 1, win: 1, frame: 76.0"], 0, 600),
  ('s2a', 0x2a, 22, 125, 1, None, ["phase: 1, win: 1, frame: 102.0"], 0, 1400),
  ('s2a3', 0x2a, 22, 125, 1, None, ["phase: 1, win: 1, frame: 102.0"], 3, 1400),
  ('s37', 0x37, 22, 125, 1, None, ["phase: 1, win: 1, frame: 102.0"], 0, 1100),
  ('s38', 0x38, 22, 125, 1, None, ["phase: 1, win: 1, frame: 102.0"], 3, 1100),
  # (2026-10-19) the chain-reached: (2, 0xb) -> (7, 4) 0xdf8ac8 L2 M25 f122 sp_33 2; (3, 0x2b) -> (7, 0x41) 0xdf96a8(2, r2 2) L2 M9 sp_33 6
  ('s04', 0x04, 25, 199, 1, None, ["phase: 1, win: 1, frame: 122.0"], 0, 600),
  ('s41', 0x41, 9, 72, 1, 6, ["phase: 2, win: 1, frame: 20.0, block: { '0x1a3': [1] }"], 0, 600),
]
cases = ["    // each row: the action main 0x%s at the phase its spawn is in; the aura P+0x1bb as the Wind Aura control hands it (aura)" % MAIN]
for nm, n, c, ln, loops, ls, steps, aura, fr in rows:
    cases.append("    C('%s', %d, 1, null, 0, %s, { st: 7, %s, frames: %d, aura: %d, block: { '0x1bb': [%d] }, ctl: { '0x44': [2, 0, 0, 0] }, unstub: ['0x6fe88'] })," %
                 (nm, n, M('2', c, V(7, n), ln, loops, ls), ST(*steps), fr, aura, aura))
cases.append("    // THE SNOW MAPS (the Snow Variants list: input.snow with the play's rage): ctl+0x2c = ctl+0x2d = 1 -- every maker's snow mode")
for nm, n, c, ln, loops, ls, steps, aura, fr in [r for r in rows if r[0] in ('s02', 's03', 's10', 's2c', 's2d3', 's36', 's28', 's283', 's2a', 's2a3', 's37', 's42', 's04', 's41')]:
    cases.append("    C('%s_snow', %d, 1, null, 0, %s, { st: 7, %s, frames: %d, aura: %d, snow: 1, rage: 1, block: { '0x1bb': [%d] }, ctl: { '0x44': [2, 0, 0, 0], '0x2c': [1], '0x2d': [1] }, unstub: ['0x6fe88'] })," %
                 (nm, n, M('2', c, V(7, n), ln, loops, ls), ST(*steps), fr, aura, aura))
cases.append("    C('s00_off', 0, 1, null, 0, %s, { st: 7, %s, frames: 600, aura: 1, block: { '0x1bb': [1] }, none: 1 })," % (M('2', 10, '7:0x00', 131), ST("phase: 1, win: 1, frame: 54.0")))
cases.append("    C('s02_r', 2, 1, null, 0, %s, { st: 7, %s, frames: 600, aura: 0, owner: [0, 0x9abc, 0], target: [-700.0, 120.0, 1900.0] })," % (M('2', 7, '7:0x02', 163), ST("phase: 1, win: 1, frame: 78.0")))
cases.append("    C('s03_r', 3, 1, null, 0, %s, { st: 7, %s, frames: 600, aura: 0, owner: [0, 0x4321, 0], target: [-1500.0, 300.0, 1200.0] })," % (M('2', 7, '7:0x03', 163), ST("phase: 1, win: 1, frame: 78.0")))
cases.append("    C('s2a_r', 0x2a, 1, null, 0, %s, { st: 7, %s, frames: 1400, aura: 0, owner: [0, 0x7654, 0], block: { '0x1bb': [0] }, ctl: { '0x44': [2, 0, 0, 0] }, unstub: ['0x6fe88'] })," % (M('2', 22, '7:0x2a', 125), ST("phase: 1, win: 1, frame: 102.0")))
spec = {
  'name': 'kushala', 'title': 'Kushala Daora', 'mon': mon, 'main': MAIN, 'variant': 0,
  'header': [
    "Kushala Daora's (em024_00) shells in render/shells.js against the ROM -- uEm024_00: sp_00 (0xaf, base00 through 0xdfd5ec, its landing",
    "0xdfd748 making the tornadoes), sp_01 (0xb0, base01 through 0xdfdb74), sp_33 (0xb2, base33: the ground-riding wind), sp_34 (0xb3,",
    "base34: the tornadoes, in the owner's ring 0xdfd3a0) and sp_38 (0xb4, base38: the wandering tornado). dev/elder-dragon-shells-spec.md 4.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xdfc6f0 at each spawn's phase,",
    "     the aura P+0x1bb and the shot counter P+0x1a3 written as the Wind Aura and the pass give them, every shell flown from the setup",
    "     the ROM built, children included (the tornadoes' current-action test 0x6fe88 run natively on the case's action).",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor, a wrong aura must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-kushala-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-kushala-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xaf): [mon, '00'], hex(0xb0): [mon, '01'], hex(0xb2): [mon, '33'], hex(0xb3): [mon, '34'], hex(0xb4): [mon, '38']},
  'owner_bytes': {},
  'bases': {hex(0xaf): 'base00', hex(0xb0): 'base01', hex(0xb2): 'base33', hex(0xb3): 'base34', hex(0xb4): 'base38'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, 0.25, 0.05, [30.0, 610.0, 420.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[25]') === '[\"7:0x04\"]', 'L2 M25: (7, 4)', pv('%s', '2', 'Motion[25]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[9]') === '[\"7:0x0f\",\"7:0x10\",\"7:0x11\",\"7:0x2c\",\"7:0x2d\",\"7:0x2e\",\"7:0x2f\",\"7:0x36\",\"7:0x42\",\"7:0x41\"]', 'L2 M9: the ten shot actions (0x41 the airborne twin)', pv('%s', '2', 'Motion[9]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[22]') === '[\"7:0x2a\",\"7:0x37\",\"7:0x38\"]' && pv('%s', '2', 'Motion[7]') === '[\"7:0x02\",\"7:0x03\"]', 'L2 M22 / M7');" % (mon, mon)]),
  'controls': "\n".join([
    "    ['s02_r', { owner: [0, 0x9abd, 0] }, 'the facing one word off'],",
    "    ['s03_r', { target: [-1500.0, 300.0, 1230.0] }, 'the target 30 further (the aimed pitch)'],",
    "    ['s2a_r', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the tornado)'],",
    "    ['s2d3', { aura: 2 }, 'the aura one level lower (the mode)'],",
    "    ['s28', { aura: 2 }, 'the aura at 2 (the mode)'],",
    "    ['s2a_snow', { snow: 0 }, 'the snow map off (the mode)'],",
    "    ['s10_snow', { rage: 0 }, 'calm on the snow map (the mode)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[22]', 'shell00'], ['2', 'Motion[7]', 'shell33']]){",
    "    await pick(list, clip);",
    "    const w = await watch(500, x => x.some(y => y.shell === sh) && (sh !== 'shell00' || x.some(y => y.shell === 'shell34' || y.shell === 'shell38')));",
    "    check(w.some(x => x.shell === sh && x.req), 'L' + list + ' ' + clip + ': ' + sh + ' started', w);",
    "    if (sh === 'shell00') check(w.some(x => (x.shell === 'shell34' || x.shell === 'shell38') && x.req), 'L2 M22: its landing made a tornado', w);",
    "  }",
    "  // THE SNOW VARIANTS LIST (Raven, 2026-10-18): the same clips with the snow map on -- enraged, L2 M22's wind ball takes its snow mode",
    "  const rb = document.getElementById('monRage'); rb.checked = true; rb.onchange({ target: rb });",
    "  const snowList = [...listSel.options].find(o => o.value === 'snow');",
    "  check(!!snowList && snowList.textContent.includes('Snow Variants'), 'the Snow Variants list is there', snowList ? snowList.textContent : null);",
    "  if (snowList){",
    "    await pick('snow', 'L2 Motion[22]');",
    "    const w = await watch(500, x => x.some(y => y.shell === 'shell00'));",
    "    check(w.some(x => x.shell === 'shell00' && x.mode >= 22 && x.mode <= 25 && x.req), 'Snow Variants L2 Motion[22], enraged: the snow wind ball (sp_00 22..25)', w);",
    "    await pick('snow', 'L2 Motion[8]');",
    "    const bw = await watch(200, x => x.some(y => y.shell === 'shell02' || /02/.test(String(y.shell))));",
    "    check(bw.some(x => x.key === 70 && x.req), 'Snow Variants L2 Motion[8], enraged: the mode-1 beam (u 70)', bw);",
    "    await pick('2', 'Motion[22]');",
    "    const r = await watch(500, x => x.some(y => y.shell === 'shell00'));",
    "    check(r.some(x => x.shell === 'shell00' && x.mode >= 9 && x.mode <= 12), 'the raw L2 Motion[22], enraged: the plain wind ball (sp_00 9..12)', r);",
    "  }",
    "  rb.checked = false; rb.onchange({ target: rb });",
    "  const S = body().schedule;",
    "  for (const [pel, key] of [['em024_00c', 31], ['em024_00u', 61], ['em024_00u', 62], ['em024_00u', 80], ['em024_00u', 150], ['em024_00u', 160], ['em024_00u', 162], ['em024_00u', 120], ['em024_00u', 130], ['em024_00u', 71], ['em024_00u', 72], ['em024_00u', 121], ['em024_00u', 131], ['em024_00u', 151], ['em024_00u', 161]]){",
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
P = SPD + r'\spec_kushala.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-kushala-check.mjs'
s = open(out, encoding='utf8').read()
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;\n    if (c.stepsRaw) o.steps = c.stepsRaw;\n    if (c.block) o.block = Object.assign({}, c.block, { '0x1bb': [c.aura | 0] });\n    if (c.ctl) o.ctl = c.ctl;\n    if (c.unstub) o.unstub = c.unstub;\n    o.frameStep = 1.0;"),
  ("ground: x.ground, size: x.size, baseScale: x.base, hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "ground: x.ground, size: x.size, baseScale: x.base, hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk,\n        windAura024: x.aura, loopStart: q.loopStart, snow: !!x.snow, rage: !!x.rage });"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(out, 'w', encoding='utf8').write(s)
print('patched')
