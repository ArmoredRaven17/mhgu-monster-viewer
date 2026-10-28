async function dbg(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'); if (![...monSel.options].some(o => o.value === 'em055_00')) monSel.add(new Option('em055_00', 'em055_00')); monSel.value = 'em055_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === 'em055_00', 900);
  $('monList').value = '2'; await $('monList').onchange(); await frames(60); $('monClip').value = 'Motion[29]'; await $('monClip').onchange();
  const SKM = await import('/render/skeleton.js'); window.__sk = SKM.gidBonesOf(V.mounted.main);
  const rt = M.effectRuntimeInstance(); const hev = []; const oh = rt.holdEvent.bind(rt); rt.holdEvent = (p, k, on, b) => { hev.push([p, k, on, V.pose.action && Math.round(V.pose.action.time*60)]); const r = oh(p, k, on, b); if (on) setTimeout(() => { const H = rt.host, m = H.m; const e = rt.schedule.entries.find(x => x.when === 'event' && x.def.record && x.def.record.key === 100); const SK = window.__sk; const bb = SK && SK.find(x => x.gid === 144); const jy = bb && bb.node ? bb.node.getWorldPosition(new V.camera.position.constructor()).y / 0.01 : null; hev.push(['after', H.stageFloorY, jy, rt.parent && rt.parent.position.map(Math.round), e && e.requests.map(q => { try { return [m.u32(q.core + 0xc) & 7, q.effects().length, !!q.stopped]; } catch (x) { return String(x); } })]); }, 50); return r; };
  const log = [[[...$('monClip').options].map(o => o.value).filter(v => v.includes('Motion[29') || v.includes('Motion[31')), V.state.list, V.state.clip]];
  V.state.loop = false; $('monClip').value = 'Motion[31]'; await $('monClip').onchange(); await frames(330); $('monClip').value = 'Motion[29]'; await $('monClip').onchange();
  for (let i = 0; i < 40; i++){ await frames(10); const c = V.motionStates.cur; const st = V.state; log.push([c && c.key, c && Math.round(c.frame), V.pose.action && V.pose.action.getClip().name, V.pose.action && Math.round(V.pose.action.time*60), (V.motionStates.monId)]); }
  return [[false, 'DBG', JSON.stringify(hev)]];
}
export const pageCheck = dbg; export const args = [[]];
