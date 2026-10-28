// hyperaudit/angles.mjs (hyper audit, 2026-10-28): a monster with a Hyper pair held, shot from four sides (front / left / back / right
// around the controls' target, the default distance) at G (ANG_RANK), Off then on -> dev/shots/<ANG_RUN>/<mon>_<pair>_<side>_<off|on>.png.
// ANG_IDS=em021_00:1-3,em019_00:1-3 (monster:pair, pair '-' joined).  Also prints, per held aura, where the runtime put its draws
// (the world-space centroid of the last frame's model / prim vertices is not exposed; the record joint's world position is).
async function angles(specs, rank, run, pass){
  const out = [];
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const $ = id => document.getElementById(id);
  const monSel = $('monSel'), sel = $('monHyper'), listSel = $('monList'), clipSel = $('monClip');
  for (const spec of specs){
    const [MON, pairS] = spec.split(':'), pair = pairS.replace('-', ',');
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange(); await frames(30);
    await V.effects(false); await V.effects(true);
    await until(() => M.effectRuntimeInstance() && M.effectRuntimeInstance().schedule && M.effectRuntimeInstance().monsterId === MON, 900);
    V.state.questRank = rank; V.state.loop = true; V.state.fxPass = pass;
    if (listSel.value !== '0'){ listSel.value = '0'; await listSel.onchange(); }
    clipSel.value = clipSel.options[Math.min(1, clipSel.options.length - 1)].value; await clipSel.onchange();
    await frames(10);
    const C = V.controls, cam = V.camera, T = C.target.clone(), off0 = cam.position.clone().sub(T);
    const r = Math.hypot(off0.x, off0.z), y = off0.y, a0 = Math.atan2(off0.x, off0.z);
    const sides = [['front', 0], ['left', Math.PI / 2], ['back', Math.PI], ['right', -Math.PI / 2]];
    const res = {};
    for (const hv of ['', pair]){
      sel.value = hv; sel.dispatchEvent(new Event('change')); await frames(70);
      for (const [nm, da] of sides){
        cam.position.set(T.x + r * Math.sin(a0 + da), T.y + y, T.z + r * Math.cos(a0 + da)); C.target.copy(T); C.update(); await frames(2);
        await V.shot(run, `${MON}_${pairS}_${nm}_${hv ? 'on' : 'off'}`);
        if (V.pose.action) V.pose.action.timeScale = 1;
        await frames(3);
      }
    }
    cam.position.copy(T.clone().add(off0)); C.update();
    sel.value = ''; sel.dispatchEvent(new Event('change')); V.state.fxPass = 'none';
    out.push([true, spec, JSON.stringify(res)]);
  }
  return out;
}
export const pageCheck = angles;
const env = typeof process !== 'undefined' ? process.env : {};
export const args = [[(env.ANG_IDS || 'em021_00:1-3').split(','), +(env.ANG_RANK || 5), env.ANG_RUN || 'hyperaudit_angles', env.ANG_PASS || 'none']];
