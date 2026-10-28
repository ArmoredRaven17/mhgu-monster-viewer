// laneA/lying.mjs (effects lane A, 2026-10-25): the shared c 1500 (0xa409c; index.html stepC1500) on any monster -- the Ground control
// on a water-class floor (g2shallow: flags & 0x1002), then each MOTION_STATES row the gate reads as lying (a sleep hold: `puffOff` or an
// `every` of c 1102; or `dead`) played 150 frames, the draw meter on. One PROBE-format line per monster (cenreport.py reads `PROBE <id>`).
// LYING_IDS env: comma list. The pq/w*.json probes did the same by hand per Flying Wyvern.
async function lying(MON){
  const V = window.__view, M = await import('/render/monster.js'), MS = await import('/render/motion-states.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip');
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
  const C = V.controls, cam = V.camera;
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  V.state.loop = false;
  V.effectMeter(true, { every: 5 });
  const log = [];
  const g = $('monGroundType'); if (g){ g.value = 'g2shallow'; g.dispatchEvent(new Event('change')); await frames(4); log.push('ground g2shallow'); }
  const rows = MS.MOTION_STATES[MON] || {};
  const lyingRow = s => s && (s.dead || s.puffOff || (s.every && s.every[0] && s.every[0][1] === 1102)
                           || (s.cycle && s.cycle.some(a => a && (a.dead || a.puffOff || (a.every && a.every[0] && a.every[0][1] === 1102)))));
  const keys = Object.keys(rows).filter(k => lyingRow(rows[k])).slice(0, 6);
  for (const k of keys){
    const i = k.indexOf('|'), l = k.slice(0, i), c = k.slice(i + 1);
    if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
    const base = c.replace(/#.*$/, '');
    const opt = [...clipSel.options].find(o => o.value === c) || [...clipSel.options].find(o => o.value.replace(/#.*$/, '').replace(/_(start|loop)$/, '') === base);
    if (!opt){ log.push('no clip ' + k); continue; }
    V.state.loop = true; clipSel.value = opt.value; await clipSel.onchange(); await frames(150); V.state.loop = false;   // loop set before the pick (lane B probe2.mjs)
    log.push('played ' + l + '|' + opt.value);
  }
  if (g){ g.value = 'plain'; g.dispatchEvent(new Event('change')); }
  const rep = V.effectMeterReport(); V.effectMeter(false);
  const want = rep.recs.filter(r => r.when !== 'shell' && /\|1500\|event$/.test(r.key));
  const rowsOut = want.map(r => ({ k: r.key, st: r.starts, live: r.liveFrames, lit: r.litSamples, s: r.samples, px: r.pixMax, verdict: r.verdict, clips: Object.keys(r.clips).slice(0, 3) }));
  return [[rowsOut.some(r => r.verdict === 'draws'), 'PROBE ' + MON, JSON.stringify({ log, rows: rowsOut, missing: rowsOut.length ? [] : ['c 1500'] })]];
}
export const pageCheck = lying;
export const args = ((typeof process !== 'undefined' && process.env.LYING_IDS) || 'em043_00').split(',').map(x => [x]);
