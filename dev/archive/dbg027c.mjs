async function dbg(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === 'em027_00')) monSel.add(new Option('em027_00', 'em027_00')); monSel.value = 'em027_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em027_00', 900);
  const RT = M.effectRuntimeInstance(), log = [];
  for (const fn of ['fire', 'placeEvent', 'holdEvent']){ const o = RT[fn].bind(RT); RT[fn] = (...a) => { log.push(fn + ' ' + JSON.stringify(a).slice(0, 80)); return o(...a); }; }
  const rg = document.getElementById('monRage');
  rg.checked = true; await rg.onchange({ target: rg }); await frames(5);
  out.push([false, 'after rage on', V.state.rage + ' ' + JSON.stringify(V.motionStates()).slice(0, 300)]);
  clipSel.value = 'Motion[2]'; await clipSel.onchange(); await frames(30);
  out.push([false, 'clip', V.state.list + '|' + clipSel.value + ' rage ' + V.state.rage]);
  out.push([false, 'log', log.slice(0, 20).join(' || ')]);
  return out;
}
export const pageCheck = dbg;
