import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:80], s.count(old))
    s = s.replace(old, new)

rep("attachedBodyOf, attachedClipFor, partnerBodyOf, composeClip, sequenceClipFor, seqFrames,",
    "attachedBodyOf, attachedClipFor, partnerBodyOf, composeClip, sequenceClipFor, seqFrames, armPairOf,")

# playAttached: the other arm takes the read pairing
rep("""    // an arm's OWN list picked (Nakarkos's l_N / r_N, shown again 2026-10-05) plays on that arm; the other arm plays its
    // own idle (its <prefix>0 list's Motion[1]) while the body holds its idle (armListBodyClip)
    const own = l && String(l.id).startsWith(a.spec.listPrefix) ? l : null;
    const other = !own && l && attachedListIds(e).has(l.id);
    let twin = own || (!other && l && c && (e.lists || []).find(x => x.id === a.spec.listPrefix + l.id)), clipName = c && c.clip;
    if (other){
      twin = (e.lists || []).find(x => x.id === a.spec.listPrefix + '0') || null;
      clipName = twin && ((twin.clips || []).find(k => /^Motion\\[1\\](_loop)?$/.test(k.clip)) || {}).clip;
    }""",
"""    // an arm's OWN list picked (Nakarkos's l_N / r_N, shown again 2026-10-05) plays on that arm; the other arm plays what
    // the game has it play beside that clip (render/monster.js ROM_ARM_PAIRS, READ: the same action for a paired order,
    // else its idle) while the body plays its side of the pair (armListBodyClip). An arm clip with no read pairing: the
    // other arm's stance-1 idle, <prefix>0 Motion[1], as before.
    const own = l && String(l.id).startsWith(a.spec.listPrefix) ? l : null;
    const other = !own && l && attachedListIds(e).has(l.id);
    let twin = own || (!other && l && c && (e.lists || []).find(x => x.id === a.spec.listPrefix + l.id)), clipName = c && c.clip;
    a.idleWrap = false;
    if (other){
      const pair = armPairFor(e, l, c);
      if (pair && pair.other === 'same'){
        twin = (e.lists || []).find(x => x.id === a.spec.listPrefix + armListSuffix(e, l)) || null;
        clipName = twin && pairedClipName(twin, c.clip, c.clip);
      } else {
        const [ol, oc] = (pair && pair.other) || ['0', 'Motion[1]'];
        twin = (e.lists || []).find(x => x.id === a.spec.listPrefix + ol) || null;
        clipName = twin && pairedClipName(twin, oc, c && c.clip);
        a.idleWrap = true;
      }
    }""")
rep("""    a.driver.loopMode = other ? () => 'repeat' : pose.loopMode;""",
    """    a.driver.loopMode = a.idleWrap ? () => 'repeat' : pose.loopMode;""")

# stepAttached: an idle loops under a longer arm clip
rep("""    if (a.driver.action && pose.action){
      a.driver.action.paused = pose.action.paused;
      a.driver.action.time = Math.min(pose.action.time, Math.max(0, a.driver.action.getClip().duration - 1e-3));
    }""",
"""    if (a.driver.action && pose.action){
      a.driver.action.paused = pose.action.paused;
      const dur = Math.max(1e-3, a.driver.action.getClip().duration);
      // the other arm's idle loops, as the game's does, under an arm clip longer than it (ROM_ARM_PAIRS)
      a.driver.action.time = a.idleWrap ? pose.action.time % dur : Math.min(pose.action.time, Math.max(0, dur - 1e-3));
    }""")

# armListBodyClip: the body's side of the pair
rep("""// A TENTACLE'S LIST PICKED: THE BODY HOLDS ITS IDLE. Raven, 2026-10-05: "We also will need to figure out how to better
// handle the tentacle animations, currently they also move his body in eratic ways" -- the body was handed the arm's
// own clip (tracks on the arm's bone ids). The arm plays it on itself (playAttached); the body plays its own idle
// (the hit-zone idle pick: L0 Motion[1]) looped over the arm clip's length, so the clock, the scrubber and the arm's
// frame gates keep the arm clip's frames. Which body motion the game runs beside an arm action is the AI's (the arms'
// streams are their own, EMC group 0) -- not read, so the idle is the viewer's neutral stand-in.
async function armListBodyClip(e, l, c){
  const own = await clipFor(l, c.clip, e.glb);               // only for its length
  const idle = hitZonesIdleClip(e), il = idle && (e.lists || []).find(x => String(x.id) === idle.list);
  const body = il ? await clipFor(il, idle.clip, e.glb) : null;""",
"""// A TENTACLE'S LIST PICKED: THE BODY PLAYS ITS SIDE OF THE PAIR. Raven, 2026-10-05: "We also will need to figure out how
// to better handle the tentacle animations, currently they also move his body in eratic ways" -- the body was handed the
// arm's own clip (tracks on the arm's bone ids). The arm plays it on itself (playAttached); the body plays the clip the
// game runs beside that arm action, looped over the arm clip's length, so the clock, the scrubber and the arm's frame
// gates keep the arm clip's frames. WHICH clip is READ (Raven: "Verify animation assignments"; render/monster.js
// ROM_ARM_PAIRS, dev/em084-arm-pairings.md): the arms run no command streams, every arm action is ordered by a body
// action, and that action's own clip is the body's -- L0 M1 / L0 M50 held for a single-arm order, its own clip for a
// paired one. An arm clip with no read pairing keeps the earlier stand-in, the hit-zone idle (L0 Motion[1]).
// the arm list's suffix ('2' of 'l_2') and the pairing of its clip
function armListSuffix(e, l){
  for (const [, a] of attached) if (a.spec && String(l.id).startsWith(a.spec.listPrefix)) return String(l.id).slice(a.spec.listPrefix.length);
  return null;
}
function armPairFor(e, l, c){
  if (!e || !l || !c) return null;
  for (const [, a] of attached)
    if (a.spec && String(l.id).startsWith(a.spec.listPrefix)) return armPairOf(e.id, a.spec.listPrefix, l.id, c.clip);
  return null;
}
// a clip of `list` for the motion `base` beside the arm clip `armClip`: its same _start / _loop piece, else the whole
// clip, else its _loop, else its _start
function pairedClipName(list, base, armClip){
  const names = (list.clips || []).map(k => k.clip), b = String(base).replace(/_(start|loop)$/, '');
  const suf = (/_(start|loop)$/.exec(armClip || '') || [])[0];
  return [suf && b + suf, b, b + '_loop', b + '_start'].find(n => n && names.indexOf(n) >= 0) || null;
}
async function armListBodyClip(e, l, c){
  const own = await clipFor(l, c.clip, e.glb);               // only for its length
  const pair = armPairFor(e, l, c);
  const pl = pair && (e.lists || []).find(x => String(x.id) === pair.body[0]);
  const pn = pl && pairedClipName(pl, pair.body[1], c.clip);
  const idle = pn ? { list: pair.body[0], clip: pn } : hitZonesIdleClip(e), il = idle && (e.lists || []).find(x => String(x.id) === idle.list);
  const body = il ? await clipFor(il, idle.clip, e.glb) : null;""")
open(p + '.tmp', 'wb').write((s.replace('\n', '\r\n') if crlf else s).encode('utf-8')); os.replace(p + '.tmp', p); print('patched')
