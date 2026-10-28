// kushwind/kwsoak.mjs (2026-10-27): after the node camera (0x9bca30) went in -- every monster mounted, its default clip played 90
// frames with the camera on his right side, and each class-held / rage record started too: does any runtime refuse (rt.failed)?
async function kwSoak(Pj){
  const P = JSON.parse(Pj || '{}');
  const out = [];
  const V = window.__view, M = await import('/render/monster.js'), $ = id => document.getElementById(id);
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = $('monSel');
  const ids = P.ids || [...monSel.options].map(o => o.value).filter(v => /^em\d/.test(v));
  for (const id of ids){
    try {
      monSel.value = id; await monSel.onchange(); await frames(5);
      await V.effects(false); await V.effects(true);
      await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === id, 600);
      const C = V.controls, cam = V.camera, d = cam.position.distanceTo(C.target);
      cam.position.copy(C.target.clone().add(new cam.position.constructor(1, 0.12, 0).normalize().multiplyScalar(d))); C.update();
      const rt = M.effectRuntimeInstance();
      // every event record started once (placeEvent-free: the plain start), so the camera nodes of held / event rows run
      let started = 0;
      if (rt && rt.schedule) for (const e of rt.schedule.entries) if (e.def.record && (e.when === 'event' || e.when === 'rage')){
        try { rt.schedule.start(e); started++; } catch (err){ out.push([false, id + ' start ' + e.def.record.pel + ':' + e.def.record.key, String(err).slice(0, 160)]); }
      }
      await frames(P.frames || 90);
      const r2 = M.effectRuntimeInstance();
      out.push([!(r2 && r2.failed), id, JSON.stringify({ started, running: r2 && r2.schedule ? r2.schedule.running : null, failed: r2 && r2.failed ? String(r2.failed).slice(0, 200) : null })]);
    } catch (err){ out.push([false, id, String(err && err.stack || err).slice(0, 200)]); }
  }
  return out;
}
export const pageCheck = kwSoak;
export const args = [[process.env.DBG || '{}']];
