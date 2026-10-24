import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('docs/render/motion-states.js', [
("""  em063_00: { severed: 8 }, em063_05: { severed: 8 },
};""",
"""  em063_00: { severed: 8 }, em063_05: { severed: 8 },
  // Deviljho / Savage: the set drivers test the sever at 0xe80800 (sets 4 / 8) and 0xe808e0 (sets 10 / 12), and part 8 is
  // drawn only on sets 8 and 12. Barroth: his part pass picks set 8 or 7 on the same test; part 12 is drawn only on set 8
  // (monsters.json groups). Their words read it (psl-mask.js em043 / em044_00; dev/em043_00- / em044_00-effects-spec.md).
  em043_00: { severed: 8 }, em043_05: { severed: 8 }, em044_00: { severed: 12 },
};"""),
("""export function shellPartsInput(monId, drawn){""",
"""// BARROTH's MUD BYTE e+0xcada as the parts SHOW it: bit 0 = the head mud gone (part 2, drawn on set 9, off on set 10),
// bit 1 = the back mud gone (part 8, set 13 / 14). `=== false`, not `!get`: the rest sets (part-rest.json 3 / 5 / 7) do not
// name the mud groups, and a group no set names is drawn -- muddy. His word reads it on L2 M12 / M13 (psl-mask.js em044_00).
export const SHELL_MUD = { em044_00: { head: 2, back: 8 } };
export function shellMudInput(monId, drawn){
  const m = SHELL_MUD[monId];
  if (!m || !drawn) return 0;
  return (drawn.get(m.head) === false ? 1 : 0) | (drawn.get(m.back) === false ? 2 : 0);
}
export function shellPartsInput(monId, drawn){"""),
])

