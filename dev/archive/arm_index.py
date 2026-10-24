import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:70], s.count(old))
    s = s.replace(old, new)
rep("""  return { questLevel: SHELL_QUEST_LEVEL, rank: SHELL_QUEST_RANK, beamState: beamState(),
           ...shellTailInput(state.id, mounted.main && mounted.main.userData.partsDrawn) };
}""",
"""  return { questLevel: SHELL_QUEST_LEVEL, rank: SHELL_QUEST_RANK, beamState: beamState(), attachedJoints: attachedJointsInput(),
           ...shellTailInput(state.id, mounted.main && mounted.main.userData.partsDrawn) };
}
// THE ATTACHED BODIES' JOINTS, by side -- Nakarkos's arms fire most of his beams from their own joints (render/beam-spawns.js
// `arm`) -- in the convention the effect runtime hands the body's (render/rom/effect/live.js writeJoints): the bone's world
// matrix, its translation in game units (/ 0.01), read when the shells step. A partner body (Seltas) is not an arm.
function attachedJointsInput(){
  let out;
  for (const [name, a] of attached){
    if (a.partner || !a.spec || !mounted[name]) continue;
    const side = a.spec.listPrefix === 'l_' ? 'left' : a.spec.listPrefix === 'r_' ? 'right' : name;
    const bones = gidBonesOf(mounted[name]);
    (out || (out = {}))[side] = gid => {
      const b = bones.find(x => x.gid === gid);
      if (!b || !b.node) return null;
      const el = b.node.matrixWorld.elements.slice();
      el[12] /= 0.01; el[13] /= 0.01; el[14] /= 0.01;
      return el.map(Math.fround);
    };
  }
  return out;
}""")
if crlf: s = s.replace('\n', '\r\n')
open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
