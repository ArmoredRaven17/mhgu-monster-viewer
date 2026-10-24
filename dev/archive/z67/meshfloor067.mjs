// Zamtrios: per clip, the DRAWN mesh's lowest vertex over the clip (12 samples) relative to the clip origin, in game units,
// at the Form rung Normal (0) and Blob (2), against the viewer's Grid Floor rule (min(origin, bone bounds)).
async function meshFloor(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const MON = 'em067_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const lvSel = document.getElementById('monLevel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange(); await frames(5);
  const setRung = async r => { lvSel.value = String(r); await lvSel.onchange({ target: lvSel }); await frames(2); };
  const meshLow = () => {
    const cr = V.pose.mixer.getRoot(), ws = V.world.scale.y || 1, wy = V.world.position.y;
    let lo = Infinity;
    V.mounted.main.traverse(o => {
      if (!o.isSkinnedMesh) return;
      let vis = true; for (let p = o; p; p = p.parent) if (p.visible === false){ vis = false; break; }
      if (!vis) return;
      o.updateWorldMatrix(true, false);
      const pos = o.geometry.attributes.position, v = o.position.clone();
      for (let i = 0; i < pos.count; i += 2){ o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld); if (v.y < lo) lo = v.y; }
    });
    return (lo - (cr.position.y * ws + wy)) / 0.01;
  };
  const all = {};
  for (const r of [0, 2]){
    await setRung(r);
    for (const list of ['0', '2', '3', '4']){
      if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); await frames(3); }
      for (const o of [...clipSel.options]){
        if (!/Motion\[/.test(o.value)) continue;
        clipSel.value = o.value; await clipSel.onchange(); await frames(3);
        const act = V.pose.action, cr = V.pose.mixer.getRoot();
        const nm = act.getClip().name;
        const dur = act.getClip().duration;
        let lo = Infinity, at = 0;
        act.paused = true;
        for (let i = 0; i <= 12; i++){
          act.time = dur * i / 12; V.pose.mixer.update(0); await frames(1);
          V.scene.updateMatrixWorld(true);
          const m = meshLow(); if (m < lo){ lo = m; at = Math.round(act.time * 60); }
        }
        act.paused = false;
        const bb = V.pose.bounds;
        const ws = V.world.scale.y || 1, wy = V.world.position.y, oy = cr.position.y * ws + wy;
        const k = list + '|' + o.value;
        const e = all[k] || (all[k] = {});
        e['r' + r] = [+lo.toFixed(1), at, nm, V.state.list];
        e.grid = bb && !bb.isEmpty() ? +((Math.min(cr.position.y, bb.min.y) * ws + wy - oy) / 0.01).toFixed(1) : 0;
        e.raw = [bb && +bb.min.y.toFixed(3), +cr.position.y.toFixed(3), ws];
      }
    }
  }
  for (const k in all) out.push([false, k, JSON.stringify(all[k])]);
  await setRung(0);
  return out;
}
export const pageCheck = meshFloor;
