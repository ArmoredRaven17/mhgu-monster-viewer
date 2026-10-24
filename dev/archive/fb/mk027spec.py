# mk027spec.py: spec_teostra.json for mk_plaincheck.py (Teostra, em027_00), then its patches
import json, sys, subprocess
mon = 'em027_00'
SPD = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
MAIN = 'e1a408'
V = lambda st, n: '%d:0x%02x' % (st, n)
# hit slot 0's life by 'id:mode' (delay + duration + 1: the hitdata records, mk027's shl): sp_01 (185) 0 / 3 (0, 10), 1 (16, 10), 2 (10, 10),
# 4 (14, 10); sp_20 (187) every record (0, 10)
UNTIL = {'185:0': 11, '185:1': 27, '185:2': 21, '185:3': 11, '185:4': 25}
UNTIL.update({'187:%d' % m: [11, 10, 11] for m in range(9)})
X = ", hitLife: 1, slot0Until: %s, frames: 700" % json.dumps(UNTIL)
def Q(l, c, v, n): return "{ list: '%s', clip: 'Motion[%d]', variant: %s, len: %d }" % (l, c, ("'%s'" % v) if v else 'null', n)
def ST(fn, *s): return "steps: [" + ', '.join("{ fn: '%s', %s }" % (fn, x) for x in s) + "]"
cases = ["    // each row: the action main 0x%s at the phase its spawn is in (owner +0x73e0 the action); vt+0x208 0xe10f7c with the motion id" % MAIN]
def C(nm, st, n, seq, steps, extra=''):
    cases.append("    C('%s', %d, 1, null, 0, [%s], { st: %d, %s%s%s })," % (nm, n, ', '.join(seq), st, steps, X, extra))
C('a06', 4, 0x06, [Q('1', 7, V(4, 6), 120)], ST(MAIN, "phase: 1, win: 1, frame: 70.0"))
C('n1f', 2, 0x1f, [Q('4', 16, V(2, 0x1f), 120)], ST(MAIN, "phase: 1, win: 1, frame: 56.0"))
C('n20', 2, 0x20, [Q('4', 16, V(2, 0x20), 120), Q('4', 10, V(7, 0x2d), 200)], ST(MAIN, "phase: 1, win: 1, frame: 56.0"),
  ", unstub: ['0x6fe88'], actionAt: { at: 120, before: [2, 0x20], action: [7, 0x2d] }, slot0Until: %s" %
  json.dumps(dict(UNTIL, **{'185:0': [10, 11]})))   # (the first blast: the lone leader, the last unit of line 18, makes it -- counted before its first move)
for nm, n in (('b03', 0x03), ('b21', 0x21), ('b26', 0x26)):
    C(nm, 7, n, [Q('4', 6, V(7, n), 276)], ST(MAIN, "phase: 1, win: 1, frame: 104.0"))
C('b25', 7, 0x25, [Q('4', 6, V(7, 0x25), 276)], ST(MAIN, *["phase: 1, win: 1, frame: %.1f" % x for x in (100, 115, 130, 180)]))
for n in (0x05, 0x07, 0x1a, 0x23, 0x24):
    C('p%02x' % n, 7, n, [Q('4', 10, V(7, n), 120)], ST(MAIN, "phase: 2, win: 1, frame: 50.0"))
for n in (0x0a, 0x15, 0x16):
    C('f%02x' % n, 7, n, [Q('2', 8, V(7, n), 120)], ST(MAIN, "phase: 2, win: 1, frame: 24.0"))
C('d2a', 7, 0x2a, [Q('4', 4, V(7, 0x2a), 100), Q('4', 10, V(7, 0x2d), 200)], ST(MAIN, "phase: 1, win: 1, frame: 36.0", "phase: 1, win: 1, frame: 40.0"),
  ", unstub: ['0x6fe88'], actionAt: { at: 100, before: [7, 0x2a], action: [7, 0x2d] }")
