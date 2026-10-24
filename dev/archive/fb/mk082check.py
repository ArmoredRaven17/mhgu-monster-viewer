import json, subprocess, sys
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + chr(92)
MAIN = '1035b58'
V = int(sys.argv[1])            # 0 Mizutsune, 4 Soulseer
MON = 'em082_0%d' % V
IDS = {0: {'0xcac0': 0x159, '0xcac4': 0x15a, '0xcac8': 0x158, '0xcacc': 0x15b},
       4: {'0xcac0': 0x15d, '0xcac4': 0x15e, '0xcac8': 0x15c, '0xcacc': 0x15f, '0xcad0': 0x160}}[V]
DTP = {0: [0,1,1,0, 0,3,3,1, 1,2,2,2, 2,2,2,3, 5,1,1,4, 6,1,1,5], 4: [0,2,2,1, 1,2,2,2, 2,2,2,3, 5,1,1,4, 6,1,1,5]}[V]
HEADLV = 3 if V == 0 else 2
def steps(phase, frames, pre=None):
    s = ["{ fn: '%s', phase: %d, frame: %s, winFrames: [%s] }" % (MAIN, phase, fr, fr) for fr in frames]
    if pre is not None: s = ["{ fn: '%s', phase: %d, frame: 0.0, winFrames: [] }" % (MAIN, pre)] + s
    return '[' + ', '.join(s) + ']'
def C(name, st, n, phase, frames, clip, prim, ln, extra='', pre=None):
    return "    C('%s', 0x%02x, %d, %s, 0, Q('%s', 0x%02x, %d, '2', %d), { st: %d, noTurn: 1, steps: %s%s })" % (
        name, n, phase, frames[0], clip, prim, ln, st, st, steps(phase, frames, pre), extra)
cases = [
  C('b00', 7, 0x00, 1, ['94.0', '100.0', '104.0'], 'Motion[42]', 0x00, 130),
  C('b01', 7, 0x01, 3, ['46.0'], 'Motion[37]', 0x01, 80),
  C('b09_tilt', 7, 0x09, 1, ['43.0', '48.0', '56.0'], 'Motion[20]', 0x09, 90, ", target: [900.0, 1400.0, 2400.0]", pre=0),
  C('b0a', 7, 0x0a, 1, ['42.0', '44.0'], 'Motion[64]', 0x0a, 80),
  C('b0c', 7, 0x0c, 1, ['43.0', '48.0', '56.0'], 'Motion[20]', 0x0c, 90, ", owner: [0, 0x9123, 0]"),
  C('b0d', 7, 0x0d, 1, ['74.0', '82.0', '136.0', '138.0', '150.0'] if V == 4 else ['70.0', '78.0', '86.0', '136.0', '150.0'], 'Motion[21]', 0x0d, 170),
  C('b0d_head', 7, 0x0d, 1, ['74.0', '82.0', '136.0', '138.0', '150.0'] if V == 4 else ['70.0', '78.0', '86.0', '136.0', '150.0'], 'Motion[21]', 0x0d, 170,
    ", block_bytes: { '0x3bc': [%d, 0] }, mizu082: { headBroken: true }" % HEADLV),
  C('b0d_tired', 7, 0x0d, 1, ['74.0', '82.0', '136.0', '138.0', '150.0'] if V == 4 else ['70.0', '78.0', '86.0', '136.0', '150.0'], 'Motion[21]', 0x0d, 170,
    ", tired: true, block_bytes: { '0x505': [2] }"),
  C('b2a', 7, 0x2a, 1, ['114.0', '120.0', '124.0'], 'Motion[89]', 0x2a, 140),
  C('b2a_tail', 7, 0x2a, 1, ['114.0', '120.0', '124.0'], 'Motion[89]', 0x2a, 140, ", severed: true, tailSevered: true"),
  C('s06', 2, 0x06, 2, ['36.0'] if V == 4 else ['38.0'], 'Motion[40]', 0x06, 60),
  C('s34', 2, 0x34, 2, ['36.0'] if V == 4 else ['38.0'], 'Motion[40]', 0x34, 60),
  C('s07', 2, 0x07, 2, ['26.0'] if V == 4 else ['21.0'], 'Motion[11]', 0x07, 50),
]
if V == 0: cases.append(C('b5e', 7, 0x5e, 1, ['50.0', '54.0', '56.0'], 'Motion[26]', 0x5e, 80))
# the trail (7, 0x10): the init at phase 2's end (ended), then L2 M24's 22 calls with the block sliding 60 a frame along z
OP = [120.5, 15.25, -80.75]
def bp(fr): return '[%r, %r, %r]' % (OP[0], OP[1], OP[2] + 60.0 * fr)
tsteps = ["{ fn: '%s', phase: 2, frame: 0.0, ended: 1, winFrames: [], blockPos: %s }" % (MAIN, bp(0))] + \
         ["{ fn: '%s', phase: 3, frame: %d.0, winFrames: [], blockPos: %s }" % (MAIN, fr, bp(fr)) for fr in range(1, 23)]
