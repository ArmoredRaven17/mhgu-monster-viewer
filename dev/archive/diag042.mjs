// diag042.mjs: Amatsu's water line in the page -- the shells' states and the live requests every 60 frames after L2 M27 plays
export async function pageCheck(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em058_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => body() && body().monsterId === MON && body().schedule);
  listSel.value = '2'; await listSel.onchange();
  const o = [...clipSel.options].find(x => x.value === 'Motion[27]') || [...clipSel.options].find(x => x.value === 'Motion[27]_start');
  out.push([true, 'clip option ' + (o && o.value) + ' target ' + JSON.stringify(V.state && V.state.rock), '']);
  clipSel.value = o.value; await clipSel.onchange();
  for (let k = 0; k < 15; k++){
    const t0 = performance.now();
    await frames(60);
    const dt = performance.now() - t0;
    const S = body().schedule, st = S.shells && S.shells.state;
    const T = S.shellTally;
    const sh = (st ? st.shells : []).map(s => s.shell + ':' + s.state + (s.live042 ? '[' + Object.entries(s.live042).filter(([a, b]) => b).map(([a, b]) => a + (b.stopping ? 's' : '')).join(',') + ']' : ''));
    const live = S.entries.reduce((n, e) => n + e.requests.filter(q => !q.done && !q.dead).length, 0);
    const reqs = S.entries.reduce((n, e) => n + e.requests.length, 0);
    out.push([true, 'f' + (k + 1) * 60 + ' ' + Math.round(dt) + 'ms shells ' + JSON.stringify(sh) + ' requests ' + reqs + ' live ' + live + ' tally ' + (T ? T.spawned + ' ' + JSON.stringify(T.refused.slice(-2)) : ''), '']);
  }
  return out;
}
