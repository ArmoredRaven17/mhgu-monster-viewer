// Screenshots for the texture-loader change: three monsters, effects off, a fixed camera and the bind pose, posted to
// the dev server's /shot (dev/shots/<run>/<mon>.png). The run name comes from window.__texRun.
async function texShots(run){
  const out = [];
  const V = window.__view;
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  await V.effects(false);
  const monSel = document.getElementById('monSel');
  for (const MON of ['em088_00', 'em077_00', 'em001_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main);
    if (V.pose.action) V.pose.action.stop();
    await frames(60);
    V.frameAll && V.frameAll();
    await frames(30);
    V.renderer.render(V.scene, V.camera);
    const url = V.renderer.domElement.toDataURL('image/png');
    const r = await fetch('/shot?run=' + run + '&name=' + MON, { method: 'POST', body: url });
    out.push([r.ok, MON + ' shot ' + run, '']);
  }
  return out;
}
export const pageCheck = texShots;
export const args = [[process.env.TEXRUN || 'tex-before']];