for nm, n, c, rank in (('s2b', 0x2b, 10, 5), ('s2c', 0x2c, 11, 5), ('s2b_low', 0x2b, 10, 3), ('d2a_low', 0x2a, 4, 3)):
    ln = 100 if n == 0x2a else 130
    C(nm, 7, n, [Q('4' if n == 0x2a else '2', c, V(7, n), ln), Q('4', 10, V(7, 0x2d if n == 0x2a else 0x2e), 200)],
      ST(MAIN, *(["phase: 1, win: 1, frame: 36.0", "phase: 1, win: 1, frame: 40.0"] if n == 0x2a else ["phase: 1, win: 1, frame: 44.0", "phase: 1, win: 1, frame: 48.0"])),
      ", unstub: ['0x6fe88'], rank: %d, actionAt: { at: %d, before: [7, %d], action: [7, %d] }" % (rank, ln, n, 0x2d if n == 0x2a else 0x2e))
# vt+0x208: L0 M5 (1, 7) / (1, 0x1b) with the aura; L2 M2
C('r07', 1, 0x07, [Q('0', 5, V(1, 7), 240)], ST('e10f7c', "phase: 0, win: 1, frame: 186.0"), ", unstub: ['0x6fe88'], owner_bytes: { '0x73e0': [1, 7], '0x4b4': [5, 0] }")
C('r1b_aura', 1, 0x1b, [Q('0', 5, V(1, 0x1b), 240)], ST('e10f7c', "phase: 0, win: 1, frame: 186.0"), ", unstub: ['0x6fe88'], owner_bytes: { '0x73e0': [1, 0x1b], '0x4b4': [5, 0] }, block: { '0x1bb': [1] }, aura: 1")
C('r1b', 1, 0x1b, [Q('0', 5, V(1, 0x1b), 240)], ST('e10f7c', "phase: 0, win: 1, frame: 186.0"), ", unstub: ['0x6fe88'], owner_bytes: { '0x73e0': [1, 0x1b], '0x4b4': [5, 0] }, none: 1")
C('g02', 0, 0, [Q('2', 2, None, 58)], ST('e10f7c', "phase: 0, win: 1, frame: 52.0"), ", owner_bytes: { '0x73e0': [0, 0], '0x4b4': [2, 2] }, ground: -20.0, floorY: -20.0")
spec = {
  'name': 'teostra', 'title': 'Teostra', 'mon': mon, 'main': MAIN, 'variant': 0,
  'header': [
    "Teostra's (em027_00) shells in render/shells.js against the ROM -- uEm027_00: sp_01 (0xb9, base01 through 0xe1ad60, its init 0xe1ac9c's",
    "scatter), sp_04 (0xba, base04 through 0xe1af84 = Savage's reader, its +0x158 0xe1b128), sp_20 (0xbb, BASE20: the nova's ring, its",
    "+0x158 0xe1b418 the next pillar) and sp_21 (0xbc, BASE21: the powder and the flame line, its vt+0x154 0xe1b794 and +0x158 0xe1b844, the",
    "blasts). dev/elder-dragon-shells-spec.md 6.",
    "",
    "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn: the action main 0xe1a408 at each spawn's phase",
    "     (vt+0x208 0xe10f7c with the motion id at e+0x4b4), every shell flown from its setup, children included; the leaders' trigger the",
    "     owner's next action written before each move from the step the play reaches it (actionAt).",
    "  2. The contract: the pick lists.",
    "  3. CONTROLS: a wrong facing, a moved target, a moved floor, a missing trigger must FAIL the comparison.",
    "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their shells; the records run out.",
    "",
    "  node dev/shells-teostra-check.mjs                                   (1..3: the ROM comparison, no viewer)",
    "  node <scratchpad>/run-check.mjs dev/shells-teostra-check.mjs         (4: the viewer)",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xb9): [mon, '01'], hex(0xba): [mon, '04'], hex(0xbb): [mon, '20'], hex(0xbc): [mon, '21']},
  'owner_bytes': {},
  'bases': {hex(0xb9): 'base01', hex(0xba): 'base04', hex(0xbb): 'base20', hex(0xbc): 'base21'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, 0.25, 0.05, [30.0, 610.0, 420.0]), 4: jointOf(-0.3, 0.1, 0.0, [10.0, 480.0, 300.0]), 9: jointOf(0.0, 0.3, 0.1, [-80.0, 530.0, 450.0]), 13: jointOf(0.15, -0.2, 0.05, [60.0, 560.0, 470.0]) };",
  'cases': '\n'.join(cases),
  'contract': "\n".join([
    "  ok(pv('%s', '4', 'Motion[10]') === '[\"7:0x05\",\"7:0x07\",\"7:0x1a\",\"7:0x23\",\"7:0x24\",\"7:0x2d\",\"7:0x2e\"]', 'L4 M10: the nova and the trigger', pv('%s', '4', 'Motion[10]'));" % (mon, mon),
    "  ok(pv('%s', '4', 'Motion[6]') === '[\"7:0x03\",\"7:0x21\",\"7:0x26\",\"7:0x25\"]', 'L4 M6: the breaths', pv('%s', '4', 'Motion[6]'));" % (mon, mon),
    "  ok(pv('%s', '0', 'Motion[5]') === '[\"1:0x07\",\"1:0x1b\"]', 'L0 M5: (1, 7) and the rage roar', pv('%s', '0', 'Motion[5]'));" % (mon, mon)]),
  'controls': "\n".join([
    "    ['b03', { joints: Object.assign({}, JOINTS, { 3: jointOf(0.1, 0.25, 0.05, [30.0, 640.0, 420.0]) }) }, 'joint 3 30 higher (the breath)'],",
    "    ['p05', { owner: [0, 0x3001, 0] }, 'the facing one word off (the ring)'],",
    "    ['p05', { ownerPos: [120.5, 15.25, -50.75] }, 'the owner 30 further (the ring)'],",
    "    ['b25', { joints: Object.assign({}, JOINTS, { 4: jointOf(-0.3, 0.1, 0.0, [10.0, 480.0, 330.0]) }) }, 'joint 4 30 further (the flame line)'],",
    "    ['s2b', { seq: [{ list: '2', clip: 'Motion[10]', variant: '7:0x2b', len: 130 }, { list: '4', clip: 'Motion[10]', variant: '7:0x05', len: 200 }] }, 'no trigger (the next play (7, 5))'],",
    "    ['g02', { ground: -1100.0, floorY: -1100.0 }, 'the ground 1080 lower (L2 M2: none)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['4', 'Motion[6]', 'shell04'], ['4', 'Motion[10]', 'shell20'], ['2', 'Motion[10]', 'shell21'], ['2', 'Motion[2]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh && y.req));",
    "    check(w.some(x => x.shell === sh && x.req), 'L' + list + ' ' + clip + ': ' + sh + ' started', w);",
    "  }",
    "  const S = body().schedule;",
    "  for (const [pel, key] of [['em027_00u', 152], ['em027_00u', 40], ['em027_00c', 31], ['em027_00c', 30], ['em027_00u', 90], ['em027_00u', 100], ['em027_00u', 111], ['em027_00u', 150], ['em027_00u', 151], ['em027_00u', 50], ['em027_00u', 110], ['em027_00u', 60], ['em027_00u', 70], ['em027_00u', 30], ['em027_00c', 34]]){",
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
P = SPD + r'\spec_teostra.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, SPD + r'\mk_plaincheck.py', P])
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-teostra-check.mjs'
s = open(out, encoding='utf8').read()
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;\n    if (c.stepsRaw) o.steps = c.stepsRaw;\n    if (c.block) o.block = c.block;\n    if (c.slot0Until) o.slot0Until = c.slot0Until;\n    if (c.actionAt) o.actionAt = c.actionAt;\n    if (c.unstub) o.unstub = c.unstub;\n    o.frameStep = 1.0;"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, loopStart: q.loopStart, fireAura027: x.aura ? 1 : 0 });"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(out, 'w', encoding='utf8').write(s)
print('patched')
