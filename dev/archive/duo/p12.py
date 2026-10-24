# p12.py: the dismounts as the ROM runs them (1:0x13 leave, 1:0x22 drop) -- unlinked, world space, code movement
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js'
s = open(p, encoding='utf-8').read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)
rep("""ROM_PARTNER_BODY.em069_00.leaves = [{ clip: 'Motion[46]', blend: 4 }, { clip: 'Motion[47]' }];""",
"""ROM_PARTNER_BODY.em069_00.leaves = [{ clip: 'Motion[46]', blend: 4 }, { clip: 'Motion[47]' }];
// THE DISMOUNTS, AS THE ROM RUNS THEM (Seltas duo agent, 2026-10-17; spec §18). Once unlinked he is a unit of his own: the
// engine draws his joint 0 on his unit position WITHOUT the clip's `reference` track (the seam test: 1:0x13 moves the unit
// by (0, 1392.5, 245) x size at M46's end, `0xfc8d44..0xfc8e60`, and M46's last joint 0 minus M47's first is (0, 13.80,
// 2.446) model units -- with the reference track applied instead, M47 would start 2.4 behind), and the code moves the unit:
//   leave (1:0x13, request 7): L4 M46 b4; at its end the unit += yaw-rotated (0, 1392.5, 245) x size; L4 M47 b0; at its end,
//     unlinked, vt+0x3e0 (`0x7527c`): posture 1 and action (0, 3) = L1 M1 b10 (`0xfc79f8`), the hover;
//   drop (1:0x22, after the 1200-frame freeze): yaw = his + hers (world), pitch / roll 0, + 0x8000; L4 M77 b0 (its start,
//     then its loop); v = -10 / frame, a = -1 / frame^2 (`0x7d65c`) until the ground (`0xbf0bc`; her ground, `P+0x5b4`);
//     L3 M11 b0 (start + one loop pass: the ended bit), L3 M29 b0, then vt+0x3dc (`0x75168`): posture 0 and action (0, 0) --
//     unaware (P+0x2c0 0) -- L0 M1 b10 (`0xfc7d24`).
// Game units: 0.01 a viewer unit; `commit` is in his model units (the 0.01 x size the frame's scale already carries).
ROM_PARTNER_BODY.em069_00.dismounts = {
  leave: { pieces: [{ list: '4', clip: 'Motion[46]', blend: 4 }, { list: '4', clip: 'Motion[47]', blend: 0 },
                    { list: '1', clip: 'Motion[1]_loop', blend: 10, rest: true }],
           commit: { after: 0, model: [0, 13.925, 2.45] } },
  drop:  { turn: Math.PI, fall: { v: -10, a: -1 },
           air: [{ list: '4', clip: 'Motion[77]_start', blend: 0 }, { list: '4', clip: 'Motion[77]_loop', blend: 0 }],
           land: [{ list: '3', clip: 'Motion[11]_start', blend: 0 }, { list: '3', clip: 'Motion[11]_loop', blend: 0 },
                  { list: '3', clip: 'Motion[29]', blend: 0 }, { list: '0', clip: 'Motion[1]_loop', blend: 10, rest: true }] },
};""")
rep("""    'Motion[33] with her 7:0x4e': { his: 'Motion[33]',""",
"""    // HIS DROP OFF HER BACK (1:0x22), 1200 frames after the tail grab's freeze: her side is her idle (the clip under it is
    // her table's pick, not read) -- the entry starts at his 1:0x22, on her back
    'Motion[77] drop off her (1:0x22)': { his: 'Motion[77]_start', body: [['0', 'Motion[1]_loop', { frames: 600 }]], drop: true },
    'Motion[33] with her 7:0x4e': { his: 'Motion[33]',""")
open(p, 'w', encoding='utf-8').write(s)

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s = open(p, encoding='utf-8').read()
# leaves entries carry an extended body (her clip held / looped while he flies off)
rep("""      else if (k === 'release' && spec.leaves)
        leaves.push({ clip: 'Queen L' + lid + ' ' + c.clip + ' + Seltas leaves', dur: c.dur, her: { list: lid, clip: c.clip }, leaves: true, group: 'leaves' });""",
"""      else if (k === 'release' && spec.leaves){
        // her clip held (or looped) while he flies off (spec.dismounts.leave) -- long enough to see it through
        const fr = Math.max(Math.round(c.dur * 60), 300);
        leaves.push({ clip: 'Queen L' + lid + ' ' + c.clip + ' + Seltas leaves', dur: fr / 60, her: { list: lid, clip: c.clip }, leaves: true,
                      body: [[lid, c.clip, { frames: fr }]], group: 'leaves' });
      }""")
