import os, json, re
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('docs/render/motion-states.js', [
# the stun: the old refusal kept, marked withdrawn
("""  // NOT WIRED, stated rather than guessed:
  //   c 1103 (THE STUN). `(10, 0x20)` runs his action main to completion with no setMotion and no script at all,""",
"""  // [WITHDRAWN 2026-10-15 -- the stun paragraph below: the 2026-09-30 probe ran the hit direction 0 only. His stun
  //   switches on 0x9e8c0 = P+0x5ccb & 7, as Uragaan's, and both sides ARE read; the rows are in the block below
  //   (dev/em055_00-effects-spec.md 4, rom-map trap 52 "sweep the hit direction").]
  // NOT WIRED, stated rather than guessed:
  //   c 1103 (THE STUN). `(10, 0x20)` runs his action main to completion with no setMotion and no script at all,"""),
("""    // RAGE: (1, 2) is L0 M11. Whether anything on the model follows it is not read, so only the flag is shown.""",
"""    // RAGE: the rage stream g6 s0 issues (1, 0) behind op 0x6f(2) -- vt+0x214 = 0xed49a8, 1 unless the motion is L2 M2 or
    // the action (7, 9) / (7, 0xd) -- and (1, 0), (1, 2) (g8 s1) and (1, 0xd) (g13 s0) all play L0 M11. [CORRECTED
    // 2026-10-15: this said "(1, 2) is L0 M11", taking (1, 2) for the rage entry; dev/em055_00-effects-spec.md 1.] His word
    // fires c 120 on (1, 0) / (1, 0xd) and clears itself whole on (1, 2) (psl-mask.js em055_00). Whether anything on the
    // model follows rage is not read, so only the flag is shown."""),
("""    // DEATH: L3 M9 for (11, 0) and L3 M17 for (11, 7) and (11, 0x12) -- the only two clips death plays that
    // nothing else does. The capture pair L3 M10 / L3 M11 is left to sleep, above.
    '3|Motion[9]':  { dead: true },
    '3|Motion[17]': { dead: true },
  },""",
"""    // DEATH: L3 M9 for (11, 0) and L3 M17 for (11, 7) and (11, 0x12) -- the only two clips death plays that
    // nothing else does. The capture pair L3 M10 / L3 M11 is left to sleep, above.
    '3|Motion[9]':  { dead: true },
    '3|Motion[17]': { dead: true },
    // THE STUN, sided as Uragaan's: (10, 0x20) switches on the hit-direction class 0x9e8c0 (P+0x5ccb & 7; .dtb +0x70
    // index 9 = mode 1, so always 1 or 2): direction 1 -> script 0x17c9250 = L3 M5 -> L3 M18 (held, wait 0x100) -> L3 M13;
    // direction 2 -> 0x17c9270 = L3 M6 -> L3 M19 (held) -> L3 M14; then 0xfe -> (10, 0x2b) 0x17c90b0 = L0 M11, which stops
    // the one held c 1103. L3 M13 / M14 / M18 / M19 / M6 also play (10, 0x44 / 0x45 / 0xe / 0xbc / 0xbb / 0xa7), whose
    // meanings are not read. (dev/em055_00-effects-spec.md 4)
    '3|Motion[5]':  { hold: ['em055_00c', 1103] },
    '3|Motion[18]': { hold: ['em055_00c', 1103] },
    '3|Motion[13]': { hold: ['em055_00c', 1103] },
    '3|Motion[6]':  { hold: ['em055_00c', 1103] },
    '3|Motion[19]': { hold: ['em055_00c', 1103] },
    '3|Motion[14]': { hold: ['em055_00c', 1103] },
  },"""),
("""  em045_04: { period: 30, joint: 3, records: [['em045_04u', 1120], ['em045_04u', 1121]], pick: () => 0 },""",
"""  em045_04: { period: 30, joint: 3, records: [['em045_04u', 1120], ['em045_04u', 1121]], pick: () => 0 },
  // DURAMBOROS: the stub shape -- vtable +0x2a4 is the base 0x6bf64, so the id is always 1 and the request is always
  // u 1121; his 1120 and 1121 are byte-identical but for the key, and HIS OWN effect: em055_00_004 on JOINT 130, pos 0,
  // scale 1, mode 0. The class writes neither e+0xb7d2 nor e+0xb7d3 (0xed0a38..0xedec14), so the puff and the drool
  // both run. (dev/em055_00-effects-spec.md 5)
  em055_00: { period: 30, joint: 130, records: [['em055_00u', 1120], ['em055_00u', 1121]], pick: () => 0 },"""),
("""export const SHELL_PARTS = { em005_00: { headBroken: 3 }, em020_00: { skull: 109 }, em009_00: { crestBroken: 3 } };""",
"""//   Crystalbeard's beard cut -- 0xc2274(e, 1, 0, 4) sets P+0x3b4 bit 1, and his part pass draws set 4 on it, the only set
//     that draws part 2 (monsters.json em045_04 groups). His enable word 0xe9cb64 swaps u 201 / u 230 for u 240 on it
//     (psl-mask.js em045; dev/em045_00-effects-spec.md 1).
export const SHELL_PARTS = { em005_00: { headBroken: 3 }, em020_00: { skull: 109 }, em009_00: { crestBroken: 3 },
  em045_04: { beardOff: 2 } };"""),
])

