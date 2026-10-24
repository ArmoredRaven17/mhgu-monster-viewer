import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('docs/render/motion-states.js', [
("""  em018_04: { severed: 31, broken: 30, level: 2 },
};""",
"""  em018_04: { severed: 31, broken: 30, level: 2 },
  // Brachydios / Raging: both part passes draw set 10 on vt+0x370(e, 1) -- the sever bit -- and set 10 is the only set
  // drawing part 8 on either (monsters.json groups). Their enable word 0xf469a8 fires L2 M21's c 210 only with the tail
  // on (psl-mask.js em063; dev/em063_00-effects-spec.md 2).
  em063_00: { severed: 8 }, em063_05: { severed: 8 },
};"""),
])

patch('docs/render/psl-mask.js', [
("// GREAT MACCAO (em085_00), uEm085_00",
"""// BRACHYDIOS (em063_00) and RAGING BRACHYDIOS (em063_05), one class uEm063_00 (vtable 0x17d92c4), vtable +0x13c =
// 0xf469a8, READ whole (0xf469a8..0xf46afc) and emulated -- the transcription below against the ROM over 25392
// combinations, 0 mismatches (dev/em063_00-effects-spec.md 1). 0xca170 first, then:
//   * variant byte e+0xb5f5 == 0 (Brachydios only -- the word's one variant test): each arm's slime row, ctl+0x2c
//     (slot 1, part 2, arm_r) / ctl+0x20 (slot 0, part 3, arm_l), in {0, 3} -> bits 19-20 / 21-22. The row is the arm's
//     last level change, written only by 0xf4653c (0xf4679c): 3 = it fell to 0 (the fist is spent), 0 = no change since
//     the reset. c 130 / c 140 (right: L2 M8 / M13 / M18 / M54 b19), c 131 / c 141 (left: L2 M5 / M11 / M16 b21).
//     state.armEmpty = [left, right], the viewer's arm level 0. NAMED DIFFERENCE: the ROM also sets these while the row
//     is still 0 (each arm's attacks after a reset, at level 2), which the viewer, holding no history, shows as not empty.
//   * every motion, both variants: vt+0x370(e, 1) = 0xa3bf4 (P+0x3b4 bit 0) clear -> bits 27-28 (L2 M21 b27 c 210).
//   * L2 M42 (0x22a): (7, 0x08 / 0x14 / 0xa1 / 0xa3 / 0xa6 / 0xb0) -> bits 17-18 (u 200);  L2 M41 (0x229): (7, 0x09).
//   * L0 M10 (0x00a): 0x81d6c "already sunk" false -> bits 15-16 (c 2 / c 3). STAND-IN state.sunk = false, as Akantor's.
const EM063_L2M42 = n => (n >= 0xa1 && n <= 0xb0 && ((0x8025 >>> (n - 0xa1)) & 1)) || n === 0x14 || n === 0x08;
const em063 = v0 => (motion, action, state) => {
  let r = state.severed ? 0 : 0x18000000;
  if (v0){
    const e = state.armEmpty || [false, false];
    if (e[1]) r |= 0x180000;
    if (e[0]) r |= 0x600000;
  }
  const n = action && action[0] === 7 ? action[1] : -1;
  if (motion === 0x22a) return r | (EM063_L2M42(n) ? 0x60000 : 0);
  if (motion === 0x229) return r | (n === 9 ? 0x60000 : 0);
  if (motion === 0x00a) return r | (state.sunk ? 0 : 0x18000);
  return r;
};
const em063_00 = em063(true), em063_05 = em063(false);

// GREAT MACCAO (em085_00), uEm085_00"""),
("em008_00, em009_00, em018_00, em018_04 };", "em008_00, em009_00, em018_00, em018_04, em063_00, em063_05 };"),
("'em009_00', 'em018_00',\n  'em018_04'];", "'em009_00', 'em018_00',\n  'em018_04', 'em063_00', 'em063_05'];"),
("""  em018_04: {
    '0|Motion[7]': [{ action: [2, 0x02] }, { action: [7, 0xe3] }, { action: [7, 0xe5] }],
  },
};""",
"""  em018_04: {
    '0|Motion[7]': [{ action: [2, 0x02] }, { action: [7, 0xe3] }, { action: [7, 0xe5] }],
  },
  // BRACHYDIOS / RAGING, the plays of the two clips their word (0xf469a8) keys on an action: status-7 table 0xf41f58.
  // L2 M42: (7, 0x08) 0xf3e314 mode 0 (start 0), (7, 0x14 / 0x15) modes 1 / 2 and (7, 0xa5 / 0xa6) modes 3 / 4 (starts
  // 38 / 34), (7, 0xb0 / 0xb1) 0xf40c9c modes 1 / 2 (start 38). Bits 17-18 (u 200) on 0x08 / 0x14 / 0xa6 / 0xb0 only.
  // L2 M41: (7, 0x09) / (7, 0x98) 0xf3eb70 modes 0 / 1 (start 0); bits on (7, 0x09) only. Each play the next; the ROM
  // starts the flagged plays at frame 34 / 38 -- the viewer plays the clip from 0. The plays are variant-blind (v0 / v5
  // identical under the emulator). NR: which command streams issue which (dev/em063_00-effects-spec.md 3).
  em063_00: EM063_ACTIONS,
  em063_05: EM063_ACTIONS,
};"""),
("export const CLIP_ACTIONS = {",
"""const EM063_ACTIONS = {
  '2|Motion[42]': [{ action: [7, 0x08] }, { action: [7, 0x14] }, { action: [7, 0x15] }, { action: [7, 0xa5] },
                   { action: [7, 0xa6] }, { action: [7, 0xb0] }, { action: [7, 0xb1] }],
  '2|Motion[41]': [{ action: [7, 0x09] }, { action: [7, 0x98] }],
};
export const CLIP_ACTIONS = {"""),
])

patch('docs/index.html', [
("""  const crestBroken = !!shellPartsInput(state.id, mounted.main && mounted.main.userData.partsDrawn).crestBroken;""",
"""  const crestBroken = !!shellPartsInput(state.id, mounted.main && mounted.main.userData.partsDrawn).crestBroken;
  // Brachydios's word reads each arm's slime row, 3 = the arm fell to level 0 (psl-mask.js em063): [left, right] from
  // the arm levels the viewer holds (slot 0 / slot 1, the ctl order). Raging's word has no arm test.
  const arms = state.id === 'em063_00' ? armSlimeLevels(mounted.main) : null;
  const armEmpty = arms ? [arms[0] === 0, arms[1] === 0] : undefined;"""),
("""{ rage, tired, severed, breakLevel7, crestBroken, posture, charge, sunk })""",
"""{ rage, tired, severed, breakLevel7, crestBroken, armEmpty, posture, charge, sunk })"""),
])
print('ok')
