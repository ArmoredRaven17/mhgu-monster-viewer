p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(p, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)

# ---- his entries: keep the layout of her pieces, so a consumer can find her clip at a frame
rep("""  partnerBodyShown = { his: c.his, body: pieces.map(p => p.name), frames: F };""",
"""  partnerBodyShown = { his: c.his, body: pieces.map(p => p.name), frames: F, entry: c.clip,
                       layout: c.body.map(([lid, cn, o = {}], i) => ({ list: String(lid), clip: cn, start: o.start || 0, frames: pieces[i].frames })) };""")

# ---- the routing: seqMotionNow answers for the combined list too
rep("""// the motion a chain entry on the Special list is playing now (render/monster.js specialMotionAt), or null
function seqMotionNow(){
  const act = pose.action, name = act && act.getClip ? act.getClip().name : null;
  if (!name || state.list !== FULL_ANIM_LIST.id) return null;""",
"""// the motion a chain entry on the Special list is playing now (render/monster.js specialMotionAt), or null -- and on the
// COMBINED LIST (ROM_PARTNER_BODY partnerList) the clip of hers the entry plays now (partnerMotionNow)
function seqMotionNow(){
  const act = pose.action, name = act && act.getClip ? act.getClip().name : null;
  if (!name) return null;
  const pl = listOf(entry());
  if (pl && pl.partner) return partnerMotionNow(pl, name, act);
  if (state.list !== FULL_ANIM_LIST.id) return null;""")
rep("""function driveClipEffects(){""", """// A COMBINED-LIST ENTRY IS ITS CLIPS OF HERS (Raven, 2026-10-17: her clip-keyed records fire on every combined entry exactly
// as on the raw clip). Every consumer keyed on list|clip -- the effect schedule, the PSL word (CLIP_ACTIONS / psl-mask),
// ACTION_EFFECTS, MOTION_STATES (parts, rage, tired, puff / drool gates, class holds), CLIP_VARIANTS, heat, turn, posture,
// air, the hit-zone mode -- reads the motion through here: { list, clip (bare), frame (over the whole slot), loopStart,
// loopSeg, loopEnd, raw (the clip name), whole (the entry IS one clip of hers, so it reads exactly as the raw clip),
// partner: true }. A her-led entry (`her`) is that clip; the joined entry walks its pieces; his entries walk the layout of
// her side partnerListBodyClip laid on his frames.
function herClipOf(l, c){
  if (!l || !l.partner || !c) return null;
  if (c.her) return { list: String(c.her.list), clip: c.her.clip };
  if (c.pieces && c.pieces[0]) return { list: String(c.pieces[0].list.id), clip: c.pieces[0].clip };
  if (c.body && c.body[0]) return { list: String(c.body[0][0]), clip: c.body[0][1] };
  return null;
}
function partnerMotionNow(l, name, act){
  const e = entry(), c = (l.clips || []).find(x => x.clip === name);
  if (!c || !e) return null;
  const t = act.time * 60;
  const listIn = id => (e.lists || []).find(x => String(x.id) === String(id));
  const at = (lid, cn, f, whole) => {
    const hl = listIn(lid), bare = cn.replace(/_(start|loop)$/, ''), loop = /_loop$/.test(cn);
    const sib = loop && hl && (hl.clips || []).find(x => x.clip === bare + '_start');
    const own = hl && (hl.clips || []).find(x => x.clip === cn);
    const S = sib ? Math.round(sib.dur * 60) : 0;
    const L = whole ? act.getClip().duration * 60 : own ? own.dur * 60 : 0;
    return { list: String(lid), clip: bare, raw: cn, frame: S + f, loopStart: loop ? S : null, loopSeg: loop, loopEnd: S + L,
             whole: !!whole, partner: true, entry: name };
  };
  if (c.her) return at(c.her.list, c.her.clip, t, true);
  if (c.pieces){
    // the joined entry, piece by piece, a split motion's _start + _loop as one motion (render/monster.js specialMotionAt)
    const bare = p => p.clip.replace(/_(start|loop)$/, ''), lid = p => String(p.list.id != null ? p.list.id : p.list);
    let a0 = 0;
    for (let i = 0; i < c.pieces.length; ){
      let j = i;
      while (j < c.pieces.length && lid(c.pieces[j]) === lid(c.pieces[i]) && bare(c.pieces[j]) === bare(c.pieces[i])) j++;
      const run = c.pieces.slice(i, j), len = run.reduce((n, p) => n + Math.round(p.dur * 60), 0);
      if (t < a0 + len || j === c.pieces.length){
        const st = run.find(p => /_start$/.test(p.clip)), lp = run.find(p => /_loop$/.test(p.clip));
        const S = st ? Math.round(st.dur * 60) : 0, L = lp ? Math.round(lp.dur * 60) : 0;
        const r = lp ? foldLoopFrame(t - a0, S, L) : { frame: t - a0, loopStart: null };
        return { list: lid(c.pieces[i]), clip: bare(c.pieces[i]), raw: run[0].clip, frame: r.frame, loopStart: r.loopStart,
                 loopSeg: r.loopStart != null, loopEnd: S + L || len, whole: false, partner: true, entry: name };
      }
      a0 += len; i = j;
    }
    return null;
  }
  const lay = partnerBodyShown && partnerBodyShown.entry === name ? partnerBodyShown.layout : null;
  if (!lay) return null;
  let a0 = 0;
  for (let i = 0; i < lay.length; i++){
    const r = lay[i];
    if (t < a0 + r.frames || i === lay.length - 1){
      const own = (listIn(r.list) && listIn(r.list).clips || []).find(x => x.clip === r.clip);
      const len = own ? Math.round(own.dur * 60) : 0;
      let f = r.start + (t - a0);
      if (len > 0) f = /_loop$/.test(r.clip) ? f % len : Math.min(f, len);     // a _loop piece wraps, a play holds its end
      return at(r.list, r.clip, f, false);
    }
    a0 += r.frames;
  }
  return null;
}
// the clip the Clip menu names, as hers: a combined entry's clip of hers, else the menu's own (for CLIP_VARIANTS rows)
function stateRawClip(){
  const l = listOf(entry()), c = l && l.partner ? (l.clips || []).find(x => x.clip === state.clip) : null;
  const h = herClipOf(l, c);
  return h && c.her ? h : { list: state.list, clip: state.clip };
}
function driveClipEffects(){""")

