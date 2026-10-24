p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s = open(p, encoding='utf8').read()
a = "  '3|Motion[18]':   { dead: true },\n};\n"
i = s.index("MOTION_STATES.em027_00 = {")
j = s.index(a, i)
b = """  '3|Motion[18]':   { dead: true },
  // THE NOVA (dev/em027_00-effects-spec.md 4; 0xe17ce8, READ + traced -- nova027.py): nine actions call it with a selector, (7, 5) 0,
  // (7, 7) 1, (7, 0x1a) 2, (7, 0x1b) 3, (7, 0x22) 4, (7, 0x23) 5, (7, 0x24) 6, (7, 0x28) 7, (7, 0x29) 8. Phase 0 sets L4 M9 (rate 1.5)
  // and requests into e+0xcacc: selectors 0 / 1 / 3 id 1006 (u 160), 2 / 4 1008 (u 161), 5 1010 then 1011 (u 162, u 164), 6 1012 then
  // 1013 (u 163, u 165), 7 / 8 nothing; when L4 M9 ends (0xb09c8, P+0x1a2 counting its replays down) phase 2 sets L4 M10, and at its
  // frame 50 (0xb0974(e, 50.0)) the held handle is stopped (0x329c40), the nova shell spawned, and id 1007 (u 170) / 1009 (u 171) /
  // 1014 (u 172) / 1015 (u 173) requested (7 / 8: the shell alone). The word stops e+0xcacc on every motion but L4 M9 -- the charge
  // record is held for L4 M9 and no longer. Keys by vt+0x1d0 0xe1aaf4 through [0x169d724]. (The old handle replaced in phase 0 gets
  // its vmethod +0x40, not read: u 162 / u 163 are kept running beside u 164 / u 165 -- I.)
  '4|Motion[9]':    { hold: ['em027_00u', 160, 'UNIQUE'] },
  '4|Motion[9]#B':  { hold: ['em027_00u', 161, 'UNIQUE'] },
  '4|Motion[9]#C':  { hold: ['em027_00u', 162, 'UNIQUE'], start: [['em027_00u', 164, 'UNIQUE']] },
  '4|Motion[9]#D':  { hold: ['em027_00u', 163, 'UNIQUE'], start: [['em027_00u', 165, 'UNIQUE']] },
  '4|Motion[9]#E':  {},
  '4|Motion[10]':   { fireFrom: [[50, [['em027_00u', 170, 'UNIQUE']]]] },
  '4|Motion[10]#B': { fireFrom: [[50, [['em027_00u', 171, 'UNIQUE']]]] },
  '4|Motion[10]#C': { fireFrom: [[50, [['em027_00u', 172, 'UNIQUE']]]] },
  '4|Motion[10]#D': { fireFrom: [[50, [['em027_00u', 173, 'UNIQUE']]]] },
  '4|Motion[10]#E': {},
};
"""
s = s[:j] + b + s[j + len(a):]
a = "  em027_00: { '3|Motion[3]': ['A', 'B', 'C', 'D'], '3|Motion[5]': ['A', 'B', 'C'], '3|Motion[7]': ['A', 'B'], '0|Motion[5]': ['A', 'B'] },"
b = "  em027_00: { '3|Motion[3]': ['A', 'B', 'C', 'D'], '3|Motion[5]': ['A', 'B', 'C'], '3|Motion[7]': ['A', 'B'], '0|Motion[5]': ['A', 'B'],\n              '4|Motion[9]': ['A', 'B', 'C', 'D', 'E'], '4|Motion[10]': ['A', 'B', 'C', 'D', 'E'] },"
assert s.count(a) == 1; s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\psl-mask.js'
s = open(p, encoding='utf8').read()
a = "              '3|Motion[5]': [{ action: [10, 0x20] }, { action: [10, 0x07], variant: 'B' }, { action: [10, 0x1e], variant: 'C' }] },"
b = """              '3|Motion[5]': [{ action: [10, 0x20] }, { action: [10, 0x07], variant: 'B' }, { action: [10, 0x1e], variant: 'C' }],
              // THE NOVA (motion-states.js em027_00): L4 M9 / M10 by the nova selector -- A 0 / 1 / 3, B 2 / 4, C 5, D 6, E 7 / 8 (L4 M10 E
              // also the other plays of it, (2, 0x20), (7, 0x2a..0x2e))
              '4|Motion[9]':  [...[0x05, 0x07, 0x1b].map(n => ({ action: [7, n] })), ...[0x1a, 0x22].map(n => ({ action: [7, n], variant: 'B' })),
                               { action: [7, 0x23], variant: 'C' }, { action: [7, 0x24], variant: 'D' }, ...[0x28, 0x29].map(n => ({ action: [7, n], variant: 'E' }))],
              '4|Motion[10]': [...[0x05, 0x07, 0x1b].map(n => ({ action: [7, n] })), ...[0x1a, 0x22].map(n => ({ action: [7, n], variant: 'B' })),
                               { action: [7, 0x23], variant: 'C' }, { action: [7, 0x24], variant: 'D' },
                               ...[[7, 0x28], [7, 0x29], [2, 0x20], [7, 0x2a], [7, 0x2b], [7, 0x2c], [7, 0x2d], [7, 0x2e]].map(a => ({ action: a, variant: 'E' }))] },"""
assert s.count(a) == 1; s = s.replace(a, b)
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
