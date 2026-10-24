import os
os.chdir(r'C:\MHGU-Extract\MHGU-Monster-Viewer')
SV = 'dev/amphibians-piscine-effects-survey.md'


def patch(p, pairs):
    b = open(p, 'rb').read(); s = b.decode('utf-8'); crlf = '\r\n' in s; s = s.replace('\r\n', '\n')
    for a, r in pairs:
        assert s.count(a) == 1, (p, a[:70], s.count(a)); s = s.replace(a, r)
    if crlf: s = s.replace('\n', '\r\n')
    open(p, 'wb').write(s.encode('utf-8'))


patch('docs/render/motion-states.js', [
("""    // TAIL depletion -- which his +0x23c routes to (10, 0x14) rather than (10, 7) -- and the exhaust status, so the
    // three take turns.
    '3|Motion[2]':  { cycle: [{ levels: [[3], [18]], fire: [null, ['em067_00u', 1000]] },
                              { levels: [[2], [22]], fire: [null, ['em067_00u', 1030]] },
                              { start: [['em067_00c', 1109]] }] },""",
"""    // TAIL depletion -- which his +0x23c routes to (10, 0x14) rather than (10, 7) -- and the exhaust status, so the
    // three take turns. THE SHOCK TRAP is a fourth: (10, 0x6e) plays L3 M2 (P+0x568 = 60) and then holds L3 M13, with
    // c 1105 every 42 (cm200_001, joint 1, 5x) while the action lasts (states-em067_00.md 72 / 820, via """ + SV + """).
    '3|Motion[2]':  { cycle: [{ levels: [[3], [18]], fire: [null, ['em067_00u', 1000]] },
                              { levels: [[2], [22]], fire: [null, ['em067_00u', 1030]] },
                              { start: [['em067_00c', 1109]] },
                              { every: [['em067_00c', 1105], 42] }] },
    // THE BLOATED POSTURE (posture 2) plays its own ailment clips (states-em067_00.md 815-822, via """ + SV + """):
    // L3 M100 is the stun's start (c 1103 held) AND the shock trap's start (c 1105 every 42), so the two take turns;
    // L4 M1 holds the stun (the same c 1103 handle); L3 M101 is the paralysis hold (c 1101 every 60) and also the trap's
    // hold from frame 20 -- shown as paralysis, as every shared hold is. L3 M102 is every recovery (no row: it drops the
    // held c 1103). His bloated sleep hold plays no motion, so its c 1102 has no clip to sit on.
    '3|Motion[100]': { cycle: [{ hold: ['em067_00c', 1103] }, { every: [['em067_00c', 1105], 42] }] },
    '4|Motion[1]':   { hold: ['em067_00c', 1103] },
    '3|Motion[101]': { every: [['em067_00c', 1101], 60] },"""),
("""    // exhaust status (10, 0x1b) -- so it CYCLES, one per play, as Malfestio's L3 M2 does. It is also the shock
    // trap's first 52 frames, which shows nothing of its own.""",
"""    // exhaust status (10, 0x1b) -- so it CYCLES, one per play, as Malfestio's L3 M2 does. It is also the shock
    // trap's first 52 frames (P+0x568 = 52, then the L3 M9 hold), with c 1105 every 42 (cm200_001, joint 1, 4x) while the
    // action lasts: a fourth turn (states-em010_00.md 92 / 653, via """ + SV + """). [2026-10-15: this said the trap's
    // start "shows nothing of its own" -- written before c 1105 was wired anywhere; withdrawn, as on the dromes.]"""),
("""                              { levels: [[1], [1], [6]], fire: [null, null, ['em010_00u', 1011]] },
                              { start: [['em010_00c', 1109]] }] },""",
"""                              { levels: [[1], [1], [6]], fire: [null, null, ['em010_00u', 1011]] },
                              { start: [['em010_00c', 1109]] },
                              { every: [['em010_00c', 1105], 42] }] },"""),
])
print('ok')
