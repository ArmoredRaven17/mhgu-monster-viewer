import os
def patch(p, reps, crlf):
    d = open(p, 'rb').read().decode('utf-8'); N = '\r\n' if crlf else '\n'
    for a, b in reps:
        a = a.replace('\n', N); b = b.replace('\n', N)
        assert d.count(a) == 1, (p, a[:80])
        d = d.replace(a, b)
    open(p + '.tmp', 'wb').write(d.encode('utf-8')); os.replace(p + '.tmp', p); print('ok', p)
ARC = '<archive>' + chr(92) + 'gapS' + chr(92)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
d = open(R, 'rb').read().decode('utf-8').replace('\r\n', '\n')
anchor = [l for l in d.split('\n') if l.startswith('| em063 records exported `when: shell` -- 2026-10-25 |')]
assert len(anchor) == 1
row = ("| THE ERUPTION HAND-OFF -- fixed 2026-10-25 (Raven: \"the explosion doesn't render each time\") | the slime timer (motion-states.js slime063, CLASS_TIMERS) steps once per VIEWER frame; the shells once per 1/60 s EFFECT step (live.js `while (acc >= STEP)`: zero or several a frame). The burn-out list `t.erupt` lived one timer step, so a burn-out on a frame with no effect step was lost: real clicks, before the fix, 0 of 5 drew at a 144 Hz clock, 4 of 5 at a jittered 60, 5 of 5 at a steady 60 (the meter's forced 1/60, why it never saw it). FIX: the timer appends each burn-out to a log `t.elog` {id, slot, col (the state 0xf46234 tested), n}; index.html slimeShellInput passes it every step (`erupt063.events`, `now`); shells.js eruptStep063 makes each id once with its col (a fresh shell state skips entries > 30 timer steps old). The effects lane's companion: slime063 burns nothing on a fresh step (`dt = c.fresh ? 0 : c.dt`: a clip change, replay or backward scrub). AFTER: 60 of 60 eruption clicks drew u 210 (started 1, lit) over 144 Hz / jittered 60 / steady 60, camera x1 and x2.5, parts in turn, the same part after its re-arm, rapid, paused, scrubbed back / forward, Red Slime set mid-clip, four clips, a clip change during the fuse; 4 of 4 clicks on a part still Yellow made none, as 0xf36984 requires (state 2) | viewer | fixed | " + ARC + "slimeclick.mjs (one row per click), click_final.out / click_before.out; dev/shells-brachydios-check.mjs (the log cases); trap 154 |")
traps = [l for l in d.split('\n') if l.startswith('153. ')]
assert len(traps) == 1 and not any(l.startswith('154. ') for l in d.split('\n'))
trap = ("154. **An event handed between two clocks must be a log, not a one-step flag (2026-10-25, Raging's eruption).** The viewer's class timers "
        "step once per drawn frame, the effect runtime once per 1/60 s of animation -- zero or several a frame. A burn-out kept for one timer step "
        "reached the shells only when that frame happened to run an effect step: always under the meter (its getDelta is forced to 1/60), 0 of 5 at "
        "144 Hz. Pass events with ids and let the consumer take each once; and meter at more than one clock (" + ARC + "slimeclick.mjs).")
patch(R, [(anchor[0], anchor[0] + '\n' + row), (traps[0], traps[0] + '\n' + trap)], False)
S = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em063_00-effects-spec.md'
patch(S, [("* **Check**: `node dev/shells-brachydios-check.mjs` (stepShells on a stand-in pose: the modes, timers and keys above).",
           "* **Check**: `node dev/shells-brachydios-check.mjs` (stepShells on a stand-in pose: the modes, timers and keys above).\n"
           "* **The eruption hand-off (fixed 2026-10-25; Raven: \"the explosion doesn't render each time\")**: the slime timer steps once per viewer\n"
           "  frame and the shells once per 1/60 s effect step, so a burn-out kept for one timer step was lost on any frame that ran no effect step\n"
           "  (0 of 5 real clicks drew at a 144 Hz clock, 4 of 5 at a jittered 60). The timer now logs each burn-out (`t.elog`: id, slot, the state at\n"
           "  the burn-out) and the shells take each id once (eruptStep063); the effects lane's slime063 burns nothing on a fresh step (5b). Re-metered\n"
           "  with real clicks (" + ARC + "slimeclick.mjs, one row per click): 60 of 60 eruptions drew u 210 over three clocks, two camera\n"
           "  distances, parts in turn, the same part after its re-arm, rapid clicks, paused, scrubbed back / forward, Red Slime set mid-clip, four\n"
           "  clips and a clip change during the fuse. A click on a part that is still Yellow (the 60-frame re-arm and the 15-frame turns) makes no\n"
           "  eruption -- 0xf36984 needs it Red -- and adds 180 frames to its wait (0xf46f34): the rule, not a miss. rom-map trap 154.")], True)
