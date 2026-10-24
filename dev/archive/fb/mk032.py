# mk032.py (2026-10-19): dev/shells-tigrex-check.mjs for mk_plaincheck.py -- Tigrex's (7, 0x07) rock volley against the ROM: the action
# main 0xe343f8 (uEm032_00) at phase 1, frames 68 / 72 / 76; owner +0xcac8 = 0xbd (shell00), +0xcac4 = 0xbe; the selector ctl+0x29 poked
# (the action-start hook 0xe20990 that writes it from the floor is not run) against input.floorFlags / floorAttr on the module side
import json, sys, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
mon = 'em032_00'
OB = "owner_bytes: Object.assign({ '0x73e0': [7, 0x07] }, { '0xcac8': [0xbd, 0, 0, 0], '0xcac4': [0xbe, 0, 0, 0] })"
Q = "{ list: '2', clip: 'Motion[5]', variant: '7:0x07', len: 175 }"
ST = "steps: [" + ", ".join("{ fn: 'e343f8', phase: 1, win: 0, winFrames: [%.1f], frame: %.1f }" % (F, F) for F in (68, 72, 76)) + "]"
def case(name, extra=''):
    return "    C('%s', 0x07, 1, 68.0, 1, [%s], { st: 7, %s, %s%s })," % (name, Q, ST, OB, extra)
def fh(name, mid, F, lst, clip, ln, extra=''):
    q = "{ list: '%s', clip: '%s', variant: null, len: %d }" % (lst, clip, ln)
    st = "steps: [{ fn: 'e21294', frame2: %.1f, owner: { '0x4b4': [%d, %d] } }]" % (F, mid & 0xff, mid >> 8)
    ob = "owner_bytes: Object.assign({ '0x73e0': [0, 0] }, { '0xcac8': [0xbd, 0, 0, 0], '0xcac4': [0xbe, 0, 0, 0] })"
    return "    C('%s', 0x00, 0, %.1f, 0, [%s], { st: 0, %s, %s%s })," % (name, F, q, st, ob, extra)
cases = "\n".join([
  "    // the plain floor (selector 0): modes 0 / 1 / 2 (u 0, landing u 30)",
  case('t07'),
  "    // the selectors the floor gives (ctl+0x29 poked in the ROM run; the module from floorFlags / floorAttr)",
  case('t07s1', ", ctl: { '0x29': [1] }, floorAttr: 2"),
  case('t07s2', ", ctl: { '0x29': [2] }, floorFlags: 2"),
  case('t07s3', ", ctl: { '0x29': [3] }, floorFlags: 0x40"),
  "    // a target high above (the X word held at 0xe000) and one below him",
  case('t07up', ", target: [200.0, 4000.0, 700.0]"),
  case('t07down', ", target: [300.0, -900.0, 700.0]"),
  "    // turned: owner words X 0x0400, Y 0xa000, Z 0x0200 (the gravity +0x170 turns by all three)",
  case('t07turn', ", owner: [0x400, 0xa000, 0x200]"),
  "    // the floor 300 up, above the launch point: crossed RISING, neither side reports a contact (the plane answers its front only), so",
  "    // 0xe355a4's rising arm (velocity y > 0 -> no landing, no end) is NOT exercised here -- both runs fly on unlanded",
  case('t07rise', ", floorY: 300.0, ground: 300.0, target: [900.0, 900.0, 2400.0]"),
  "    // THE FRAME HANDLER 0xe21294 (vt +0x208): shell01 (0xbe) mode 0 at the owner, by the motion id at a channel-1 frame (0xb09b0)",
  fh('f01c', 0x01c, 18.0, '0', 'Motion[28]', 147),
  fh('f101', 0x101, 58.0, '1', 'Motion[1]', 61),
  fh('f102', 0x102, 2.0, '1', 'Motion[2]', 139),
  fh('f208', 0x208, 14.0, '2', 'Motion[8]', 99),
  "    // more than 900 above his ground: none (0xe218b0)",
  fh('f208high', 0x208, 14.0, '2', 'Motion[8]', 99, ", ground: -1000.0, floorY: -1000.0, none: true"),
])
spec = {
  'name': 'tigrex', 'title': 'Tigrex shells', 'mon': mon, 'main': 'e343f8', 'variant': 0,
  'header': [
    "Tigrex's (em032_00) shell00 row in render/shells.js against the ROM -- (7, 0x07) 0xe2a770 on L2 M5: the volley helper 0xe2aacc",
    "at 68 / 72 / 76, uShellEm032_sp_00 (0xbd, base00; reader 0xe35410, +0x150 0xe3557c, +0x170 0xe3587c). dev/em032-shells-spec.md 8.",
    "",
    "  node dev/shells-tigrex-check.mjs ; node <scratchpad>/run-check.mjs dev/shells-tigrex-check.mjs",
    "",
    "Exit code 1 when anything fails.",
  ],
  'folders': {hex(0xbd): [mon, '00'], hex(0xbe): [mon, '01']},
  'owner_bytes': {},
  'bases': {hex(0xbd): 'base00', hex(0xbe): 'base01'},
  'joints': "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 50: jointOf(0.3, -0.1, 0.05, [60.0, 180.0, 310.0]) };",
  'cases': cases,
  'contract': "  ok(pv('%s', '2', 'Motion[5]') === '[\"7:0x07\"]', 'L2 M5: (7, 0x07)', pv('%s', '2', 'Motion[5]'));" % (mon, mon),
  'controls': "\n".join([
    "    ['t07', { joints: Object.assign({}, JOINTS, { 50: jointOf(0.3, -0.1, 0.05, [60.0, 181.0, 310.0]) }) }, 'joint 50 one unit up'],",
    "    ['t07', { target: [930.0, 40.0, 2400.0] }, 'the target 30 aside'],",
    "    ['t07turn', { owner: [0x400, 0xa000, 0x300] }, 'the owner Z word 0x100 more (the gravity alone reads it)'],",
    "    ['f208', { ownerPos: [121.5, 15.25, -80.75] }, 'the owner one unit along x'],"]),
  'page': "\n".join([
    "  for (const [list, clip, sh] of [['2', 'Motion[5]', 'shell00'], ['1', 'Motion[1]', 'shell01'], ['2', 'Motion[8]', 'shell01'], ['0', 'Motion[28]', 'shell01']]){",
    "    await pick(list, clip);",
    "    const w = await watch(400, x => x.some(y => y.shell === sh));",
    "    const T = body().schedule.shellTally;",
    "    check(w.some(x => x.shell === sh), 'L' + list + ' ' + clip + ': ' + sh + ' made', { w, failed: body().failed ? String(body().failed) : null, refused: T ? T.refused.slice(-3) : null });",
    "    if (body().failed) await open();",
    "  }"]),
}
P = D + r'\spec_tigrex.json'
json.dump(spec, open(P, 'w', encoding='utf8'), indent=1)
subprocess.check_call([sys.executable, D + r'\mk_plaincheck.py', P])
outp = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-tigrex-check.mjs'
s = open(outp, encoding='utf8').read()
N = chr(10)
reps = [
  ("    if (c.precall) o.precall = c.precall;",
   "    if (c.precall) o.precall = c.precall;" + N + "    if (c.ctl) o.ctl = c.ctl;" + N + "    o.frameStep = 1.0;"),
  ("hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk });",
   "hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, floorFlags: x.floorFlags, floorAttr: x.floorAttr });"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:50]
    s = s.replace(a, b)
open(outp, 'w', encoding='utf8').write(s)
print('patched')
