p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(p, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)
# the joined entry carries the frame of his death
rep("""    joined.push({ clip: an.name, dur: pieces.reduce((t, p) => t + p.dur, 0), pieces, group: 'joined' });""",
"""    const deathAt = an.deathAt ? pieces.slice(0, an.deathAt.piece).reduce((t, p) => t + Math.round(p.dur * 60), 0) + an.deathAt.frame : null;
    joined.push({ clip: an.name, dur: pieces.reduce((t, p) => t + p.dur, 0), pieces, group: 'joined', deathAt });""")
# the death pick: on her M79 entry and on the joined grab
rep("""  if (l && l.partner && (c.leaves || c.drop) && a.spec.dismounts){""",
"""  // HIS DEATH IN HER M79 (render/monster.js pairs '4|Motion[79]' `death`, the joined entry's `deathAt`; spec §21): linked and
  // frozen to the kill frame, then unlinked: his death (11, 8)
  if (l && l.partner && a.spec.dismounts && a.spec.dismounts.death){
    const pl = ((a.part && a.part.lists) || []).find(x => String(x.id) === String(a.spec.partnerList.from));
    const pr = c.her ? partnerPairOf(a.spec, c.her.list, c.her.clip) : null;
    if (pl && (c.deathAt != null || (pr && pr.death))){
      const pre = [];
      if (c.deathAt != null){
        // the joined grab's linked part, piece by piece from the pairs (the ride under M76, his struggle under M77, the hold)
        let at = 0;
        for (const p of c.pieces){
          const f = Math.round(p.dur * 60), pair = partnerPairOf(a.spec, p.list.id, p.clip), q = pair.seq[0];
          const take = Math.min(f, c.deathAt - at);
          if (take <= 0) break;
          const hold = q.mode === 'hold' ? partnerHoldOf(a, pl, p.list, pair) * 60 : null;
          pre.push({ list: '4', clip: q.clip, blend: q.blend || 0, frames: take, mode: hold != null ? 'hold' : q.mode === 'wrap' ? 'wrap' : 'play',
                     start: hold != null ? hold : q.start || 0, period: q.period || 0 });
          at += take;
        }
      } else pre.push({ list: '4', clip: pr.seq[0].clip, frames: pr.death.at, mode: 'hold', start: partnerHoldOf(a, pl, null, pr) * 60 });
      return { list: pl, clip: c.clip, paired: true, rom: true, hold: null, mode: 'seq', start: 0, compose: [], release: false,
               unl: 'death', pre, deathAt: c.deathAt != null ? c.deathAt : pr.death.at };
    }
  }
  if (l && l.partner && (c.leaves || c.drop) && a.spec.dismounts){""")
# the plan
rep("""  const base = unlBaseOf(a);
  const out = [];
  let tLand = null, commitAt = null;
  if (pick.unl === 'leave'){""",
"""  const at0 = pick.unl === 'death' ? pick.deathAt : 0;
  const base = unlBaseOf(a, at0);
  const out = [];
  let tLand = null, commitAt = null;
  if (pick.unl === 'death'){
    // linked and frozen to the kill frame, then the fall to her ground (the stand-in rate) and the lie
    for (const x of pick.pre) out.push(Object.assign({}, x));
    const drop = base ? Math.max(0, (base.pos.y - base.floor) * base.ws) / 0.01 : 0;
    let n = 0; while (-(d.fall.v * n + d.fall.a * n * n / 2) < drop && n < 600) n++;
    tLand = at0 + n;
    const s0 = durOf(d.air[0]);
    out.push(Object.assign({}, d.air[0], { frames: Math.max(1, Math.min(s0, n)) }));
    if (n > s0) out.push(Object.assign({}, d.air[1], { frames: n - s0 }));
    let at = at0 + Math.max(1, n);
    for (const x of d.land){ const f = x.rest ? Math.max(1, herF - at) : durOf(x); out.push(Object.assign({}, x, { frames: f })); at += f; }
  } else if (pick.unl === 'leave'){""")
