// gorering.mjs (run-check-detail.mjs; GR_MON): the Gore line's slot ring in the page -- clips with fill sites played (each fill: u 30
// held at the point; a third fill bursts the first slot: u 31), the draw meter on, and the ring's state read back.
async function goreRing(mon){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === mon, 900);
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(3))); C.update();
  const pick = async (l, c) => { if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); } const o = [...clipSel.options].find(x => x.value === c) || [...clipSel.options].find(x => c.includes('#') && x.value.startsWith(c.split('#')[0]) && x.value.endsWith('#' + c.split('#')[1])) || [...clipSel.options].find(x => x.value.startsWith(c + '_')); if (!o){ out.push([false, 'MISSING ' + l + '|' + c, '']); return false; } clipSel.value = o.value; await clipSel.onchange(); return true; };
  const S = () => M.effectRuntimeInstance().schedule;
  V.effectMeter(true, { every: 5 });
  const plays = [['2', 'Motion[52]#B', 240], ['2', 'Motion[4]', 240], ['2', 'Motion[6]', 300]];
  for (const [l, c, n] of plays){
    if (!await pick(l, c)) continue;
    await frames(n);
    const R = S().ring; const T = S().shellTally;
    out.push([false, 'shells ' + l + '|' + c, JSON.stringify(T && { spawned: T.spawned, refused: T.refused.slice(-3) }) + ' clip ' + clipSel.value]);
    out.push([false, 'after ' + l + '|' + c, JSON.stringify(R ? { counter: R.counter, count: R.count, slots: R.slots.map(s => s.byte === 0xff ? 'free' : { byte: s.byte, life: Math.round(s.life), pt: s.point.map(Math.round) }) } : null)]);
  }
  const pel = { em071_00: 'em071_00u', em071_05: 'em071_05u', em072_00: 'em072_00u' }[mon];
  const recs = V.effectMeterReport().recs.filter(r => r.key.startsWith(mon + '|' + pel + '|3'));
  for (const r of recs) out.push([r.starts > 0 && r.verdict === 'draws', 'METER ' + r.key, JSON.stringify({ starts: r.starts, lit: r.litSamples + '/' + r.samples, px: r.pixMax, aimed: r.aimedLit + '/' + r.aimed, verdict: r.verdict })]);
  for (const k of [30, 31]) if (!recs.some(r => r.key.startsWith(mon + '|' + pel + '|' + k + '|'))) out.push([false, mon + ' NO START u ' + k, '']);
  const rt = M.effectRuntimeInstance();
  out.push([!rt.failed, mon + ': the runtime did not stop', String(rt.failed || '')]);
  V.effectMeter(false);
  return out;
}
export const pageCheck = goreRing;
export const args = ((typeof process !== 'undefined' && process.env.GR_MON) ? process.env.GR_MON : 'em071_00').split(',').map(id => [id]);
