# mk005s13.py (2026-10-19): dev/shells-gravios13-check.mjs for mk_plaincheck.py -- Gravios's (7, 0x49) sp_13 pair (uShellEm005_sp_13,
# base13), the action main 0xd2dfb0 (uEm004_00) run natively at phase 1 / frame 105; the owner's +0xcad0 = 0x6f (the loader
# 0xd2e538 is not run by the harness), a .dtp of threshold 1 (the head's level 0 < 1: mode 1)
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em005_00'
X = ", owner_bytes: Object.assign({ '0x73e0': [7, 0x49] }, { '0xcad0': [0x6f, 0, 0, 0] }), dtp: Array(32).fill(1), frames: 400, initOk: ['0x6f'], stubs: ['0x275dc0', '0x807984', '0x4ef25c', '0x4eeed0']"
Q = "{ list: '2', clip: 'Motion[46]', variant: '7:0x49', len: 156, loopStart: 8 }"
# (2026-10-19) the frame handler's cases: fn 0xd2329c with the motion id at e+0x4b4 and the channel-1 gate 0xb09b0 answered (frame2)
Q103 = "{ list: '1', clip: 'Motion[103]', variant: null, len: 194, loopStart: 80 }"
Q104 = "{ list: '1', clip: 'Motion[104]', variant: null, len: 203 }"
def FH(name, mid, F, q):
    Fs = F if isinstance(F, list) else [F]; F = Fs[0]
    st = "steps: [" + ", ".join("{ fn: 'd2329c', frame2: %.1f, owner: { '0x4b4': [%d, %d] } }" % (x, mid & 0xff, mid >> 8) for x in Fs) + "]"
    ob = "owner_bytes: Object.assign({ '0x73e0': [0, 0] }, { '0xcac8': [0x6d, 0, 0, 0] })"
    return "    C('%s', 0x00, 0, %.1f, 0, [%s], { st: 0, %s, %s, frames: 400, dtp: Array(32).fill(1) })," % (name, F, q, st, ob)
cases = "\n".join([
  "    // (7, 0x49) phase 1 at f105: the two sp_13 at joint 3 (mode 0 no effect, mode 1 u 150)",
  "    C('g49', 0x49, 1, 105.0, 1, [%s], { st: 7%s })," % (Q, X),
  "    // the same with the target 4500 away: 0xc1044's ratio 1.29 (inside [1.0, 1.5]) and 7000 away (clamped to 1.5)",
  "    C('g49far', 0x49, 1, 105.0, 1, [%s], { st: 7, target: [1200.0, 40.0, 4300.0]%s })," % (Q, X),
  "    C('g49max', 0x49, 1, 105.0, 1, [%s], { st: 7, target: [1200.0, 40.0, 7000.0]%s })," % (Q, X),
  "    // THE FRAME HANDLER 0xd2329c (vt+0x208): shell01 0x6d mode 1 at the owner on L1 M103 (f2 / f80 / f140) and L1 M104 (f16)",
] + [FH(n, mid, F, q) for (n, mid, F, q) in (('h103', 0x167, [2.0, 80.0, 140.0], Q103),
                                              ('h104', 0x168, 16.0, Q104))])
spec = {
  'name': 'gravios13', 'title': 'Gravios sp_13', 'mon': mon, 'main': 'd2dfb0', 'variant': 0,
  'header': [
    "Gravios's (em005_00) sp_13 in render/shells.js against the ROM -- (7, 0x49) 0xd2af3c on L2 M46 f105: uShellEm005_sp_13 (0x6f,",
    "base13; reader 0xd3144c) modes 0 and 1 at joint 3. dev/em005-shells-spec.md 8.",
    "",
    "  node dev/shells-gravios13-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-gravios13-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0x6f): [mon, '13'], hex(0x6d): [mon, '01']},
  'owner_bytes': {},
  'bases': {hex(0x6f): 'base13', hex(0x6d): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 3: jointOf(0.1, -0.2, 0.05, [40.0, 610.0, 380.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[46]') === '[\"7:0x49\"]', 'L2 M46: (7, 0x49)', pv('%s', '2', 'Motion[46]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['g49', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside'],",
    "    ['g49', { joints: Object.assign({}, JOINTS, { 3: jointOf(0.1, -0.2, 0.05, [40.0, 611.0, 380.0]) }) }, 'joint 3 one unit up'],",
    "    ['h104', { ownerPos: [121.5, 15.25, -80.75] }, 'the owner 1 along x (the frame handler shell01)'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[46]_loop', 'shell13'], ['1', 'Motion[104]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_gravios13.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-gravios13-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;" + N + "    if (c.dtp) o.dtp = c.dtp;" + N + "    if (c.initOk) o.initOk = c.initOk;" + N + "    if (c.stubs) o.stubs = c.stubs;" + N + "    o.frameStep = 1.0;"),
  ("    const isLive = s => !!s.run && !!s.run.init && (s.run.spawn.state === 1 || s.run.spawn.state === 2);",
   "    // (c.initOk: an init whose 0 is the harness's missing attack data, emu_fb initOk -- the shell is made and flying)" + N +
   "    const isLive = s => !!s.run && (!!s.run.init || (c.initOk || []).map(Number).includes(s.id)) && (s.run.spawn.state === 1 || s.run.spawn.state === 2);"),
  ("    if (!R.init) return 'the ROM init deleted it, the module made it';",
   "    if (!R.init && !(R.spawn && (R.spawn.state === 2 || R.spawn.state === 1))) return 'the ROM init deleted it, the module made it';"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, loopStart: q.loopStart });"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
