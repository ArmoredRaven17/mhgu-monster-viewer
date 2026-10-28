// khezuaoe/aoeshot.mjs (Khezu AoE lane, 2026-10-27): Khezu's body discharge L2 M12 seen from straight above, ONE STATE PER PAGE
// (the viewer's travel carry moves the world between plays: dev/hyper-states.md 7.4). The state comes from the environment:
//   AOE_RANK (5 G / 3 / 1), AOE_PAIR ('' Hyper off, '1,2' / '1,3' held), AOE_TAG (the shot name's state), AOE_CLIP (Motion[12]),
//   AOE_AT (the sample frames, comma list), AOE_HOLD ('' none, or the effect state to force: 'tired' sets the Exhausted toggle).
// The clip plays from 0 at 1/60 s a frame. At each sample frame the action is held, the camera put straight above the unit's
// root at a fixed height (the same in every state), the frame drawn, its line pixels counted (blue-white: b > 180, r < 170 ...
// and bright: r, g, b > 200) and shot to dev/shots/khezuaoe/<mon>_<clip>_f<at>_<tag>.png. The draw meter (E16) runs over the
// play: per record its starts, draw frames and lit pixels (max / mean over its samples, each record drawn ALONE).
//   bash dev/archive/khezuaoe/run.sh dev/archive/khezuaoe/aoeshot.mjs <out>   (env as above)
async function aoe(mon, list, clip, rank, pair, at, tag, hold, H){
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id), monSel = $('monSel'), listSel = $('monList'), clipSel = $('monClip'), sel = $('monHyper');
  if (![...monSel.options].some(o => o.value === mon)) monSel.add(new Option(mon, mon));
  monSel.value = mon; await monSel.onchange();
  window.__quest.set(rank, null);
  await V.effects(false); await V.effects(true);
  await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === mon, 900);
  listSel.value = list; await listSel.onchange(); await frames(2);
  sel.value = pair; sel.dispatchEvent(new Event('change')); await frames(3);
  if (hold === 'tired'){ const t = $('monTired'); if (t && !t.checked){ t.checked = true; t.dispatchEvent(new Event('change')); } await frames(3); }
  V.effectMeter(true, { every: 5 });
  V.state.loop = false;
  clipSel.value = [...clipSel.options].map(o => o.value).find(v => v === clip) || [...clipSel.options].map(o => o.value).find(v => v.startsWith(clip + '_')) || clip;
  await clipSel.onchange();
  await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(clip), 300);
  const act = V.pose.action; act.time = 0;
  const out = [];
  const box = new V.camera.position.constructor();
  for (const f of at){
    let k = 0;
    while (act.time * 60 < f && k < 2000){ await frames(1); k++; }
    act.paused = true; act.userHeld = true;
    // straight above the unit's root (the skeleton's first bone), a fixed height H (viewer units, metres) in every state
    const root = V.mounted.main;
    let bone = null; root.traverse(o => { if (!bone && o.isBone) bone = o; });
    (bone || root).getWorldPosition(box);
    V.camera.position.set(box.x, box.y + H, box.z + 0.01);
    V.controls.target.set(box.x, box.y, box.z); V.controls.update();
    await frames(2);
    const gl = V.renderer.getContext();
    V.renderer.render(V.scene, V.camera);
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let blue = 0, bright = 0, far = 0, rmax = 0;
    const cx = w / 2, cy = h / 2;
    for (let i = 0; i < px.length; i += 4){
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const isB = b > 180 && r < 170, isW = r > 200 && g > 200 && b > 200;
      if (isB) blue++;
      if (isW) bright++;
      if (isB || isW){
        const p = i >> 2, x = p % w, y = (p / w) | 0, d = Math.hypot(x - cx, y - cy);
        if (d > Math.min(w, h) * 0.25) far++;
        if (d > rmax) rmax = d;
      }
    }
    const name = mon + '_' + clip.replace(/[^A-Za-z0-9]/g, '') + '_f' + f + '_' + tag;
    const ts = act.timeScale;                 // __view.shot sets timeScale 0 (it poses a still): put the play's own back
    await V.shot('khezuaoe', name, act.time);
    act.timeScale = ts;
    out.push([true, `${mon} ${list}|${clip} f${f} (clip ${Math.round(act.time * 60)}) ${tag}`, JSON.stringify({ shot: name, blue, bright, far, rmaxPx: Math.round(rmax), w, h,
      root: [Math.round(box.x), Math.round(box.y), Math.round(box.z)], hyper: V.state.hyper || '', rank: window.__quest.now().rank, tired: !!V.state.tired })]);
    act.paused = false; act.userHeld = false;
  }
  const rep = V.effectMeterReport();
  for (const r of rep.recs)
    out.push([true, 'meter ' + r.key, JSON.stringify({ efl: r.efl, starts: r.starts, clips: r.clips, drawFrames: r.drawFrames, visibleFrames: r.visibleFrames,
      samples: r.samples, litSamples: r.litSamples, pixMax: r.pixMax, pixMean: Math.round(r.pixMean), verdict: r.verdict })]);
  V.effectMeter(false);
  return out;
}
export const pageCheck = aoe;
const env = typeof process !== 'undefined' ? process.env : {};
export const args = [[env.AOE_MON || 'em003_00', env.AOE_LIST || '2', env.AOE_CLIP || 'Motion[12]', +(env.AOE_RANK || 5), env.AOE_PAIR || '',
  (env.AOE_AT || '40,80,108,120,150,180,220').split(',').map(Number), env.AOE_TAG || 'state', env.AOE_HOLD || '', +(env.AOE_H || 20)]];