cases.append("    C('t10', 0x10, 3, 1.0, 0, Q('Motion[24]', 0x10, 30, '2', 7), { st: 7, noTurn: 1, steps: [%s], ownerPath: fr => [%r, %r, %r + 60.0 * Math.min(fr, 22)] })" %
             (', '.join(tsteps), OP[0], OP[1], OP[2]))
if V == 4:
    cases.append(C('b7d', 7, 0x7d, 1, ['44.0'], 'Motion[64]', 0x7d, 70))
    cases.append(C('s07_tired', 2, 0x07, 2, ['26.0'], 'Motion[11]', 0x07, 50, ", tired: true, block_bytes: { '0x505': [2] }"))
    cases.append(C('b64', 7, 0x64, 1, ['110.0'], 'Motion[72]', 0x64, 140))
    cases.append(C('b65_tired', 7, 0x65, 1, ['110.0'], 'Motion[71]', 0x65, 140, ", tired: true, block_bytes: { '0x505': [2] }"))
    cases.append(C('b69', 7, 0x69, 2, ['110.0'], 'Motion[72]', 0x64, 140))
# the throws (status 2, phase 2, f10 / 20 / 30): one per helper and set, and the two cancels
for nm, n, clip in (('w04', 0x04, 'Motion[56]'), ('w1e', 0x1e, 'Motion[56]'), ('w2a', 0x2a, 'Motion[56]'), ('w2c', 0x2c, 'Motion[56]'),
                    ('w05', 0x05, 'Motion[59]'), ('w08', 0x08, 'Motion[56]'), ('w09', 0x09, 'Motion[59]'), ('w22', 0x22, 'Motion[56]'),
                    ('w32', 0x32, 'Motion[56]'), ('w33', 0x33, 'Motion[59]')):
    cases.append(C(nm, 2, n, 2, ['10.0', '20.0', '30.0'], clip, n, 60))
