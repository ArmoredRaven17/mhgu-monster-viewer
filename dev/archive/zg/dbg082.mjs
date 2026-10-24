// debug: which Soulseer class record (u 310 / 320 / 321 / 330 UNIQUE) runs into an unrecorded path
async function dbg(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em082_04';
  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  const res = {};
  for (const [k, how] of [[310, 'hold'], [320, 'fire'], [321, 'fire'], [330, 'fire'], [300, 'rage']]){
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON);
    const rt = M.effectRuntimeInstance();
    try {
      if (how === 'hold') rt.holdEvent('em082_04u', k, true);
      else if (how === 'fire') rt.fire('em082_04u', k);
      else rt.setRage(true);
    } catch (e){ res[k] = 'threw ' + e; continue; }
    await frames(200);
    if (how === 'hold') rt.holdEvent('em082_04u', k, false);
    if (how === 'rage') rt.setRage(false);
    await frames(60);
    res[k] = rt.failed || 'ok';
  }
  check(false, 'debug', res);
  return out;
}
export const pageCheck = dbg;
