const V = window.__view;
const q = new URLSearchParams(location.search);
const RUN = 'colour-space-' + (q.get('csrun') || 'x');
const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip'), lvSel = document.getElementById('monLevel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
const out = { run: RUN, cm: (await import('three')).ColorManagement.enabled, output: V.renderer.outputColorSpace };
async function mon(id){
  if (![...monSel.options].some(o => o.value === id)) monSel.add(new Option(id, id));
  monSel.value = id; await monSel.onchange(); await wait(2500);
  try { await V.effects(false); } catch (e) {}
}
async function level(text){
  const o = [...lvSel.options].find(x => x.textContent === text);
  if (!o) throw new Error('no rung ' + text + ' in ' + [...lvSel.options].map(x => x.textContent));
  lvSel.value = o.value; await lvSel.onchange({ target: lvSel });
}
async function rage(on){ const b = document.getElementById('monRage'); b.checked = on; await b.onchange({ target: b }); }
function cam(yaw, lift){
  V.frameAll();
  const T = V.camera.position.constructor;
  const t = V.controls.target.clone(), p = V.camera.position.clone().sub(t);
  p.applyAxisAngle(new T(0, 1, 0), yaw); p.y += p.length() * lift;
  p.multiplyScalar(0.9);
  V.camera.position.copy(t).add(p); V.camera.lookAt(t); V.controls.update();
}
async function snap(name, settle = 2500){
  await wait(settle);
  const act = V.pose.action, at = 0;
  V.state.matAnim = false;
  try { const r = await V.shot(RUN, name, at); out[name] = { saved: r.saved, err: r.errors.length, level: V.state.level, rage: V.state.rage }; }
  finally { V.state.matAnim = true; }
  if (act){ act.timeScale = 1; act.paused = false; }
}
function lights(){
  const s = []; V.scene.traverse(o => { if (o.isLight) s.push([o.type, o.color.toArray().map(x => +x.toFixed(3)), +o.intensity.toFixed(3)]); });
  return s;
}
await mon('em082_00'); await level('Exhausted'); cam(0.7, 0.15); await snap('mizutsune_exhausted', 4000);
await mon('em013_01'); await rage(true); cam(0.7, 0.15); await snap('crimson_fatalis_enraged', 4000);
await mon('em081_04'); await level('Charged'); cam(0.7, 0.15); await snap('boltreaver_charged', 4000);
await mon('em045_00'); cam(0.7, 0.15); await snap('seregios_calm');
await mon('em001_00'); cam(0.7, 0.15); await snap('rathian_calm');
out.lightsDefault = lights();
// the Lighting panel on top: a preset, then the key's strength and colour and the ambient slider
document.querySelector('#lightRow .btn[data-light="warm"]').click(); await snap('rathian_preset_warm', 300);
out.lightsWarm = lights();
const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.oninput(); };
set('lKey', 4); set('lKeyCol', '#ff4040'); set('lAmb', 0.2);
await snap('rathian_custom_redkey', 300);
out.lightsCustom = lights();
document.querySelector('#lightRow .btn[data-light="default"]').click(); await snap('rathian_back_default', 300);
// EXPERIMENT (probe only, not wired): the game's modal monster-light numbers (areas' EM01 1.8 key, EM02 0.6
// from below, no rim, no headlight) as ROM light.diffuse values, i.e. three intensity x pi
if (q.get('emexp')){
  const D = []; V.scene.traverse(o => { if (o.isDirectionalLight) D.push(o); });
  const byI = k => D.find(o => Math.abs(o.intensity - k) < 1e-3);
  const key = byI(2.3), rim = byI(1.1), fill = byI(0.55), head = byI(0.9);
  key.intensity = 1.8 * Math.PI; rim.intensity = 0; fill.intensity = 0.6 * Math.PI; if (head) head.intensity = 0;
  await snap('rathian_em_numbers', 300);
  await mon('em082_00'); await level('Exhausted'); cam(0.7, 0.15);
  { const D2 = []; V.scene.traverse(o => { if (o.isDirectionalLight) D2.push(o); });
    for (const o of D2){ if (Math.abs(o.intensity - 2.3) < 1e-3) o.intensity = 1.8 * Math.PI; else if (Math.abs(o.intensity - 1.1) < 1e-3) o.intensity = 0;
      else if (Math.abs(o.intensity - 0.55) < 1e-3) o.intensity = 0.6 * Math.PI; else if (Math.abs(o.intensity - 0.9) < 1e-3) o.intensity = 0; } }
  await snap('mizutsune_exhausted_em_numbers', 4000);
}
out.errors = (window.__errors || []).slice(-10);
return out;
