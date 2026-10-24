import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:80], s.count(old))
    s = s.replace(old, new)

rep("FULL_ANIM_LIST, romAnimationsOf, romAnimationMotion, piecesOf, foldLoopFrame, loopFoldOf,",
    "FULL_ANIM_LIST, romAnimationsOf, romAnimationMotion, piecesOf, foldLoopFrame, loopFoldOf, specialMotionAt,")

# playNow: the list is a parameter (a chain entry's motion is on its own list)
rep("""function playNow(act, base, frame, loopSeg, loopStart = 0){
  if (!act || !base){ plays.key = null; return null; }
  const key = state.id + '|' + state.list + '|' + base;""",
"""function playNow(act, base, frame, loopSeg, loopStart = 0, onList = state.list){
  if (!act || !base){ plays.key = null; return null; }
  const key = state.id + '|' + onList + '|' + base;""")
rep("""  let list = state.list, clip = base;
  const an = state.list === FULL_ANIM_LIST.id ? romAnimationMotion(state.id, base) : null;""",
"""  let list = onList, clip = base;
  const an = onList === FULL_ANIM_LIST.id ? romAnimationMotion(state.id, base) : null;""")

# driveClipEffects
rep("""  const base = clipName ? clipName.replace(/_(start|loop)$/, '') : null;
  let splitOffset = 0;
  if (clipName && clipName.endsWith('_loop')){
    const sib = ((listOf(entry()) || {}).clips || []).find(c => c.clip === base + '_start');
    if (sib) splitOffset = Math.round(sib.dur * 60);
  }
  if (!rt.schedule.rockInput)""",
"""  let base = clipName ? clipName.replace(/_(start|loop)$/, '') : null, onList = state.list;
  let splitOffset = 0;
  if (clipName && clipName.endsWith('_loop')){
    const sib = ((listOf(entry()) || {}).clips || []).find(c => c.clip === base + '_start');
    if (sib) splitOffset = Math.round(sib.dur * 60);
  }
  if (!rt.schedule.rockInput)""")
rep("""  if (fold){ const r = foldLoopFrame(act.time * 60, fold.S, fold.L); frame = r.frame; if (r.loopStart != null){ splitOffset = r.loopStart; loopSeg = true; } }
  const play = playNow(act, base, frame, loopSeg, splitOffset);""",
"""  if (fold){ const r = foldLoopFrame(act.time * 60, fold.S, fold.L); frame = r.frame; if (r.loopStart != null){ splitOffset = r.loopStart; loopSeg = true; } }
  // a Special entry that is a chain of motions (render/monster.js specialMotionAt): the motion the game plays now, on its
  // own list, at its own frame -- Rajang's 'S. Motion 8 Beam' is L2 M8 (its beam rows, its PSL) and then L2 M9
  const seq = seqMotionNow();
  if (seq){ onList = seq.list; base = seq.clip; frame = seq.frame; splitOffset = seq.loopStart != null ? seq.loopStart : 0; loopSeg = seq.loopSeg; }
  const play = playNow(act, base, frame, loopSeg, splitOffset, onList);""")
rep("""  rt.schedule.setClip(act ? state.id + '|' + state.list + '|' + base : null, frame,
                      base ? clipEffectsFor(state.id, base, state.list) : null,""",
"""  rt.schedule.setClip(act ? state.id + '|' + onList + '|' + base : null, frame,
                      base ? clipEffectsFor(state.id, base, onList) : null,""")

# the resolver, before driveClipEffects
rep("""function driveClipEffects(){""",
"""// the motion a chain entry on the Special list is playing now (render/monster.js specialMotionAt), or null
function seqMotionNow(){
  const act = pose.action, name = act && act.getClip ? act.getClip().name : null;
  if (!name || state.list !== FULL_ANIM_LIST.id) return null;
  const c = ((listOf(entry()) || {}).clips || []).find(x => x.clip === name);
  return c ? specialMotionAt(state.id, state.list, name, c.pieces, act.time * 60) : null;
}
function driveClipEffects(){""")

# rockInput: the pick is the motion's
rep("""  const names = clipName ? pickVariantsFor(state.id, state.list, clipName, beamState()) : [];
  if (names.length){
    const key = state.id + '|' + state.list + '|' + clipName;""",
"""  // (a chain entry's pick is its motion's: a play of the entry reaches that motion once, so it advances once a play)
  const seq = seqMotionNow(), pList = seq ? seq.list : state.list, pClip = seq ? seq.clip : clipName;
  const names = pClip ? pickVariantsFor(state.id, pList, pClip, beamState()) : [];
  if (names.length){
    const key = state.id + '|' + pList + '|' + pClip;""")
open(p + '.tmp', 'wb').write((s.replace('\n', '\r\n') if crlf else s).encode('utf-8')); os.replace(p + '.tmp', p); print('patched')
