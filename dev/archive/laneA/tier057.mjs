// laneA/tier057.mjs (effects lane A, 2026-10-25): Zinogre's Charging rung held u 30 (tier 2) and, with the Gauge Tier 3 toggle, u 31 (id 1002)
// -- the draw meter over each, the toggle off first as the control (u 31 must not start).
async function run(){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), MON = 'em057_00';
  const monSel = $('monSel');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  const want = ['em057_00|em057_00u|30|event', 'em057_00|em057_00u|31|event'];
  const rows = () => V.effectMeterReport().recs.filter(r => want.includes(r.key)).map(r => ({ k: r.key, st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, px: r.pixMax, verdict: r.verdict, clips: [] }));
  const lv = $('monLevel'), log = ['levels ' + [...lv.options].map(o => o.value + ':' + o.textContent).join(',')];
  const tog = on => { const i = $('monTog_gaugeTier3') && $('monTog_gaugeTier3').querySelector('input'); if (i){ i.checked = on; i.dispatchEvent(new Event('change')); } return !!i; };
  V.effectMeter(true, { every: 5 });
  lv.value = '1'; lv.dispatchEvent(new Event('change')); await frames(120);
  const control = rows();
  log.push('toggle ' + tog(true)); await frames(150); tog(false); await frames(10);
  lv.value = '0'; lv.dispatchEvent(new Event('change')); await frames(10);
  const out = rows(); V.effectMeter(false);
  return [[!control.some(r => r.k.endsWith('|31|event')) && out.length === 2, 'PROBE ' + MON, JSON.stringify({ log, control, rows: out, missing: want.filter(k => !out.some(r => r.k === k)) })]];
}
export const pageCheck = run; export const args = [[]];
