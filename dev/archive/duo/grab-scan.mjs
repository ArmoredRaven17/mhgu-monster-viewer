// grab-scan: every clip of hers, the distance from her tail pincers (joints 160 / 161) to joint 200 (his attach point)
// and -- where he is mounted -- to his root (gid 0) and torso (gid 1), at every 4th frame. Reports rows as FAIL so the
// runner prints them.
async function pageGrabScan(){
  const out = [];
  const V = window.__view;
  const SK = await import('/render/skeleton.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (await test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em069_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  V.state.loop = true;
  await V.partner(true);
  const E = V.MON.monsters.find(m => m.id === MON);
  const gb = (root, gid) => { const b = SK.gidBonesOf(root).find(x => x.gid === gid); return b && b.node; };
  const wp = n => { n.updateWorldMatrix(true, false); return new (V.scene.position.constructor)().setFromMatrixPosition(n.matrixWorld); };
  for (const l of E.lists.filter(x => ['0', '3', '4'].includes(String(x.id)))){
    listSel.value = l.id; await listSel.onchange();
    for (const c of l.clips){
      clipSel.value = c.clip; await clipSel.onchange();
      await until(() => V.pose.action && V.pose.action.getClip().name === c.clip, 300);
      V.pose.action.paused = true;
      const F = Math.max(1, Math.round(V.pose.action.getClip().duration * 60));
      let minJ = 1e9, maxJ = 0, minR = 1e9, maxR = 0, minT = 1e9, maxT = 0, j200move = 0, first = null, mounted = false;
      for (let f = 0; f <= F; f += 6){
        V.pose.action.time = Math.min(f, F - 0.01) / 60;
        await frames(2);
        const r = await V.partner();
        const m = V.mounted.main;
        const p160 = gb(m, 160), p161 = gb(m, 161), j = gb(m, 200);
        if (!p160 || !p161 || !j) continue;
        const pc = wp(p160).add(wp(p161)).multiplyScalar(0.5), jp = wp(j);
        if (!first) first = jp.clone(); else j200move = Math.max(j200move, jp.distanceTo(first));
        const dj = pc.distanceTo(jp); minJ = Math.min(minJ, dj); maxJ = Math.max(maxJ, dj);
        if (r.mounted && V.mounted.em076_00){
          mounted = true;
          const s0 = gb(V.mounted.em076_00, 0), s1 = gb(V.mounted.em076_00, 1);
          if (s0){ const d = pc.distanceTo(wp(s0)); minR = Math.min(minR, d); maxR = Math.max(maxR, d); }
          if (s1){ const d = pc.distanceTo(wp(s1)); minT = Math.min(minT, d); maxT = Math.max(maxT, d); }
        }
      }
      V.pose.action.paused = false;
      const fx = x => x > 1e8 ? null : +x.toFixed(2);
      out.push([false, l.id + '|' + c.clip, JSON.stringify({ F, j200move: fx(j200move), pincerToJ200: [fx(minJ), fx(maxJ)],
        mounted, pincerToRoot: mounted ? [fx(minR), fx(maxR)] : null, pincerToTorso: mounted ? [fx(minT), fx(maxT)] : null })]);
    }
  }
  return out;
}
export const pageCheck = pageGrabScan;
