async function dbg(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === 'em027_00')) monSel.add(new Option('em027_00', 'em027_00')); monSel.value = 'em027_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em027_00', 900);
  const RT = M.effectRuntimeInstance(), S = RT.schedule;
  for (const [how, k] of [['fire', 2], ['place', 2], ['fire', 3], ['place', 3]]){
    const qs = how === 'fire' ? RT.fire('em027_00u', k) : RT.placeEvent('em027_00u', k, [{ positionOnly: true, rootJoint: 3 }]);
    const n = [];
    for (let i = 0; i < 6; i++){ await frames(1); n.push((qs || []).map(q => q.effects().length + (q.finished() ? 'F' : '')).join(',')); }
    out.push([false, how + ' u ' + k, JSON.stringify(n) + ' failed ' + RT.failed]);
  }
  return out;
}
export const pageCheck = dbg;
