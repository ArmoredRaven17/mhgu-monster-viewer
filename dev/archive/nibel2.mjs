// Nibelsnarf: the check's first steps, reporting the first moment the effect runtime fails and what was alive then
async function nibel2(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em056_00';
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON && M.effectRuntimeInstance().schedule, 3000);
  const fx = M.effectRuntimeInstance(), S = fx.schedule;
  const alive = () => S.entries.filter(e => e.requests.some(q => !q.stopped)).map(e => (e.def.record ? e.def.record.pel + ':' + e.def.record.key : e.def.efl) + '(' + e.when + ')');
  let lastAlive = [];
  const play = async (list, clip, n = 3) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    clipSel.value = o.value; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
    for (let i = 0; i < n; i++){ await frames(1); if (!fx.failed) lastAlive = alive(); }
    return o.value;
  };
  const steps = [];
  V.state.loop = true;
  const seq = [['0', 'Motion[1]'], ['3', 'Motion[6]'], ['3', 'Motion[8]'], ['3', 'Motion[6]'], ['3', 'Motion[11]'],
               ['3', 'Motion[1]', 120], ['3', 'Motion[1]', 120], ['3', 'Motion[1]', 120], ['3', 'Motion[6]'], ['3', 'Motion[19]', 200], ['0', 'Motion[7]', 95]];
  for (const [l, c, n] of seq){
    const v = await play(l, c, n || 3);
    steps.push(l + '|' + v + (fx.failed ? ' FAILED: ' + fx.failed : ''));
    if (fx.failed){ out.push([false, 'first failure', JSON.stringify({ steps, aliveBefore: lastAlive })]); return out; }
  }
  out.push([false, 'no failure', JSON.stringify(steps)]);
  return out;
}
export const pageCheck = nibel2;
