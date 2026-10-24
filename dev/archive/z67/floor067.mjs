// Zamtrios: for every clip of every list, where the viewer's Grid Floor sits against the clip origin (the ROM's unit, pinned
// to the ground in postures 0 / 4 by 0xbf284) and the lowest bone over the loop. Numbers are game units (clip units x 100),
// relative to the clip origin; floorRule = what monsterFloorY computes (min(origin, bounds.min.y) unless an air row applies).
async function floorProbe(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const MON = 'em067_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange(); await frames(5);
  for (const list of ['0', '2', '3', '4']){
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); await frames(3); }
    for (const o of [...clipSel.options]){
      if (!/Motion\[/.test(o.value)) continue;
      clipSel.value = o.value; await clipSel.onchange(); await frames(3);
      const act = V.pose.action, cr = V.pose.mixer && V.pose.mixer.getRoot();
      if (!act || !cr){ out.push([false, list + '|' + o.value, 'no action']); continue; }
      const b = V.pose.bounds;
      const dur = act.getClip().duration;
      // the lowest bone and the root's own Y over the clip, sampled at 24 steps (pose.js's walk), with the live anchoring
      let lowRel = Infinity, rootMin = Infinity, rootMax = -Infinity, lowAt = 0;
      act.paused = true;
      for (let i = 0; i <= 24; i++){
        act.time = dur * i / 24; V.pose.mixer.update(0); await frames(1);
        cr.updateWorldMatrix(true, true);
        let low = Infinity;
        cr.traverse(n => { if (n.isBone){ const e = n.matrixWorld.elements; const y = e[13]; if (y < low) low = y; } });
        // into the clip root's parent space (the world group): divide out the world scale
        const ws = V.world.scale.y || 1, wy = V.world.position.y;
        const lowLocal = (low - wy) / ws;
        const rel = (lowLocal - cr.position.y) * 100;
        if (rel < lowRel){ lowRel = rel; lowAt = Math.round(act.time * 60); }
        rootMin = Math.min(rootMin, cr.position.y * 100); rootMax = Math.max(rootMax, cr.position.y * 100);
      }
      act.paused = false;
      const rule = b && !b.isEmpty() ? Math.min(0, (b.min.y - cr.position.y) * 100) : 0;
      out.push([false, list + '|' + o.value, JSON.stringify({ floorBelowOrigin: +rule.toFixed(1), boundsMinRel: b ? +((b.min.y - cr.position.y) * 100).toFixed(1) : null,
        lowestBoneRel: +lowRel.toFixed(1), lowAt, rootY: [+rootMin.toFixed(1), +rootMax.toFixed(1)], air: b && !b.isEmpty() ? (b.min.y < cr.position.y - 1.0) : null })]);
    }
  }
  return out;
}
export const pageCheck = floorProbe;
