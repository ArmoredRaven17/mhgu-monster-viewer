const V = window.__view;
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 300) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const out = {};
async function mon(id){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(1200);
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === id && M.effectRuntimeInstance().schedule);
}
async function trial(id, list, value, ms = 1500){
  const fx = M.effectRuntimeInstance(), S = fx.schedule;
  const fired = [], held = [];
  const f0 = S.fire.bind(S); S.fire = (pel, key) => { fired.push(key); return f0(pel, key); };
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  clipSel.value = value; await clipSel.onchange();
  await wait(ms);
  S.fire = f0;
  const holds = S.entries.filter(e => e.when === 'event' && e.requests.some(q => !q.stopped)).map(e => e.def.record.key);
  return { menu: clipSel.value, variant: V.state.clipVariant, clip: V.state.clip, playing: V.pose.action && V.pose.action.getClip().name, fired, holds };
}
await mon('em076_00');
out.seltasMenu = [...clipSel.options].map(o => o.textContent.split(' —')[0]).filter(t => /Motion\[19\]/.test(t));
if (V.state.list !== '0'){ listSel.value = '0'; await listSel.onchange(); }
out.seltasMenu = [...clipSel.options].map(o => o.value).filter(t => /Motion\[19\]/.test(t));
out.seltasA = await trial('em076_00', '0', 'Motion[19]_loop');
out.seltasB = await trial('em076_00', '0', 'Motion[19]_loop#B');
await mon('em061_00');
out.lagombiA = await trial('em061_00', '3', 'Motion[13]_loop');
out.lagombiB = await trial('em061_00', '3', 'Motion[13]_loop#B');
return out;
