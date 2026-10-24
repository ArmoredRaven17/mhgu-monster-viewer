import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n') if crlf else raw.decode('utf-8')
def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:70], s.count(old))
    s = s.replace(old, new)
# 1. spawnBeamReal: an arm's joints
rep("""  const why = ray02real(S, state.prevJoints, own);
  if (why){ out.refused.push({ action: row.action, beam: t.id, why: 'beam on its monster: ' + why }); return; }
  out.spawned.push(S); state.shells.push(S);
  if (S.u38 && !(ch.count > (t.mode === 3 || t.mode === 4 ? 4 : 5))) end02g(S, out);
}""",
"""  // an arm's beam (Nakarkos): the arm's own joints as its action code saw them (state.prevArm, kept like prevJoints)
  if (row.arm) S.arm = row.arm;
  const J0 = row.arm ? (state.prevArm && state.prevArm[row.arm]) : state.prevJoints;
  if (!J0){ out.refused.push({ action: row.action, beam: t.id, why: 'beam on its monster: no joints for the ' + row.arm + ' arm (input.attachedJoints)' }); return; }
  const why = ray02real(S, J0, own);
  if (why){ out.refused.push({ action: row.action, beam: t.id, why: 'beam on its monster: ' + why }); return; }
  out.spawned.push(S); state.shells.push(S);
  if (S.u38 && !(ch.count > (t.mode === 3 || t.mode === 4 ? 4 : 5))) end02g(S, out);
}""")
# 2. the shell loop: an arm's beam moves on that arm's joints
rep("""    else if (S.base === 'base02g') step02g(S, J, ctx, input, D, out);""",
    """    else if (S.base === 'base02g') step02g(S, S.arm ? armJoints(input, S.arm) : J, ctx, input, D, out);""")
# 3. the snapshot: beam joints eagerly, and the arms'
rep("""    const g = shellJoint(sh, m);
    if (g != null) state.prevJoints(g);
  }
  state.prevJoints(0);
  return out;
}""",
"""    const g = shellJoint(sh, m);
    if (g != null) state.prevJoints(g);
  }
  state.prevJoints(0);
  // ...and the joints this monster's beam rows read (render/beam-spawns.js: the type's ray joint, an aim's joint), and an
  // attached body's (Nakarkos's arms, input.attachedJoints) the same way, for the rows it fires
  const AJ = input.attachedJoints || null;
  state.prevArm = {};
  if (AJ) for (const side of Object.keys(AJ)){
    const s2 = new Map(), Jf = armJoints(input, side);
    state.prevArm[side] = gid => { if (!s2.has(gid)){ const m = Jf(gid); s2.set(gid, m ? Array.from(m) : null); } return s2.get(gid); };
  }
  for (const r of BEAM_SPAWNS[state.monId] || []){
    const t = BEAM_MODES.find(x => x.id === r.type), PJ = r.arm ? state.prevArm[r.arm] : state.prevJoints;
    if (!PJ) continue;
    if (t && t.ray && t.ray.joint >= 0) PJ(t.ray.joint);
    if (r.aim && r.aim.joint != null) PJ(r.aim.joint);
  }
  return out;
}
// an attached body's joints by gid, as the viewer hands them (input.attachedJoints[side]: the game's 16-float matrices)
function armJoints(input, side){
  const f0 = input.attachedJoints && input.attachedJoints[side];
  return gid => (f0 ? f0(gid) : null);
}""")
if crlf: s = s.replace('\n', '\r\n')
open(p + '.tmp', 'wb').write(s.encode('utf-8')); os.replace(p + '.tmp', p)
print('ok')
