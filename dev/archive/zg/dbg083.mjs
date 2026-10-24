// debug: does switching the list to 3 auto-play L3 Motion[1] (one count of its cycle) on Elderfrost?
async function dbg(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em083_04';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON);
  const keys = [];
  let on = true;
  (async () => { while (on){ const c = V.motionStates().cur; const k = (c && c.key) + ' / ' + (V.pose.action && V.pose.action.getClip().name);
    if (keys[keys.length - 1] !== k) keys.push(k); await frames(1); } })();
  listSel.value = '0'; await listSel.onchange(); await frames(4);
  keys.push('-- list 3 now');
  listSel.value = '3'; await listSel.onchange(); await frames(4);
  keys.push('-- clip L3 M11 now');
  clipSel.value = 'Motion[11]'; await clipSel.onchange(); await frames(4);
  on = false;
  check(false, 'debug', { keys, clip0: [...clipSel.options].slice(0, 3).map(o => o.value) });
  return out;
}
export const pageCheck = dbg;