rep("""  pick.plan = { base, commitAt, tLand, d, floor: base ? base.floor : 0 };""",
    """  pick.plan = { base, commitAt, tLand, d, floor: base ? base.floor : 0, at: at0 };""")
# sample her joint at the kill frame
rep("""function unlBaseOf(a){
  const m = releaseMatOf(a) || jointFrameOf(a);""", """function unlBaseOf(a, at = 0){
  const m = releaseMatOf(a, at) || jointFrameOf(a);""")
rep("""function releaseMatOf(a){
  if (!pose.action || !pose.mixer || !pose.proxyBones) return null;
  const src = pose.proxyBones.get(a.spec.joint);
  if (!src) return null;
  const t = pose.action.time;
  pose.action.time = 0; pose.mixer.update(0); if (pose.anchorProxy) pose.anchorProxy();""",
"""function releaseMatOf(a, at = 0){
  if (!pose.action || !pose.mixer || !pose.proxyBones) return null;
  const src = pose.proxyBones.get(a.spec.joint);
  if (!src) return null;
  const t = pose.action.time;
  pose.action.time = at / 60; pose.mixer.update(0); if (pose.anchorProxy) pose.anchorProxy();""")
# the frame: linked before the kill frame
rep("""  const b = pl.base, p = b.pos.clone();
  let yaw = b.yaw;
  if (a.pick.unl === 'leave'){""", """  if (pl.at && t < pl.at) return null;                     // (his death: still linked before the kill frame)
  const b = pl.base, p = b.pos.clone();
  let yaw = b.yaw;
  if (a.pick.unl === 'death'){
    const n = Math.min(t - pl.at, pl.tLand - pl.at);
    p.y -= -(pl.d.fall.v * n + pl.d.fall.a * n * n / 2) * 0.01 / b.ws;
    if (t >= pl.tLand) p.y = pl.floor;
  } else if (a.pick.unl === 'leave'){""")
# composing: honour a piece's own mode / start / period
rep("""    const st = x.start || 0, fr = x.frames || Math.max(1, seqFrames(pc) - st);
    pieces.push({ clip: pc, frames: fr, mode: /_loop$/.test(x.clip) ? 'wrap' : 'play', start: st / 60, blend: x.blend || 0 });
    layout.push({ from: at, frames: fr, clip: x.clip, list: x.list || null, mode: /_loop$/.test(x.clip) ? 'wrap' : 'play', start: st, dur: seqFrames(pc),""",
"""    const st = x.start || 0, fr = x.frames || Math.max(1, seqFrames(pc) - st);
    const md = x.mode || (/_loop$/.test(x.clip) ? 'wrap' : 'play');
    pieces.push({ clip: pc, frames: fr, mode: md, start: st / 60, blend: x.blend || 0, period: x.period ? x.period / 60 : 0 });
    layout.push({ from: at, frames: fr, clip: x.clip, list: x.list || null, mode: md, start: st, dur: seqFrames(pc),""")
# the glow follows his bit: off once dead
rep("""      const base = a.pick && a.pick.release ? a.spec.groups.map(x => x === 8 ? 0 : x) : a.spec.groups;""",
    """      const base = a.pick && (a.pick.release || a.deadNow) ? a.spec.groups.map(x => x === 8 ? 0 : x) : a.spec.groups;""")
rep("""      // HIS WINGS follow his flight state at this frame""", """      // (dead from the kill frame on: his bit is clear, the glow goes)
      { const dn = !!(a.pick && a.pick.unl === 'death' && pose.action && Math.round(pose.action.time * 60) >= a.pick.deathAt);
        if (dn !== !!a.deadNow){ a.deadNow = dn; applyPartState(); } }
      // HIS WINGS follow his flight state at this frame""")
rep("""           released: !!(a.pick && a.pick.release), unl:""", """           released: !!(a.pick && a.pick.release), dead: !!a.deadNow, unl:""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
