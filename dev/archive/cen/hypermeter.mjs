// hypermeter.mjs (2026-10-25): the Hyper dropdown on every monster that has hyper data -- each option held 90 frames over the first
// clip of List 0, the draw meter on: per aura record (u 1300 + ID) its starts / lit samples / verdict.  METER_IDS=a,b,...
async function hyperMeter(ids){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  for (const MON of ids){
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
    const C = V.controls, cam = V.camera;
    cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
    const sel = $('monHyper');
    await until(() => sel && sel.options.length > 1 && !$('monHyperRow').hidden, 300);
    const opts = [...sel.options].map(o => [o.value, o.textContent]).filter(([v]) => v);
    if (!opts.length){ out.push([false, 'HYPER ' + MON, JSON.stringify({ error: 'no Hyper options' })]); continue; }
    if (listSel.value !== '0'){ listSel.value = '0'; await listSel.onchange(); }
    clipSel.value = clipSel.options[Math.min(1, clipSel.options.length - 1)].value; await clipSel.onchange();
    V.state.loop = true;
    V.effectMeter(true, { every: 5 });
    for (const [v] of opts){ sel.value = v; sel.dispatchEvent(new Event('change')); await frames(90); }
    sel.value = ''; sel.dispatchEvent(new Event('change')); await frames(10);
    const rep = V.effectMeterReport();
    V.effectMeter(false);
    V.state.loop = false;
    const rows = rep.recs.filter(r => /\|1[23]\d\d\|/.test(r.key) && /\|13[0-2]\d\|/.test(r.key))
      .map(r => ({ k: r.key, st: r.starts, lit: r.litSamples, s: r.samples, verdict: r.verdict, nodraw: r.nodraw }));
    out.push([rows.length > 0 && rows.every(r => r.verdict === 'draws'), 'HYPER ' + MON, JSON.stringify({ options: opts, rows })]);
  }
  return out;
}
export const pageCheck = hyperMeter;
export const args = ((typeof process !== 'undefined' && process.env.METER_IDS) ? process.env.METER_IDS : 'em001_00').split(',').map(id => [[id]]);