# ---- playNow: the copy's row by the clip of hers
rep("""  const vkey = state.clipVariant && state.clip.replace(/_(start|loop)$/, '') === clip ? list + '|' + clip + '#' + state.clipVariant : null;""",
"""  const vkey = state.clipVariant && stateRawClip().clip.replace(/_(start|loop)$/, '') === clip ? list + '|' + clip + '#' + state.clipVariant : null;""")

# ---- driveMotionStates: a whole entry reads exactly as the raw clip
rep("""  const seq = seqMotionNow();
  const r = seq ? motionStates.step(state.id, seq.list, seq.clip, seq.frame,""",
"""  const seq = seqMotionNow();
  // a combined entry that IS one clip of hers: the raw clip's own call, with her list, clip, copy and frame
  const wq = seq && seq.whole ? seq : null;
  const rc = wq ? stateRawClip() : null;
  const wRow = wq && state.clipVariant && rc.clip.replace(/_(start|loop)$/, '') === wq.clip
             && (MOTION_STATES[state.id] || {})[wq.list + '|' + wq.clip + '#' + state.clipVariant] ? wq.clip + '#' + state.clipVariant : wq && wq.clip;
  const r = wq ? motionStates.step(state.id, wq.list, wRow, wq.frame,
                                   { loopStart: wq.loopStart || 0, loopEnd: wq.loopEnd, loopSeg: wq.loopSeg,
                                     ended: !!(act && act.loop === THREE.LoopOnce && act.time >= clipDur(act) - 1e-3) },
                                   { rage: !!state.rage, level: state.level | 0, tired: exhausted(), posture: plays.key ? plays.posture : undefined }, now)
          : seq ? motionStates.step(state.id, seq.list, seq.clip, seq.frame,""")
rep("""  stepTurn(base, act ? act.time * 60 + loopStart : 0);
  stepBox(base);""", """  // (a combined entry turns and stands as the clip of hers it plays now)
  const pq = seq && seq.partner ? seq : null;
  stepTurn(pq ? pq.clip : base, pq ? pq.frame : act ? act.time * 60 + loopStart : 0, pq ? pq.list : state.list);
  stepBox(pq ? pq.clip : base, pq ? pq.list : state.list);""")
rep("""  syncClassHolds(rt, seq ? seq.list + '|' + seq.clip : state.list + '|' + rowClip);""",
"""  syncClassHolds(rt, wq ? wq.list + '|' + wRow : seq ? seq.list + '|' + seq.clip : state.list + '|' + rowClip);""")

