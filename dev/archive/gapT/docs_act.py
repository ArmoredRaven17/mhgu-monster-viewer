import os
ARC = '<archive>' + chr(92) + 'gapT' + chr(92)
def patch(p, reps):
    raw = open(p, 'rb').read().decode('utf-8')
    for a, b, mode in reps:
        lines = raw.split('\n')
        idx = [i for i, l in enumerate(lines) if l.rstrip('\r').startswith(a)]
        assert len(idx) == 1, (p, a[:70], len(idx))
        i = idx[0]; end = '\r' if lines[i].endswith('\r') else ''
        new = [x + end for x in b.split('\n')]
        if mode == 'after': lines[i + 1:i + 1] = new
        elif mode == 'append': lines[i] = lines[i].rstrip('\r') + b + end
        raw = '\n'.join(lines)
    open(p + '.tmp', 'wb').write(raw.encode('utf-8')); os.replace(p + '.tmp', p); print('ok', p)

R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
patch(R, [
  ("| `0x10b029c` (Neset (1, 0x15)), `0xb0968` mode 2 |",
   "| THE ACTION CLOCK -- built 2026-10-26 (shells lane; trap 162) | render/shells.js stepShells: `state.actNow` counts game frames (dt) from the ACTION's start -- a fresh motion (from the clip's own advance, frame - f0, so a play from the clip's start counts as its frames) or a change of the row the step resolves on a running clip (a combined list's piece naming another action: from 0); `state.actHist` its advance, `passAct` the test, the clip rows' (prev, cur] on the previous advance. Rows `{ act: N }` use it (spawn087). Neset's lifts re-keyed: (1, 0x15) `{ act: 1 }` k 0 / `{ act: 41 }` k 1, (1, 8) `{ act: 1 }` k 1 (0x10b029c / 0x10afc44: \"on the first move\", tune 0x36 = 40 later) | viewer | built | dev/shells-neset-lift-check.mjs 5 / 5 (the pre-change module fails its two combined cases: none / k 1 at step 118 -- the positive control); page: " + ARC + "liftmeter.mjs, lift_after.out |\n"
   "| Neset's lifts metered on the page (2026-10-26) | **combined**: \"raises Ahtal-Neset and enters it\" -- the (1, 0x15) piece from entry f1164 (L0 M9 @230): k 0 first seen f1166 (L0 M9 @231.2), k 1 f1206 (@255.2), each 59 + 51 frames in states 1 / 2, u 320 st 2 draws, u 70 st 2 draws; \"re-enters, Neset rises again\" -- the (1, 8) piece (L0 M9 held at 0): k 1 first seen f306 (@0.0, during the hold, not after it), 59 + 51 frames -- the 112-frame wait the entry holds -- u 320 / u 70 draw. **His own entry** unchanged: raw L0 M9 (1, 0x15) k 0 at clip f3 / k 1 f42, (1, 8) k 1 f3 (as before the change) | em087_00 | measured | " + ARC + "lift_after.out |", 'after'),
  ("162. **A shell row keyed on a CLIP frame is not the ROM's",
   " [2026-10-26, shells lane: ANSWERED -- the shells' action clock (`{ act: N }` rows, stepShells actNow / passAct); the lifts re-keyed and metered on both combined entries, his own entry unchanged; rom-map row \"THE ACTION CLOCK\".]", 'append'),
])
C = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em088-em087-combined-spec.md'
patch(C, [
  ("* The (1, 0x15) / (1, 8) lift rows on action time (shells lane).",
   " -> **Done 2026-10-26 (shells lane)**: rows `{ act: N }` on the shells' action clock (frames from the action's start: a fresh motion, or a\n"
   "  piece naming another action on the same clip). Metered: the raise entry's (1, 0x15) piece makes k 0 at f1166 and k 1 at f1206 (L0 M9\n"
   "  @231 / @255); the re-entry's (1, 8) piece makes k 1 at f306, inside the 112-frame hold (it used to come after it); both draw (u 320,\n"
   "  u 70). His own L0 M9 entry is as before. dev/shells-neset-lift-check.mjs; rom-map \"THE ACTION CLOCK\".", 'append'),
])
E = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\effect-runtime-engine.md'
patch(E, [
  ("- The frame step every move reads: the unit's +0x1c (dt) or the global `[[0x211f764]+0x68]`.",
   "- **Clip frame vs action frame** (2026-10-26): a maker's frame test reads the ACTION's own counters (dt timers, \"on the first\n"
   "  move\", `0xb0968` on the motion it set) -- the same thing as the clip frame only while the action plays its motion from 0 at rate 1. An\n"
   "  action that enters its motion mid-way (Ahtal-Neset's (1, 0x15): L0 M9 from 230.0 at 0.6) or holds it (his (1, 8): rate 0) needs the\n"
   "  count from the action's start; the viewer keeps both (render/shells.js: clip rows `frame`, action rows `act`; rom-map trap 162).", 'after'),
])
