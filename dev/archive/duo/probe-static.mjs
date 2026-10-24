// probe-static.mjs: every entry of the combined list, frame by frame (paused, her time set), his bones' largest local rotation
// change from the previous frame; static stretches of >= 10 frames (max change < 0.005 rad) are listed with what he plays there
async function probe(){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (await test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === 'em069_00')) monSel.add(new Option('em069_00', 'em069_00'));
  monSel.value = 'em069_00'; await monSel.onchange();
  listSel.value = 'duo'; await listSel.onchange();
  const L = V.MON.monsters.find(m => m.id === 'em069_00').lists.find(l => l.id === 'duo');
  const only = (window.__probeOnly || null);
  const rows = [];
  for (const c of L.clips){
    if (only && !only.includes(c.clip)) continue;
    clipSel.value = c.clip; await clipSel.onchange();
    await until(async () => V.pose.action && (await V.partner()).mounted, 900); await frames(3);
    const g = V.mounted.em076_00;
    if (!g){ rows.push({ entry: c.clip, err: 'not mounted' }); continue; }
    const bones = []; g.traverse(o => { if (o.isBone) bones.push(o); });
    V.pose.action.paused = true;
    const F = Math.min(600, Math.round(V.pose.action.getClip().duration * 60));
    let prev = null, run = 0, runStart = 0;
    const stretches = [];
    let first = null;
    for (let f = 0; f < F; f++){
      V.pose.action.time = f / 60; await frames(1);
      const cur = bones.map(b => b.quaternion.clone());
      if (prev){
        let mx = 0;
        for (let i = 0; i < cur.length; i++){ const d = cur[i].angleTo(prev[i]); if (d > mx) mx = d; }
        if (mx < 0.005){ if (run === 0) runStart = f - 1; run++; }
        else { if (run >= 9) stretches.push([runStart, f - 1]); run = 0; }
      }
      prev = cur;
    }
    if (run >= 9) stretches.push([runStart, F - 1]);
    const info = [];
    for (const [a, b] of stretches){
      V.pose.action.time = a / 60; await frames(1);
      const q = await V.partner();
      info.push({ from: a, to: b, local: q.local, mode: q.mode, unl: q.unl ? q.unl.kind : null });
    }
    V.pose.action.paused = false;
    if (info.length) rows.push({ entry: c.clip, F, static: info });
  }
  out.push([false, 'static stretches', JSON.stringify(rows)]);
  return out;
}
export const pageCheck = probe;