rep("""    hisClips.push({ clip: pl.prefix + name, his: hc, dur: c.dur, body, hisSeq: Array.isArray(ent) ? null : ent.hisSeq || null, group: 'his' });""",
"""    hisClips.push({ clip: pl.prefix + name, his: hc, dur: Array.isArray(ent) || !ent.drop ? c.dur : 10, body, hisSeq: Array.isArray(ent) ? null : ent.hisSeq || null,
                    drop: !Array.isArray(ent) && !!ent.drop, group: 'his' });""")
# play(): an entry with a body of its own is composed (the leaves entries too)
rep("""              : l.partner ? (c.her ? await clipFor((e.lists || []).find(x => String(x.id) === String(c.her.list)), c.her.clip, e.glb)""",
"""              : l.partner ? (c.her && !c.body ? await clipFor((e.lists || []).find(x => String(x.id) === String(c.her.list)), c.her.clip, e.glb)""")
# partnerMotionNow: a her entry with a body walks the body's layout
rep("""  if (c.her) return at(c.her.list, c.her.clip, t, true);""", """  if (c.her && !c.body) return at(c.her.list, c.her.clip, t, true);""")
# the picks
rep("""  if (l && l.partner && c.leaves){
    const pl = ((a.part && a.part.lists) || []).find(x => String(x.id) === String(a.spec.partnerList.from));
    return pl ? { list: pl, clip: c.clip, paired: true, rom: true, hold: null, mode: 'seq', start: 0, compose: a.spec.leaves, release: true } : null;
  }""", """  if (l && l.partner && (c.leaves || c.drop) && a.spec.dismounts){
    const pl = ((a.part && a.part.lists) || []).find(x => String(x.id) === String(a.spec.partnerList.from));
    return pl ? { list: pl, clip: c.clip, paired: true, rom: true, hold: null, mode: 'seq', start: 0, compose: [], release: true,
                  unl: c.drop ? 'drop' : 'leave' } : null;
  }""")
# compose: the dismount's pieces, the landing frame, the path
rep("""async function partnerComposeClip(a, pick){
  const pieces = [], layout = [];
  let at = 0;""", """// THE DISMOUNT'S CLIP AND PATH (render/monster.js ROM_PARTNER_BODY `dismounts`): his pieces on their own lists, laid out
// to her entry's length; the unit's start (her joint at HER frame 0, upright, her facing) and the code movement
function dismountPlan(a, pick){
  const d = a.spec.dismounts[pick.unl], herF = pose.action ? Math.round(pose.action.getClip().duration * 60) : 300;
  const lists = (a.part && a.part.lists) || [];
  const durOf = x => { const l = lists.find(y => String(y.id) === x.list), c = l && (l.clips || []).find(y => y.clip === x.clip); return c ? Math.round(c.dur * 60) : 0; };
  const base = unlBaseOf(a);
  const out = [];
  let tLand = null, commitAt = null;
  if (pick.unl === 'leave'){
    let at = 0;
    d.pieces.forEach((x, i) => { const f = x.rest ? Math.max(1, herF - at) : durOf(x); out.push(Object.assign({}, x, { frames: f })); if (i === d.commit.after) commitAt = at + f; at += f; });
  } else {
    // the fall: -10 / frame, -1 / frame^2 (game units; 0.01 a viewer unit) from the unit's height to her ground
    const drop = base ? Math.max(0, base.pos.y - monsterFloorY()) / 0.01 : 0;
    let n = 0; while (-(d.fall.v * n + d.fall.a * n * n / 2) < drop && n < 600) n++;
    tLand = n;
    const s0 = durOf(d.air[0]);
    out.push(Object.assign({}, d.air[0], { frames: Math.max(1, Math.min(s0, n)) }));
    if (n > s0) out.push(Object.assign({}, d.air[1], { frames: n - s0 }));
    let at = Math.max(1, n);
    for (const x of d.land){ const f = x.rest ? Math.max(1, herF - at) : durOf(x); out.push(Object.assign({}, x, { frames: f })); at += f; }
  }
  pick.plan = { base, commitAt, tLand, d };
  return out;
}
// the unit when he unlinks: her joint at HER frame 0 (sampled from her driver, put back), upright, at her facing (his yaw +
// hers, pitch / roll 0: 0xfc5020..0xfc5048 / 0xfc9b4c..0xfc9b84)
function unlBaseOf(a){
  const m = releaseMatOf(a) || jointFrameOf(a);
  if (!m) return null;
  const pos = new THREE.Vector3().setFromMatrixPosition(m);
  mountFrame.updateWorldMatrix(true, false);
  const q = mountFrame.getWorldQuaternion(new THREE.Quaternion());
  const scn = pose.mixer && pose.mixer.getRoot(), ref = scn && scn.getObjectByName('reference');
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
  const yaw = Math.atan2(fwd.x, fwd.z) + (ref ? ref.rotation.y : 0);
  return { pos, yaw, scale: (a.part && a.part.sizeBase) || 1 };
}
// his frame at her frame t, unlinked: the unit's start plus the code's movement (render/monster.js `dismounts`)
const _uq = new THREE.Quaternion(), _uy = new THREE.Vector3(0, 1, 0);
function unlFrameAt(a, t){
  const pl = a.pick && a.pick.plan;
  if (!pl || !pl.base) return null;
  const b = pl.base, p = b.pos.clone();
  let yaw = b.yaw;
  if (a.pick.unl === 'leave'){
    if (pl.commitAt != null && t >= pl.commitAt){
      const o = new THREE.Vector3(...pl.d.commit.model).multiplyScalar(b.scale).applyAxisAngle(_uy, yaw);
      p.add(o);
    }
  } else {
    yaw += pl.d.turn;
    const n = Math.min(t, pl.tLand);
    p.y -= -(pl.d.fall.v * n + pl.d.fall.a * n * n / 2) * 0.01;
    if (t >= pl.tLand) p.y = Math.min(p.y, monsterFloorY());
  }
  _uq.setFromAxisAngle(_uy, yaw);
  return new THREE.Matrix4().compose(p, _uq, new THREE.Vector3(b.scale, b.scale, b.scale));
}
async function partnerComposeClip(a, pick){
  const pieces = [], layout = [];
  let at = 0;
  if (pick.unl) pick.compose = dismountPlan(a, pick);""")
