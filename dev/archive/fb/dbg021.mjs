export const args = [];
export async function pageCheck(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em021_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => body() && body().monsterId === MON && body().schedule);
  for (const [list, name] of [['2', 'Motion[7]'], ['2', 'Motion[12]']]){
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options].map(x => x.value).filter(v => v.startsWith(name));
    const o = [...clipSel.options].find(x => x.value === name) || [...clipSel.options].find(x => x.value.startsWith(name + '_'));
    clipSel.value = o.value; await clipSel.onchange();
    const S = body().schedule, log = [];
    for (let i = 0; i < 260; i++){
      await frames(1);
      if (i % 20 === 0){ const c = S.clip; log.push([i, c && c.key, c && Math.round(c.frame), S.shellTally && S.shellTally.spawned, (S.shellTally && S.shellTally.refused.slice(-3)) || null]); }
    }
    out.push([false, list + ' ' + name, JSON.stringify({ opts, st: V.state.list, log })]);
  }
  return out;
}