cases.append(C('w04_tail', 2, 0x04, 2, ['10.0', '20.0', '30.0'], 'Motion[56]', 0x04, 60, ", severed: true, tailSevered: true"))
cases.append(C('w04_tired', 2, 0x04, 2, ['10.0', '20.0', '30.0'], 'Motion[56]', 0x04, 60, ", tired: true, block_bytes: { '0x505': [2] }"))
cases.append(C('w1e_far', 2, 0x1e, 2, ['10.0', '20.0', '30.0'], 'Motion[56]', 0x1e, 60, ", target: [-3000.0, 0.0, 2600.0]"))
if V == 4:
    H26 = ", slot0: [0], slot0Ids: [0x160], hitLife: true, slotsOnly: 'shell26', slotsHold: 'shell26'"
    cases.append(C('f26', 7, 0x26, 1, ['78.0', '98.0'], 'Motion[69]', 0x26, 130, H26 + ", slot0Modes: [0, 1, 2, 3, 4, 5]"))
    cases.append(C('f26_turn', 7, 0x26, 1, ['78.0', '98.0'], 'Motion[69]', 0x26, 130, H26 + ", slot0Modes: [0, 1, 2, 3, 4, 5], owner: [0, 0x9123, 0]"))
    cases.append(C('f13', 7, 0x13, 1, ['30.0', '110.0'], 'Motion[38]', 0x13, 140, H26 + ", slot0Modes: [10, 11, 12, 13]"))
    cases.append(C('f13_tired', 7, 0x13, 1, ['30.0', '110.0'], 'Motion[38]', 0x13, 140, H26 + ", slot0Modes: [10, 11, 12, 13], tired: true, block_bytes: { '0x505': [2] }"))
    cases.append("    C('f36', 0x36, 1, 0.0, 0, Q('Motion[4]', 0x36, 30, '0', 2), { st: 2, noTurn: 1, steps: [{ fn: '%s', phase: 1, frame: 0.0, winFrames: [0.0] }]%s, slot0Modes: [14, 15] })" % (MAIN, H26))
    rsteps = ["{ fn: '%s', phase: 0, frame: 0.0, winFrames: [] }" % MAIN] + ["{ fn: '%s', phase: 2, frame: %d.0, winFrames: [] }" % (MAIN, k) for k in range(1, 611)]
    cases.append("    C('r16', 0x16, 2, 1.0, 0, Q('Motion[15]', 0x16, 620, '0', 1), { st: 1, noTurn: 1, steps: [%s]%s, slot0Modes: [6, 7, 8, 9], frames: 300, unstub: ['0x7206c'], tailQ: { list: '0', clip: 'Motion[1]', variant: null, len: 0 } })" % (', '.join(rsteps), H26))
    cases.append(C('f26_end', 7, 0x26, 1, ['78.0', '98.0'], 'Motion[69]', 0x26, 130))
if V == 4:
    FL = ", soulFlame082: true, block_bytes: { '0x1bb': [2] }"
    cases.append(C('L09', 7, 0x09, 1, ['43.0', '48.0', '56.0'], 'Motion[20]', 0x09, 90, ", target: [900.0, 1400.0, 2400.0]" + FL, pre=0))
    cases.append(C('L0c', 7, 0x0c, 1, ['43.0', '48.0', '56.0'], 'Motion[20]', 0x0c, 90, ", owner: [0, 0x9123, 0]" + FL))
    cases.append(C('L0d', 7, 0x0d, 1, ['74.0', '136.0', '142.0'], 'Motion[21]', 0x0d, 170, FL))
    cases.append(C('L06', 2, 0x06, 2, ['36.0'], 'Motion[40]', 0x06, 60, FL))
    cases.append(C('L07', 2, 0x07, 2, ['26.0'], 'Motion[11]', 0x07, 50, FL))
    cases.append(C('L04', 2, 0x04, 2, ['0.0', '10.0', '20.0', '30.0'], 'Motion[56]', 0x04, 60, FL))
    cases.append(C('L05', 2, 0x05, 2, ['0.0', '10.0', '20.0', '30.0'], 'Motion[59]', 0x05, 60, FL))
    for nm, st, n, ph, fr, clip, ln in (('L08', 2, 0x08, 2, ['10.0', '20.0', '30.0'], 'Motion[56]', 60), ('L00', 7, 0x00, 1, ['94.0', '100.0', '104.0'], 'Motion[42]', 130),
                                        ('L2a', 7, 0x2a, 1, ['114.0', '120.0', '124.0'], 'Motion[89]', 140), ('L64', 7, 0x64, 1, ['110.0'], 'Motion[72]', 140),
                                        ('L26', 7, 0x26, 1, ['78.0', '98.0'], 'Motion[69]', 130), ('L13', 7, 0x13, 1, ['30.0', '110.0'], 'Motion[38]', 140)):
        cases.append(C(nm, st, n, ph, fr, clip, n, ln, FL + ", none: 1"))
