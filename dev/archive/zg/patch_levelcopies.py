# The level-request copies (re-walk 2026-10-18, reqtrace.py): a clip whose u 1400 / u 1121 the class asks for on SOME of
# its plays only gets a copy for those plays; its other plays request nothing.
import re
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render'
def patch(path, pairs):
    s = open(path, encoding='utf8', newline='').read()
    NL = '\r\n' if s.count('\r\n') > s.count('\n') / 2 else '\n'
    for a, b in pairs:
        a2, b2 = a.replace('\n', NL), b.replace('\n', NL)
        assert s.count(a2) == 1, (path, a)
        s = s.replace(a2, b2)
    open(path, 'w', encoding='utf8', newline='').write(s)

SRC = '(reqtrace.py: the action main per action, all eight setMotion wrappers, 0xa499c and vt+0x1d0 / +0x1cc hooked; 2026-10-18)'
patch(V + r'\psl-mask.js', [
    ("const EM043_ACTIONS = {\n  '0|Motion[5]': [{ action: [1, 2] }, { action: [10, 0x2a] }],\n  '0|Motion[6]': [{ action: [2, 0] }, { action: [6, 3], posture: 4, sunk: true }],\n};",
     "const EM043_ACTIONS = {\n  '0|Motion[5]': [{ action: [1, 2] }, { action: [10, 0x2a] }],\n"
     "  // L0 M6 copy B: (6, 3) alone asks 0xa499c(e, 2) = u 1400 (0xe770a8); the walks (2, n) play it without " + SRC + "\n"
     "  '0|Motion[6]': [{ action: [2, 0] }, { action: [6, 3], posture: 4, sunk: true, variant: 'B' }],\n};"),
    ("const EM063_ACTIONS = {\n",
     "const EM063_ACTIONS = {\n"
     "  // L0 M10 copy B: the burrows (6, 2) / (6, 3) / (6, 6) ask u 1400 (0xf3ccbc / 0xf3cd9c); the walks (2, n) and the (7, n)\n"
     "  // plays set it with no request " + SRC + "\n"
     "  '0|Motion[10]': [{ action: null }, { action: [6, 2], posture: 4, variant: 'B' }],\n"),
    ("  em045_00: { ...EM045_ACTIONS, '0|Motion[6]': [{ action: [2, 2] }, { action: [6, 6], posture: 4, sunk: true }] },\n  em045_04: EM045_ACTIONS,",
     "  // L0 M6 copy B: (6, 3) / (6, 6) ask u 1400 (0xe941b0); the walks and (6, 2) play it with none " + SRC + "\n"
     "  em045_00: { ...EM045_ACTIONS, '0|Motion[6]': [{ action: [2, 2] }, { action: [6, 6], posture: 4, sunk: true, variant: 'B' }] },\n"
     "  em045_04: { ...EM045_ACTIONS, '0|Motion[6]': [{ action: [2, 2] }, { action: [6, 6], posture: 4, variant: 'B' }] },"),
    ("    '0|Motion[6]':  [{ action: [2, 0] }, { action: [6, 5], posture: 4, sunk: true }],\n    '0|Motion[15]': [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],",
     "    // L0 M6 copy B: (6, 5) / (6, 6) ask u 1400 (0xed6354); the walks and (6, 3) play it with none " + SRC + "\n"
     "    '0|Motion[6]':  [{ action: [2, 0] }, { action: [6, 5], posture: 4, sunk: true, variant: 'B' }],\n    '0|Motion[15]': [{ action: null }, { action: [6, 4], posture: 4, sunk: true }],"),
    ("  em007_04: {\n    '9|Motion[11]':",
     "  em007_04: {\n"
     "    // L0 M7's posture-4 plays are two copies: B the burrows asking 0xa499c(e, 2) = u 1400 ((6, 3 / 6 / 0x10 / 0x21..0x23 /\n"
     "    // 0x2a); 0xd3bfcc), C those asking 0xa499c(e, 1) = u 1121 ((6, 0xf / 0x17 / 0x1c / 0x1d / 0x24 / 0x25 / 0x28 / 0x29 /\n"
     "    // 0x2b / 0x2c); 0xd3c748) -- the word reads only the posture here, so one action stands for each " + SRC + "\n"
     "    '9|Motion[11]':"),
    ("    '0|Motion[5]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],\n    '0|Motion[7]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],\n  },\n  // DIABLOS (em007_00)",
     "    '0|Motion[5]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],\n"
     "    '0|Motion[7]':  [{ action: null, posture: 0 }, { action: [6, 3], posture: 4, variant: 'B' }, { action: [6, 0xf], posture: 4, variant: 'C' }],\n  },\n  // DIABLOS (em007_00)"),
    ("  em007_00: {\n    '0|Motion[5]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],\n    '0|Motion[7]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],",
     "  em007_00: {\n    '0|Motion[5]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],\n"
     "    // L0 M7 copies B (u 1400) / C (u 1121): as Bloodbath's, the same class code\n"
     "    '0|Motion[7]':  [{ action: null, posture: 0 }, { action: [6, 3], posture: 4, variant: 'B' }, { action: [6, 0xf], posture: 4, variant: 'C' }],"),
    ("  em004_00: {\n    '2|Motion[3]': [\n",
     "  em004_00: {\n"
     "    // L0 M7 copy B: (6, 3) asks u 1400 (0xd27be4); (7, 0x18 / 0x19 / 0x1a / 0x1d / 0x57) play it with none " + SRC + ".\n"
     "    // Gravios's (6, 3) asks it too, but em005_00u holds no key 1400 -- nothing to show, no copy for him.\n"
     "    '0|Motion[7]': [{ action: null }, { action: [6, 3], posture: 4, variant: 'B' }],\n"
     "    '2|Motion[3]': [\n"),
    ("  em004_00: {\n    // L0 M7 copy B",
     "  // AKANTOR, L0 M2 copy B: the burrows (6, 2 / 6 / 7 / 8) ask 0xa499c(e, 1) = u 1121 (0xe3a5c8) -- a request the viewer\n"
     "  // did not show; his other plays of L0 M2 (the walks, (7, n), (6, 3 / 9 / 0xc..0xf)) ask nothing " + SRC + "\n"
     "  em033_00: {\n    '0|Motion[2]': [{ action: null }, { action: [6, 2], posture: 4, variant: 'B' }],\n  },\n"
     "  em004_00: {\n    // L0 M7 copy B"),
])
CORR = '    // [CORRECTED 2026-10-18 (reqtrace.py): the class asks it on the plays listed in psl-mask.js CLIP_ACTIONS copy %s only, not on\n    //   every play of the clip.]\n'
patch(V + r'\motion-states.js', [
    ("    '0|Motion[7]':  { hold: ['em004_00u', 1400] },\n",
     CORR % 'B' + "    '0|Motion[7]':  {},\n    '0|Motion[7]#B': { hold: ['em004_00u', 1400] },\n"),
    ("    '0|Motion[10]': { hold: ['em063_00u', 1400] },\n",
     CORR % 'B' + "    '0|Motion[10]': {},\n    '0|Motion[10]#B': { hold: ['em063_00u', 1400] },\n"),
    ("    '0|Motion[10]': { hold: ['em063_05u', 1400] },\n",
     CORR % 'B' + "    '0|Motion[10]': {},\n    '0|Motion[10]#B': { hold: ['em063_05u', 1400] },\n"),
    ("    '0|Motion[6]':  { hold: ['em045_00u', 1400] },\n",
     CORR % 'B' + "    '0|Motion[6]':  {},\n    '0|Motion[6]#B': { hold: ['em045_00u', 1400] },\n"),
    ("    '0|Motion[6]':  { hold: ['em045_04u', 1400] },\n",
     CORR % 'B' + "    '0|Motion[6]':  {},\n    '0|Motion[6]#B': { hold: ['em045_04u', 1400] },\n"),
    ("    '0|Motion[6]':  { hold: ['em055_00u', 1400] },\n",
     CORR % 'B' + "    '0|Motion[6]':  {},\n    '0|Motion[6]#B': { hold: ['em055_00u', 1400] },\n"),
    ("    '0|Motion[6]':  { hold: ['em043_00u', 1400] },\n",
     CORR % 'B' + "    '0|Motion[6]':  {},\n    '0|Motion[6]#B': { hold: ['em043_00u', 1400] },\n"),
    ("    '0|Motion[6]':  { hold: ['em043_05u', 1400] },\n",
     CORR % 'B' + "    '0|Motion[6]':  {},\n    '0|Motion[6]#B': { hold: ['em043_05u', 1400] },\n"),
    ("    '0|Motion[7]':  { hold: ['em007_00u', 1400], posture: 4 },\n",
     CORR % 'B (u 1400) / C (u 1121)' + "    '0|Motion[7]':  {},\n    '0|Motion[7]#B': { hold: ['em007_00u', 1400], posture: 4 },\n    '0|Motion[7]#C': { hold: ['em007_00u', 1121], posture: 4 },\n"),
    ("    '0|Motion[7]':  { hold: ['em007_04u', 1400], posture: 4 },\n",
     CORR % 'B (u 1400) / C (u 1121)' + "    '0|Motion[7]':  {},\n    '0|Motion[7]#B': { hold: ['em007_04u', 1400], posture: 4 },\n    '0|Motion[7]#C': { hold: ['em007_04u', 1121], posture: 4 },\n"),
    ("  em044_00: { '0|Motion[6]': ['A', 'B', 'C'] },\n",
     "  em044_00: { '0|Motion[6]': ['A', 'B', 'C'] },\n"
     "  em004_00: { '0|Motion[7]': ['A', 'B'] }, em033_00: { '0|Motion[2]': ['A', 'B'] },\n"
     "  em043_00: { '0|Motion[6]': ['A', 'B'] }, em043_05: { '0|Motion[6]': ['A', 'B'] },\n"
     "  em045_00: { '0|Motion[6]': ['A', 'B'] }, em045_04: { '0|Motion[6]': ['A', 'B'] }, em055_00: { '0|Motion[6]': ['A', 'B'] },\n"
     "  em063_00: { '0|Motion[10]': ['A', 'B'] }, em063_05: { '0|Motion[10]': ['A', 'B'] },\n"),
])
print('ok')