rep("""    const x = pick.compose[i], pc = await clipFor(pick.list, x.clip, a.part.glb);""",
"""    const x = pick.compose[i];
    const xl = x.list ? ((a.part && a.part.lists) || []).find(y => String(y.id) === String(x.list)) || pick.list : pick.list;
    const pc = await clipFor(xl, x.clip, a.part.glb);""")
rep("""    layout.push({ from: at, frames: fr, clip: x.clip, mode: /_loop$/.test(x.clip) ? 'wrap' : 'play', start: st, dur: seqFrames(pc) });""",
"""    layout.push({ from: at, frames: fr, clip: x.clip, list: x.list || null, mode: /_loop$/.test(x.clip) ? 'wrap' : 'play', start: st, dur: seqFrames(pc) });""")
rep("""  return { clip: seg.clip, frame: fr };
}
async function playAttached(l, c){""", """  return { clip: seg.clip, frame: fr, list: seg.list || null };
}
async function playAttached(l, c){""")
# the driver holds his `reference` node while unlinked (the engine draws joint 0 on the unit)
rep("""      a.driver.loopMode = pick.paired ? pose.loopMode : () => 'repeat';
      await a.driver.play({ file: pick.list.file, clip: pick.clip, model: a.part.glb, clip3: pclip },""",
"""      a.driver.loopMode = pick.paired ? pose.loopMode : () => 'repeat';
      a.driver.holdReference = !!pick.unl;
      await a.driver.play({ file: pick.list.file, clip: pick.clip, model: a.part.glb, clip3: pclip },""")
# attachFrame: unlinked -> the unit's path
rep("""  if (a.partner && a.pick && a.pick.release && a.releaseMat){ a.frame.matrix.copy(a.releaseMat); a.frame.matrixWorld.copy(a.frame.matrix); return; }""",
"""  if (a.partner && a.pick && a.pick.unl){
    const m = unlFrameAt(a, pose.action ? Math.round(pose.action.time * 60) : 0);
    if (m){ a.frame.matrix.copy(m); a.frame.matrixWorld.copy(m); return; }
  }
  if (a.partner && a.pick && a.pick.release && a.releaseMat){ a.frame.matrix.copy(a.releaseMat); a.frame.matrixWorld.copy(a.frame.matrix); return; }""")
# wings / claws read the piece's own list
rep("""        const wp = loc ? wingPartsAt(a.spec.monster, a.spec.list, loc.clip, loc.frame) : null;""",
"""        const wp = loc ? wingPartsAt(a.spec.monster, loc.list || a.spec.list, loc.clip, loc.frame) : null;""")
# readback: the unlinked plan
rep("""           released: !!(a.pick && a.pick.release), wingParts:""",
"""           released: !!(a.pick && a.pick.release), unl: a.pick && a.pick.unl ? { kind: a.pick.unl, commitAt: a.pick.plan && a.pick.plan.commitAt,
             tLand: a.pick.plan && a.pick.plan.tLand, yaw: a.pick.plan && a.pick.plan.base ? +a.pick.plan.base.yaw.toFixed(4) : null,
             floor: +monsterFloorY().toFixed(3), layout: (a.pick.layout || []).map(x => [x.list, x.clip, x.from, x.frames]) } : null,
           frameYaw: (() => { const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().extractRotation(a.frame.matrix)); const f = new THREE.Vector3(0, 0, 1).applyQuaternion(q); return +Math.atan2(f.x, f.z).toFixed(4); })(),
           wingParts:""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
