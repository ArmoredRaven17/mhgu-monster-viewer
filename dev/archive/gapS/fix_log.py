# fix_log.py: Raging's eruption hand-off as a LOG (shells lane, 2026-10-25). The timer (motion-states.js slime063) steps once per
# VIEWER frame; the shells step once per 1/60 s EFFECT step (live.js: `while (acc >= STEP)`), zero or several per viewer frame. The
# one-step `t.erupt` list was cleared at the next timer step, so a burn-out on a viewer frame that ran no effect step (a 144 Hz
# display, frame jitter, a scrub, a pause) never reached the shells. The log keeps each burn-out (id, slot, the state 0xf46234
# tested) until the shells have taken it.
import os
def patch(p, reps):
    d = open(p, 'rb').read().decode('utf-8')
    for a, b in reps:
        assert d.count(a) == 1, (p, a[:80])
        d = d.replace(a, b)
    open(p + '.tmp', 'wb').write(d.encode('utf-8'))
    os.replace(p + '.tmp', p)
    print('ok', p)
MS = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
patch(MS, [
    ("      if (s.fuse <= 0){ s.fuse = 0; s.held = false; s.cd = -1; s.erupted = true; t.erupt.push(k); }   // 0xf46234",
     "      if (s.fuse <= 0){ s.fuse = 0; s.held = false; s.cd = -1; s.erupted = true; t.erupt.push(k);   // 0xf46234\n"
     "        // ...and into the eruption LOG the shells take from (shells lane, 2026-10-25): this timer steps once per viewer frame, the\n"
     "        // shells once per 1/60 s effect step (zero or several a frame), so a one-step list is lost on a frame with no effect step;\n"
     "        // each entry keeps its id, its slot and the state 0xf46234 tested (col: still 2, the countdown -1 turns it next step)\n"
     "        t.eid = (t.eid | 0) + 1; (t.elog || (t.elog = [])).push({ id: t.eid, slot: k, col: s.col, n: t.seq });\n"
     "        if (t.elog.length > 32) t.elog.shift();\n"
     "      }"),
])
IX = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
patch(IX, [
    ("  return { slime063: t.lv.slice(), erupt063: t.erupt && t.erupt.length ? { slots: t.erupt.slice(), seq: t.seq } : undefined };",
     "  // erupt063.events: the timer's eruption LOG (every burn-out, id / slot / state; shells lane 2026-10-25), passed every step so a\n"
     "  // burn-out on a viewer frame without an effect step still reaches the shells (render/shells.js eruptStep063 takes each id once)\n"
     "  return { slime063: t.lv.slice(),\n"
     "           erupt063: (t.elog && t.elog.length) || (t.erupt && t.erupt.length)\n"
     "             ? { slots: (t.erupt || []).slice(), seq: t.seq, events: (t.elog || []).slice(), now: t.seq } : undefined };"),
])
