import os
ARC = '<archive>' + chr(92) + 'gapT' + chr(92)
def patch(p, reps):
    raw = open(p, 'rb').read().decode('utf-8')
    for a, b, mode in reps:
        lines = raw.split('\n')
        idx = [i for i, l in enumerate(lines) if l.rstrip('\r').startswith(a)]
        assert len(idx) == 1, (p, a[:70], len(idx))
        i = idx[0]; end = '\r' if lines[i].endswith('\r') else ''
        if mode == 'after': lines[i + 1:i + 1] = [x + end for x in b.split('\n')]
        elif mode == 'append': lines[i] = lines[i].rstrip('\r') + b + end
        raw = '\n'.join(lines)
    open(p + '.tmp', 'wb').write(raw.encode('utf-8')); os.replace(p + '.tmp', p); print('ok', p)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
patch(R, [
  ("| THE ACTION CLOCK -- built 2026-10-26 (shells lane; trap 162) |",
   " **[RE-CHECKED 2026-10-26 against the combined lane's read wait (111; spec 4): the test above (\"the clip rows' (prev, cur] on the previous advance\") is SUPERSEDED -- the clock counts the action's UPDATES and a row is due on the update its count reaches N (`passAct`: actPrev < N <= actNow): the update that starts the action is 0, its first phase-1 update 1. So (1, 8)'s lift is made on update 1, moves 110 times in states 1 / 2 and is out of them on update 111 -- the 111-frame wait (shells-neset-lift-check: made 1, live 110, out 111). The previous-advance form made both lifts one update late (2 / 42), which on his own entry is how the clip rows had made them.]**", 'append'),
  ("| Neset's lifts metered on the page (2026-10-26) |",
   " **[RE-METERED 2026-10-26 on the update clock and the re-timed entries (re-entry 965 frames): raise -- (1, 0x15) piece from f1164, k 0 made f1165 (update 1), k 1 f1205 (update 41), 59 + 51 frames each, u 320 / u 70 draw; re-entry -- Neset's partner runtime shows the (1, 8) piece from entry f302 (L3 M12 to f301): k 1 made f303 (update 1), in states 1 / 2 to f412, out at f413 = update 111, the frame his L0 M9 leaves 0 (@1.00) -- the lift's end and the hold's end on the same update; u 320 / u 70 draw. Own entry: k 0 / k 1 at clip f2 / f41, (1, 8) k 1 at f2 (one update earlier than before, the ROM's update 1). The partner runtime's hand-off at f302 against the spec's 301 is the combined entries' framing (" + ARC + "probe2.out), not the shells'.]**", 'append'),
])
C = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em088-em087-combined-spec.md'
patch(C, [
  ("  u 70). His own L0 M9 entry is as before. dev/shells-neset-lift-check.mjs; rom-map \"THE ACTION CLOCK\".",
   " **Re-checked against the 111 wait (2026-10-26)**: the clock counts the action's updates (made on update 1); the (1, 8) lift is out of\n"
   "  states 1 / 2 on update 111 -- on the page the partner runtime shows the (1, 8) piece from entry f302, the lift made f303, out at f413, the\n"
   "  frame his L0 M9 leaves 0. The (1, 0x15) lifts: f1165 / f1205 (updates 1 / 41). His own entry's lifts now come one update earlier (clip\n"
   "  f2 / f41), the ROM's update 1. One frame to check on this side: the partner runtime takes the (1, 8) piece at f302, the table above says\n"
   "  301 (" + ARC + "probe2.out: L3 M12 through f301).", 'append'),
])
