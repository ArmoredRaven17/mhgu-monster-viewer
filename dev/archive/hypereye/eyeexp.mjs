// hypereye/eyeexp.mjs (hyper-eye lane, 2026-10-27): DIAGNOSTIC ONLY (not a fix): why the hyper head aura's eye rows show black on the
// page. The head aura on (as eyepage.mjs), then four shots of the same frame with the runtime's order() wrapped so the eye model meshes
// (cm200_108) are changed after syncModels: base / RevSub hidden / RevSub depthWrite off / every eye mesh depthTest off. Also prints
// each eye draw's mesh material state (blend, depth) and the fragment colour inputs.
async function check(ids, distM, run){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), SK = await import('/render/skeleton.js');
  const THREE = V.camera.position.constructor;
  const HA = await (await fetch('/hyper-auras.json')).json();
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), monSel = $('monSel');
  for (const MON of ids){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange(); await frames(120);
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
    const rt = M.effectRuntimeInstance();
    const file = HA[MON] && (HA[MON].g || HA[MON].normal);
    const effs = rt.def.effects || [];
    const head = file && file.auras.find(a => effs.some(e => e.record && e.record.pel === MON + 'u' && e.record.key === a.key && /_500\.efl$/.test(e.efl)));
    const sel = $('monHyper');
    const opt = [...sel.options].find(o => o.value && o.value.split(',').map(Number).includes(head.id));
    const root = V.mounted.main, bone = SK.gidBonesOf(root).find(b => b.gid === head.joint);
    await V.shot(run, MON + '_xpose');
    const eyes = [];
    root.traverse(o => { if (o.isMesh && o.visible && [].concat(o.material).some(m => /eye/i.test(m.name || ''))){
      const pos = o.geometry.attributes.position, v = new THREE();
      for (let i = 0; i < pos.count; i++){ o.getVertexPosition ? o.getVertexPosition(i, v) : v.fromBufferAttribute(pos, i); eyes.push(v.clone().applyMatrix4(o.matrixWorld)); } } });
    const eyeW = eyes.reduce((s, p) => s.add(p), new THREE()).multiplyScalar(1 / Math.max(1, eyes.length));
    const headW = new THREE().setFromMatrixPosition(bone.node.matrixWorld);
    const fwd = eyeW.clone().sub(headW).normalize();
    const C = V.controls, cam = V.camera;
    C.target.copy(eyeW); cam.position.copy(eyeW.clone().add(fwd.multiplyScalar(distM))); cam.position.y += distM * 0.15; C.update(); await frames(2);
    if (V.pose.action) V.pose.action.timeScale = 1;
    if (opt){ sel.value = opt.value; sel.onchange({ target: sel }); }
    await frames(90);
    const orig = rt.order.bind(rt);
    let mode = 'base', info = null;
    rt.order = function(gpu, prims, models){
      orig(gpu, prims, models);
      const eyeDraws = models.filter(d => d.mesh && /cm200_108/.test(d.model));
      info = eyeDraws.map(d => ({ blend: d.blend, depth: d.depth, prim: d.primColor, order: d.mesh.renderOrder, vis: d.mesh.visible,
                                  dt: d.mesh.material.depthTest, dw: d.mesh.material.depthWrite, transparent: d.mesh.material.transparent }));
      for (const d of eyeDraws){
        const rev = /RevSub/.test(d.blend);
        if (mode === 'noRevSub' && rev) d.mesh.visible = false;
        if (mode === 'revNoDepthWrite' && rev) d.mesh.material.depthWrite = false;
        if (mode === 'noDepthTest') d.mesh.material.depthTest = false;
        if (mode === 'coreOnly' && !rev) d.mesh.material.depthTest = false;
        if (mode === 'coreOnly' && rev) d.mesh.visible = false;
      }
    };
    const shots = {};
    for (const m of ['base', 'noRevSub', 'revNoDepthWrite', 'noDepthTest', 'coreOnly']){
      mode = m;
      try { await V.shot(run, MON + '_x_' + m); shots[m] = info; } catch (e){ shots[m] = 'failed ' + e.message; }
      if (V.pose.action) V.pose.action.timeScale = 1;
      await frames(1);
    }
    rt.order = orig;
    sel.value = ''; sel.onchange({ target: sel });
    out.push([true, 'EYEXP ' + MON, JSON.stringify(shots)]);
  }
  return out;
}
export const pageCheck = check;
export const args = [[((typeof process !== 'undefined' && process.env.EYE_IDS) || 'em002_00').split(','),
                      +((typeof process !== 'undefined' && process.env.EYE_DIST) || 3),
                      (typeof process !== 'undefined' && process.env.EYE_RUN) || 'hypereye']];
