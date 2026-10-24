// Zamtrios at the Blob rung on blob clips (and Normal on L0 M1): per VISIBLE mesh group, its lowest vertex (game units rel. the
// clip origin) and its extent (max - min over x / y / z) -- a collapsed (scale-0) piece has extent ~0
async function perMesh(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const MON = 'em067_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const lvSel = document.getElementById('monLevel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange(); await frames(5);
  const setRung = async r => { lvSel.value = String(r); await lvSel.onchange({ target: lvSel }); await frames(2); };
  for (const [rung, list, clip, f] of [[0, '0', 'Motion[1]_loop', 0], [2, '4', 'Motion[1]_loop', 100], [2, '3', 'Motion[100]', 99], [2, '4', 'Motion[5]_loop', 45], [2, '4', 'Motion[12]', 188], [2, '4', 'Motion[2]', 0], [2, '4', 'Motion[2]', 200], [2, '0', 'Motion[1]_loop', 0]]){
    await setRung(rung);
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); await frames(3); }
    clipSel.value = clip; await clipSel.onchange(); await frames(3);
    const act = V.pose.action, cr = V.pose.mixer.getRoot();
    act.paused = true; act.time = f / 60; V.pose.mixer.update(0); await frames(2); V.scene.updateMatrixWorld(true);
    const ws = V.world.scale.y || 1, wy = V.world.position.y, oy = cr.position.y * ws + wy;
    const per = {};
    V.mounted.main.traverse(o => {
      if (!o.isSkinnedMesh) return;
      let vis = true; for (let p = o; p; p = p.parent) if (p.visible === false){ vis = false; break; }
      if (!vis) return;
      let g = null; for (let p = o; p; p = p.parent){ const m = /Group\[(\d+)\]/.exec(p.name || ''); if (m){ g = m[1]; break; } const m2 = /^Group(\d+)/.exec(p.name || ''); if (m2){ g = m2[1]; break; } }
      const key = 'G' + (g == null ? o.name : g);
      const pos = o.geometry.attributes.position, v = o.position.clone();
      const e = per[key] || (per[key] = { lo: Infinity, mn: [Infinity, Infinity, Infinity], mx: [-Infinity, -Infinity, -Infinity] });
      for (let i = 0; i < pos.count; i++){ o.getVertexPosition(i, v); v.applyMatrix4(o.matrixWorld);
        const y = (v.y - oy) / 0.01; if (y < e.lo) e.lo = y;
        [v.x, v.y, v.z].forEach((c, k) => { e.mn[k] = Math.min(e.mn[k], c); e.mx[k] = Math.max(e.mx[k], c); }); }
    });
    const rows = Object.entries(per).map(([k, e]) => [k, +e.lo.toFixed(0), e.mx.map((x, i) => +((x - e.mn[i]) / 0.01).toFixed(0))]).sort((a, b) => a[1] - b[1]);
    out.push([false, 'rung' + rung + ' ' + list + '|' + clip + ' f' + f, JSON.stringify(rows)]);
    act.paused = false;
  }
  await setRung(0);
  return out;
}
export const pageCheck = perMesh;
