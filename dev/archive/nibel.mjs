// Nibelsnarf: open (L0 M6, his opening), effects on; when does the runtime fail, on which clip / frame, and what was alive
async function nibel(){
  const out = [];
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 3000) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const MON = 'em056_00';
  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === MON && M.effectRuntimeInstance().schedule);
  const fx = M.effectRuntimeInstance(), S = fx.schedule;
  const alive = () => S.entries.filter(e => e.requests.some(q => !q.stopped)).map(e => (e.def.record ? e.def.record.pel + ':' + e.def.record.key : e.def.efl) + '(' + e.when + ')');
  let failedAt = null;
  const seen = [];
  for (let i = 0; i < 900; i++){
    await frames(1);
    if (i % 60 === 0) seen.push({ i, clip: V.state.list + '|' + V.state.clip, f: V.pose.action ? Math.round(V.pose.action.time * 60) : null, alive: alive() });
    if (fx.failed){ failedAt = { i, clip: V.state.list + '|' + V.state.clip, f: V.pose.action ? Math.round(V.pose.action.time * 60) : null, why: String(fx.failed), alive: alive() }; break; }
  }
  out.push([false, 'nibelsnarf on L0 M6', JSON.stringify({ failedAt, seen: seen.slice(0, 6) })]);
  return out;
}
export const pageCheck = nibel;