patch('docs/render/psl-mask.js', [
("// GREAT MACCAO (em085_00), uEm085_00",
"""// URAGAAN (em045_00) and CRYSTALBEARD URAGAAN (em045_04), one class uEm045_00 (vtable 0x17c257c), vtable +0x13c =
// 0xe9cb64, READ whole (0xe9cb64..0xe9cd64) and emulated -- 39936 runs each, 0 mismatches (dev/em045_00-effects-spec.md
// 1). 0xca170 first, then by motion id; the variant byte e+0xb5f5 == 4 is tested twice and only picks the beard word:
//   * L2 M1 / M5 / M13 / M14 (k = motion - 0x201 in 0x3011): bits 25-26, or on Crystalbeard with the beard cut
//     (vt+0x370(e, 2) = 0xa3bf4, P+0x3b4 bit 1; motion-states.js SHELL_PARTS beardOff) bits 27-28: u 201 / u 230 with
//     it on, u 240 with it off;
//   * L2 M2 / L2 M3, status 7: n 2 -> bits 17-18, tired (0x81614) 19-20; n 4 or 0x90 -> 21-22, tired 23-24. (7, 2) is
//     the u 100 machine 0xe95b78(e, 0), (7, 4) the same with sel 1 (u 110 / u 120), (7, 0x90) the u 130 / 140 machine
//     0xe98ca8 whose last motion is L2 M3;
//   * L2 M10: the beard word AND the action arm (the status read through the post-indexed pointer, 0xe9cc70);
//   * L0 M11: status 1, n 2 or 0xc -> bits 15-16 (c 90 on the rage roar (1, 2));
//   * L0 M6: bits 29-30 unless 0x81d6c (MoguriBaseOfs -2000 Uragaan / 0 Crystalbeard: his roll after the curl starts
//     sunk, Crystalbeard's never) -- c 0 / c 1 dust on the surface only.
const em045 = v4 => (motion, action, state) => {
  const n = action && action[0] === 7 ? action[1] : -1;
  const beard = v4 && state.beardOff ? 0x18000000 : 0x6000000;
  const act = (n === 4 || n === 0x90) ? (state.tired ? 0x1800000 : 0x600000) : n === 2 ? (state.tired ? 0x180000 : 0x60000) : 0;
  if (motion === 0x201 || motion === 0x205 || motion === 0x20d || motion === 0x20e) return beard;
  if (motion === 0x202 || motion === 0x203) return act;
  if (motion === 0x20a) return beard | act;
  if (motion === 0x00b) return action && action[0] === 1 && (action[1] === 2 || action[1] === 0xc) ? 0x18000 : 0;
  if (motion === 0x006) return state.sunk ? 0 : 0x60000000;
  return 0;
};
const em045_00 = em045(false), em045_04 = em045(true);

// DURAMBOROS (em055_00), uEm055_00 vtable 0x17c8768, +0x13c = 0xede150, READ whole (0xede150..0xede1f0) and emulated --
// 20736 runs, 0 mismatches (dev/em055_00-effects-spec.md 1). 0xca170 first, then:
//   * L0 M3 / L0 M4 / L0 M6 / L0 M15 (bit of 0x8058): 0x81d6c "sunk" (MoguriBaseOfs -2000) -> bits 18-20, else 21-23:
//     c 100 (b18) on the turns L0 M3 / M4 only inside the rolling posture, c 0 (b21) on L0 M6 / M15 only outside it;
//   * L0 M11, status 1: n 0 / 0xd -> bit 15 (c 120, the roar burst); n 2 -> the WHOLE word cleared (str 0 at 0xede1ec,
//     base bits too);
//   * every other motion: the base alone -- L2 M25 / M32's u 400 on b6 / b9 / b12 fires once per state.
function em055_00(motion, action, state){
  if (motion === 0x003 || motion === 0x004 || motion === 0x006 || motion === 0x00f) return state.sunk ? 0x1c0000 : 0xe00000;
  if (motion === 0x00b && action && action[0] === 1){
    if (action[1] === 2) return { set: 0, clear: 0xffffffff };
    if (action[1] === 0 || action[1] === 0xd) return 0x8000;
  }
  return 0;
}

// GREAT MACCAO (em085_00), uEm085_00"""),
("em080_00: em080, em080_04: em080 };", "em080_00: em080, em080_04: em080, em045_00, em045_04, em055_00 };"),
("'em080_00', 'em080_04'];", "'em080_00', 'em080_04', 'em045_00', 'em045_04', 'em055_00'];"),
("""  em044_00: {
    '0|Motion[11]': [{ action: [1, 2] }, { action: [10, 0x2a] }],""",
"""  // URAGAAN / CRYSTALBEARD (dev/em045_00-effects-spec.md 3; status-7 dispatcher 0xe9a7b8, table 0xe9a7e4): (7, 2) ->
  // 0xe95b78(e, 0) L2 M2 then L2 M3 in phase 2; (7, 4) -> 0xe95b78(e, 1); (7, 0x90) -> 0xe98ca8 L2 M10 -> L2 M21 -> L2 M3;
  // (7, 0x8a) -> 0xe97e94 L2 M10. L2 M2's three entries keep step with its u 100 / 110 / 120 hold cycle (MOTION_STATES).
  // L0 M11: the rage roar (1, 2) fires c 90, (1, 0) does not. L0 M6 (Uragaan only): the walk (2, 2), then the EMC's curl
  // -> turn -> roll (6, 6), which starts sunk; Crystalbeard's MoguriBaseOfs is 0, so he is never sunk.
  em045_00: { ...EM045_ACTIONS, '0|Motion[6]': [{ action: [2, 2] }, { action: [6, 6], posture: 4, sunk: true }] },
  em045_04: EM045_ACTIONS,
  // DURAMBOROS (dev/em055_00-effects-spec.md 3): L0 M11 is (1, 0) -- the rage roar, g6 s0 behind op 0x6f(2) -- (1, 0xd)
  // (g13 s0) and (1, 2) (g8 s1); c 120 on the first two, the whole word cleared on (1, 2). L0 M3 / M4 / M6 / M15: the depth
  // decides (0x81d6c): a posture-0 play, then one in the rolling posture ((6, 4) / (6, 5) after the curl).
  em055_00: {
    '0|Motion[11]': [{ action: [1, 0] }, { action: [1, 2] }],
    '0|Motion[3]':  [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
    '0|Motion[4]':  [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
    '0|Motion[6]':  [{ action: [2, 0] }, { action: [6, 5], posture: 4, sunk: true }],
    '0|Motion[15]': [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],
  },
  em044_00: {
    '0|Motion[11]': [{ action: [1, 2] }, { action: [10, 0x2a] }],"""),
("const EM043_ACTIONS = {",
"""const EM045_ACTIONS = {
  '2|Motion[2]':  [{ action: [7, 2] }, { action: [7, 4] }, { action: [7, 4] }],
  '2|Motion[3]':  [{ action: [7, 2] }, { action: [7, 4] }, { action: [7, 0x90] }],
  '2|Motion[10]': [{ action: [7, 0x90] }, { action: [7, 0x8a] }],
  '0|Motion[11]': [{ action: [1, 2] }, { action: [1, 0] }],
};
const EM043_ACTIONS = {"""),
])

