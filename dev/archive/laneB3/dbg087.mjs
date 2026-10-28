// laneB3/dbg087.mjs (lane B3, 2026-10-27): Ahtal-Neset's u 500..605 fired by hand on the page -- the runtime's failure state and
// error after each (live.js fire catches and FAILS the runtime on a refusal), and the entries' request counts.
async function check(){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), MON = 'em087_00', monSel = $('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  const res = [];
  for (const key of [500, 505, 510, 515, 520, 600, 605]){
    const rt = M.effectRuntimeInstance();
    const ents = rt.schedule.entries.filter(e => e.def.record && e.def.record.key === key && e.def.record.pel === 'em087_00u');
    rt.fire('em087_00u', key);
    await frames(30);
    const rt2 = M.effectRuntimeInstance();
    res.push({ key, entries: ents.map(e => e.when + ':' + e.requests.length), failed: !!rt2.failed, err: rt2.failed ? String(rt2.error || rt2.failed).slice(0, 300) : null });
    if (rt2.failed){ await V.effects(false); await V.effects(true); await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule, 900); }
  }
  // a Parts row change: does it replace the runtime?
  const rtA = M.effectRuntimeInstance(); const s0 = rtA.schedule.starts;
  window.__point087.set(2, true); await frames(2); const s1 = M.effectRuntimeInstance().schedule.starts; await frames(28);
  const rtB = M.effectRuntimeInstance();
  const e505 = rtB.schedule.entries.find(e => e.def.record && e.def.record.key === 505);
  res.push({ toggle: 2, startsBefore: s0, startsAfter: s1, tog: JSON.stringify(window.__view.state && window.__view.state.toggles), sameRuntime: rtA === rtB, req505: e505 && e505.requests.length, meterOn: !!(window.__view.effectMeterReport) });
  out.push([res.every(r => !r.failed), 'DBG087', JSON.stringify(res)]);
  return out;
}
export const pageCheck = check;
export const args = [[]];
