p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s = open(p, encoding='utf8').read()
a = "// ZAMTRIOS's u 60 (dev/em067_00-effects-spec.md 3;"
b = """// VALSTRAX's states (dev/em086_00-effects-spec.md 3; NO states note existed -- read here; his word is the base 0xca170). Status 10
// (tracer, partscr): (10, 7) every part -> 0x17f90a0 (L3 M1); (10, 0x14) parts 0..3 / 6 -> 0x17f90e0 (L3 M3), 4 / 7 -> 0x17f9438 (L3
// M5 -> wait 240 -> L3 M6 -> L3 M7), 5 -> 0x17f9460 (L3 M9 -> L3 M10 -> L3 M11); (10, 0x72) part 1 -> 0x17f95f0 (L3 M37 -> wait 480 ->
// L3 M10 -> L3 M11), part 6 -> 0x17f9560 (L3 M21) with vt+0x204 0x109f830's 0xc2274(e, 0, 0, 0x8f) (emulated) -- the TAIL SEVER at
// joint 143; sleep (10, 0x1d) 0x17f9110 (L0 M24 -> L0 M25 held), (10, 0x1e) L0 M25 held, (10, 0x44) 0x17f91c0 (L0 M26 -> L3 M16);
// paralysis (10, 0x1f) 0x17f91f8 (L3 M13 -> L3 M14 held); the stun (10, 0x20) sides 0 / 1 / 3 -> 0x17f92e0 (L3 M9 -> L3 M10 held ->
// L3 M11), side 2 -> 0x17f9300 (L3 M5 -> L3 M6 held -> L3 M7); recoveries L3 M16; no shock-trap or exhaust case; death (11, 0) L3
// M17. The part pass vt+0x210 0x10a1230, RUN with each part's level (ppemu.py): part 0 set 4 -> 5 -> 6 (the head: cracked, broken; u
// 1000 / 1001), 1 10 -> 11 (the back, u 1005), 2 13 -> 14 (left wing, u 1010), 3 26 -> 27 (right wing, u 1015), 4 17 -> 18 (u 1020), 5
// 19 -> 20 (u 1025); the tail set did not move with P+0x3b4 (bits 0 / 2 / 4 / 0x2000 / 0x4000 / 0x8000 tried). The eyes 0x71398(e, 3,
// 2, -1) (0x109e288): open 3, shut 2. Rage: g6 s0 = (1, 4) L0 M5. His puff is his own (vt+0x1d8 writes e+0xb7d2 = 0 at 0x109e17c).
MOTION_STATES.em086_00 = {
  '3|Motion[1]':   { cycle: [{ levels: [[4], [5], [6]], fire: [null, ['em086_00u', 1000], ['em086_00u', 1001]] },
                             { levels: [[10], [11]], fire: [null, ['em086_00u', 1005]] },
                             { levels: [[13], [14]], fire: [null, ['em086_00u', 1010]] },
                             { levels: [[26], [27]], fire: [null, ['em086_00u', 1015]] },
                             { levels: [[17], [18]], fire: [null, ['em086_00u', 1020]] },
                             { levels: [[19], [20]], fire: [null, ['em086_00u', 1025]] }] },
  '3|Motion[21]':  { start: [['em086_00u', 900]], drops: true },
  '0|Motion[24]':  { sets: [2] },
  '0|Motion[25]':  { sets: [2], every: [['em086_00c', 1102], 90] },
  '3|Motion[13]':  { every: [['em086_00c', 1101], 60] },
  '3|Motion[14]':  { every: [['em086_00c', 1101], 60] },
  '3|Motion[9]':   { hold: ['em086_00c', 1103] }, '3|Motion[9]#B': {},
  '3|Motion[10]':  { hold: ['em086_00c', 1103] }, '3|Motion[10]#B': {},
  '3|Motion[11]':  { hold: ['em086_00c', 1103] }, '3|Motion[11]#B': {},
  '3|Motion[5]':   { hold: ['em086_00c', 1103] }, '3|Motion[5]#B': {},
  '3|Motion[6]':   { hold: ['em086_00c', 1103] }, '3|Motion[6]#B': {},
  '3|Motion[7]':   { hold: ['em086_00c', 1103] }, '3|Motion[7]#B': {},
  '0|Motion[5]':   { rage: true }, '0|Motion[5]#B': {},
  '3|Motion[17]':  { dead: true, sets: [2] },
};
"""
assert s.count(a) == 1; s = s.replace(a, b + a)
a = "  em024_00: { '3|Motion[3]': ['A', 'B', 'C', 'D'],"
b = """  // VALSTRAX: the stun chains A / B the (10, 0x14) / (10, 0x72) twins; L0 M5 A the rage entry (1, 4) / B (1, 0xfe)
  em086_00: Object.fromEntries(['3|Motion[9]', '3|Motion[10]', '3|Motion[11]', '3|Motion[5]', '3|Motion[6]', '3|Motion[7]', '0|Motion[5]'].map(k => [k, ['A', 'B']])),
"""
assert s.count(a) == 1; s = s.replace(a, b + a)
open(p, 'w', encoding='utf8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\psl-mask.js'
s = open(p, encoding='utf8').read()
a = "  // KUSHALA (dev/em024_00-effects-spec.md 2; tracer): L0 M5 A the rage entry"
b = """  // VALSTRAX (dev/em086_00-effects-spec.md 3; tracer): the copies his state rows read
  em086_00: { ...Object.fromEntries(['3|Motion[9]', '3|Motion[10]', '3|Motion[11]', '3|Motion[5]', '3|Motion[6]', '3|Motion[7]'].map(k =>
                [k, [{ action: [10, 0x20] }, { action: [10, 0x14], variant: 'B' }]])),
              '0|Motion[5]': [{ action: [1, 0x04] }, { action: [1, 0xfe], variant: 'B' }] },
"""
assert s.count(a) == 1; s = s.replace(a, b + a)
open(p, 'w', encoding='utf8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\tail-option.js'
s = open(p, encoding='utf8').read()
a = "  em072_00: { piece: 'em072_00_tail', joint: 143, above: 20, landing: ['em072_00u', 905] },"
b = a + """
  // VALSTRAX (2026-10-18, dev/em086_00-effects-spec.md 3): vt+0x204 0x109f830 on (10, 0x72) with part 6 calls 0xc2274(e, 0, 0, 0x8f)
  // (emulated) -> JOINT 143. Descriptor [0x172ba68][132] = 0x159ba1c: word 1 0x8626 em086_00_tail, +0xb4 0x77ed. No +0x78 row: 20.
  em086_00: { piece: 'em086_00_tail', joint: 143, above: 20, landing: ['em086_00u', 905] },"""
assert s.count(a) == 1; s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
