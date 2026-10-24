# mk004.py (2026-10-19): dev/shells-basarios-check.mjs for mk_plaincheck.py -- every Basarios (em004_00) shell00 row against the ROM:
# the action main 0xd2dfb0 (uEm004_00, em 4) run natively at each spawn's phase / frame; the owner's +0xcac4 = 0x6a (shell00), +0xcac8 =
# 0x6b (shell01, the landing's child u 161) -- the loader 0xd2e538 is not run by the harness
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em004_00'
OB = "owner_bytes: Object.assign({ '0x73e0': [7, %s] }, { '0xcac4': [0x6a, 0, 0, 0], '0xcac8': [0x6b, 0, 0, 0] })"
def Q(clip, n, ln):
    return "{ list: '4', clip: '%s', variant: '7:0x%02x', len: %d }" % (clip, n, ln)
def one(name, n, frame, clip, ln, extra=''):
    return "    C('%s', 0x%02x, 1, %.1f, 1, [%s], { st: 7, %s%s })," % (name, n, frame, Q(clip, n, ln), OB % hex(n), extra)
def seq(name, n, frames, clip, ln, extra=''):
    st = ", ".join("{ fn: 'd2dfb0', phase: 1, win: 1, frame: %.1f }" % F for F in frames)
    return "    C('%s', 0x%02x, 1, %.1f, 1, [%s], { st: 7, steps: [%s], %s%s })," % (name, n, frames[0], Q(clip, n, ln), st, OB % hex(n), extra)
def aimed(name, n, frame, clip, ln, extra=''):
    st = "{ fn: 'd2dfb0', phase: 0, win: 0, frame: null }, { fn: 'd2dfb0', phase: 1, win: 1, frame: %.1f }" % frame
    return "    C('%s', 0x%02x, 1, %.1f, 1, [%s], { st: 7, steps: [%s], %s%s })," % (name, n, frame, Q(clip, n, ln), st, OB % hex(n), extra)
Q103 = "{ list: '1', clip: 'Motion[103]', variant: null, len: 194, loopStart: 80 }"
Q104 = "{ list: '1', clip: 'Motion[104]', variant: null, len: 203 }"
def FH(name, mid, Fs, q):
    st = "steps: [" + ", ".join("{ fn: 'd2329c', frame2: %.1f, owner: { '0x4b4': [%d, %d] } }" % (x, mid & 0xff, mid >> 8) for x in Fs) + "]"
    ob = "owner_bytes: Object.assign({ '0x73e0': [0, 0] }, { '0xcac8': [0x6b, 0, 0, 0] })"
    return "    C('%s', 0x00, 0, %.1f, 0, [%s], { st: 0, %s, %s, frames: 400, dtp: Array(32).fill(1) })," % (name, Fs[0], q, st, ob)
cases = "\n".join([
  "    // 0xd283fc: ONE shell00 mode by the stub's arg, at its frame (u16 table 0x162286c) on L4 M5 -- the X offset +0x15ec (ints[0] 5 / -10 / 5 / -5)",
  one('b04', 0x04, 76.0, 'Motion[5]', 219),
  one('b0b', 0x0b, 74.0, 'Motion[5]', 219),
  one('b16', 0x16, 90.0, 'Motion[5]', 219),
  one('b17', 0x17, 80.0, 'Motion[5]', 219),
  "    // 0xd2ba08: three in sequence on L4 M20 (f60 / f104 / f134), modes 8 / 9 / 10 (arg 0) or 5 / 6 / 7 -- the Y fan +0x15f0 (ints[2] -35 / -1 / 30)",
  seq('b4e', 0x4e, [60.0, 104.0, 134.0], 'Motion[20]', 295),
  seq('b58', 0x58, [60.0, 104.0, 134.0], 'Motion[20]', 295),
  "    // 0xd299e4: (7, 0x12) -- entered from (2, 0x0f) by 0xd25e14 when the area has a 0x10000 point -- L4 M8 + M7, shell00 MODE 4 at f76:",
  "    // flag bit 0 set, base00's X aim 0x3f9378 from the owner's point to the target, clamped to [10, 90] degrees",
  aimed('b12', 0x12, 76.0, 'Motion[8]', 219),
  "    // the target far and above (the aim's X under 10 degrees: the clamp's low end, as b12), well below him (about 60 degrees,",
  "    // inside the range) and 17 degrees below",
  aimed('b12far', 0x12, 76.0, 'Motion[8]', 219, ", target: [1500.0, 40.0, 7400.0]"),
  aimed('b12near', 0x12, 76.0, 'Motion[8]', 219, ", target: [260.0, -700.0, 420.0]"),
  aimed('b12mid', 0x12, 76.0, 'Motion[8]', 219, ", target: [400.0, -300.0, 900.0]"),
  "    // THE FRAME HANDLER 0xd2329c (vt+0x208): his shell01 0x6b mode 1 (c 0) at the owner on L1 M103 (f2 / f80 / f140) and L1 M104 (f16)",
] + [FH('h103', 0x167, [2.0, 80.0, 140.0], Q103), FH('h104', 0x168, [16.0], Q104)])
spec = {
  'name': 'basarios', 'title': 'Basarios shells', 'mon': mon, 'main': 'd2dfb0', 'variant': 0,
  'header': [
    "Basarios's (em004_00) shell00 rows in render/shells.js against the ROM -- uShellEm004_sp_00 (0x6a, base00; reader 0xd304ac) from",
    "0xd283fc (modes 0..3), 0xd2ba08 (5..10) and 0xd299e4 ((7, 0x12) mode 4), with the landing's shell01 (0x6b, u 161) as the child.",
    "dev/em004-shell00-spec.md; dev/em004-fireball-actions.md.",
    "",
    "  node dev/shells-basarios-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-basarios-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x6a): [mon, '00'], hex(0x6b): [mon, '01']},
  'owner_bytes': {},
  'bases': {hex(0x6a): 'base00', hex(0x6b): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, -0.2, 0.05, [40.0, 310.0, 380.0]) };",
  'cases': cases,
  'contract': "\n".join([
    "  ok(pv('%s', '4', 'Motion[5]') === '[\"7:0x04\",\"7:0x0b\",\"7:0x16\",\"7:0x17\"]', 'L4 M5: (7, 4 / 0xb / 0x16 / 0x17)', pv('%s', '4', 'Motion[5]'));" % (mon, mon),
    "  ok(pv('%s', '4', 'Motion[8]') === '[\"7:0x12\"]', 'L4 M8: (7, 0x12)', pv('%s', '4', 'Motion[8]'));" % (mon, mon)]),
  'controls': "\n".join([
    "    ['b04', { joints: Object.assign({}, JOINTS, { 3: jointOf(0.1, -0.2, 0.05, [40.0, 311.0, 380.0]) }) }, 'joint 3 one unit up'],",
    "    ['b12near', { target: [290.0, -700.0, 420.0] }, 'the mode-4 target 30 aside, inside the clamp'],",
    "    ['b12', { target: [900.0, -1400.0, 2400.0] }, 'the clamped target dropped 1440 (into the range)'],",
    "    ['h104', { ownerPos: [121.5, 15.25, -80.75] }, 'the owner 1 along x (the frame handler shell01)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['4', 'Motion[5]', 'shell00'], ['4', 'Motion[20]', 'shell00'], ['4', 'Motion[8]', 'shell00'], ['1', 'Motion[104]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_basarios.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-basarios-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;" + N + "    if (c.stubs) o.stubs = c.stubs;" + N + "    if (c.dtp) o.dtp = c.dtp;" + N + "    o.frameStep = 1.0;"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
