import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s = open(p, encoding='utf-8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
# Diablos: the cycle row goes; copies B / C carry the two records
rep("""    // the UNIQUE records by name (the SEQUENCE twins on keys 30 / 40 are cm202_000 / _001, the clip bits')
    '0|Motion[1]': { cycle: [{ hold: ['em007_00c', 30, 'UNIQUE'] }, { hold: ['em007_00c', 40, 'UNIQUE'] }] },""",
"""    // NOW COPIES, not a cycle (Raven, 2026-10-17: "Diablos L0, M1 has dust effect when it is not moving"): copy A is the
    // plain idle -- posture 0 (CLIP_POSTURE [0, 4]), and group-6 indices 19 / 45, which play this clip and request nothing --
    // and B / C carry the burrowed plays' held records (CLIP_VARIANTS below; the UNIQUE records by name: the SEQUENCE twins
    // on keys 30 / 40 are cm202_000 / _001, the clip bits').""")
n = s.index("  em007_04: {")
seg_end = s.index("\n  },", n)
seg = s[n:seg_end]
a = """    '0|Motion[1]': { cycle: [{ hold: ['em007_00c', 30, 'UNIQUE'] }, { hold: ['em007_00c', 40, 'UNIQUE'] },
                             { hold: ['em007_04u', 230, 'UNIQUE'] }] },"""
assert seg.count(a) == 1
seg = seg.replace(a, """    // NOW COPIES (as Diablos above): A the plain idle, B / C / D the burrowed plays' held records (CLIP_VARIANTS below)""")
s = s[:n] + seg + s[seg_end:]
rep("""  em088_00: { '3|Motion[16]': ['A', 'B'], '3|Motion[9]': ['A', 'B'] },
};""", """  em088_00: { '3|Motion[16]': ['A', 'B'], '3|Motion[9]': ['A', 'B'] },
  // DIABLOS / BLOODBATH L0 M1: A the plain idle (posture 0; nothing requested), then one copy per held record the burrowed
  // group-6 plays request (0xd3c418 / 0xd3c318: c 30, c 40, and Bloodbath's u 230)
  em007_00: { '0|Motion[1]': ['A', 'B', 'C'] },
  em007_04: { '0|Motion[1]': ['A', 'B', 'C', 'D'] },
};""")
rep("""MOTION_STATES.em056_00['3|Motion[3]#B'] = TRAP_B('em056_00c');""", """MOTION_STATES.em056_00['3|Motion[3]#B'] = TRAP_B('em056_00c');
for (const id of ['em007_00', 'em007_04'])
  Object.assign(MOTION_STATES[id], { '0|Motion[1]#B': { hold: ['em007_00c', 30, 'UNIQUE'] }, '0|Motion[1]#C': { hold: ['em007_00c', 40, 'UNIQUE'] } });
MOTION_STATES.em007_04['0|Motion[1]#D'] = { hold: ['em007_04u', 230, 'UNIQUE'] };""")
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(p + '.tmp', p)
print('ok')
