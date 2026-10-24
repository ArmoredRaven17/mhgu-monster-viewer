// meter1.mjs (run-check.mjs; M1_MON, M1_SEQ 'list|clip;..', M1_FRAMES, M1_KEYS 'pel|key|when,..'): the draw meter on given clips, rows for given keys
async function meter1(mon, seq, frames_, keys){
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
  cam.position.copy(C.target.clone().add(cam.position.clone().sub(C.target).multiplyScalar(2.5))); C.update();
  V.effectMeter(true, { every: 5 });
  for (const step of seq){
    const [l, c] = step.split('|');
    if (V.state.list !== l){ listSel.value = l; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === c) || [...clipSel.options].find(x => x.value === c + '_start') || [...clipSel.options].find(x => x.value === c + '_loop');
    clipSel.value = o.value; await clipSel.onchange();
    await frames(frames_);
  }
  const rows = V.effectMeterReport().recs.filter(r => keys.some(k => r.key === mon + '|' + k));
  for (const r of rows) out.push([false, 'METER ' + r.key, JSON.stringify({ starts: r.starts, draws: r.draws, lit: r.litSamples + '/' + r.samples, px: r.pixMax, aimed: r.aimedLit + '/' + r.aimed, hidden: r.hidden, verdict: r.verdict })]);
  out.push([false, 'FAILED? ' + String(M.effectRuntimeInstance() && M.effectRuntimeInstance().failed), '']);
  if (!rows.length) out.push([false, 'METER none of ' + keys.join(','), '']);
  V.effectMeter(false);
  return out;
}
export const pageCheck = meter1;
export const args = [[process.env.M1_MON || 'em084_00', (process.env.M1_SEQ || '3|Motion[65]').split(';'), +(process.env.M1_FRAMES || 300), (process.env.M1_KEYS || 'em084_00c|800|event').split(',')]];
