# mk025spec.py: spec_chameleos.json for mk_plaincheck.py (Chameleos, em025_00), then its patches
import json, sys, subprocess, struct
mon = 'em025_00'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
MAIN = 'e0dd58'
def M(l, c, v, n): return "[{ list: '%s', clip: 'Motion[%d]', variant: '%s', len: %d }]" % (l, c, v, n)
def ST(fn, *s): return "steps: [" + ', '.join("{ fn: '%s', %s }" % (fn, x) for x in s) + "]"
V = lambda st, n: '%d:0x%02x' % (st, n)
TGB = list(struct.pack('<3f', 900.0, 40.0, 2400.0))
X = ", hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, creatorCopy: 1, frames: 1300"
cases = ["    // each row: the action main 0x%s at the phase its spawn is in; the footfalls: vt+0x208 0xe00344 with the motion id at e+0x4b4" % MAIN]
for nm, n, l, c, ln, steps in [
    ('g08', 0x08, '2', 15, 40, ["phase: 2, win: 1, frame: 2.0"]),
    ('g24', 0x24, '2', 15, 40, ["phase: 2, win: 1, frame: 2.0"]),
    ('g1f', 0x1f, '2', 45, 120, ["phase: 1, win: 1, frame: 70.0"]),
    ('t0d', 0x0d, '2', 27, 100, ["phase: 1, win: 1, frame: 64.0"]),
    ('t17', 0x17, '2', 27, 100, ["phase: 1, win: 1, frame: 64.0"]),
    ('t29', 0x29, '2', 27, 100, ["phase: 2, win: 1, frame: 64.0"]),
    ('t1e', 0x1e, '2', 43, 100, ["phase: 1, win: 1, frame: 64.0"]),
]:
    cases.append("    C('%s', %d, 1, null, 0, %s, { st: 7, %s%s })," % (nm, n, M(l, c, V(7, n), ln), ST(MAIN, *steps), X))
for nm, own, tg in [('t18', None, None), ('t18_l', [0, 0xc800, 0], [-1500.0, 100.0, 900.0]), ('t18_r', [0, 0x2400, 0], [1400.0, -50.0, 2200.0])]:
    t = tg or [900.0, 40.0, 2400.0]
    blk = list(struct.pack('<3f', *t))
    extra = (", owner: %s" % json.dumps(own)) if own else ''
    extra += (", target: %s" % json.dumps(t)) if tg else ''
    cases.append("    C('%s', 0x18, 1, null, 0, %s, { st: 7, %s%s, block: { '0x30': %s }%s })," %
                 (nm, M('2', 36, '7:0x18', 90), ST(MAIN, "phase: 0", "phase: 1, win: 1, frame: 44.0"), X, json.dumps(blk), extra))
for nm, l, c, ln, F, mot in [('f_l1m7', '1', 7, 60, 22.0, 0x107), ('f_l1m9', '1', 9, 60, 36.0, 0x109), ('f_l2m8', '2', 8, 400, (64.0, 160.0, 256.0, 354.0), 0x208),
                             ('f_l1m2', '1', 2, 90, 64.0, 0x102)]:
    cases.append("    C('%s', 0, 1, null, 0, [{ list: '%s', clip: 'Motion[%d]', variant: null, len: %d }], { st: 7, %s, hitLife: 1, slot0Until: { '181:0': 110, '181:1': 110, '181:3': 110, '182:4': 42, '182:0': 25, '182:1': 25, '182:2': 25 }, frames: 200, owner_bytes: { '0x73e0': [0, 0], '0x4b4': [%d, %d] } })," %
                 (nm, l, c, ln, ST('e00344', *["phase: 0, win: 1, frame: %.1f" % x for x in (F if isinstance(F, tuple) else (F,))]), mot & 0xff, mot >> 8))
