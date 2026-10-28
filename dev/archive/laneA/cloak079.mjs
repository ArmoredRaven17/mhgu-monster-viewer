// laneA/cloak079.mjs (effects lane A, 2026-10-25): Nightcloak's cloak-gated u 100 / u 200 (index.html stepCloak079) under the draw meter.
// Control first: Cloaked off, Exhausted on, an idle clip and a death row -> neither may start. Then Cloaked on: u 100 (tired) and u 200 (death).
async function run(){
  const V = window.__view, M = await import('/render/monster.js'), MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), MON = 'em079_04';
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  const rows = MS.MOTION_STATES[MON] || {};
  const death = Object.keys(rows).find(k => rows[k] && rows[k].dead);
  const play = async (k, n) => {
    const i = k.indexOf('|'), l = k.slice(0, i), c = k.slice(i + 1);
    if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === c) || [...clipSel.options].find(x => x.value.replace(/#.*$/, '').replace(/_(start|loop)$/, '') === c);
    if (!o) return 'no ' + k;
    clipSel.value = o.value; await clipSel.onchange(); await frames(n); return 'played ' + l + '|' + o.value;
  };
  const tog = on => { const i = $('monTog_cloaked') && $('monTog_cloaked').querySelector('input'); if (i){ i.checked = on; i.dispatchEvent(new Event('change')); } return !!i; };
  const tired = on => { const t = $('monTired'); if (t){ t.checked = on; t.dispatchEvent(new Event('change')); } };
  const want = ['em079_04|em079_04u|100|event', 'em079_04|em079_04u|200|event'];
  const meter = () => { const rep = V.effectMeterReport(); return rep.recs.filter(r => want.includes(r.key)).map(r => ({ k: r.key, st: r.starts, verdict: r.verdict })); };
  const log = [];
  const rt0 = M.effectRuntimeInstance(), calls = [];
  const oh = rt0.holdEvent.bind(rt0), of = rt0.fire.bind(rt0);
  rt0.holdEvent = (p, k, on, b) => { if (p === 'em079_04u') calls.push(['hold', k, on]); return oh(p, k, on, b); };
  rt0.fire = (p, k, ...a) => { if (p === 'em079_04u') calls.push(['fire', k]); return of(p, k, ...a); };
  const probeState = () => [typeof V.motionStates, V.motionStates && Object.keys(V.motionStates).slice(0, 8)];
  V.effectMeter(true, { every: 5 });
  log.push('toggle ' + tog(false)); tired(true); log.push(await play('0|Motion[1]', 120)); if (death) log.push(await play(death, 120));
  const control = meter();
  V.effectMeter(false); V.effectMeter(true, { every: 5 });
  tog(true); await frames(4); log.push(await play('0|Motion[1]', 150)); log.push(JSON.stringify(probeState())); tired(false); if (death) log.push(await play(death, 150)); log.push(JSON.stringify(probeState())); log.push(JSON.stringify(calls.filter(c => c[0] === 'fire' || c[2] === false).slice(0, 10))); log.push('failed ' + String(rt0.failed && (rt0.failed.message || rt0.failed)).slice(0, 300) + ' err ' + String(rt0.error || rt0.lastError || '').slice(0, 200)); log.push('ents ' + JSON.stringify(rt0.schedule.entries.filter(e => e.def.record && e.def.record.pel === 'em079_04u' && [100, 200].includes(e.def.record.key)).map(e => [e.when, e.def.record.key, e.requests.length])));
  const rowsOut = V.effectMeterReport().recs.filter(r => want.includes(r.key))
    .map(r => ({ k: r.key, st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, px: r.pixMax, verdict: r.verdict, clips: Object.keys(r.clips).slice(0, 3) }));
  V.effectMeter(false); tog(false);
  return [[control.length === 0 && rowsOut.length === 2, 'PROBE ' + MON, JSON.stringify({ log, control, rows: rowsOut, missing: want.filter(k => !rowsOut.some(r => r.k === k)) })]];
}
export const pageCheck = run; export const args = [[]];