patch('docs/render/psl-mask.js', [
("// GREAT MACCAO (em085_00), uEm085_00",
"""// DEVILJHO (em043_00) and SAVAGE DEVILJHO (em043_05), one class uEm043_00, vtable +0x13c = 0xe80fd0 (vtable 0x17bfd1c),
// READ whole (0xe80fd0..0xe810e0, jump table 0xe81054) and emulated -- 46080 runs against the ROM, 0 mismatches
// (dev/em043_00-effects-spec.md 1). 0xca170 first, then by motion id -- NO variant test (Savage's word is Deviljho's):
//   * L2 M3 / M4 / M10 / M19 / M20 / M21 (0x70083 over motion - 0x203): the tail severed (vt+0x370(e, 1) = 0xa3bf4) ->
//     nothing, else bits 15-17: c 121 / c 120 / c 122 / c 120 / c 125 / c 124 -- the tail's impacts, while it is on;
//   * L0 M5 (0xe810a0): bits 15-17 unless the action is (10, 0xa7), (10, 0x2a) or (10, 0x70) (0x6fe88) -- c 60 on the
//     rage roar (1, 2) / (1, 0x12), not on the paralysis / shock-trap / (10, 0xa7) recoveries;
//   * L0 M6 / L0 M11 / L0 M14 (0xe8107c): bits 15-17 unless 0x81d6c (posture 4 and P+0x5c < 0.9 x MoguriBaseOfs: already
//     under the ground) -- c 0 / c 1, the footfalls, on the surface only (state.sunk: CLIP_ACTIONS' `sunk`, clipSunkFor);
//   * every other motion: the base alone. Savage's c 91 (b13) and c 90 (b12) are the base's tired-calm group.
const EM043_TAIL = new Set([0x203, 0x204, 0x20a, 0x213, 0x214, 0x215]);
function em043(motion, action, state){
  if (EM043_TAIL.has(motion)) return state.severed ? 0 : 0x38000;
  if (motion === 0x005)
    return action && action[0] === 10 && (action[1] === 0xa7 || action[1] === 0x2a || action[1] === 0x70) ? 0 : 0x38000;
  if (motion === 0x006 || motion === 0x00b || motion === 0x00e) return state.sunk ? 0 : 0x38000;
  return 0;
}

// BARROTH (em044_00), uEm044_00 vtable +0x13c = 0xe8d714 (vtable 0x17c1434), READ whole (0xe8d714..0xe8d854; literal
// 0xe8d858 -> GOT 0x1831c54) and emulated -- 27648 runs, 0 mismatches (dev/em044_00-effects-spec.md 1). 0xca170 first,
// then by motion id -- the class has no variant test:
//   * L0 M3 / M4 / M6 / M13 / M15 (0xa058): bits 27-28 unless 0x81d6c (under the ground) -- the footfalls c 0..c 3;
//   * L0 M11: status 1, number 2 or 0xe -> bits 23-24 -- c 90 on the rage roar, not on (1, 0) or the recoveries;
//   * L2 M12 / M13: the mud byte e+0xcada (bit 0 head, bit 1 back gone; motion-states.js shellMudInput): both muddy bits
//     19-20 (u 360), head bare 17-18 (u 350), back bare 15-16 (u 340), both bare nothing;
//   * L4 M6 / M7: 0x3a8430 == 5 (the rank byte; the viewer's SHELL_QUEST_RANK) -> bits 21-22 (u 210 on L4 M6);
//   * L2 M2: the tail severed -> nothing, else bits 25-26 (c 40).
function em044_00(motion, action, state){
  if (motion <= 0xf && ((0xa058 >>> motion) & 1)) return state.sunk ? 0 : 0x18000000;
  if (motion === 0x00b) return action && action[0] === 1 && (action[1] === 2 || action[1] === 0xe) ? 0x1800000 : 0;
  if (motion === 0x20c || motion === 0x20d){
    const m = (state.mud | 0) & 3;
    return m === 3 ? 0 : m === 0 ? 0x180000 : (m & 1) ? 0x60000 : 0x18000;
  }
  if (motion === 0x406 || motion === 0x407) return state.rank === 5 ? 0x600000 : 0;
  if (motion === 0x202) return state.severed ? 0 : 0x6000000;
  return 0;
}

// GREAT MACCAO (em085_00), uEm085_00"""),
("em018_04, em063_00, em063_05 };", "em018_04, em063_00, em063_05,\n  em043_00: em043, em043_05: em043, em044_00 };"),
("'em018_04', 'em063_00', 'em063_05'];", "'em018_04', 'em063_00', 'em063_05', 'em043_00', 'em043_05', 'em044_00'];"),
("""  em063_00: EM063_ACTIONS,
  em063_05: EM063_ACTIONS,
};""",
"""  em063_00: EM063_ACTIONS,
  em063_05: EM063_ACTIONS,
  // DEVILJHO / SAVAGE (dev/em043_00-effects-spec.md 3). L0 M5: the rage roar (1, 2) (0xe74d18; (1, 0x12) at 0xe7455c the
  // same) fires c 60, the recovery (10, 0x2a) does not. L0 M6: the walk (2, 0) sets it at posture 0 (0xe7500c / 0xe75d6c /
  // 0xe7e1ac); (6, 3) at 0xe77008 takes posture 4 and sets it at 0xe77064 with P+0x5c left from the burrow before it --
  // `sunk` (INFERRED: no command stream issues (6, 3); the (0, 7) hold and (6, 4) set P+0x5c that way).
  em043_00: EM043_ACTIONS,
  em043_05: EM043_ACTIONS,
  // BARROTH (dev/em044_00-effects-spec.md 3). L0 M11 is REQUIRED: with no action c 90 never fires -- (1, 2) / (1, 0xe) do,
  // (1, 0) and the recoveries (10, 0x2a / 0x2b / 0x70 / 0xa9 / 0xc5) do not. L0 M6: the walk, and (6, 3 / 6 / 0xe) at
  // 0xe86430 under posture 4 (0xe864bc), which the command tables issue only after (6, 1) / (6, 4) -- both set P+0x5c to
  // MoguriBaseOfs, so it plays sunk.
  em044_00: {
    '0|Motion[11]': [{ action: [1, 2] }, { action: [10, 0x2a] }],
    '0|Motion[6]':  [{ action: [2, 0] }, { action: [6, 6], posture: 4, sunk: true }],
  },
};"""),
("const EM063_ACTIONS = {",
"""const EM043_ACTIONS = {
  '0|Motion[5]': [{ action: [1, 2] }, { action: [10, 0x2a] }],
  '0|Motion[6]': [{ action: [2, 0] }, { action: [6, 3], posture: 4, sunk: true }],
};
const EM063_ACTIONS = {"""),
("""// the posture a play starts in (P+0x1ba)""",
"""// whether a play starts already under the ground (0x81d6c: posture 4 and P+0x5c < 0.9 x MoguriBaseOfs), where the play's
// entry says so (Deviljho's and Barroth's burrowed L0 M6); false elsewhere -- the viewer's stand-in, as Akantor's
export function clipSunkFor(monId, list, clip, n){
  const t = CLIP_ACTIONS[monId], a = t && t[String(list) + '|' + String(clip).replace(/_(start|loop)$/, '')];
  if (!a || !a.length) return false;
  return a[((n | 0) % a.length + a.length) % a.length].sunk === true;
}
// the posture a play starts in (P+0x1ba)"""),
])

patch('docs/index.html', [
("import { pslMask, clipActionFor, clipPostureFor, ACTION_EFFECTS, actionName, actionOf } from './render/psl-mask.js';",
 "import { pslMask, clipActionFor, clipPostureFor, clipSunkFor, ACTION_EFFECTS, actionName, actionOf } from './render/psl-mask.js';"),
("shellTailInput, shellPartsInput,", "shellTailInput, shellPartsInput, shellMudInput,"),
("""  const sunk = false;
  plays.mask""",
"""  // Deviljho's and Barroth's burrowed L0 M6 entries name it (psl-mask.js clipSunkFor); every other play stays false
  const sunk = clipSunkFor(state.id, list, clip, plays.n);
  // Barroth's mud byte (motion-states.js shellMudInput) and the rank his L4 M6 / M7 arm reads (SHELL_QUEST_RANK, G)
  const mud = shellMudInput(state.id, mounted.main && mounted.main.userData.partsDrawn);
  plays.mask"""),
("""{ rage, tired, severed, breakLevel7, crestBroken, armEmpty, posture, charge, sunk })""",
"""{ rage, tired, severed, breakLevel7, crestBroken, armEmpty, mud, rank: SHELL_QUEST_RANK, posture, charge, sunk })"""),
])
print('ok')
