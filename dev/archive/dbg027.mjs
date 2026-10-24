async function dbg(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === 'em027_00')) monSel.add(new Option('em027_00', 'em027_00')); monSel.value = 'em027_00'; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === 'em027_00', 900);
  const RT = M.effectRuntimeInstance(), log = []; for (const fn of ['fire', 'placeEvent', 'holdEvent']){ const o = RT[fn].bind(RT); RT[fn] = (...a) => { log.push(fn + ' ' + JSON.stringify(a).slice(0, 120)); return o(...a); }; }
  const rg = document.getElementById('monRage');
  out.push([false, 'rage row hidden', String(document.getElementById('monRageRow').hidden) + ' state.rage ' + V.state.rage]);
  rg.checked = true; await rg.onchange({ target: rg });
  clipSel.value = 'Motion[2]'; await clipSel.onchange(); await frames(30);
  const ms = window.__view.motionStates || null;
  out.push([false, 'state.rage', String(V.state.rage)]);
  const S = M.effectRuntimeInstance().schedule;
  out.push([false, 'all u', JSON.stringify(S.entries.filter(e => e.def.record && e.def.record.pel === 'em027_00u').map(e => e.def.record.key + e.when[0]))]); out.push([false, 'n', S.entries.length + ' mon ' + M.effectRuntimeInstance().monsterId]);
  out.push([false, 'entries u2', JSON.stringify(S.entries.filter(e => e.def.record && e.def.record.key === 2 && e.def.record.pel === 'em027_00u').map(e => [e.when, e.requests.length]))]);
  out.push([false, 'log', log.slice(0, 20).join(' || ')]); const ms2 = null;  return out;
}
export const pageCheck = dbg;
