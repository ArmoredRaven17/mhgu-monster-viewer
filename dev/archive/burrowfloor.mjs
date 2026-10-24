// burrowfloor.mjs (run-check-long.mjs; BF_IDS): per clip of a burrowing monster, the viewer's floor (monsterFloorY) against the
// unit (the clip origin, unitGamePos), in game units: floor - unit at 9 samples over the clip, the origin's own y range, the posture.
async function burrowFloor(ids){
  const out = [];
  const V = window.__view, MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  for (const MON of ids){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange(); await frames(5);
    const rows = [];
    for (const list of [...listSel.options].map(o => o.value)){
      if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); await frames(3); }
      for (const o of [...clipSel.options]){
        const mm = /Motion\[(\d+)\]/.exec(o.value); if (!mm) continue;
        clipSel.value = o.value; await clipSel.onchange(); await frames(3);
        const act = V.pose.action; if (!act || !act.getClip) continue;
        const dur = act.getClip().duration;
        act.paused = true;
        let dmin = Infinity, dmax = -Infinity, umin = Infinity, umax = -Infinity, omin = Infinity;
        for (let i = 0; i <= 8; i++){
          act.time = dur * i / 8; V.pose.mixer.update(0); V.scene.updateMatrixWorld(true);
          const u = V.unitGamePos()[1], f = V.background().floor / 0.01, w = V.world.position.y / 0.01;
          const bb = V.pose.bounds, cr = V.pose.mixer.getRoot(), ws = V.world.scale.y || 1; const old = (bb && !bb.isEmpty() ? Math.min(cr.position.y, bb.min.y) : cr.position.y) * ws / 0.01 + w; omin = Math.min(omin, old - u);
          dmin = Math.min(dmin, f - u); dmax = Math.max(dmax, f - u); umin = Math.min(umin, u - w); umax = Math.max(umax, u - w);
        }
        act.paused = false;
        const post = MS.postureOf(MON, list, 'Motion[' + mm[1] + ']');
        rows.push([list + '|Motion[' + mm[1] + ']', String(post), Math.round(dmin), Math.round(dmax), Math.round(umin), Math.round(umax), Math.round(omin)]);
      }
    }
    out.push([false, 'BF ' + MON, JSON.stringify(rows)]);
  }
  return out;
}
export const pageCheck = burrowFloor;
export const args = ((typeof process !== 'undefined' && process.env.BF_IDS) ? process.env.BF_IDS : 'em007_00').split(',').map(id => [[id]]);
