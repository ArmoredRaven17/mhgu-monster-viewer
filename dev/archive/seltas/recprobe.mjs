// every exported shell record of both, started on its monster's runtime (schedule.start, at the unit) and run out: no refusal
export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'records: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel');
  const body = () => M.effectRuntimeInstance();
  for (const [mon, keys] of [['em069_00', [['em069_00u', 10], ['em069_00u', 20], ['em069_00u', 21], ['em069_00c', 31], ['em069_00c', 32], ['em069_00c', 33]]],
                             ['em076_00', [['em076_00u', 0], ['em076_00u', 1], ['em076_00u', 10], ['em076_00u', 11], ['em076_00u', 20], ['em076_00u', 21]]]]){
    if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
    monSel.value = mon; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    await until(() => body() && body().monsterId === mon && body().schedule);
    for (const [pel, key] of keys){
      const S = body().schedule, e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === pel && x.def.record.key === key);
      if (!e){ check(false, pel + ' ' + key + ' exported as a shell record'); continue; }
      let started = 0, maxRun = 0;
      for (let rep = 0; rep < 2; rep++){
        try { S.start(e); started++; } catch (err){ check(false, pel + ' ' + key + ' start', String(err)); }
        for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }
      }
      check(!body().failed && started === 2, pel + ' ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });
      if (body().failed) break;
    }
  }
  return out;
}
