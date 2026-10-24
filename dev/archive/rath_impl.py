import os
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
p = os.path.join(V, 'docs', 'render', 'psl-mask.js')
s = open(p, encoding='utf-8', newline='').read()

def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:70])
    s = s.replace(a, b)

rep("export const CLASS_MASK = { em007_00,", """// THE RATH LINE -- Rathian / Gold / Dreadqueen (em 1) and Rathalos / Silver / Dreadking (em 2): ONE class, uEm001_00
// (vtable 0x1793c28; there is no uEm002_00 -- the id map 0x50aa8 puts all six on it, told apart by the em byte e+0xb5f4,
// the variant e+0xb5f5 and the id word e+0xb5f0). vt+0x13c = 0xd09054, READ whole (..0xd09420, jump table 0xd09090) and
// emulated by two agents (dev/em001-effects-spec.md: 195,840 runs; dev/em002-effects-spec.md: 14,976 runs; 0 mismatches):
//   L2 M3 / M4 (both lines) and, em 1 only, L4 M6 / M50 / M52 / M55 / M65 and L9 M2 / M6 -- THE TAIL FORM: severed -> bits
//     21-23 (severed L4 M65 also clears bit 1, u 350 off); on variant 4 (Dreadqueen / Dreadking) bits 18-20 when part 7's
//     break level reaches the .dtp threshold (2 at both ranks) or the quest number (0x49930 -> 0x3a8470) is 5 or under;
//     else bits 15-17. state.questLevel: the viewer's quest (index.html SHELL_QUEST_LEVEL, 10).
//   L2 M1: bits 24-26 by enemy id (Gold 0x201, Silver 0x202, Dreadqueen 0x401), not while tired (0x81614).
//   L4 M32 (em 2 only): bits 27-29 under (7, 3 / 0x29 / 0x2b / 0x2c / 0x48 / 0x49), not while tired.
//   L4 M38: (7, 0xf5) clears bits 6-12 and sets 30-31.
//   L0 M16 / M17: bits 18-19 under (1, 7) / (1, 8) -- c 60 / c 61, which have no record.
// No CLIP_ACTIONS: L4 M32 / M38 take their action from the shell picks (pickVariantsFor), which playNow uses first.
const RATH_TAIL1 = new Set([0x406, 0x432, 0x434, 0x437, 0x441, 0x902, 0x906]);
const RATH_L4M32 = new Set([0x03, 0x29, 0x2b, 0x2c, 0x48, 0x49]);
const rath = (em, id, v4) => (motion, action, state) => {
  const s = action ? action[0] : -1, n = action ? action[1] : -1;
  const tail = () => {
    if (state.severed) return 0xe00000;
    if (v4 && ((state.breakLevel7 | 0) >= 2 || ((state.questLevel | 0) >>> 0) <= 5)) return 0x1c0000;
    return 0x38000;
  };
  if (motion === 0x203 || motion === 0x204) return tail();
  if (em === 1 && RATH_TAIL1.has(motion)) return motion === 0x441 && state.severed ? { set: 0xe00000, clear: 0x2 } : tail();
  if (motion === 0x201) return (id === 0x201 || id === 0x202 || id === 0x401) && !state.tired ? 0x7000000 : 0;
  if (em === 2 && motion === 0x420) return s === 7 && !state.tired && RATH_L4M32.has(n) ? 0x38000000 : 0;
  if (motion === 0x426) return s === 7 && n === 0xf5 ? { set: 0xc0000000, clear: 0x1fc0 } : 0;
  if (motion === 0x010 || motion === 0x011) return s === 1 && (n === 7 || n === 8) ? 0xc0000 : 0;
  return 0;
};

export const CLASS_MASK = { em001_00: rath(1, 0x001, false), em001_02: rath(1, 0x201, false), em001_04: rath(1, 0x401, true),
  em002_00: rath(2, 0x002, false), em002_02: rath(2, 0x202, false), em002_04: rath(2, 0x402, true),
  em007_00,""")
rep("'em088_00', 'em087_00', 'em007_00',", "'em088_00', 'em087_00', 'em007_00',\n  'em001_00', 'em001_02', 'em001_04', 'em002_00', 'em002_02', 'em002_04',")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

p = os.path.join(V, 'docs', 'render', 'motion-states.js')
s = open(p, encoding='utf-8', newline='').read()
rep("  em002_04: { severed: 8, broken: 13, level: 2 },", """  em002_04: { severed: 8, broken: 13, level: 2 },
  // Rathalos / Silver: the part driver 0xcf2a14..0xcf2a98 draws part 8 on set 12 for these two (dev/em002-effects-spec.md)
  em002_00: { severed: 8 }, em002_02: { severed: 8 },""")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)

p = os.path.join(V, 'docs', 'index.html')
s = open(p, encoding='utf-8', newline='').read()
rep("{ rage, tired, severed, breakLevel7, crestBroken, beardOff, armEmpty, mud, rank: SHELL_QUEST_RANK, heat, posture, charge, sunk, carry })",
    "{ rage, tired, severed, breakLevel7, crestBroken, beardOff, armEmpty, mud, rank: SHELL_QUEST_RANK, questLevel: SHELL_QUEST_LEVEL, heat, posture, charge, sunk, carry })")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)
print('ok')
