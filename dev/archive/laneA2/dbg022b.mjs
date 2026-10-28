// laneA2/dbg022b.mjs: Blangonga u 60 (mode 1, no joint) -- does a unit live under fire() (parent-bound) vs placeEvent (position only)?
async function dbg(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === 'em022_00')) monSel.add(new Option('em022_00', 'em022_00'));
  monSel.value = 'em022_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  for (let i = 0; i < 900 && !(M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em022_00'); i++) await frames(1);
  const rt = M.effectRuntimeInstance();
  const E = rt.schedule.entries.find(e => e.def.record && e.def.record.pel === 'em022_00u' && e.def.record.key === 60);
  const res = {};
  const live = () => E.requests.map(q => { try { return q.effects().length; } catch (e) { return 'err ' + e.message; } });
  const clipSel = document.getElementById('monClip'), listSel = document.getElementById('monList');
  listSel.value = '0'; await listSel.onchange(); await frames(10);
  E.requests.length = 0; clipSel.value = 'Motion[20]_loop#B'; await clipSel.onchange(); await frames(3);
  const q = E.requests[0];
  const A = V.pose.action; res.act = A ? { dur: A.getClip().duration, paused: A.paused, run: A.isRunning(), t: A.time, name: A.getClip().name } : null; res.adv = rt.advance; res.acc = rt.acc; res.steps = rt.stats && rt.stats.steps;
  await frames(5); res.steps2 = rt.stats && rt.stats.steps; res.adv2 = rt.advance;
  if (q){ const m = q.m, R = q.requester; res.pos = [m.f32(R + 0xc0), m.f32(R + 0xc4), m.f32(R + 0xc8)]; res.f1c = m.u32(R + 0x1c); res.t8 = m.u32(R + 8); res.units = q.effects().length; }
  E.requests.length = 0; rt.placeEvent('em022_00u', 60, [{ position: [0, 0, 0], flags1c: 3, positionOnly: true, type8: 2 }]); await frames(2); res.manualDuringClip = live();
  return [[true, 'dbg', JSON.stringify(res)]];
}
export const pageCheck = dbg;
export const args = [[]];
