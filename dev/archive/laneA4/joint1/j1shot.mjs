// laneA4/joint1/j1shot.mjs (lane A4, 2026-10-25): screenshots of joint -1 effects under the shipped rule (live.js unitMatrix: the
// gid-0 bone) and the ROM's (the unit: __view.unitGamePos(), as j1meter.mjs 'unit'), the same camera and the same clip frame.
// Method as <archive>/aurashot.mjs: the viewer's own render, then canvas.toDataURL in the same task. Each item is played from frame 0
// at 1/60 s per frame to its frame, the clock then stopped (getDelta 0) and the saved camera put back before the shot.
// DBG env: { "items": [{ "id": "em083_00", "list": "2", "clip": "Motion[23]", "frame": 240, "label": "...", "ctl": null,
//                         "zoom": 1.6, "rage": false }], "rules": ["cur", "unit"] }
async function shots(Pj){
  const P = JSON.parse(Pj || '{}');
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  let RULE = 'cur';
  const install = rt => {
    if (!rt || rt.__j1) return;
    rt.__j1 = true; rt.__ob0 = rt.originBone;
    const um = rt.unitMatrix.bind(rt);
    rt.unitMatrix = o => { um(o); if (RULE === 'unit'){ const u = V.unitGamePos(); o.elements[12] = u[0] * 0.01; o.elements[13] = u[1] * 0.01; o.elements[14] = u[2] * 0.01; } return o; };
  };
  const r1 = v => Math.round(v * 10) / 10;
  let cur = null, cam0 = null;
  for (const it of P.items){
    try {
      cam0 = null;
      const shotsOf = {};
      for (const rule of (P.rules || ['cur', 'unit'])){
        RULE = rule;
        V.pose.clock.getDelta = () => 1 / 60;
        // a fresh mount per rule: the world group keeps the travel of earlier plays (index.html shiftWorld), so a replay starts elsewhere
        if (![...monSel.options].some(o => o.value === it.id)) monSel.add(new Option(it.id, it.id));
        monSel.value = it.id; await monSel.onchange(); await frames(10);
        const world0 = [V.world.position.x, V.world.position.z].map(v => r1(v * 100));
        if (it.rage != null){ const r = $('monRage'); if (r && r.checked !== !!it.rage){ r.checked = !!it.rage; r.dispatchEvent(new Event('change')); await frames(2); } }
        await V.effects(false); await V.effects(true);
        await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === it.id, 900);
        install(M.effectRuntimeInstance());
        if (it.ctl != null){ const s = $('monClassCtl'); if (s){ s.value = String(it.ctl); s.dispatchEvent(new Event('change')); await frames(2); } }
        if (V.state.list !== it.list){ listSel.value = it.list; await listSel.onchange(); await frames(2); }
        const opt = [...clipSel.options].find(o => o.value === it.clip) || [...clipSel.options].find(o => o.value.startsWith(it.clip));
        V.state.loop = !!it.loop;
        // the clip from frame 0: another clip first, so a re-select restarts it
        const other = [...clipSel.options].find(o => o.value !== opt.value);
        if (other){ clipSel.value = other.value; await clipSel.onchange(); await frames(2); }
        clipSel.value = opt.value; await clipSel.onchange();
        install(M.effectRuntimeInstance());
        if (!cam0){ const C = V.controls, cam = V.camera; const z = it.zoom || 1.6;
          // a three-quarter view from the front-right, a little above, at the fitted distance x zoom
          const d = cam.position.distanceTo(C.target) * z, dir = new cam.position.constructor(0.75, 0.35, 1).normalize();
          cam0 = { p: C.target.clone().add(dir.multiplyScalar(d)), t: C.target.clone() }; }
        await until(() => V.pose.action && Math.round(V.pose.action.time * 60) >= it.frame, 4000);
        V.pose.clock.getDelta = () => 0;
        await frames(3);
        V.camera.position.copy(cam0.p); V.controls.target.copy(cam0.t); V.controls.update();
        await frames(3);
        const rt = M.effectRuntimeInstance();
        const pos = n => { if (!n) return null; n.updateWorldMatrix(true, false); const e = n.matrixWorld.elements; return [r1(e[12] * 100), r1(e[13] * 100), r1(e[14] * 100)]; };
        V.renderer.render(V.scene, V.camera);
        const url = V.renderer.domElement.toDataURL('image/png');
        // the same frame with this runtime's draw suppressed (live.js frame: `suppressed` draws nothing) -- the body alone
        rt.suppressed = true; V.renderer.render(V.scene, V.camera);
        const body = V.renderer.domElement.toDataURL('image/png');
        rt.suppressed = false;
        shotsOf[rule] = { url, body, world0, f: Math.round(V.pose.action.time * 60), gid0: pos(rt.__ob0), unit: V.unitGamePos().map(r1),
                          running: rt.schedule ? rt.schedule.running : null, prims: rt.stats.prims, models: rt.stats.models, failed: rt.failed ? String(rt.failed).slice(0, 160) : null };
      }
      V.pose.clock.getDelta = () => 1 / 60;
      out.push([true, 'SHOT ' + it.label, JSON.stringify({ it, shots: shotsOf })]);
    } catch (e){ out.push([false, 'SHOT ' + it.label, JSON.stringify({ error: String(e && e.stack || e).slice(0, 400) })]); }
  }
  return out;
}
export const pageCheck = shots;
// one page evaluate per item (a whole run's PNGs in one CDP reply closed the socket)
const DBG0 = JSON.parse((typeof process !== 'undefined' && process.env.DBG) || '{}');
export const args = (DBG0.items || []).map(it => [JSON.stringify({ rules: DBG0.rules, items: [it] })]);
