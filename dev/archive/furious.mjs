// Furious Rajang on mount: the material state shown and its clock (settled = no transition playing), the rage-start record,
// and Rajang (who opens Normal) for contrast
async function furious(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  const monSel = document.getElementById('monSel');
  for (const MON of ['em023_05', 'em023_00']){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await until(() => V.state.id === MON && V.mounted.main);
    await frames(2);
    const ms = V.motionStates().mat;
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON && M.effectRuntimeInstance().schedule, 300);
    const rt = M.effectRuntimeInstance(), S = rt && rt.schedule;
    const live = S ? S.entries.filter(e => e.requests.length).map(e => (e.def.record ? e.def.record.pel + ' ' + e.def.record.key : e.def.efl) + ' (' + e.when + ')') : null;
    out.push([false, MON, JSON.stringify({ rage: V.state.rage, mat: ms, settled: ms && ms.t < 0, effectsLive: live })]);
  }
  return out;
}
export const pageCheck = furious;
