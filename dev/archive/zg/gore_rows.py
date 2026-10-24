p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s = open(p, encoding='utf8').read()
a = "// ZAMTRIOS's u 60 (dev/em067_00-effects-spec.md 3;"
b = """// THE GORE LINE's states (dev/em071-em072-effects-spec.md 3; NO states note existed -- read here; uEm071_00 runs Gore em 0x47,
// Chaotic em 0x47 variant 5 and Shagaru em 0x48). Status 10 (tracer, partscr; all three the same): (10, 7) parts 0 / 6 / 7 -> 0x17e50f0
// (L3 M2), 1 / 2 / 3 / 5 -> 0x17e5100 (L3 M1), 4 -> 0x17e5528 (L3 M3 -> wait 240 -> L3 M4 -> L3 M5); (10, 0x14) parts 3 / 7 -> L3 M1,
// 5 -> 0x17e5578 (L3 M9 -> L3 M10 -> L3 M11); the exhaust (10, 0x1b) -> L3 M2; (10, 0x72) part 6 -> 0x17e5140 (L3 M39) with vt+0x204
// 0xfadfa0's 0xc2274(e, 0, 0, 0x8f) (emulated) -- the TAIL SEVER at joint 143 -- the other parts 0x17e5150 (L3 M18); sleep (10, 0x1d)
// 0x17e5170 (L0 M18 -> L0 M19 held), (10, 0x1e) L0 M19 held; paralysis (10, 0x1f) 0x17e51a0 (L3 M15 held); the shock trap (10, 0x6e)
// 0x17e5250 (L3 M15); the stun (10, 0x20) sides 0 / 1 / 3 -> 0x17e53e0 (L3 M9 -> L3 M10 held -> L3 M11), side 2 -> 0x17e5400 (L3 M3 ->
// L3 M4 held -> L3 M5); recoveries L3 M17; death (11, 0) 0x17e53b0 (L3 M22 -> L3 M21), (11, 7 / 0x12) L3 M34, capture (11, 0x10) L0
// M18. Tired (0, 2) L3 M23. The part pass vt+0x210 0xfbf97c, RUN with each part's level (ppemu.py; control: Lao-Shan's static read
// reproduced): Gore -- part 0 set 1 -> 2 (the head, u 1000), part 7 5 -> 6 (the feelers, u 1035), part 3 9 -> 10 (the wing arms, u
// 1015), part 2 11 -> 12 (the wings, u 1010); Chaotic -- 0: 1 -> 2, 7: 11 -> 12 (his right wing arm), 3: 9 -> 10, 2: 13 -> 14; Shagaru
// -- 0: 3 -> 10 at level 1, 11 + 10 at level 2 (the horns, u 1000 / 1001), 3: 5 -> 8, 2: 4 -> 9, part 7 nothing. The tail set never
// changed in those runs (P+0x3b4 bits 0 / 0x2000): the cut tail's piece and u 900 show it. The eyes: Shagaru only, 0x71398(e, 1, 7,
// -1) at 0xfadcc8 (em 0x48) -- shut set 7. Rage: g6 s0 -> Shagaru (7, 0x53) L4 M2, else (1, 0) L0 M5 / (1, 3) L0 M31.
{ const gore = (u, cPel, v) => {
    const M2 = v === 'shagaru' ? [{ levels: [[3], [10], [11, 10]], fire: [null, [u, 1000], [u, 1001]] }]
             : [{ levels: [[1], [2]], fire: [null, [u, 1000]] }, { levels: v === 'chaotic' ? [[11], [12]] : [[5], [6]], fire: [null, [u, 1035]] }];
    const M1 = v === 'shagaru' ? [{ levels: [[4], [9]], fire: [null, [u, 1010]] }, { levels: [[5], [8]], fire: [null, [u, 1015]] }]
             : [{ levels: v === 'chaotic' ? [[13], [14]] : [[11], [12]], fire: [null, [u, 1010]] }, { levels: [[9], [10]], fire: [null, [u, 1015]] }];
    const shut = v === 'shagaru' ? { sets: [7] } : {};
    const all = v !== 'shagaru';                         // Shagaru's c.pel has no 1104 / 1105 / 1109
    return {
      '3|Motion[2]':    { cycle: all ? [...M2, { start: [[cPel, 1109]] }] : M2 },
      '3|Motion[1]':    { cycle: M1 },
      '3|Motion[39]':   { start: [[u, 900]], drops: true },
      '0|Motion[18]':   Object.assign({}, shut),
      '0|Motion[19]':   Object.assign({ every: [[cPel, 1102], 90], puffOff: true }, shut),
      '3|Motion[15]':   { every: [[cPel, 1101], 60] },
      '3|Motion[15]#B': all ? { every: [[cPel, 1105], 42] } : {},
      '3|Motion[9]':    { hold: [cPel, 1103] }, '3|Motion[9]#B': {},
      '3|Motion[10]':   { hold: [cPel, 1103] }, '3|Motion[10]#B': {},
      '3|Motion[11]':   { hold: [cPel, 1103] }, '3|Motion[11]#B': {},
      '3|Motion[3]':    { hold: [cPel, 1103] }, '3|Motion[3]#B': {},
      '3|Motion[4]':    { hold: [cPel, 1103] }, '3|Motion[4]#B': {},
      '3|Motion[5]':    { hold: [cPel, 1103] }, '3|Motion[5]#B': {},
      '3|Motion[23]':   { rage: false, tired: true },
      '0|Motion[5]':    { rage: true }, '0|Motion[5]#B': {},
      '0|Motion[31]':   { rage: true }, '0|Motion[31]#B': {},
      ...(v === 'shagaru' ? { '4|Motion[2]': { rage: true } } : {}),
      '3|Motion[22]':   Object.assign({ dead: true }, shut),
      '3|Motion[21]':   Object.assign({ dead: true, settled: true }, shut),
      '3|Motion[34]':   Object.assign({ dead: true }, shut),
    };
  };
  MOTION_STATES.em071_00 = Object.assign(MOTION_STATES.em071_00 || {}, gore('em071_00u', 'em071_00c', 'gore'));
  MOTION_STATES.em071_05 = Object.assign(MOTION_STATES.em071_05 || {}, gore('em071_05u', 'em071_00c', 'chaotic'));
  MOTION_STATES.em072_00 = Object.assign(MOTION_STATES.em072_00 || {}, gore('em072_00u', 'em072_00c', 'shagaru')); }
"""
assert s.count(a) == 1; s = s.replace(a, b + a)
a = "  em071_00: { '2|Motion[7]': ['A', 'B', 'C'] }, em071_05: { '2|Motion[7]': ['A', 'B', 'C'] }, em072_00: { '2|Motion[7]': ['A', 'B', 'C'] },"
b = """  em071_00: { '2|Motion[7]': ['A', 'B', 'C'], ...GORE_COPIES }, em071_05: { '2|Motion[7]': ['A', 'B', 'C'], ...GORE_COPIES },
  em072_00: { '2|Motion[7]': ['A', 'B', 'C'], ...GORE_COPIES },"""