title = 'Soulseer' if V == 4 else 'Mizutsune'
spec = {
 "name": 'soulseer' if V == 4 else 'mizutsune', "title": title, "mon": MON, "main": MAIN, "variant": V,
 "header": [
  "%s's (%s) bubbles in render/shells.js against the ROM -- uEm082_00's sp_12 (0x%x, NEW base12 through its reader 0x104f15c), made" % (title, MON, IDS['0xcac8']),
  "by the chooser 0x104b540 and the makers 0x104a298 / 0x104a840 (dev/leviathan-shells-spec.md 5).",
  "",
  "  1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn, the class's action main 0x1035b58 with the",
  "     action at e+0x73e0, the shell-id fields e+0xcac0.. and the .dtp array filled, the phase and the frame tests answered one at a time.",
  "  2. The contract: the pick lists.",
  "  3. CONTROLS: a wrong joint, a wrong facing, a moved target (the tilt), a dropped gate must FAIL the comparison.",
  "  4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their bubbles; the records run out.",
  "",
  "  node dev/shells-%s-check.mjs   /   node <scratchpad>/run-check.mjs dev/shells-%s-check.mjs" % (('soulseer',) * 2 if V == 4 else ('mizutsune',) * 2),
  "",
  "Exit code 1 when anything fails."],
 "folders": dict({hex(IDS['0xcac8']): [MON, "12"], hex(IDS['0xcacc']): [MON, "13"], hex(IDS['0xcac0']): [MON, "01"]}, **({'0x160': [MON, "26"]} if V == 4 else {})),
 "owner_bytes": {k: list(v.to_bytes(4, 'little')) for k, v in IDS.items()},
 "bases": dict({hex(IDS['0xcac8']): "base12", hex(IDS['0xcacc']): "base13", hex(IDS['0xcac0']): "base01"}, **({'0x160': "base26"} if V == 4 else {})),
 "joints": "  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 1: jointOf(0.1, 0.3, 0.0, [120.0, 220.0, 60.0]), 2: jointOf(0.9, -0.45, 0.25, [160.25, 260.5, 140.75]),\n                   7: jointOf(-0.3, 0.6, 0.1, [90.0, 150.0, 30.0]), 12: jointOf(0.4, 0.2, -0.2, [100.0, 140.0, -20.0]), 144: jointOf(0.0, -1.0, 0.3, [130.0, 300.0, 250.0]),\n                   255: jointOf(0.5, 0.5, 0.5, [140.0, 320.0, 280.0]), 20: jointOf(0.3, -0.2, 0.6, [125.0, 330.0, 210.0]), 18: jointOf(-0.2, 0.1, 0.4, [110.0, 280.0, 200.0]) };\n  const J2b = jointOf(-0.4, 0.3, 0.1, [150.0, 250.0, 130.0]);",
 "cases": ',\n'.join(cases) + ',',
 "contract": "  ok(pv('%s', '2', 'Motion[21]') === '[\"7:0x0d\"]', 'L2 M21 picks its bubble action', pv('%s', '2', 'Motion[21]'));" % (MON, MON),
 "controls": "\n".join([
  "    ['b0c', { joints: Object.assign({}, JOINTS, { 2: J2b }) }, 'another joint 2'],",
  "    ['b0c', { owner: [0, 0x9124, 0] }, 'the facing one word off'],",
  "    ['b09_tilt', { target: [900.0, 1500.0, 2400.0] }, 'the target 100 higher (the tilt e+0xcb9c)'],",
  "    ['b0d_head', { mizu082: { headBroken: false } }, 'the head read intact'],",
  "    ['b0d_tired', { tired: false }, 'the tired gate dropped'],",
  "    ['b2a_tail', { tailSevered: false }, 'the tail read intact'],",
  "    ['w04', { target: [930.0, 40.0, 2400.0] }, 'the target 30 over (the throws)'],",
  "    ['w04_tail', { tailSevered: false }, 'the throw tail cancel dropped'],",
] + ([
  "    ['L06', { soulFlame082: false }, 'the soul flame read out (lit 174..176)'],",
  "    ['L08', { soulFlame082: false }, 'the soul flame read out (the throws)'],",
  "    ['L26', { soulFlame082: false }, 'the soul flame read out (the ghost flames)'],",
] if V == 4 else []) + [
  "    ['w1e', { joints: Object.assign({}, JOINTS, { 18: J2b }) }, 'another joint 18'],"]),
 "page": "\n".join([
  "  {",
  "    await pick('2', 'Motion[21]');",
  "    const w = await watch(400);",
  "    check(w.some(x => x.shell === 'shell12' && x.req), 'L2 M21: bubbles, shell12, started', w);",
  "    check(!body().failed, 'L2 M21 played out: the runtime still up', body().failed ? String(body().failed) : null);",
  "    if (body().failed) await open();",
  "  }",
  "  for (const [l, c, n, sh] of [['2', 'Motion[56]', 200, 'shell13']].concat(%s)){" % ("[['2', 'Motion[69]', 140, 'shell26']]" if V == 4 else "[]"),
  "    // (200 frames: the viewer LOOPS this one-shot action, a volley a pass, and some twenty 300-frame puddles at once fill the effect",
  "    // runtime's slot pool -- its full path 0x418d4 is unlifted (dev/leviathan-shells-spec.md 5, the effects lane's))",
  "    await open();",
  "    await pick(l, c);",
  "    const w = await watch(n);",
  "    check(w.some(x => x.shell === sh && x.req), 'L' + l + ' ' + c + ': ' + sh + ' started', w.slice(0, 4));",
  "    check(!body().failed, 'L' + l + ' ' + c + ' played out: the runtime still up', body().failed ? String(body().failed) : null);",
  "    if (body().failed) await open();",
  "  }",
  "  // THE LOOPING PLAY (off until the effects lane lifts the slot pool's full path 0x418d4 -- dev/leviathan-shells-spec.md 5f): the",
  "  // viewer loops these one-shot actions, a volley a pass; switch LOOPS on and each clip plays 1500 frames with the runtime up",
  "  const LOOPS = true;   // (2026-10-18: the pool's 0x418d4 READ -- not a full pool; the effects lane switched Soulseer's on)",
  "  if (LOOPS) for (const [l, c, sh] of [['2', 'Motion[56]', 'shell13'], ['2', 'Motion[59]', 'shell13']].concat(%s)){" % ("[['2', 'Motion[69]', 'shell26'], ['0', 'Motion[15]', 'shell26']]" if V == 4 else "[]"),
  "    await open();",
  "    await pick(l, c);",
  "    const w = await watch(1500);",
  "    check(w.some(x => x.shell === sh && x.req), 'LOOPING L' + l + ' ' + c + ': ' + sh + ' started', w.length);",
  "    check(!body().failed, 'LOOPING L' + l + ' ' + c + ' for 1500 frames: the runtime still up', body().failed ? String(body().failed) : null);",
  "  }",
  "  if (!LOOPS) check(true, 'the looping play is off (LOOPS = false: the effect pool, 0x418d4)');",
] + ([
  "  {",
  "    // THE SOUL FLAME ON (the Soul Flame control, state.classCtl 1 -> shellExtra soulFlame082): L2 M20's lit bubbles 188..190 (u 200 / 210)",
  "    await open();",
  "    const cs = document.getElementById('monClassCtl'); cs.value = '1'; cs.onchange({ target: cs });",
  "    check(V.shellExtra && V.shellExtra().soulFlame082 === true, 'the Soul Flame control reaches the shells', V.shellExtra && V.shellExtra().soulFlame082);",
  "    await pick('2', 'Motion[20]');",
  "    const w = await watch(200, x => x.some(y => y.shell === 'shell12'));",
  "    check(w.some(x => x.shell === 'shell12' && x.mode >= 185 && x.key === 200 && x.req), 'L2 M20 lit: a flame bubble (185..190), u 200 started', w.slice(0, 4));",
  "    cs.value = '0'; cs.onchange({ target: cs });",
  "  }",
] if V == 4 else []) + [
  "  await open();   // (a fresh runtime for the records: the play-outs' long effects off the pool)",
  "  const S = body().schedule;",
  "  for (const key of %s){" % json.dumps([0, 1, 2, 10, 11, 12, 20, 21, 22, 30, 31, 32, 40, 41, 42, 50, 51, 52, 60, 61, 80, 81, 100, 101] + ([150, 200, 201, 210] if V == 4 else [])),
  "    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === '%su' && x.def.record.key === key);" % MON,
  "    if (!e){ check(false, '%su ' + key + ' exported as a shell record'); continue; }" % MON,
  "    let started = 0, maxRun = 0;",
  "    for (let rep = 0; rep < 2; rep++){",
  "      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }",
  "      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }",
  "    }",
  "    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });",
  "    if (body().failed) await open();",
  "  }"]),
}
json.dump(spec, open(D + 'spec_%s.json' % spec['name'], 'w', encoding='utf8'), indent=1)
print(subprocess.run([sys.executable, D + 'mk_plaincheck.py', D + 'spec_%s.json' % spec['name']], capture_output=True, text=True).stdout)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\shells-%s-check.mjs' % spec['name']
s = open(P, encoding='utf8').read()
def rep(o, n):
    global s
    assert s.count(o) == 1, o
    s = s.replace(o, n)
