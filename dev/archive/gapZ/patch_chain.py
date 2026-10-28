# patch_chain.py: a Special-list piece may name a FRAME RANGE ({ from, to } as its 4th element), for an action that sets the same motion
# again from a later frame (Khezu's (7, 0x4d): L2 M3 to 200, then L2 M3 from 40 -- 0xd17e30..0xd17e54); the entry, and the shells' second
# wave. In place, CRLF / LF kept; each replacement asserted unique.
import sys
def patch(P, reps):
    s = open(P, 'rb').read().decode('utf8'); nl = '\r\n' if '\r\n' in s else '\n'
    for old, new in reps:
        o = old.replace('\n', nl); n = new.replace('\n', nl)
        assert s.count(o) == 1, (P, old[:80], s.count(o))
        s = s.replace(o, n)
    open(P, 'wb').write(s.encode('utf8')); print('ok', P)

M = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js'
patch(M, [
("""    { name: 'Motion 28', pieces: [['2', 'Motion[28]_start'], ['2', 'Motion[28]_loop']] },
  ],""",
"""    { name: 'Motion 28', pieces: [['2', 'Motion[28]_start'], ['2', 'Motion[28]_loop']] },
    // KHEZU'S (7, 0x4d), WHOLE (shells lane, 2026-10-27; READ 0xd16e08): phase 0 sets L2 M3 (0x203, blend 8); phase 1 makes modes 15 / 16 /
    // 17 at 176.0 (0xd1780c) and at 200.0 (0xd17df8: `cmp r5, #5` picks the table's second word, 0xd17f54) sets phase 3 and L2 M3 AGAIN
    // from frame 40 with a 20-frame blend (0xafce8(e, 0x203, s0 20.0, s1 40.0) 0xd17e30..0xd17e54); phase 3 makes modes 18 / 19 at 176.0
    // of that play (0xd17130..0xd172cc) and at 254.0 hands on to L2 M13 (0x20d, blend 2: 0xd172d0 -> 0xd17e58). Every other index of the
    // handler leaves at 254.0 straight to L2 M13 (0xd17f50). The pieces: M3's _start (0..254) to 200, the same from 40, then M13.
    { name: 'S. Motion 3 (7:0x4d)', pieces: [['2', 'Motion[3]_start', 0, { to: 200 }], ['2', 'Motion[3]_start', 20, { from: 40 }], ['2', 'Motion[13]', 2]],
      motions: true, action: [7, 0x4d] },
  ],"""),
("""  const key = 'seq:' + modelUrl + ':' + (entry.clip || '') + ':' + entry.pieces.map(p => p.list.file + '#' + p.clip + (p.blend ? '~' + p.blend : '')).join('|');""",
"""  const key = 'seq:' + modelUrl + ':' + (entry.clip || '') + ':' + entry.pieces.map(p => p.list.file + '#' + p.clip + (p.blend ? '~' + p.blend : '') +
                                                                    (p.from != null || p.to != null ? '@' + (p.from || 0) + '-' + (p.to != null ? p.to : '') : '')).join('|');"""),
("""    pieces.push({ clip, frames: seqFrames(clip), mode: 'play', start: 0, blend: p.blend || 0 });""",
"""    // a piece's FRAME RANGE ({ from, to }, 60 / s frames of the clip): the motion set again from a later frame (setMotion's start)
    const from = p.from || 0, to = p.to != null ? Math.min(p.to, seqFrames(clip)) : seqFrames(clip);
    pieces.push({ clip, frames: Math.max(1, to - from), mode: 'play', start: from / SEQ_FPS, blend: p.blend || 0 });"""),
("""  let at = 0;
  for (let i = 0; i < pieces.length; ){
    let j = i;
    while (j < pieces.length && lid(pieces[j]) === lid(pieces[i]) && bare(pieces[j]) === bare(pieces[i])) j++;
    const run = pieces.slice(i, j), len = run.reduce((n, p) => n + Math.round(p.dur * 60), 0);
    if (t < at + len || j === pieces.length){""",
"""  let at = 0;
  const ranged = p => p.from != null || p.to != null;
  for (let i = 0; i < pieces.length; ){
    let j = i;
    // a ranged piece is its own run: the motion set again (its frame from `from`, a wrap to `from` for the shells -- the same action
    // goes on: loopStart = from when the run before it is the same motion)
    if (ranged(pieces[i])) j = i + 1;
    else while (j < pieces.length && !ranged(pieces[j]) && lid(pieces[j]) === lid(pieces[i]) && bare(pieces[j]) === bare(pieces[i])) j++;
    const run = pieces.slice(i, j), len = run.reduce((n, p) => n + Math.round(p.dur * 60), 0);
    if (ranged(pieces[i]) && (t < at + len || j === pieces.length)){
      const p = pieces[i], from = p.from || 0, prev = pieces[i - 1];
      const again = !!prev && lid(prev) === lid(p) && bare(prev) === bare(p) && from > 0;
      return { list: lid(p), clip: bare(p), frame: from + (t - at), loopStart: again ? from : null, loopSeg: false, loopEnd: from + len };
    }
    if (t < at + len || j === pieces.length){"""),
])

H = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
patch(H, [
("""    const pieces = piecesOf(an).map(([lid, cn, blend]) => {
      const l = (m.lists || []).find(x => String(x.id) === String(lid));
      const c = l && (l.clips || []).find(x => x.clip === cn);
      return c ? { list: l, clip: cn, dur: c.dur, blend: blend || 0 } : null;
    });
    if (pieces.some(p => !p)){ noteError('full animation ' + an.name + ': a piece is missing from ' + m.id); continue; }""",
"""    // a piece's 4th element is its frame range { from, to } (render/monster.js ROM_ANIMATIONS: Khezu's (7, 0x4d) sets L2 M3 again from 40)
    const pieces = piecesOf(an).map(([lid, cn, blend, rng]) => {
      const l = (m.lists || []).find(x => String(x.id) === String(lid));
      const c = l && (l.clips || []).find(x => x.clip === cn);
      if (!c) return null;
      if (!rng) return { list: l, clip: cn, dur: c.dur, blend: blend || 0 };
      const all = Math.round(c.dur * 60), from = rng.from || 0, to = rng.to != null ? Math.min(rng.to, all) : all;
      return { list: l, clip: cn, dur: Math.max(1, to - from) / 60, blend: blend || 0, from, to };
    });
    if (pieces.some(p => !p)){ noteError('full animation ' + an.name + ': a piece is missing from ' + m.id); continue; }"""),
("""    if (copyActs) names = names.filter(v => !actionOf(v) || copyActs.includes(actionName(actionOf(v))));
  }""",
"""    if (copyActs) names = names.filter(v => !actionOf(v) || copyActs.includes(actionName(actionOf(v))));
  }
  // A SPECIAL ENTRY THAT NAMES ITS ACTION IS THAT ACTION (render/monster.js ROM_ANIMATIONS `action` with `motions`): the shells' pick is it,
  // not the clip's rotation -- Khezu's 'S. Motion 3 (7:0x4d)' plays (7, 0x4d) only
  if (names.length && state.list === FULL_ANIM_LIST.id){
    const anA = romAnimationsOf(state.id).find(x => x.name === (act && act.getClip ? act.getClip().name : null));
    if (anA && anA.motions && anA.action) names = names.filter(v => !actionOf(v) || actionName(actionOf(v)) === actionName(anA.action));
  }"""),
])