assert s.count(a) == 1; s = s.replace(a, b)
a = "export const CLIP_VARIANTS = {"
b = """// THE GORE LINE's state copies: L3 M15 A paralysis / B the shock trap; the stun chains A / B their part-4 / part-5 twins; L0 M5 /
// M31 A the rage entries (1, 0) / (1, 3), B their other plays
const GORE_COPIES = Object.fromEntries(['3|Motion[15]', '3|Motion[9]', '3|Motion[10]', '3|Motion[11]', '3|Motion[3]', '3|Motion[4]', '3|Motion[5]',
                                        '0|Motion[5]', '0|Motion[31]'].map(k => [k, ['A', 'B']]));
"""
assert s.count(a) == 1; s = s.replace(a, b + a)
open(p, 'w', encoding='utf8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\psl-mask.js'
s = open(p, encoding='utf8').read()
a = """    '2|Motion[7]': [{ action: [7, 0x58] }, { action: [7, 0x60], variant: 'B' },
                    ...[0x52, 0x59, 0x5b, 0x5e, 0x5f, 0x61, 0x67].map(n => ({ action: [7, n], variant: 'C' }))] }])),"""
b = """    '2|Motion[7]': [{ action: [7, 0x58] }, { action: [7, 0x60], variant: 'B' },
                    ...[0x52, 0x59, 0x5b, 0x5e, 0x5f, 0x61, 0x67].map(n => ({ action: [7, n], variant: 'C' }))],
    '3|Motion[15]': [{ action: [10, 0x1f] }, { action: [10, 0x6e], variant: 'B' }],
    ...Object.fromEntries(['3|Motion[9]', '3|Motion[10]', '3|Motion[11]'].map(k => [k, [{ action: [10, 0x20] }, { action: [10, 0x14], variant: 'B' }]])),
    ...Object.fromEntries(['3|Motion[3]', '3|Motion[4]', '3|Motion[5]'].map(k => [k, [{ action: [10, 0x20] }, { action: [10, 0x07], variant: 'B' }]])),
    '0|Motion[5]':  [{ action: [1, 0x00] }, ...[[1, 0x14], [1, 0x16], [13, 0x07], [13, 0x0a], [13, 0x0b]].map(a => ({ action: a, variant: 'B' }))],
    '0|Motion[31]': [{ action: [1, 0x03] }, { action: [1, 0x08], variant: 'B' }, { action: [1, 0x17], variant: 'B' }] }])),"""
assert s.count(a) == 1; s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\tail-option.js'
s = open(p, encoding='utf8').read()
a = "  em027_00: { piece: 'em027_00_tail', joint: 143, above: 20, landing: ['em027_00u', 905] },"
b = a + """
  // THE GORE LINE (2026-10-18, dev/em071-em072-effects-spec.md 3): vt+0x204 0xfadfa0 on (10, 0x72) with part 6 calls 0xc2274(e, 0, 0,
  // 0x8f) (emulated, all three) -> JOINT 143. Descriptors [0x172ba68][59] / [127] / [60]: word 1 0x7e84 em071_00_tail / 0x85b3
  // em071_05_tail / 0x7ea6 em072_00_tail, +0xb4 0x77ed. No +0x78 row on Gore or Shagaru: the shared 20.
  em071_00: { piece: 'em071_00_tail', joint: 143, above: 20, landing: ['em071_00u', 905] },
  em071_05: { piece: 'em071_05_tail', joint: 143, above: 20, landing: ['em071_05u', 905] },
  em072_00: { piece: 'em072_00_tail', joint: 143, above: 20, landing: ['em072_00u', 905] },"""
assert s.count(a) == 1; s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
