// pq/hy056b.mjs (2026-10-25): em056_00 Hyper -- the runtime's state, the u 1301..1303 entries and their requests after the option is set
async function hy(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const MON = 'em056_00', monSel = $('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  await frames(30);
  const rt = M.effectRuntimeInstance(), S = rt.schedule, sel = $('monHyper');
  const opts = [...sel.options].map(o => o.value);
  V.effectMeter(true, { every: 5 }); sel.value = '1,2'; sel.dispatchEvent(new Event('change')); await frames(90);
  const rep = V.effectMeterReport(); V.effectMeter(false);
  const recs = rep.recs.map(r => r.key + ' st' + r.starts + ' lit' + r.litSamples + '/' + r.samples + ' ' + r.verdict);
  const ents = S.entries.filter(e => e.def.record && e.def.record.key >= 1300 && e.def.record.key < 1330)
    .map(e => ({ k: e.def.record.key, pel: e.def.record.pel, when: e.when, reqs: e.requests.length, units: e.requests.map(q => { try { return q.effects().length; } catch (x) { return 'err ' + x.message; } }) }));
  return [[false, 'HY056', JSON.stringify({ failed: !!rt.failed, err: rt.failed ? String(rt.error || rt.failed).slice(0, 400) : null, rowHidden: $('monHyperRow').hidden, recs, rts: (M.effectRuntimes ? 'has' : 'no'), opts, val: sel.value, ents })]];
}
export const pageCheck = hy;
export const args = [[]];