patch('docs/index.html', [
("""  const crestBroken = !!shellPartsInput(state.id, mounted.main && mounted.main.userData.partsDrawn).crestBroken;""",
"""  const partsIn = shellPartsInput(state.id, mounted.main && mounted.main.userData.partsDrawn);
  const crestBroken = !!partsIn.crestBroken;
  const beardOff = !!partsIn.beardOff;           // Crystalbeard's word reads the beard cut (psl-mask.js em045)"""),
("""{ rage, tired, severed, breakLevel7, crestBroken, armEmpty,""", """{ rage, tired, severed, breakLevel7, crestBroken, beardOff, armEmpty,"""),
])

# effect-mounts.json: append em055_00 to _autoOnRage in place (text edit, keeps the file's formatting)
p = 'docs/effect-mounts.json'
b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
lst = json.loads(s)['_autoOnRage']
assert 'em055_00' not in lst
i = s.index('"_autoOnRage": [')
j = s.index(']', i)
body = s[i:j]
last = body.rstrip()
s = s[:i] + last + ',\n  "em055_00"\n ' + s[j:]
json.loads(s)
if crlf: s = s.replace('\n', '\r\n')
open(p, 'wb').write(s.encode('utf-8'))
print('ok', len(json.loads(open(p, encoding='utf-8').read())['_autoOnRage']))
