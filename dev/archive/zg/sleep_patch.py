p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s = open(p, encoding='utf8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:90])
    s = s.replace(a, b)
# KUSHALA: the hold is the clip (10, 0x1d) left running -- L3 M55
rep("""  '3|Motion[10]':   { sets: [6], every: [['em024_00c', 1102], 90], puffOff: true },""",
"""  // THE SLEEP HOLD (READ 2026-10-18; dev/em024_00-effects-spec.md 6): (10, 0x1e)'s script 0x17b4370 is op 1 -> 0x17b42bc and end,
  // and the stepper's op 0 / 1 / 2 arm 0x9f33c stores the record at P+0x560 and calls setMotion only for ops 0 / 2 / 0x35
  // (0x9fea8..0x9febc): op 1 SETS NO MOTION (the tracer: no motion call), so the hold is the clip (10, 0x1d) left running -- L3 M55,
  // its last op. (L3 M10 was taken for it from the word 0x30a in that record, INFERRED -- withdrawn, rom-map.)
  '3|Motion[55]':   { sets: [6], every: [['em024_00c', 1102], 90], puffOff: true },""")
# TEOSTRA: L3 M17, copy B
rep("""  '3|Motion[5]':    { hold: ['em027_00c', 1103] }, '3|Motion[5]#B': {},
  '3|Motion[5]#C':  { every: [['em027_00c', 1102], 90], puffOff: true },""",
"""  '3|Motion[5]':    { hold: ['em027_00c', 1103] }, '3|Motion[5]#B': {},
  // THE SLEEP HOLD (READ 2026-10-18; spec 6): (10, 0x1e) 0x17b7210 = op 1 -> 0x17b739c, end -- no motion (0x9fea8), so the clip
  // (10, 0x1d) 0x17b7240 left running: L3 M17, its last op. Copy B = the sleep's plays; A his other L3 M17 plays ((1, 8), the wake
  // (10, 0x44)). (L3 M5 copy C was the record's words read as a script -- withdrawn.)
  '3|Motion[17]':   {}, '3|Motion[17]#B': { every: [['em027_00c', 1102], 90], puffOff: true },""")
rep("""  em027_00: { '3|Motion[3]': ['A', 'B', 'C', 'D'], '3|Motion[5]': ['A', 'B', 'C'], '3|Motion[7]': ['A', 'B'], '0|Motion[5]': ['A', 'B'],""",
    """  em027_00: { '3|Motion[3]': ['A', 'B', 'C', 'D'], '3|Motion[5]': ['A', 'B'], '3|Motion[17]': ['A', 'B'], '3|Motion[7]': ['A', 'B'], '0|Motion[5]': ['A', 'B'],""")
open(p, 'w', encoding='utf8', newline='').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\psl-mask.js'
s = open(p, encoding='utf8', newline='').read()
rep("""              '3|Motion[5]': [{ action: [10, 0x20] }, { action: [10, 0x07], variant: 'B' }, { action: [10, 0x1e], variant: 'C' }],
              // THE NOVA""", """              '3|Motion[5]': [{ action: [10, 0x20] }, { action: [10, 0x07], variant: 'B' }],
              // the sleep hold: (10, 0x1d)'s last clip, held through (10, 0x1e) (op 1 sets no motion -- motion-states.js)
              '3|Motion[17]': [{ action: [1, 0x08] }, { action: [10, 0x44] }, { action: [10, 0x1d], variant: 'B' }, { action: [10, 0x1e], variant: 'B' }],
              // THE NOVA""")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')
