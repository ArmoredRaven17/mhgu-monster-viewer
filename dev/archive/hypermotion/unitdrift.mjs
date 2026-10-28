// hypermotion/unitdrift.mjs (hyper-motion lane, 2026-10-27; the shells lane's Deviljho L2 M25 shots, gapZ/em043_00_off0 / _on0): does
// the Hyper motion side move the unit differently? DRIFT_MON / DRIFT_LIST / DRIFT_CLIP / DRIFT_PAIR. The clip is played from frame 0 with
// the clock fixed at 1/60 s, Hyper off and then the pair; at each render frame the clip frame (act.time x 60), the timeScale, the unit's
// world position (the model root and its bone '00', game units x 100) and the world group's offset are logged; the two runs are then
// compared AT EQUAL CLIP FRAMES (nearest sample). Also the live records near the head with the pair held (the red glow).
async function drift(mon, list, clip, pair){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip'), sel = $('monHyper');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === mon, 900);
  listSel.value = list; await listSel.onchange(); await frames(2);
  const opts = [...clipSel.options].map(o => o.value);
  const c = opts.includes(clip) ? clip : opts.find(o => o.startsWith(clip));
  const runs = {};
  for (const hv of ['', pair]){
    await until(() => [...sel.options].some(o => o.value === hv), 300);
    sel.value = hv; sel.dispatchEvent(new Event('change')); await frames(2);
    V.state.loop = false;
    clipSel.value = c; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(c), 300);
    const act = V.pose.action, dur = act.getClip().duration; act.time = 0;
    const root = V.mounted.main, log = [];
    let bone = null; root.traverse(o => { if (!bone && o.isBone && /^(00|bone00?|j00)$/i.test(o.name)) bone = o; });
    for (let k = 0; k < 2000; k++){
      await frames(1);
      root.updateWorldMatrix(true, true);
      const p = new root.position.constructor(); (bone || root).getWorldPosition(p);
      const g = root.parent ? root.parent.position : { x: 0, y: 0, z: 0 };
      log.push([Math.round(act.time * 600) / 10, act.timeScale, Math.round(p.x * 1000) / 10, Math.round(p.y * 1000) / 10, Math.round(p.z * 1000) / 10, Math.round(g.x * 1000) / 10, Math.round(g.z * 1000) / 10]);
      if (act.time >= dur - 1e-3 || (act.paused && k > 2)) break;
    }
    runs[runs.off ? 'on' : 'off'] = { log, bone: bone ? bone.name : 'root', cam: V.camera.position.toArray().map(v => Math.round(v * 100) / 100) };
    if (hv){
      const rt = M.effectRuntimeInstance();
      runs.live = (rt && rt.liveRecords ? rt.liveRecords() : null);
    }
  }
  // compare at equal clip frames
  const at = (log, f) => log.reduce((b, r) => Math.abs(r[0] - f) < Math.abs(b[0] - f) ? r : b, log[0]);
  const rows = [];
  for (const f of [0, 15, 30, 45, 60, 90, 120, 150, 180, 240]){
    const a = at(runs.off.log, f), b = at(runs.on.log, f);
    if (Math.abs(a[0] - f) > 2 || Math.abs(b[0] - f) > 2) continue;
    rows.push({ f, off: a.slice(2), on: b.slice(2), ts: b[1], d: Math.round(Math.hypot(a[2] - b[2], a[3] - b[3], a[4] - b[4]) * 10) / 10 });
  }
  sel.value = ''; sel.dispatchEvent(new Event('change'));
  const maxd = Math.max(...rows.map(r => r.d));
  return [[maxd < 1, `${mon} ${list}|${c} unit position at equal clip frames, Hyper off vs ${pair}`, JSON.stringify({ bone: runs.off.bone, rows, framesOff: runs.off.log.length, framesOn: runs.on.log.length, camOff: runs.off.cam, camOn: runs.on.cam })],
          [true, 'live records with the pair', String(JSON.stringify(runs.live)).slice(0, 1500)]];
}
export const pageCheck = drift;
const env = typeof process !== 'undefined' ? process.env : {};
export const args = [[env.DRIFT_MON || 'em043_00', env.DRIFT_LIST || '2', env.DRIFT_CLIP || 'Motion[25]', env.DRIFT_PAIR === 'off' ? '' : (env.DRIFT_PAIR || '1,2')]];
