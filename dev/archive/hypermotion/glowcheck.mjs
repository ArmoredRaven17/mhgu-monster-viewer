// hypermotion/glowcheck.mjs (hyper-motion lane, 2026-10-27): WHAT IS THE LARGE RED GLOW in the shells lane's Deviljho L2 M25 Hyper shot
// (gapZ/em043_00_on0.png)? The clip is played from 0 at 1/60 s to clip frame GLOW_AT with the pair held, in three passes -- as built;
// with the burst u 1311 withheld (rt.fire filtered); with the held head aura u 1301 dropped -- plus Hyper off. Each pass is shot
// (dev/shots/hypermotion/em043_00_glow_<pass>.png, the camera pinned) and the red pixels counted on the page (r > 150, g < 80, b < 80).
async function glow(mon, list, clip, pair, at, passes = ['off', 'built', 'noBurst', 'noAura']){
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
  const out = [];
  const camP = V.camera.position.clone(), camT = V.controls.target.clone();
  let k0 = 0;
  for (const pass of passes){
    const kp = k0++;
    // a fresh runtime per pass: a burst fired in the previous pass would still be drawing
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().monsterId === mon, 900);
    const rt = M.effectRuntimeInstance();
    const fire0 = rt.fire.bind(rt), hold0 = rt.holdEvent.bind(rt);
    if (pass === 'noBurst') rt.fire = (p, k, ...a) => (k >= 1311 && k <= 1315 ? null : fire0(p, k, ...a));
    if (pass === 'noAura') rt.holdEvent = (p, k, on, ...a) => (k >= 1301 && k <= 1305 && on ? null : hold0(p, k, on, ...a));
    const hv = pass === 'off' ? '' : pair;
    sel.value = ''; sel.dispatchEvent(new Event('change')); await frames(3);
    sel.value = hv; sel.dispatchEvent(new Event('change')); await frames(3);
    V.state.loop = false;
    clipSel.value = [...clipSel.options].map(o => o.value).find(v => v === clip) || [...clipSel.options].map(o => o.value).find(v => v.startsWith(clip + '_')) || clip; await clipSel.onchange();
    await until(() => V.pose.action && V.pose.action.getClip().name.startsWith(clip), 300);
    const act = V.pose.action; act.time = 0;
    let k = 0;
    while (act.time * 60 < at && k < 1000){ await frames(1); k++; }
    act.paused = true; act.userHeld = true;
    V.camera.position.copy(camP); V.controls.target.copy(camT); V.controls.update();
    await frames(2);
    const gl = V.renderer.getContext();
    V.renderer.render(V.scene, V.camera);
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight, px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let red = 0; for (let i = 0; i < px.length; i += 4) if (px[i] > 150 && px[i + 1] < 80 && px[i + 2] < 80) red++;
    await V.shot('hypermotion', mon + '_' + clip.replace(/[^A-Za-z0-9]/g, '') + '_f' + at + '_' + (passes.length > 4 ? kp + '_' : '') + pass, act.time);
    out.push([true, `${mon} ${list}|${clip} f${Math.round(act.time * 60)} #${kp} ${pass}`, JSON.stringify({ pick: (document.getElementById('beamLabel') || {}).textContent || null, blue: (() => { let b = 0; for (let i = 0; i < px.length; i += 4) if (px[i + 2] > 180 && px[i] < 120) b++; return b; })(), redPixels: red, frame: Math.round(act.time * 600) / 10 })]);
    rt.fire = fire0; rt.holdEvent = hold0;
    act.paused = false; act.userHeld = false;
  }
  sel.value = ''; sel.dispatchEvent(new Event('change'));
  return out;
}
export const pageCheck = glow;
const env = typeof process !== 'undefined' ? process.env : {};
export const args = [[env.GLOW_MON || 'em043_00', env.GLOW_LIST || '2', env.GLOW_CLIP || 'Motion[25]', env.GLOW_PAIR || '1,2', +(env.GLOW_AT || 30), (env.GLOW_PASSES || 'off,built,noBurst,noAura').split(',')]];
