import os
ROOT = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
def patch(rel, pairs):
    p = os.path.join(ROOT, rel)
    raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
    s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
    for old, new in pairs:
        assert s.count(old) == 1, (rel, old[:70], s.count(old))
        s = s.replace(old, new)
    if crlf: s = s.replace('\n', '\r\n')
    open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p)
    print('patched', rel)

patch(r'docs\render\rom\effect\schedule.js', [
("""  setClip(key, frame, motion, start = 0, mask = null, play = null){ this.clip = { key, frame, motion: motion || null, start, mask, play }; }""",
 """  // `loop`: the frame is in the motion's LOOP (a _loop clip, or a Special entry's folded cycle) -- so a loop starting at 0
  // (a motion shipped as a _loop piece alone) still reads as a loop to the shells, not as the action issued again
  setClip(key, frame, motion, start = 0, mask = null, play = null, loop = false){ this.clip = { key, frame, motion: motion || null, start, mask, play, loop: !!loop }; }"""),
("""                                      loopStart: c && c.start ? c.start : null, joints: S.joints, rage: this.rage,""",
 """                                      loopStart: c && (c.start || c.loop) ? c.start : null, joints: S.joints, rage: this.rage,"""),
])
patch(r'docs\index.html', [
("""                      base ? clipEffectsFor(state.id, base, state.list) : null, splitOffset, mask, mask != null ? play.token : null);""",
 """                      base ? clipEffectsFor(state.id, base, state.list) : null, splitOffset, mask, mask != null ? play.token : null, loopSeg);"""),
])
patch(r'dev\effect-live-soak.mjs', [
("""            let frame = act ? act.time * 60 + splitOffset : 0, start = splitOffset;
            if (act && fold){ const r = M.foldLoopFrame(act.time * 60, fold.S, fold.L); frame = r.frame; start = r.loopStart || 0; }
            fx.schedule.setClip(act ? V.state.id + '|' + V.state.list + '|' + b : null, frame,
                                b ? M.clipEffectsFor(V.state.id, b, V.state.list) : null, start);""",
 """            let frame = act ? act.time * 60 + splitOffset : 0, start = splitOffset, loopSeg = !!(nm && nm.endsWith('_loop'));
            if (act && fold){ const r = M.foldLoopFrame(act.time * 60, fold.S, fold.L); frame = r.frame; start = r.loopStart || 0; if (r.loopStart != null) loopSeg = true; }
            fx.schedule.setClip(act ? V.state.id + '|' + V.state.list + '|' + b : null, frame,
                                b ? M.clipEffectsFor(V.state.id, b, V.state.list) : null, start, null, null, loopSeg);"""),
])
patch(r'dev\shell-capture.mjs', [
("""    let frame = act ? act.time * 60 + splitOffset : 0, loopStart = act && splitOffset ? splitOffset : null;""",
 """    let frame = act ? act.time * 60 + splitOffset : 0, loopStart = act && (splitOffset || (nm && nm.endsWith('_loop'))) ? splitOffset : null;"""),
])
