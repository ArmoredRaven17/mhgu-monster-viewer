import re
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js'
s = open(p, encoding='utf-8').read()
def rep(old, new):
    global s
    assert s.count(old) == 1, old[:80]
    s = s.replace(old, new)
rep("""ROM_PARTNER_BODY.em069_00.partnerList = {
  id: 'duo', label: 'Combined (with Seltas)', from: '4', prefix: 'Seltas ', herLists: ['0', '3', '4'],""",
"""// WHERE HE LEAVES HER (request 7: her 1:0x1a shake-off M68 and her death clips, `classes` release): her hook writes the
// request at her action start (0xf8972c / 0xf8975c), his 1:0x13 UNLINKS at its own start (0xfc5054, bit 0 cleared
// 0xfc5088) and plays L4 M46 b4 then M47 b0 (0xfc8e84), wings out; unlinked he does not return to the ride (0xfc8e9c).
// So from her frame 0 he is no longer on joint 200: the viewer leaves him where joint 200 was at that frame, in world
// space, playing M46 then M47 (then their last frame -- what he does next is his own table's; his flight's push is
// code, 0xfc8cbc, not shown). His glow goes off with the bit (0xfc6468: group 0, not 8).
ROM_PARTNER_BODY.em069_00.leaves = [{ clip: 'Motion[46]', blend: 4 }, { clip: 'Motion[47]' }];
ROM_PARTNER_BODY.em069_00.partnerList = {
  id: 'duo', label: 'Combined (with Seltas)', from: '4', prefix: 'Seltas ', herLists: ['0', '3', '4'],""")
open(p, 'w', encoding='utf-8').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(p, encoding='utf-8').read()
rep("""  const req = [], joined = [], hisClips = [], free = [];""", """  const req = [], joined = [], leaves = [], hisClips = [], free = [];""")
rep("""      if (k === 'combined') req.push({ clip: 'Queen L' + lid + ' ' + c.clip, dur: c.dur, her: { list: lid, clip: c.clip }, group: 'required' });""",
"""      if (k === 'combined') req.push({ clip: 'Queen L' + lid + ' ' + c.clip, dur: c.dur, her: { list: lid, clip: c.clip }, group: 'required' });
      else if (k === 'release' && spec.leaves)
        leaves.push({ clip: 'Queen L' + lid + ' ' + c.clip + ' + Seltas leaves', dur: c.dur, her: { list: lid, clip: c.clip }, leaves: true, group: 'leaves' });""")
rep("""  const clips = [...req, ...joined, ...hisClips, ...free];
  if (clips.length) m.lists.push({ id: pl.id, label: pl.label, file: herList.file, clips, partner: true,
                                   groups: { required: req.length, joined: joined.length, his: hisClips.length, free: free.length } });""",
"""  const clips = [...req, ...joined, ...leaves, ...hisClips, ...free];
  if (clips.length) m.lists.push({ id: pl.id, label: pl.label, file: herList.file, clips, partner: true,
                                   groups: { required: req.length, joined: joined.length, leaves: leaves.length, his: hisClips.length, free: free.length } });""")
rep("""  // a combined-list entry that is a clip of hers: his ROM pair for that clip, exactly as before (or his own logic)
  if (l && l.partner && c.her){""", """  // a clip of hers where he LEAVES her at frame 0 (request 7): his 1:0x13, M46 then M47, released into world space
  if (l && l.partner && c.leaves){
    const pl = ((a.part && a.part.lists) || []).find(x => String(x.id) === String(a.spec.partnerList.from));
    return pl ? { list: pl, clip: c.clip, paired: true, rom: true, hold: null, mode: 'seq', start: 0, compose: a.spec.leaves, release: true } : null;
  }
  // a combined-list entry that is a clip of hers: his ROM pair for that clip, exactly as before (or his own logic)
  if (l && l.partner && c.her){""")
rep("""function attachFrame(a){
  a.jointNode.updateWorldMatrix(true, false);
  if (a.partner){""", """function attachFrame(a){
  a.jointNode.updateWorldMatrix(true, false);
  // RELEASED (a `release` pick): the frame stays where joint 200 was when he unlinked -- taken on the first step after
  // the pick, her frame 0 -- and her motion no longer carries him (ROM_PARTNER_BODY `leaves`)
  if (a.partner && a.pick && a.pick.release && a.releaseMat){ a.frame.matrix.copy(a.releaseMat); a.frame.matrixWorld.copy(a.frame.matrix); return; }
  if (a.partner){""")
rep("""      a.pick = pick;""", """      a.pick = pick; a.releaseMat = null;""")
# capture the release frame right after attachFrame on the first step
rep("""    attachFrame(a);
    if (a.partner){""", """    attachFrame(a);
    if (a.partner && a.pick && a.pick.release && !a.releaseMat) a.releaseMat = a.frame.matrix.clone();
    if (a.partner){""")
# glow off once he has left
rep("""      const on = a.spec.groups.concat(a.spec.claws ? [a.clawSet != null ? a.clawSet : a.spec.claws.sets[0]] : []);""",
"""      // (released: his bit is clear, so the combined glow's group 8 is not drawn -- group 0, 0xfc6468)
      const base = a.pick && a.pick.release ? a.spec.groups.map(x => x === 8 ? 0 : x) : a.spec.groups;
      const on = base.concat(a.spec.claws ? [a.clawSet != null ? a.clawSet : a.spec.claws.sets[0]] : []);""")
rep("""           bodyJointAt: at(a.jointNode), partnerJoint0At""", """           bodyJointAt: at(a.jointNode), frameAt: new THREE.Vector3().setFromMatrixPosition(a.frame.matrix).toArray().map(v => +v.toFixed(3)),
           released: !!(a.pick && a.pick.release), partnerJoint0At""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