# ---- turn / steer / box take the list
rep("""function stepBox(base){
  const key = state.id + '|' + state.list + '|' + base;
  if (key !== boxClip){ boxClip = key; boxForced = { wall: null, ceiling: null }; }
  const p = base ? postureOf(state.id, state.list, base) : 0;""",
"""function stepBox(base, list = state.list){
  const key = state.id + '|' + list + '|' + base;
  if (key !== boxClip){ boxClip = key; boxForced = { wall: null, ceiling: null }; }
  const p = base ? postureOf(state.id, list, base) : 0;""")
rep("""function steerAt(base, frame){
  const t = base && STEER[state.id] && STEER[state.id][state.list + '|' + base];
  if (!t){ steer.key = null; return 0; }
  const ri = rockInput(), O = ri ? t.offset[ri.variant] : undefined;
  const key = state.id + '|' + state.list + '|' + base + '|' + (ri && ri.variant);""",
"""function steerAt(base, frame, list = state.list){
  const t = base && STEER[state.id] && STEER[state.id][list + '|' + base];
  if (!t){ steer.key = null; return 0; }
  const ri = rockInput(), O = ri ? t.offset[ri.variant] : undefined;
  const key = state.id + '|' + list + '|' + base + '|' + (ri && ri.variant);""")
rep("""function stepTurn(base, frame){
  turnYaw = base ? (turnAt(state.id, state.list, base, frame) + steerAt(base, frame)) * Math.PI / 180 : 0;""",
"""function stepTurn(base, frame, list = state.list){
  turnYaw = base ? (turnAt(state.id, list, base, frame) + steerAt(base, frame, list)) * Math.PI / 180 : 0;""")

# ---- air: a combined entry's height is its clip of hers
rep("""  if (!clipRoot || !act || !act.getClip || state.list === FULL_ANIM_LIST.id) return null;
  const reach = (pose.bounds && !pose.bounds.isEmpty()) ? pose.bounds.min.y : Infinity;
  const e = entry();
  // a clip with its own AIR_HEIGHT row applies as it is; any other only when it hangs below its origin
  return airLift(state.id, state.list, act.getClip().name, act.time * 60, world.scale.y || 1, (e && e.sizeBase) || 1,
                 reach < clipRoot.position.y - AIR_REACH);""",
"""  if (!clipRoot || !act || !act.getClip || state.list === FULL_ANIM_LIST.id) return null;
  const reach = (pose.bounds && !pose.bounds.isEmpty()) ? pose.bounds.min.y : Infinity;
  const e = entry();
  // (a combined entry: the clip of hers it plays now, at its own frame -- seqMotionNow)
  const pq = listOf(e) && listOf(e).partner ? seqMotionNow() : null;
  // a clip with its own AIR_HEIGHT row applies as it is; any other only when it hangs below its origin
  return airLift(state.id, pq ? pq.list : state.list, pq ? pq.raw : act.getClip().name,
                 pq ? pq.frame - (pq.loopSeg ? pq.loopStart : 0) : act.time * 60, world.scale.y || 1, (e && e.sizeBase) || 1,
                 reach < clipRoot.position.y - AIR_REACH);""")

# ---- the hit-zone mode: a combined entry gives the state of its clip of hers
rep("""function clipZoneMode(e, l, c, frame){
  const first = c && c.pieces && c.pieces[0];""",
"""function clipZoneMode(e, l, c, frame){
  const h = herClipOf(l, c);
  if (h){ l = { id: h.list }; c = { clip: h.clip }; }
  const first = c && c.pieces && c.pieces[0];""")

# ---- the Clip menu offers her copies on a combined entry
rep("""    clips.map(c => (clipVariantsFor(state.id, state.list, c.clip) || [{ value: c.clip, label: c.clip }])""",
"""    clips.map(c => ((c.her ? (clipVariantsFor(state.id, c.her.list, c.her.clip) || null) && clipVariantsFor(state.id, c.her.list, c.her.clip)
                       .map(v => { const k = clipVariantOf(v.value).variant; return { value: c.clip + (k ? '#' + k : ''), label: c.clip + v.label.slice(c.her.clip.length) }; })
                     : clipVariantsFor(state.id, state.list, c.clip)) || [{ value: c.clip, label: c.clip }])""")

# ---- readback: the routed motion
rep("""           herSide: listOf(e) && listOf(e).partner ? partnerBodyShown : null,""",
"""           herSide: listOf(e) && listOf(e).partner ? partnerBodyShown : null,
           routed: (() => { const q = seqMotionNow(); return q && q.partner ? { list: q.list, clip: q.clip, frame: +q.frame.toFixed(2), whole: q.whole } : null; })(),""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