rep("const Q = (clip, n, len, list = '2') => [{ list, clip, variant: v(n), len }];",
    "const Q = (clip, n, len, list = '2', st = 7) => [{ list, clip, variant: st + ':0x' + n.toString(16).padStart(2, '0'), len }];")
rep("questLevel: x.quest, trunkSnow083: x.trunk });", "questLevel: x.quest, trunkSnow083: x.trunk, tired: !!x.tired, tailSevered: !!x.tailSevered, mizu082: x.mizu082, soulFlame082: !!x.soulFlame082 });")
rep("    if (c.precall) o.precall = c.precall;", "    if (c.precall) o.precall = c.precall;\n    if (c.block_bytes) o.block_bytes = c.block_bytes;\n    if (c.severed) o.severed = 1;\n    o.dtp = %s;\n    if (c.slot0Ids) o.slot0Ids = c.slot0Ids;\n    if (c.unstub) o.unstub = c.unstub;\n    if (c.slot0Modes) o.slot0Modes = c.slot0Modes;" % json.dumps(DTP))
rep("      for (const sh of out.spawned) info.set(sh.id, { S: sh, step: k, starts: [], children: [] });",
    "      if (x.slotsOnly) for (const sh of out.spawned) if (sh.shell !== x.slotsOnly) sh.slots = null;\n      // (slotsHold: the ROM run holds that shell's slot-0 byte on: its slot here never runs out either)\n      if (x.slotsHold) for (const sh of out.spawned) if (sh.shell === x.slotsHold && sh.slots) for (const sl of sh.slots) sl.duration = Infinity;\n      for (const sh of out.spawned) info.set(sh.id, { S: sh, step: k, starts: [], children: [] });")
rep("for (let i = 0; i < (x.frames || 460) + 500; i++) steps.push({ q: last.q, frame: last.q.len });",
    "for (let i = 0; i < (x.frames || 460) + 500; i++) steps.push(x.tailQ ? { q: x.tailQ, frame: 0 } : { q: last.q, frame: last.q.len });   // (tailQ: another clip, the action over)")
rep("ownerPos: { x: x.ownerPos[0], y: x.ownerPos[1], z: x.ownerPos[2] },",
    "ownerPos: (P => ({ x: P[0], y: P[1], z: P[2] }))(x.ownerPath ? x.ownerPath(frame) : x.ownerPos),")
rep("|| [...clipSel.options].find(x => x.value === name + '_start');", "|| [...clipSel.options].find(x => x.value === name + '_start') || [...clipSel.options].find(x => x.value === name + '_loop');")
open(P, 'w', encoding='utf8').write(s)
print('patched', P)
