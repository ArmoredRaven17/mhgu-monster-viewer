// Nibelsnarf L0 M23: which clip plays, the driver's state and the drool, against L0 M9
async function nibel3(){
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
  const fired = [];
  const f0 = S.fire.bind(S); S.fire = (pel, key) => { const r = f0(pel, key); fired.push(pel + ':' + key); return r; };
  const res = {};
  const L0 = [...clipSel.options].map(o => o.value);
  const play = async (list, clip) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const opts = [...clipSel.options];
    const o = opts.find(x => x.value === clip) || opts.find(x => x.value === clip + '_loop') || opts.find(x => x.value === clip + '_start');
    clipSel.value = o.value; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300);
    return o.value;
  };
  V.state.loop = true;
  res.opts = (listSel.value = '0', await listSel.onchange(), [...clipSel.options].map(o => o.value).filter(v => /Motion\[(9|23)\]/.test(v)));
  for (const c of ['Motion[1]', 'Motion[9]', 'Motion[1]', 'Motion[23]', 'Motion[1]', 'Motion[23]_loop']){
    fired.length = 0;
    const v = await play('0', c);
    await frames(120);
    const ms = V.motionStates || (V.__motionStates);
    res[c + ' -> ' + v] = { fired: fired.slice(), tired: S.tired, droolKeys: Object.keys(S).filter(k => /drool|tired/i.test(k)).map(k => k + '=' + JSON.stringify(S[k]).slice(0, 60)), failed: fx.failed || null };
  }
  out.push([false, 'nibel3', JSON.stringify(res)]);
  return out;
}
export const pageCheck = nibel3;
