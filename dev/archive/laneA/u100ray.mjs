// laneA/u100ray.mjs (effects lane A, 2026-10-25): Duramboros u 100 on L2 M29 -- where the held request ends. Logs every stage-ray
// call the effect runtime makes (bridge.js 0x18154c native -> m.svc.stageRay) with the point's Y (B.y) and the floor answered, and the
// u 100 request's core state / effect count each frame from the hold. Control: the same on L2 M31 (u 100 draws there).
async function dbg(clipName, frameAt){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'); if (![...monSel.options].some(o => o.value === 'em055_00')) monSel.add(new Option('em055_00', 'em055_00')); monSel.value = 'em055_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === 'em055_00', 900);
  $('monList').value = '2'; await $('monList').onchange(); await frames(30);
  const rt = M.effectRuntimeInstance(), H = rt.host, m = H.m;
  const log = [];
  const sr0 = m.svc.stageRay;
  m.svc.stageRay = (a) => { const f = sr0(a); let by = null, ay = null; try { by = m.f32(a[2] + 4); ay = m.f32(a[1] + 4); } catch (x) {} log.push(['ray', V.pose.action && Math.round(V.pose.action.time * 60), by, ay, f]); return f; };
  V.state.loop = false; $('monClip').value = clipName; await $('monClip').onchange();
  const e = rt.schedule.entries.find(x => x.when === 'event' && x.def.record && x.def.record.key === 100 && x.def.record.pel === 'em055_00u');
  let seen = 0;
  for (let i = 0; i < 520; i++){
    await frames(1);
    const fr = V.pose.action && Math.round(V.pose.action.time * 60);
    if (e && e.requests.length){ seen++; log.push(['req', fr, e.requests.map(q => { try { return [m.u32(q.core + 0xc) & 7, q.effects().length, !!q.stopped]; } catch (x) { return String(x); } }), H.stageFloorY]); }
    else if (seen && seen < 999){ log.push(['gone', fr, H.stageFloorY]); seen = 999; }
    if (fr != null && fr > frameAt + 30) break;
  }
  m.svc.stageRay = sr0;
  return [[true, 'RAY ' + clipName, JSON.stringify(log.filter(x => x[0] !== 'ray' || (x[1] >= frameAt - 2 && x[1] <= frameAt + 12)).slice(0, 80))]];
}
export const pageCheck = dbg;
export const args = [['Motion[29]', 270], ['Motion[31]', 313]];
