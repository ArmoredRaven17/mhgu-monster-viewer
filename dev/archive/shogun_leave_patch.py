import os
ROOT = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
def patch(rel, pairs):
    p = os.path.join(ROOT, rel)
    raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
    s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
    for old, new in pairs:
        assert s.count(old) == 1, (rel, old[:80], s.count(old))
        s = s.replace(old, new)
    if crlf: s = s.replace('\n', '\r\n')
    open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p)
    print('patched', rel)

patch(r'docs\render\beam-spawns.js', [
("""  // the start and one pass of its loop, 106 frames. Modes 1 / 3 (L9 M20) live 108 frames and end by themselves, 103
  // before the action's own end at the motion's (0xdcc00c); that action's turn, frames 50..56 toward the hunter's
  // bearing + 180 degrees (0x7840c, tune 0x25..0x27 / 0x29), follows a target the viewer does not have.
""",
"""  // the start and one pass of its loop, 106 frames. Modes 1 / 3 (L9 M20) live 108 frames and end by themselves, 103
  // before the action's own end at the motion's (0xdcc00c); that action's turn, frames 50..56 toward the hunter's
  // bearing + 180 degrees (0x7840c, tune 0x25..0x27 / 0x29), follows a target the viewer does not have. Shogun's mode 4
  // lives 2000 too: (7, 0x32) ends at M27's end (vt+0x3ec = 0x75388: action (0, 8), whose first update 0xdc61b0 sets
  // L5 M1, 0x501, on the ceiling), so his beam ends there -- in the viewer, at the replay of M27.
"""),
("""    { list: '2', clip: 'Motion[27]', frame: 50, type: 'em020_00:4', action: [7, 0x32], when: { part: { skull: true } } },
""",
"""    { list: '2', clip: 'Motion[27]', frame: 50, type: 'em020_00:4', action: [7, 0x32], when: { part: { skull: true } }, leave: { end: true } },
"""),
])
patch(r'docs\render\shells.js', [
("""  // a replay of a clip the game plays once: the play before reached the motion's end, past any `leave` of its beams
""",
"""  // a replay of a clip the game plays once is that action issued again (fresh, below): a beam whose action leaves its
  // motion (`leave`) is gone by then -- each such action begins on another motion (Rustrazor's L9 M2 / M5 and L2 M73,
  // Shogun's after action (0, 8)'s L5 M1), which ends it by +0x170 if nothing did earlier
"""),
])