spec = {
  'name': 'chameleos', 'title': 'Chameleos', 'mon': mon, 'main': MAIN, 'variant': 0,
  'header': [
    "Chameleos's (em025_00) shells in render/shells.js against the ROM -- uEm025_00: sp_00 (0xb5, base00 through 0xe0eee0, its landing",
    "0xe0efdc: sp_01 4 and the cloud), sp_01 (0xb6, base01 through 0xe0f2dc: the footfalls), sp_13 (0xb7, base13 through 0xe0f510, its Y word",
    "0xe0f7f0, its landing 0xe0f6fc) and sp_39 (0xb8, base39: the poison cloud, the owner's ring 0xe0dad8). dev/elder-dragon-shells-spec.md 5.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xe0dd58 at each spawn's phase",
    "     (the footfalls: vt+0x208 0xe00344 with the motion id at e+0x4b4), every shell flown from its setup, children included (the",
    "     cloud's creator handed over: creatorCopy).",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-chameleos-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-chameleos-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xb5): [mon, '00'], hex(0xb6): [mon, '01'], hex(0xb7): [mon, '13'], hex(0xb8): [mon, '39']},
  'owner_bytes': {},
  'bases': {hex(0xb5): 'base00', hex(0xb6): 'base01', hex(0xb7): 'base13', hex(0xb8): 'base39'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, 0.25, 0.05, [30.0, 610.0, 420.0]), 142: jointOf(0.0, 0.3, 0.1, [-80.0, 30.0, 150.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '2', 'Motion[27]') === '[\"7:0x0d\",\"7:0x16\",\"7:0x17\",\"7:0x29\"]', 'L2 M27: the spits', pv('%s', '2', 'Motion[27]'));" % (mon, mon),
    "  ok(pv('%s', '2', 'Motion[15]') === '[\"7:0x08\",\"7:0x24\"]', 'L2 M15: the gob', pv('%s', '2', 'Motion[15]'));" % (mon, mon)]),
  'controls': "\n".join([
    "    ['t0d', { owner: [0, 0x3001, 0] }, 'the facing one word off'],",
    "    ['t0d', { target: [900.0, 40.0, 2430.0] }, 'the target 30 further'],",
    "    ['g1f', { floorY: 3.0, ground: 3.0 }, 'the floor 3 higher (the landing)'],",
    "    ['t18_l', { target: [-1500.0, 100.0, 930.0] }, 'the target 30 further (the (7, 0x18) aim)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[27]', 'shell13'], ['2', 'Motion[45]', 'shell00']]){",
    "    await pick(list, clip);",
    "    const w = await watch(500, x => x.some(y => y.shell === sh) && x.some(y => y.shell === 'shell39'));",
    "    check(w.some(x => x.shell === sh && x.req), 'L' + list + ' ' + clip + ': ' + sh + ' started', w);",
    "    // (L2 M45's gob starts 13 below the viewer's floor at f70 -- the head at the ground, its offset (0, -80, 140) -- and falls through it,",
    "    // as the ROM's query would for that geometry: no landing there; the spit's landing is the cloud's check)",
    "    if (sh === 'shell13') check(w.some(x => x.shell === 'shell39' && x.req), 'L' + list + ' ' + clip + ': its landing left a cloud (shell39)', w);",
    "  }",
    "  const S = body().schedule;",
    "  for (const [pel, key] of [['em025_00u', 0], ['em025_00u', 2], ['em025_00u', 1], ['em025_00u', 11], ['em025_00u', 3], ['em025_00c', 30], ['em025_00c', 31]]){",
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
P = SPD + r'\spec_chameleos.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-chameleos-check.mjs'
s = open(out, encoding='utf8').read()
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;\n    if (c.stepsRaw) o.steps = c.stepsRaw;\n    if (c.block) o.block = c.block;\n    if (c.creatorCopy) o.creatorCopy = 1;\n    if (c.slot0Until) o.slot0Until = c.slot0Until;\n    o.frameStep = 1.0;"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, loopStart: q.loopStart });"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(out, 'w', encoding='utf8').write(s)
print('patched')
