// THE DRAW METER's controls (render/rom/effect/live.js METER; __view.effectMeter / effectMeterReport; dev/effect-runtime-engine.md E16).
// A check that an effect STARTED and was NOT REFUSED does not show that it DRAWS (Raven, 2026-10-19). The meter redraws each live
// request alone and counts the pixels it lights; these controls keep the meter itself honest:
//   P  Rathian (em001_00) L2 M5, the fireball Raven verifies: u 200 / u 201 / u 202 must DRAW and LIGHT pixels.
//   N1 the same clip with the camera turned away: draws, nothing lit from it, lit when the meter aims at its units (off camera).
//   N2 the same clip in view with every texture lookup answering null: draws, nothing lit, the hidden reason named.
async function meterControls(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'meter: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view, M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (t, n = 600) => { for (let i = 0; i < n; i++){ if (t()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const MON = 'em001_00';
  if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
  monSel.value = MON; await monSel.onchange();
  await V.effects(false); await V.effects(true);
  const rt = () => M.effectRuntimeInstance();
  check(await until(() => rt() && rt().schedule && rt().monsterId === MON, 900), 'runtime up');
  const play = async (list, clip) => { if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === clip) || [...clipSel.options].find(x => x.value === clip + '_start');
    clipSel.value = o.value; await clipSel.onchange(); await until(() => V.pose.action && V.pose.action.getClip().name === o.value, 300); };
  const rows = () => V.effectMeterReport().recs.filter(r => r.monster === MON);
  V.state.loop = false;
  // P
  V.effectMeter(true, { every: 3 });
  await play('2', 'Motion[5]'); await frames(220);
  const p = rows().filter(r => /\|(200|201|202)\|clip$/.test(r.key));
  check(p.length >= 2 && p.every(r => r.starts > 0 && r.litSamples > 0 && r.pixMax > 50), 'P: the fireball records draw and light pixels',
        p.map(r => [r.key, r.starts, r.draws, r.litSamples + '/' + r.samples, r.pixMax, r.verdict]));
  const fx = rt();
  const fire = () => rows().filter(r => /\|(200|201|202)\|clip$/.test(r.key));
  // N1: the same clip with the camera turned away (the orbit target mirrored behind it): the effects run and draw off screen
  const C = V.controls, cam = V.camera, t0 = C.target.clone();
  C.target.copy(cam.position.clone().multiplyScalar(2).sub(t0)); C.update();
  try {
    V.effectMeter(true, { every: 3 });
    await play('2', 'Motion[4]'); await frames(2); await play('2', 'Motion[5]'); await frames(220);
  } finally { C.target.copy(t0); C.update(); }
  const n1 = fire();
  check(n1.length >= 2 && n1.every(r => r.starts > 0 && r.drawFrames > 0 && r.litSamples === 0 && r.aimedLit > 0 && /off camera/.test(r.verdict)), 'N1: the camera turned away -- draws, nothing lit from it, lit when the meter looks at them',
        n1.map(r => [r.key, r.starts, r.draws, r.litSamples + '/' + r.samples, r.aimedLit + '/' + r.aimed, r.verdict]));
  // N2: the same clip in view with every texture lookup answering null: the draws stay, no mesh is visible, the reason is named
  const tex0 = fx.texture.bind(fx), ftex0 = fx.fileTexture.bind(fx);
  fx.texture = () => null; fx.fileTexture = () => null;
  try {
    V.effectMeter(true, { every: 3 });
    await play('2', 'Motion[4]'); await frames(2); await play('2', 'Motion[5]'); await frames(220);
  } finally { fx.texture = tex0; fx.fileTexture = ftex0; }
  const n2 = fire();
  check(n2.length >= 2 && n2.every(r => r.drawFrames > 0 && r.litSamples === 0 && Object.keys(r.hidden).some(h => /texture/.test(h))),
        'N2: textures withheld -- draws, nothing lit, the hidden reason named', n2.map(r => [r.key, r.draws, r.visibleFrames, r.hidden, r.verdict]));
  V.effectMeter(false);
  return out;
}
export const pageCheck = meterControls;
