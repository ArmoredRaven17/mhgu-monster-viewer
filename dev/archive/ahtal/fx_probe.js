// PROBE: Ahtal-Ka's exported effect records that draw Ahtal-Neset's effect MODELS (em087_00_001 = a broken Dragonator
// spike, em087_00_000 = a ballista ball) -- em088_00_000.efl (u 200 / 201 / 210 / 211 / 220 / 221, joint 130) -- played
// live on the clips the PSL binds them to. Nothing here changes the page; it plays and shoots.
const V = window.__view;
const THREE = await import('three');
const M = await import('/render/monster.js');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const until = async (f, n = 600) => { for (let i = 0; i < n; i++){ if (f()) return true; await wait(16); } return false; };
const id = 'em088_00';
if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
monSel.value = id; await monSel.onchange(); await wait(2500);
await V.effects(false); await V.effects(true);
await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === id && M.effectRuntimeInstance().schedule);
const out = {};
async function run(list, clip, frames, tag){
  const S = M.effectRuntimeInstance().schedule, fired = [];
  const f0 = S.fire.bind(S); S.fire = (p, k) => { fired.push(k); return f0(p, k); };
  if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
  clipSel.value = 'Motion[1]'; await clipSel.onchange(); await wait(200);
  fired.length = 0;
  clipSel.value = clip; await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name === clip);
  const shots = [];
  for (const fr of frames){
    await until(() => V.pose.action.time * 60 >= fr, 900);
    V.frameAll && V.frameAll();
    const r = await V.shot('em088-fx', tag + '_f' + fr, V.pose.action.time);
    shots.push({ frame: Math.round(V.pose.action.time * 60), saved: r && r.saved, errors: (r && r.errors || []).slice(-3) });
    V.pose.action.paused = false; V.pose.action.timeScale = 1;
  }
  S.fire = f0;
  const live = (S.entries || []).filter(e => e.requests && e.requests.some(q => !q.stopped)).map(e => e.def && e.def.record && e.def.record.key);
  return { fired, live, shots };
}
out.m4 = await run('2', 'Motion[4]', [80, 140, 220], 'L2M4');
out.m6 = await run('2', 'Motion[6]', [60, 100], 'L2M6');
return out;
