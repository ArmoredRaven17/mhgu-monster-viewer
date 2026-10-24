// Start Tetsucabra's u 0 alone on the page, twice, 240 frames each, and report where the runtime stops (if it does).
export async function pageCheck(MON){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'rock: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;

  const monSel = document.getElementById('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().monsterId === MON && rt().schedule), 'runtime up');
  const fx = rt(), S = fx.schedule;
  const e = S.entries.find(x => x.def.record && x.def.record.pel === MON + 'u' && x.def.record.key === 0);
  check(!!e, 'u 0 in the schedule', e && e.when);
  if (!e) return out;
  for (let rep = 0; rep < 2; rep++){
    try { S.start(e); } catch (err){ check(false, 'start', String(err)); }
    for (let i = 0; i < 240; i++){ await frames(1); if (fx.failed) break; }
  }
  check(!fx.failed, 'u 0 alone, twice, 240 frames: the runtime still up', fx.failed ? String(fx.failed) : null);
  return out;
}
export const args = [['em066_00'], ['em066_04']];
